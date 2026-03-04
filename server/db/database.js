const Database = require('better-sqlite3');
const path = require('path');
const bcrypt = require('bcryptjs');

const db = new Database(process.env.DB_PATH || path.join(__dirname, 'anaqa.db'));

// Enable WAL mode and foreign keys
db.exec("PRAGMA journal_mode = WAL");
db.exec("PRAGMA foreign_keys = ON");

// ── Schema ────────────────────────────────────────────────────────────────────
db.exec(`
  CREATE TABLE IF NOT EXISTS admins (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    email      TEXT    NOT NULL UNIQUE,
    password   TEXT    NOT NULL,
    created_at TEXT    DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS collections (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    name       TEXT    NOT NULL,
    slug       TEXT    NOT NULL UNIQUE,
    image      TEXT,
    created_at TEXT    DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS products (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    name          TEXT    NOT NULL,
    description   TEXT,
    price         REAL    NOT NULL,
    old_price     REAL,
    collection_id INTEGER REFERENCES collections(id) ON DELETE SET NULL,
    created_at    TEXT    DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS product_images (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    url        TEXT    NOT NULL,
    is_primary  INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS product_sizes (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    size       TEXT    NOT NULL,
    quantity   INTEGER NOT NULL DEFAULT 0,
    UNIQUE(product_id, size)
  );

  CREATE TABLE IF NOT EXISTS orders (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_name   TEXT NOT NULL,
    address         TEXT NOT NULL,
    email           TEXT NOT NULL,
    phone           TEXT NOT NULL,
    delivery_option TEXT NOT NULL DEFAULT 'free',
    notes           TEXT,
    status          TEXT NOT NULL DEFAULT 'pending',
    total           REAL NOT NULL,
    created_at      TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS order_items (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id   INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    size       TEXT    NOT NULL,
    quantity   INTEGER NOT NULL,
    price      REAL    NOT NULL
  );

  CREATE TABLE IF NOT EXISTS product_collections (
    product_id    INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    collection_id INTEGER NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
    PRIMARY KEY(product_id, collection_id)
  );

  CREATE TABLE IF NOT EXISTS discounts (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    code        TEXT    NOT NULL UNIQUE,
    type        TEXT    NOT NULL DEFAULT 'percent',
    value       REAL    NOT NULL,
    max_uses    INTEGER,
    uses_count  INTEGER NOT NULL DEFAULT 0,
    active      INTEGER NOT NULL DEFAULT 1,
    created_at  TEXT    DEFAULT (datetime('now'))
  );
`);

// ── Migrations ────────────────────────────────────────────────────────────────
// Add sort_order to collections (for user-defined ordering)
try { db.exec('ALTER TABLE collections ADD COLUMN sort_order INTEGER DEFAULT 0'); } catch(e) {}

// Add discount columns to orders table
try { db.exec('ALTER TABLE orders ADD COLUMN discount_code TEXT'); } catch(e) {}
try { db.exec('ALTER TABLE orders ADD COLUMN discount_amount REAL DEFAULT 0'); } catch(e) {}

// Migrate existing collection_id data → product_collections junction table
try {
  const productsWithCol = db.prepare('SELECT id, collection_id FROM products WHERE collection_id IS NOT NULL').all();
  productsWithCol.forEach(p => {
    db.prepare('INSERT OR IGNORE INTO product_collections (product_id, collection_id) VALUES (?, ?)').run(p.id, p.collection_id);
  });
} catch(e) {}

// ── Seed default admin ────────────────────────────────────────────────────────
const adminExists = db.prepare('SELECT id FROM admins LIMIT 1').get();
if (!adminExists) {
  const hashed = bcrypt.hashSync('admin123', 10);
  db.prepare('INSERT INTO admins (email, password) VALUES (?, ?)').run('admin@anaqa.com', hashed);
  console.log('Default admin → admin@anaqa.com / admin123');
}

// ── Seed default collections ──────────────────────────────────────────────────
const collectionsExist = db.prepare('SELECT id FROM collections LIMIT 1').get();
if (!collectionsExist) {
  db.prepare('INSERT INTO collections (name, slug) VALUES (?, ?)').run('Latest Drops', 'latest-drops');
  db.prepare('INSERT INTO collections (name, slug) VALUES (?, ?)').run('Winter Collection', 'winter-collection');
  db.prepare('INSERT INTO collections (name, slug) VALUES (?, ?)').run('Summer Collection', 'summer-collection');
  console.log('Default collections seeded.');
}

module.exports = db;
