const express = require('express');
const db = require('../db/database');
const auth = require('../middleware/auth');

const router = express.Router();

// POST /api/discounts/validate — public (must be before /:id)
router.post('/validate', (req, res) => {
  const { code, subtotal } = req.body;
  if (!code) return res.status(400).json({ error: 'Code is required' });

  const discount = db.prepare('SELECT * FROM discounts WHERE code = ? COLLATE NOCASE').get(code.trim());
  if (!discount) return res.status(404).json({ error: 'Invalid discount code' });
  if (!discount.active) return res.status(400).json({ error: 'This discount code is no longer active' });
  if (discount.max_uses !== null && discount.uses_count >= discount.max_uses) {
    return res.status(400).json({ error: 'This discount code has reached its usage limit' });
  }

  let discountAmount = 0;
  if (discount.type === 'percent') {
    discountAmount = (Number(subtotal) * discount.value) / 100;
  } else {
    discountAmount = discount.value;
  }
  discountAmount = Math.min(discountAmount, Number(subtotal)); // can't exceed subtotal

  res.json({
    valid: true,
    code: discount.code,
    type: discount.type,
    value: discount.value,
    discount_amount: Number(discountAmount.toFixed(2)),
    message: discount.type === 'percent'
      ? `${discount.value}% off applied`
      : `$${discount.value.toFixed(2)} off applied`,
  });
});

// GET /api/discounts — admin only
router.get('/', auth, (req, res) => {
  const discounts = db.prepare('SELECT * FROM discounts ORDER BY created_at DESC').all();
  res.json(discounts);
});

// POST /api/discounts — admin only
router.post('/', auth, (req, res) => {
  const { code, type, value, max_uses } = req.body;
  if (!code || !type || !value) return res.status(400).json({ error: 'Code, type, and value are required' });
  if (!['percent', 'flat'].includes(type)) return res.status(400).json({ error: 'Type must be "percent" or "flat"' });
  if (Number(value) <= 0) return res.status(400).json({ error: 'Value must be greater than 0' });

  try {
    const result = db.prepare(
      'INSERT INTO discounts (code, type, value, max_uses) VALUES (?, ?, ?, ?)'
    ).run(
      code.trim().toUpperCase(),
      type,
      parseFloat(value),
      max_uses ? parseInt(max_uses) : null
    );
    res.status(201).json(db.prepare('SELECT * FROM discounts WHERE id = ?').get(result.lastInsertRowid));
  } catch (e) {
    if (e.message.includes('UNIQUE')) return res.status(400).json({ error: 'Discount code already exists' });
    throw e;
  }
});

// PUT /api/discounts/:id — admin only
router.put('/:id', auth, (req, res) => {
  const { code, type, value, max_uses, active } = req.body;
  const existing = db.prepare('SELECT * FROM discounts WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Not found' });

  db.prepare(`
    UPDATE discounts SET
      code = ?, type = ?, value = ?, max_uses = ?, active = ?
    WHERE id = ?
  `).run(
    code !== undefined ? code.trim().toUpperCase() : existing.code,
    type !== undefined ? type : existing.type,
    value !== undefined ? parseFloat(value) : existing.value,
    max_uses !== undefined ? (max_uses ? parseInt(max_uses) : null) : existing.max_uses,
    active !== undefined ? (active ? 1 : 0) : existing.active,
    req.params.id
  );
  res.json(db.prepare('SELECT * FROM discounts WHERE id = ?').get(req.params.id));
});

// DELETE /api/discounts/:id — admin only
router.delete('/:id', auth, (req, res) => {
  const existing = db.prepare('SELECT * FROM discounts WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Not found' });
  db.prepare('DELETE FROM discounts WHERE id = ?').run(req.params.id);
  res.json({ message: 'Deleted' });
});

module.exports = router;
