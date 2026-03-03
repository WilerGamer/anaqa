const express = require('express');
const db = require('../db/database');
const auth = require('../middleware/auth');
const { sendOrderNotification, sendOrderConfirmation, sendStatusUpdate } = require('../utils/mailer');

const router = express.Router();

// POST /api/orders — public (customer checkout)
router.post('/', (req, res) => {
  const { customer_name, address, email, phone, delivery_option, notes, items, discount_code } = req.body;

  if (!customer_name || !address || !email || !phone) {
    return res.status(400).json({ error: 'All customer fields are required' });
  }
  if (!items || items.length === 0) {
    return res.status(400).json({ error: 'No items in order' });
  }

  // Validate stock for all items before placing order
  for (const item of items) {
    const sizeRow = db.prepare(
      'SELECT quantity FROM product_sizes WHERE product_id = ? AND size = ?'
    ).get(item.product_id, item.size);

    if (!sizeRow) return res.status(400).json({ error: `Size ${item.size} not found for product ${item.product_id}` });
    if (sizeRow.quantity < item.quantity) {
      return res.status(400).json({ error: `Insufficient stock for size ${item.size}` });
    }
  }

  // Calculate subtotal
  let subtotal = 0;
  const enrichedItems = items.map(item => {
    const product = db.prepare('SELECT price FROM products WHERE id = ?').get(item.product_id);
    if (!product) throw new Error(`Product ${item.product_id} not found`);
    subtotal += product.price * item.quantity;
    return { ...item, price: product.price };
  });

  // Apply discount code
  let discountAmount = 0;
  let validatedCode = null;
  if (discount_code) {
    const discount = db.prepare('SELECT * FROM discounts WHERE code = ? COLLATE NOCASE').get(discount_code.trim());
    if (discount && discount.active && (discount.max_uses === null || discount.uses_count < discount.max_uses)) {
      validatedCode = discount;
      if (discount.type === 'percent') {
        discountAmount = (subtotal * discount.value) / 100;
      } else {
        discountAmount = discount.value;
      }
      discountAmount = Math.min(discountAmount, subtotal);
    }
  }

  const total = Math.max(0, subtotal - discountAmount);

  // Place order in a transaction
  const placeOrder = db.transaction(() => {
    const result = db.prepare(`
      INSERT INTO orders (customer_name, address, email, phone, delivery_option, notes, total, discount_code, discount_amount)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      customer_name, address, email, phone,
      delivery_option || 'cod',
      notes || null,
      total,
      validatedCode ? validatedCode.code : null,
      discountAmount
    );

    const orderId = result.lastInsertRowid;

    for (const item of enrichedItems) {
      db.prepare(`
        INSERT INTO order_items (order_id, product_id, size, quantity, price)
        VALUES (?, ?, ?, ?, ?)
      `).run(orderId, item.product_id, item.size, item.quantity, item.price);

      // Reduce inventory
      db.prepare(`
        UPDATE product_sizes SET quantity = quantity - ?
        WHERE product_id = ? AND size = ?
      `).run(item.quantity, item.product_id, item.size);
    }

    // Increment discount uses_count
    if (validatedCode) {
      db.prepare('UPDATE discounts SET uses_count = uses_count + 1 WHERE id = ?').run(validatedCode.id);
    }

    return orderId;
  });

  try {
    const orderId = placeOrder();
    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);

    // Send email notification (non-blocking — order succeeds even if email fails)
    const orderItems = db.prepare(`
      SELECT oi.*, p.name FROM order_items oi
      JOIN products p ON p.id = oi.product_id
      WHERE oi.order_id = ?
    `).all(orderId);
    sendOrderNotification(order, orderItems).catch(err =>
      console.error('[Mailer] Failed to send admin notification:', err.message)
    );
    sendOrderConfirmation(order, orderItems).catch(err =>
      console.error('[Mailer] Failed to send customer confirmation:', err.message)
    );

    res.status(201).json({ message: 'Order placed successfully', order });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/orders — admin only
router.get('/', auth, (req, res) => {
  const { status } = req.query;
  let query = 'SELECT * FROM orders';
  const params = [];
  if (status) { query += ' WHERE status = ?'; params.push(status); }
  query += ' ORDER BY created_at DESC';
  const orders = db.prepare(query).all(...params);
  res.json(orders);
});

// GET /api/orders/:id — admin only
router.get('/:id', auth, (req, res) => {
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
  if (!order) return res.status(404).json({ error: 'Order not found' });

  const items = db.prepare(`
    SELECT oi.*, p.name as product_name,
      (SELECT url FROM product_images WHERE product_id = p.id AND is_primary = 1 LIMIT 1) as product_image
    FROM order_items oi
    JOIN products p ON p.id = oi.product_id
    WHERE oi.order_id = ?
  `).all(req.params.id);

  res.json({ ...order, items });
});

// PUT /api/orders/:id/status — admin only
router.put('/:id/status', auth, (req, res) => {
  const { status } = req.body;
  const validStatuses = ['pending', 'processing', 'delivered', 'cancelled'];
  if (!validStatuses.includes(status)) return res.status(400).json({ error: 'Invalid status' });

  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
  if (!order) return res.status(404).json({ error: 'Not found' });

  db.prepare('UPDATE orders SET status = ? WHERE id = ?').run(status, req.params.id);
  const updated = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);

  sendStatusUpdate(updated).catch(err =>
    console.error('[Mailer] Failed to send status update email:', err.message)
  );

  res.json(updated);
});

// DELETE /api/orders/:id — admin only
router.delete('/:id', auth, (req, res) => {
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
  if (!order) return res.status(404).json({ error: 'Not found' });
  db.prepare('DELETE FROM orders WHERE id = ?').run(req.params.id);
  res.json({ message: 'Order deleted' });
});

// GET /api/orders/stats/summary — admin only (supports ?from=ISO&to=ISO date filters)
router.get('/stats/summary', auth, (req, res) => {
  const { from, to } = req.query;
  let where = '';
  const params = [];
  if (from) { where += ' AND created_at >= ?'; params.push(from); }
  if (to)   { where += ' AND created_at <= ?'; params.push(to); }

  const total = db.prepare(`SELECT COUNT(*) as count, SUM(total) as revenue FROM orders WHERE 1=1${where}`).get(...params);
  const byStatus = db.prepare(`SELECT status, COUNT(*) as count FROM orders WHERE 1=1${where} GROUP BY status`).all(...params);
  res.json({ total_orders: total.count, total_revenue: total.revenue || 0, by_status: byStatus });
});

module.exports = router;
