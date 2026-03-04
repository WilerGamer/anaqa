const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('../db/database');
const auth = require('../middleware/auth');

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(process.env.UPLOADS_PATH || path.join(__dirname, '../uploads'), 'collections');
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `collection-${Date.now()}${ext}`);
  },
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

// GET /api/collections — public (ordered by sort_order, then created_at)
router.get('/', (req, res) => {
  const collections = db.prepare(`
    SELECT c.*, COUNT(pc.product_id) as product_count
    FROM collections c
    LEFT JOIN product_collections pc ON pc.collection_id = c.id
    GROUP BY c.id
    ORDER BY c.sort_order ASC, c.created_at DESC
  `).all();
  res.json(collections);
});

// PUT /api/collections/reorder — admin only (must be before /:id)
router.put('/reorder', auth, (req, res) => {
  const { order } = req.body;
  if (!Array.isArray(order)) return res.status(400).json({ error: 'order must be an array of IDs' });
  order.forEach((id, idx) => {
    db.prepare('UPDATE collections SET sort_order = ? WHERE id = ?').run(idx, parseInt(id));
  });
  res.json({ message: 'Reordered' });
});

// GET /api/collections/:slug — public
router.get('/:slug', (req, res) => {
  const collection = db.prepare('SELECT * FROM collections WHERE slug = ?').get(req.params.slug);
  if (!collection) return res.status(404).json({ error: 'Collection not found' });

  const products = db.prepare(`
    SELECT p.*,
      (SELECT url FROM product_images WHERE product_id = p.id AND is_primary = 1 LIMIT 1) as primary_image
    FROM products p
    JOIN product_collections pc ON pc.product_id = p.id
    WHERE pc.collection_id = ?
    ORDER BY p.created_at DESC
  `).all(collection.id);

  res.json({ ...collection, products });
});

// POST /api/collections — admin only
router.post('/', auth, upload.single('image'), (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'Name is required' });

  const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  const image = req.file ? `/uploads/collections/${req.file.filename}` : null;

  // Sort new collection at the end
  const maxOrder = db.prepare('SELECT MAX(sort_order) as m FROM collections').get();
  const sort_order = (maxOrder?.m ?? -1) + 1;

  try {
    const result = db.prepare('INSERT INTO collections (name, slug, image, sort_order) VALUES (?, ?, ?, ?)').run(name, slug, image, sort_order);
    const collection = db.prepare('SELECT * FROM collections WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(collection);
  } catch (e) {
    if (e.message.includes('UNIQUE')) return res.status(400).json({ error: 'Collection name already exists' });
    throw e;
  }
});

// PUT /api/collections/:id — admin only
router.put('/:id', auth, upload.single('image'), (req, res) => {
  const { name } = req.body;
  const existing = db.prepare('SELECT * FROM collections WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Collection not found' });

  const updatedName = name || existing.name;
  const slug = updatedName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  const image = req.file ? `/uploads/collections/${req.file.filename}` : existing.image;

  db.prepare('UPDATE collections SET name = ?, slug = ?, image = ? WHERE id = ?').run(updatedName, slug, image, req.params.id);
  res.json(db.prepare('SELECT * FROM collections WHERE id = ?').get(req.params.id));
});

// DELETE /api/collections/:id — admin only
router.delete('/:id', auth, (req, res) => {
  const existing = db.prepare('SELECT * FROM collections WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Not found' });
  // product_collections rows are deleted via CASCADE; update legacy column
  db.prepare('UPDATE products SET collection_id = NULL WHERE collection_id = ?').run(req.params.id);
  db.prepare('DELETE FROM collections WHERE id = ?').run(req.params.id);
  res.json({ message: 'Deleted' });
});

// POST /api/collections/:id/products — add product to collection (admin only)
router.post('/:id/products', auth, (req, res) => {
  const colId = parseInt(req.params.id);
  const { product_id } = req.body;
  if (!product_id) return res.status(400).json({ error: 'product_id required' });

  const col = db.prepare('SELECT * FROM collections WHERE id = ?').get(colId);
  if (!col) return res.status(404).json({ error: 'Collection not found' });

  const productId = parseInt(product_id);
  db.prepare('INSERT OR IGNORE INTO product_collections (product_id, collection_id) VALUES (?, ?)').run(productId, colId);

  // Update legacy collection_id if product has none
  const prod = db.prepare('SELECT collection_id FROM products WHERE id = ?').get(productId);
  if (!prod?.collection_id) {
    db.prepare('UPDATE products SET collection_id = ? WHERE id = ?').run(colId, productId);
  }

  res.json({ message: 'Added' });
});

// DELETE /api/collections/:id/products/:productId — remove product from collection (admin only)
router.delete('/:id/products/:productId', auth, (req, res) => {
  const colId = parseInt(req.params.id);
  const productId = parseInt(req.params.productId);

  db.prepare('DELETE FROM product_collections WHERE collection_id = ? AND product_id = ?').run(colId, productId);

  // If the removed collection was the product's primary (legacy), update it
  const prod = db.prepare('SELECT collection_id FROM products WHERE id = ?').get(productId);
  if (prod?.collection_id === colId) {
    const firstRemaining = db.prepare(
      'SELECT collection_id FROM product_collections WHERE product_id = ? LIMIT 1'
    ).get(productId);
    db.prepare('UPDATE products SET collection_id = ? WHERE id = ?').run(firstRemaining?.collection_id || null, productId);
  }

  res.json({ message: 'Removed' });
});

module.exports = router;
