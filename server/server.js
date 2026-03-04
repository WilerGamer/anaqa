require('dns').setDefaultResultOrder('ipv4first');
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 5000;
const isProduction = process.env.NODE_ENV === 'production';

// ── Middleware ───────────────────────────────────────────────────────────────
// In production, allow all origins (same-origin via static files). In dev, allow Vite dev server.
if (!isProduction) {
  app.use(cors({ origin: ['http://localhost:5173', 'http://localhost:3000'], credentials: true }));
} else {
  app.use(cors());
}
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded images (path is configurable for production volume)
const uploadsPath = process.env.UPLOADS_PATH || path.join(__dirname, 'uploads');
fs.mkdirSync(uploadsPath, { recursive: true }); // ensure it exists on startup
app.use('/uploads', express.static(uploadsPath));

// ── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/auth', require('./routes/auth'));
app.use('/api/collections', require('./routes/collections'));
app.use('/api/products', require('./routes/products'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/discounts', require('./routes/discounts'));

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

// ── Serve React build in production ──────────────────────────────────────────
if (isProduction) {
  const clientBuildPath = path.join(__dirname, '../client/dist');
  app.use(express.static(clientBuildPath));
  // All non-API routes return the React app
  app.get('*', (req, res) => {
    res.sendFile(path.join(clientBuildPath, 'index.html'));
  });
}

// ── Error handler ─────────────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`Anaqa API running at http://localhost:${PORT} [${isProduction ? 'production' : 'development'}]`);
});
