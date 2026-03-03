import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useCart } from '../context/CartContext';

export default function Checkout() {
  const { items, subtotal, clearCart } = useCart();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    customer_name: '',
    address: '',
    email: '',
    phone: '',
    delivery_option: 'cod',
    notes: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(null);

  // Discount state
  const [discountCode, setDiscountCode] = useState('');
  const [discountApplied, setDiscountApplied] = useState(null);
  const [discountError, setDiscountError] = useState('');
  const [discountLoading, setDiscountLoading] = useState(false);

  if (items.length === 0 && !success) {
    return (
      <div className="page-enter pt-20 min-h-screen flex flex-col items-center justify-center px-4">
        <h2 className="font-serif text-2xl text-navy mb-4">Your cart is empty</h2>
        <Link to="/shop" className="btn-primary">Shop Now</Link>
      </div>
    );
  }

  function handleChange(e) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  }

  async function handleApplyDiscount() {
    if (!discountCode.trim()) return;
    setDiscountError('');
    setDiscountLoading(true);
    try {
      const { data } = await axios.post('/api/discounts/validate', {
        code: discountCode.trim(),
        subtotal,
      });
      setDiscountApplied(data);
    } catch (err) {
      setDiscountApplied(null);
      setDiscountError(err.response?.data?.error || 'Invalid discount code');
    } finally {
      setDiscountLoading(false);
    }
  }

  function handleRemoveDiscount() {
    setDiscountApplied(null);
    setDiscountCode('');
    setDiscountError('');
  }

  const discountAmount = discountApplied ? discountApplied.discount_amount : 0;
  const total = Math.max(0, subtotal - discountAmount);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const orderItems = items.map(i => ({
        product_id: i.id,
        size: i.selectedSize,
        quantity: i.cartQty,
      }));
      const payload = {
        ...form,
        items: orderItems,
        discount_code: discountApplied ? discountApplied.code : undefined,
      };
      const { data } = await axios.post('/api/orders', payload);
      clearCart();
      setSuccess(data.order);
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  if (success) return (
    <div className="page-enter pt-20 min-h-screen flex flex-col items-center justify-center px-4 text-center">
      <div className="w-16 h-16 bg-navy rounded-full flex items-center justify-center mb-6">
        <svg className="w-8 h-8 text-cream" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
        </svg>
      </div>
      <h2 className="font-serif text-3xl text-navy mb-3">Order Confirmed!</h2>
      <p className="font-sans text-sm text-navy/60 mb-1">Order #{success.id}</p>
      <p className="font-sans text-sm text-navy/60 mb-8 max-w-sm">
        Thank you, {success.customer_name}! Your order has been placed. We'll be in touch soon.
      </p>
      <div className="bg-cream-dark p-6 max-w-sm w-full text-left mb-8">
        <p className="font-sans text-xs tracking-widest uppercase text-beige mb-3">Order Details</p>
        <div className="space-y-1 font-sans text-sm text-navy/70">
          <p><span className="text-navy font-medium">Total:</span> ${Number(success.total).toFixed(2)}</p>
          <p><span className="text-navy font-medium">Delivery:</span> Cash on Delivery</p>
          <p><span className="text-navy font-medium">Address:</span> {success.address}</p>
        </div>
      </div>
      <Link to="/shop" className="btn-primary">Continue Shopping</Link>
    </div>
  );

  return (
    <div className="page-enter pt-20">
      <div className="max-w-screen-xl mx-auto px-6 lg:px-10 py-12">
        <h1 className="section-title mb-10">Checkout</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Form */}
          <form onSubmit={handleSubmit} className="lg:col-span-2 space-y-5">
            <div>
              <p className="font-sans text-xs tracking-widest uppercase text-navy mb-4">Customer Information</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-sans text-xs text-navy/60 mb-1.5">Full Name *</label>
                  <input name="customer_name" value={form.customer_name} onChange={handleChange} required className="input-field" placeholder="Your full name" />
                </div>
                <div>
                  <label className="block font-sans text-xs text-navy/60 mb-1.5">Phone Number *</label>
                  <input name="phone" value={form.phone} onChange={handleChange} required className="input-field" placeholder="+212 6XX XXXXXX" />
                </div>
                <div className="md:col-span-2">
                  <label className="block font-sans text-xs text-navy/60 mb-1.5">Email Address *</label>
                  <input name="email" type="email" value={form.email} onChange={handleChange} required className="input-field" placeholder="your@email.com" />
                </div>
                <div className="md:col-span-2">
                  <label className="block font-sans text-xs text-navy/60 mb-1.5">Delivery Address *</label>
                  <textarea name="address" value={form.address} onChange={handleChange} required rows={3} className="input-field resize-none" placeholder="Street address, city, postal code..." />
                </div>
              </div>
            </div>

            {/* Delivery option — COD only */}
            <div>
              <p className="font-sans text-xs tracking-widest uppercase text-navy mb-4">Delivery Option</p>
              <div className="border border-navy bg-cream-dark p-4">
                <p className="font-sans text-sm font-medium text-navy">Cash on Delivery</p>
                <p className="font-sans text-xs text-navy/50 mt-1">Pay when your order arrives</p>
              </div>
            </div>

            {/* Discount code */}
            <div>
              <p className="font-sans text-xs tracking-widest uppercase text-navy mb-3">Discount Code</p>
              {discountApplied ? (
                <div className="flex items-center justify-between bg-green-50 border border-green-200 px-4 py-3">
                  <div>
                    <p className="font-sans text-sm font-medium text-green-800">{discountApplied.code}</p>
                    <p className="font-sans text-xs text-green-600">{discountApplied.message}</p>
                  </div>
                  <button type="button" onClick={handleRemoveDiscount}
                    className="font-sans text-xs text-red-500 hover:text-red-700 transition-colors ml-4">
                    Remove
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={discountCode}
                    onChange={e => { setDiscountCode(e.target.value); setDiscountError(''); }}
                    onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleApplyDiscount())}
                    placeholder="Enter discount code"
                    className="input-field flex-1 uppercase"
                  />
                  <button
                    type="button"
                    onClick={handleApplyDiscount}
                    disabled={discountLoading || !discountCode.trim()}
                    className="btn-primary text-sm px-5 disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
                  >
                    {discountLoading ? '...' : 'Apply'}
                  </button>
                </div>
              )}
              {discountError && (
                <p className="font-sans text-xs text-red-600 mt-2">{discountError}</p>
              )}
            </div>

            {/* Notes */}
            <div>
              <label className="block font-sans text-xs text-navy/60 mb-1.5">Order Notes (optional)</label>
              <textarea name="notes" value={form.notes} onChange={handleChange} rows={3} className="input-field resize-none" placeholder="Any special instructions for your order..." />
            </div>

            {error && <p className="font-sans text-sm text-red-600 bg-red-50 border border-red-200 px-4 py-3">{error}</p>}

            <button type="submit" disabled={loading} className="btn-primary w-full text-center text-sm">
              {loading ? 'Placing Order...' : 'Confirm Order'}
            </button>
          </form>

          {/* Summary */}
          <div>
            <div className="bg-cream-dark p-6 sticky top-24">
              <h2 className="font-serif text-xl text-navy mb-5">Your Order</h2>
              <div className="space-y-4 mb-6">
                {items.map(item => {
                  const image = item.primary_image || (item.images && item.images[0]?.url);
                  return (
                    <div key={`${item.id}-${item.selectedSize}`} className="flex gap-3">
                      <div className="w-14 h-18 flex-shrink-0 bg-cream overflow-hidden">
                        {image && <img src={image} alt={item.name} className="w-full h-full object-cover" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-sans text-xs text-navy font-medium truncate">{item.name}</p>
                        <p className="font-sans text-xs text-navy/50">Size: {item.selectedSize} · Qty: {item.cartQty}</p>
                        <p className="font-sans text-xs text-navy mt-1">${(item.price * item.cartQty).toFixed(2)}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="border-t border-beige/50 pt-4 space-y-2">
                <div className="flex justify-between font-sans text-sm text-navy/60">
                  <span>Subtotal</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                {discountApplied && (
                  <div className="flex justify-between font-sans text-sm text-green-700">
                    <span>Discount ({discountApplied.code})</span>
                    <span>−${discountAmount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between font-serif text-base text-navy border-t border-beige/30 pt-2 mt-2">
                  <span>Total</span>
                  <span>${total.toFixed(2)}</span>
                </div>
                <p className="font-sans text-xs text-navy/40 mt-1">Payment: Cash on Delivery</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
