const nodemailer = require('nodemailer');
const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

function isConfigured() {
  return process.env.GMAIL_USER && !process.env.GMAIL_USER.includes('your_gmail');
}

function fmt(amount) {
  return `$${Number(amount).toFixed(2)}`;
}

function itemsTable(items) {
  return items.map(item =>
    `<tr style="border-bottom:1px solid #f5f0e8">
      <td style="padding:8px 0;color:#0A1628">${item.name}</td>
      <td style="padding:8px 0;text-align:center;color:#0A1628">${item.size}</td>
      <td style="padding:8px 0;text-align:center;color:#0A1628">${item.quantity}</td>
      <td style="padding:8px 0;text-align:right;color:#0A1628">${fmt(Number(item.price) * item.quantity)}</td>
    </tr>`
  ).join('');
}

function baseLayout(headerTitle, headerSub, bodyHtml) {
  return `
<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;border:1px solid #e5e0d8;padding:0">
  <div style="background:#0A1628;padding:20px 24px">
    <h2 style="color:#F5F0E8;margin:0;font-size:20px">${headerTitle}</h2>
    ${headerSub ? `<p style="color:#C9B99A;margin:4px 0 0;font-size:13px">${headerSub}</p>` : ''}
  </div>
  <div style="padding:24px">
    ${bodyHtml}
  </div>
  <div style="background:#f5f0e8;padding:14px 24px;text-align:center">
    <p style="font-size:12px;color:#888;margin:0">Anaqa — Luxury Essentials</p>
  </div>
</div>`.trim();
}

// ── Admin notification (sent to store email) ─────────────────────────────────
async function sendOrderNotification(order, items) {
  if (!isConfigured()) {
    console.log('[Mailer] Email not configured — skipping admin notification for order #' + order.id);
    return;
  }

  const subtotalBeforeDiscount = Number(order.total) + Number(order.discount_amount || 0);

  const html = baseLayout(
    `New Order — #${order.id}`,
    new Date(order.created_at).toLocaleString(),
    `
    <h3 style="font-size:13px;text-transform:uppercase;letter-spacing:.08em;color:#C9B99A;margin:0 0 12px">Customer</h3>
    <table style="font-size:14px;color:#0A1628;border-collapse:collapse;width:100%">
      <tr><td style="padding:3px 12px 3px 0;color:#888;width:80px">Name</td><td>${order.customer_name}</td></tr>
      <tr><td style="padding:3px 12px 3px 0;color:#888">Email</td><td>${order.email}</td></tr>
      <tr><td style="padding:3px 12px 3px 0;color:#888">Phone</td><td>${order.phone}</td></tr>
      <tr><td style="padding:3px 12px 3px 0;color:#888">Address</td><td>${order.address}</td></tr>
    </table>
    <hr style="border:none;border-top:1px solid #e5e0d8;margin:20px 0">
    <h3 style="font-size:13px;text-transform:uppercase;letter-spacing:.08em;color:#C9B99A;margin:0 0 12px">Items</h3>
    <table style="width:100%;border-collapse:collapse;font-size:14px">
      <thead><tr style="border-bottom:1px solid #e5e0d8">
        <th style="text-align:left;padding:6px 0;color:#888;font-weight:normal">Product</th>
        <th style="text-align:center;padding:6px 0;color:#888;font-weight:normal">Size</th>
        <th style="text-align:center;padding:6px 0;color:#888;font-weight:normal">Qty</th>
        <th style="text-align:right;padding:6px 0;color:#888;font-weight:normal">Price</th>
      </tr></thead>
      <tbody>${itemsTable(items)}</tbody>
    </table>
    <hr style="border:none;border-top:1px solid #e5e0d8;margin:20px 0">
    <table style="font-size:14px;color:#0A1628;border-collapse:collapse;width:100%">
      <tr><td style="padding:3px 0;color:#888;width:140px">Subtotal</td><td style="text-align:right">${fmt(subtotalBeforeDiscount)}</td></tr>
      ${order.discount_code ? `<tr><td style="padding:3px 0;color:#888">Discount (${order.discount_code})</td><td style="text-align:right;color:green">-${fmt(order.discount_amount)}</td></tr>` : ''}
      <tr><td style="padding:6px 0 3px;font-weight:bold">Total</td><td style="text-align:right;font-weight:bold;font-size:16px">${fmt(order.total)}</td></tr>
      <tr><td style="padding:3px 0;color:#888">Payment</td><td style="text-align:right">Cash on Delivery</td></tr>
    </table>
    ${order.notes ? `<hr style="border:none;border-top:1px solid #e5e0d8;margin:20px 0"><p style="font-size:13px;color:#888;margin:0 0 4px">Notes</p><p style="font-size:14px;color:#0A1628;margin:0">${order.notes}</p>` : ''}
    `
  );

  await transporter.sendMail({
    from: `"Anaqa Store" <${process.env.GMAIL_USER}>`,
    to: process.env.STORE_EMAIL || process.env.GMAIL_USER,
    subject: `🛍️ New Order #${order.id} — ${order.customer_name} (${fmt(order.total)})`,
    html,
  });

  console.log(`[Mailer] Admin notification sent for order #${order.id}`);
}

