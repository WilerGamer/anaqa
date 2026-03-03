const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('../db/database');
const auth = require('../middleware/auth');

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../uploads/products');
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `product-${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`);
  },
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

// Helper: enrich product with images, sizes, and all collection memberships
function enrichProduct(product) {
  if (!product) return null;

  product.images = db.prepare(
    'SELECT * FROM product_images WHERE product_id = ? ORDER BY is_primary DESC, id ASC'
  ).all(product.id);

  // NOTE: Use single-quoted strings in CASE — SQLite treats "X" as a column name, not a string
  product.sizes = db.prepare(`
    SELECT * FROM product_sizes WHERE product_id = ?
    ORDER BY CASE size
      WHEN 'S'   THEN 1
      WHEN 'M'   THEN 2
      WHEN 'L'   THEN 3
      WHEN 'XL'  THEN 4
      WHEN 'XXL' THEN 5
      ELSE 6
    END
  `).all(product.id);

  // All collection IDs this product belongs to
  const collectionRows = db.prepare(
    'SELECT collection_id FROM product_collections WHERE product_id = ?'
  ).all(product.id);
  product.collection_ids = collectionRows.map(r => r.collection_id);

  // Primary collection (first by sort_order) for display
  const firstCol = db.prepare(`
    SELECT c.name, c.slug FROM collections c
    JOIN product_collections pc ON pc.collection_id = c.id
    WHERE pc.product_id = ?
    ORDER BY c.sort_order ASC, c.id ASC
    LIMIT 1
  `).get(product.id);
  product.collection_name = firstCol?.name || null;
  product.collection_slug = firstCol?.slug || null;

  return product;
}

// Helper: sync product_collections and update collection_id (primary) on products table
function syncCollections(productId, rawIds) {
  db.prepare('DELETE FROM product_collections WHERE product_id = ?').run(productId);
  const ids = (Array.isArray(rawIds) ? rawIds : [rawIds])
    .map(id => parseInt(id))
    .filter(id => !isNaN(id) && id > 0);
  ids.forEach(colId => {
    db.prepare('INSERT OR IGNORE INTO product_collections (product_id, collection_id) VALUES (?, ?)').run(productId, colId);
  });
  // Keep legacy collection_id in sync (first collection as primary, or null)
  db.prepare('UPDATE products SET collection_id = ? WHERE id = ?').run(ids[0] || null, productId);
}

// GET /api/products — public
router.get('/', (req, res) => {
  const { collection, search, limit = 50, offset = 0 } = req.query;
  let query = `
    SELECT p.*,
      (SELECT c.name FROM collections c
       JOIN product_collections pc ON pc.collection_id = c.id
       WHERE pc.product_id = p.id
       ORDER BY c.sort_order ASC, c.id ASC LIMIT 1) as collection_name,
      (SELECT c.slug FROM collections c
       JOIN product_collections pc ON pc.collection_id = c.id
       WHERE pc.product_id = p.id
       ORDER BY c.sort_order ASC, c.id ASC LIMIT 1) as collection_slug,
      (SELECT url FROM product_images WHERE product_id = p.id AND is_primary = 1 LIMIT 1) as primary_image
    FROM products p
    WHERE 1=1`;
  const params = [];

  if (collection) {
    query += ` AND p.id IN (
      SELECT pc.product_id FROM product_collections pc
      JOIN collections c ON c.id = pc.collection_id
      WHERE c.slug = ?
    )`;
    params.push(collection);
  }
  if (search) { query += ' AND (p.name LIKE ? OR p.description LIKE ?)'; params.push(`%${search}%`, `%${search}%`); }
  query += ' ORDER BY p.created_at DESC LIMIT ? OFFSET ?';
  params.push(Number(limit), Number(offset));

  res.json(db.prepare(query).all(...params));
});

// GET /api/products/:id — public
router.get('/:id', (req, res) => {
  const product = db.prepare('SELECT * FROM products WHERE id = ?').get(parseInt(req.params.id));
  if (!product) return res.status(404).json({ error: 'Product not found' });
  res.json(enrichProduct(product));
});

