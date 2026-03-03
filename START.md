# Anaqa — How to Run

## First-time setup

Open TWO terminal windows.

### Terminal 1 — Backend
```bash
cd "ANAQA WEB/server"
npm install
npm run dev
```
Server runs at: http://localhost:5000

### Terminal 2 — Frontend
```bash
cd "ANAQA WEB/client"
npm install
npm run dev
```
Store runs at: http://localhost:5173

---

## Add your images

Place these files in `client/public/images/`:
- `logo.png` — Anaqa logo
- `hero-banner.jpg` — Hero banner image

---

## Admin Panel

URL: http://localhost:5173/admin

Default credentials:
- Email: `admin@anaqa.com`
- Password: `admin123`

**IMPORTANT: Change your password after first login.**

---

## What you can do in the Admin Panel

| Section | Actions |
|---------|---------|
| Products | Add, edit, delete products · Upload images · Set sizes/stock |
| Collections | Create collections · Upload collection images · Add/remove products |
| Orders | View all orders · Update order status · Delete orders |

---

## Currency

Currently set to **MAD** (Moroccan Dirham). To change, search for `MAD` in `client/src/` and replace.