// ── Customer order confirmation ───────────────────────────────────────────────
async function sendOrderConfirmation(order, items) {
  if (!isConfigured()) return;

  const subtotalBeforeDiscount = Number(order.total) + Number(order.discount_amount || 0);

  const html = baseLayout(
    'Order Confirmed!',
    `Order #${order.id} · ${new Date(order.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`,
    `
    <p style="font-size:15px;color:#0A1628;margin:0 0 20px">
      Hi <strong>${order.customer_name}</strong>, thank you for your order! We've received it and will be in touch soon.
    </p>

    <h3 style="font-size:13px;text-transform:uppercase;letter-spacing:.08em;color:#C9B99A;margin:0 0 12px">Your Items</h3>
    <table style="width:100%;border-collapse:collapse;font-size:14px">
      <thead><tr style="border-bottom:1px solid #e5e0d8">
        <th style="text-align:left;padding:6px 0;color:#888;font-weight:normal">Product</th>
        <th style="text-align:center;padding:6px 0;color:#888;font-weight:normal">Size</th>
        <th style="text-align:center;padding:6px 0;color:#888;font-weight:normal">Qty</th>
        <th style="text-align:right;padding:6px 0;color:#888;font-weight:normal">Price</th>
      </tr></thead>
      <tbody>${itemsTable(items)}</tbody>
    </table>

    <hr style="border:none;border-top:1px solid #e5e0d8;margin:20px 0">

    <table style="font-size:14px;color:#0A1628;border-collapse:collapse;width:100%">
      <tr><td style="padding:3px 0;color:#888;width:140px">Subtotal</td><td style="text-align:right">${fmt(subtotalBeforeDiscount)}</td></tr>
      ${order.discount_code ? `<tr><td style="padding:3px 0;color:#888">Discount (${order.discount_code})</td><td style="text-align:right;color:green">-${fmt(order.discount_amount)}</td></tr>` : ''}
      <tr><td style="padding:6px 0 3px;font-weight:bold">Total</td><td style="text-align:right;font-weight:bold;font-size:16px">${fmt(order.total)}</td></tr>
      <tr><td style="padding:3px 0;color:#888">Payment</td><td style="text-align:right">Cash on Delivery</td></tr>
    </table>

    <hr style="border:none;border-top:1px solid #e5e0d8;margin:20px 0">

    <h3 style="font-size:13px;text-transform:uppercase;letter-spacing:.08em;color:#C9B99A;margin:0 0 12px">Delivery Address</h3>
    <p style="font-size:14px;color:#0A1628;margin:0;line-height:1.6">${order.address}</p>

    <hr style="border:none;border-top:1px solid #e5e0d8;margin:20px 0">
    <p style="font-size:13px;color:#888;margin:0">Questions? Reply to this email or contact us directly.</p>
    `
  );

  await transporter.sendMail({
    from: `"Anaqa" <${process.env.GMAIL_USER}>`,
    to: order.email,
    subject: `Order Confirmed — #${order.id}`,
    html,
  });

  console.log(`[Mailer] Customer confirmation sent to ${order.email} for order #${order.id}`);
}

// ── Customer status update ────────────────────────────────────────────────────
const STATUS_MESSAGES = {
  processing: {
    title: 'Your Order is Being Processed',
    body: "Great news! We've started processing your order and it will be on its way soon.",
  },
  delivered: {
    title: 'Your Order Has Been Delivered',
    body: "Your order has been marked as delivered. We hope you love your new pieces! If you have any questions, don't hesitate to reach out.",
  },
  cancelled: {
    title: 'Your Order Has Been Cancelled',
    body: 'Your order has been cancelled. If you believe this is a mistake or have questions, please contact us.',
  },
};

async function sendStatusUpdate(order) {
  if (!isConfigured()) return;
  const msg = STATUS_MESSAGES[order.status];
  if (!msg) return; // no email for 'pending'

  const html = baseLayout(
    msg.title,
    `Order #${order.id}`,
    `
    <p style="font-size:15px;color:#0A1628;margin:0 0 20px">Hi <strong>${order.customer_name}</strong>,</p>
    <p style="font-size:14px;color:#555;line-height:1.7;margin:0 0 24px">${msg.body}</p>

    <div style="background:#f5f0e8;padding:16px 20px;margin-bottom:20px">
      <table style="font-size:14px;color:#0A1628;border-collapse:collapse;width:100%">
        <tr><td style="padding:3px 0;color:#888;width:110px">Order</td><td>#${order.id}</td></tr>
        <tr><td style="padding:3px 0;color:#888">Status</td><td style="text-transform:capitalize;font-weight:bold">${order.status}</td></tr>
        <tr><td style="padding:3px 0;color:#888">Total</td><td>${fmt(order.total)}</td></tr>
        <tr><td style="padding:3px 0;color:#888">Address</td><td>${order.address}</td></tr>
      </table>
    </div>

    <p style="font-size:13px;color:#888;margin:0">Questions? Reply to this email and we'll be happy to help.</p>
    `
  );

  await transporter.sendMail({
    from: `"Anaqa" <${process.env.GMAIL_USER}>`,
    to: order.email,
    subject: `${msg.title} — Order #${order.id}`,
    html,
  });

  console.log(`[Mailer] Status update (${order.status}) sent to ${order.email} for order #${order.id}`);
}

module.exports = { sendOrderNotification, sendOrderConfirmation, sendStatusUpdate };