// POST /api/products — admin only
router.post('/', auth, upload.array('images', 10), (req, res) => {
  const { name, description, price, old_price, collection_ids, sizes } = req.body;
  if (!name || !price) return res.status(400).json({ error: 'Name and price are required' });

  const result = db.prepare(
    'INSERT INTO products (name, description, price, old_price) VALUES (?, ?, ?, ?)'
  ).run(
    name,
    description || null,
    parseFloat(price),
    old_price ? parseFloat(old_price) : null
  );

  const productId = result.lastInsertRowid;

  if (req.files && req.files.length > 0) {
    req.files.forEach((file, i) => {
      db.prepare('INSERT INTO product_images (product_id, url, is_primary) VALUES (?, ?, ?)')
        .run(productId, `/uploads/products/${file.filename}`, i === 0 ? 1 : 0);
    });
  }

  if (sizes) {
    const parsedSizes = typeof sizes === 'string' ? JSON.parse(sizes) : sizes;
    parsedSizes.forEach(({ size, quantity }) => {
      db.prepare('INSERT INTO product_sizes (product_id, size, quantity) VALUES (?, ?, ?)')
        .run(productId, size, parseInt(quantity) || 0);
    });
  }

  if (collection_ids) {
    const ids = typeof collection_ids === 'string' ? JSON.parse(collection_ids) : collection_ids;
    syncCollections(productId, ids);
  }

  res.status(201).json(enrichProduct(db.prepare('SELECT * FROM products WHERE id = ?').get(productId)));
});

// PUT /api/products/:id — admin only
router.put('/:id', auth, upload.array('images', 10), (req, res) => {
  const { name, description, price, old_price, collection_ids, sizes, size_adjustments, remove_images } = req.body;
  const id = parseInt(req.params.id);

  const existing = db.prepare('SELECT * FROM products WHERE id = ?').get(id);
  if (!existing) return res.status(404).json({ error: 'Product not found' });

  // Build explicit values — no COALESCE (unreliable with node:sqlite null binding)
  const updatedName     = name     || existing.name;
  const updatedDesc     = description !== undefined ? (description || null) : existing.description;
  const updatedPrice    = price    ? parseFloat(price)    : existing.price;
  const updatedOldPrice = old_price !== undefined
    ? (old_price ? parseFloat(old_price) : null)
    : existing.old_price;

  db.prepare(
    'UPDATE products SET name = ?, description = ?, price = ?, old_price = ? WHERE id = ?'
  ).run(updatedName, updatedDesc, updatedPrice, updatedOldPrice, id);

  // Update collection memberships
  if (collection_ids !== undefined) {
    const ids = typeof collection_ids === 'string' ? JSON.parse(collection_ids) : collection_ids;
    syncCollections(id, ids);
  }

  // Remove specified images
  if (remove_images) {
    const imgIds = typeof remove_images === 'string' ? JSON.parse(remove_images) : remove_images;
    imgIds.forEach(imgId => db.prepare('DELETE FROM product_images WHERE id = ? AND product_id = ?').run(parseInt(imgId), id));
  }

  // Add new images
  if (req.files && req.files.length > 0) {
    const hasExisting = db.prepare('SELECT id FROM product_images WHERE product_id = ? LIMIT 1').get(id);
    req.files.forEach((file, i) => {
      db.prepare('INSERT INTO product_images (product_id, url, is_primary) VALUES (?, ?, ?)')
        .run(id, `/uploads/products/${file.filename}`, !hasExisting && i === 0 ? 1 : 0);
    });
  }

  // Additive inventory adjustments (edit mode — adds/subtracts from current stock)
  if (size_adjustments) {
    const adjustments = typeof size_adjustments === 'string' ? JSON.parse(size_adjustments) : size_adjustments;
    adjustments.forEach(({ size, delta }) => {
      const d = parseInt(delta) || 0;
      if (d === 0) return;
      const row = db.prepare('SELECT quantity FROM product_sizes WHERE product_id = ? AND size = ?').get(id, size);
      if (row) {
        db.prepare('UPDATE product_sizes SET quantity = ? WHERE product_id = ? AND size = ?').run(Math.max(0, row.quantity + d), id, size);
      } else {
        db.prepare('INSERT INTO product_sizes (product_id, size, quantity) VALUES (?, ?, ?)').run(id, size, Math.max(0, d));
      }
    });
  } else if (sizes) {
    // Absolute set — used only when creating or explicitly overriding
    const parsedSizes = typeof sizes === 'string' ? JSON.parse(sizes) : sizes;
    db.prepare('DELETE FROM product_sizes WHERE product_id = ?').run(id);
    parsedSizes.forEach(({ size, quantity }) => {
      db.prepare('INSERT INTO product_sizes (product_id, size, quantity) VALUES (?, ?, ?)').run(id, size, parseInt(quantity) || 0);
    });
  }

  res.json(enrichProduct(db.prepare('SELECT * FROM products WHERE id = ?').get(id)));
});

// DELETE /api/products/:id — admin only
router.delete('/:id', auth, (req, res) => {
  const id = parseInt(req.params.id);
  if (!db.prepare('SELECT id FROM products WHERE id = ?').get(id)) return res.status(404).json({ error: 'Not found' });
  db.prepare('DELETE FROM products WHERE id = ?').run(id);
  res.json({ message: 'Deleted' });
});

module.exports = router;
