import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';

export default function Cart() {
  const { items, removeItem, updateQty, subtotal } = useCart();
  const navigate = useNavigate();
  const [limitToast, setLimitToast] = useState(false);

  function handleIncrease(item) {
    const result = updateQty(item.id, item.selectedSize, item.cartQty + 1);
    if (result === 'limit') {
      setLimitToast(true);
      setTimeout(() => setLimitToast(false), 2500);
    }
  }

  if (items.length === 0) return (
    <div className="page-enter pt-20 min-h-screen flex flex-col items-center justify-center px-4">
      <svg className="w-16 h-16 text-beige mb-6" fill="none" stroke="currentColor" strokeWidth={1} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" />
      </svg>
      <h2 className="font-serif text-2xl text-navy mb-2">Your cart is empty</h2>
      <p className="font-sans text-sm text-navy/50 mb-8">Discover our latest luxury essentials.</p>
      <Link to="/shop" className="btn-primary">Continue Shopping</Link>
    </div>
  );

  return (
    <div className="page-enter pt-20">
      <div className="max-w-screen-xl mx-auto px-6 lg:px-10 py-12">
        <h1 className="section-title mb-10">Shopping Cart</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Items */}
          <div className="lg:col-span-2 space-y-0 divide-y divide-cream-dark">
            {items.map(item => {
              const image = item.primary_image || (item.images && item.images[0]?.url);
              return (
                <div key={`${item.id}-${item.selectedSize}`} className="flex gap-5 py-6">
                  {/* Image */}
                  <div className="w-24 h-32 flex-shrink-0 bg-cream-dark overflow-hidden">
                    {image ? (
                      <img src={image} alt={item.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-cream-dark" />
                    )}
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <Link to={`/product/${item.id}`} className="font-serif text-base text-navy hover:text-beige-dark transition-colors">
                      {item.name}
                    </Link>
                    <p className="font-sans text-xs text-navy/50 mt-1 tracking-wide">Size: {item.selectedSize}</p>
                    <p className="font-sans text-sm font-medium text-navy mt-2">${Number(item.price).toFixed(2)}</p>

                    {/* Quantity + Remove */}
                    <div className="flex items-center gap-4 mt-4">
                      <div className="flex items-center border border-beige">
                        <button onClick={() => updateQty(item.id, item.selectedSize, item.cartQty - 1)} className="w-8 h-8 flex items-center justify-center hover:bg-cream-dark text-navy text-sm">−</button>
                        <span className="w-8 h-8 flex items-center justify-center font-sans text-sm border-x border-beige text-navy">{item.cartQty}</span>
                        <button onClick={() => handleIncrease(item)} className="w-8 h-8 flex items-center justify-center hover:bg-cream-dark text-navy text-sm">+</button>
                      </div>
                      <button
                        onClick={() => removeItem(item.id, item.selectedSize)}
                        className="font-sans text-xs text-beige hover:text-navy transition-colors tracking-wide"
                      >
                        Remove
                      </button>
                    </div>
                  </div>

                  {/* Line total */}
                  <div className="text-right flex-shrink-0">
                    <p className="font-sans text-sm font-medium text-navy">${(item.price * item.cartQty).toFixed(2)}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Order summary */}
          <div className="lg:col-span-1">
            <div className="bg-cream-dark p-6 sticky top-24">
              <h2 className="font-serif text-xl text-navy mb-6">Order Summary</h2>
              <div className="space-y-3 mb-6">
                {items.map(item => (
                  <div key={`${item.id}-${item.selectedSize}`} className="flex justify-between font-sans text-sm text-navy/70">
                    <span className="truncate pr-4">{item.name} × {item.cartQty} ({item.selectedSize})</span>
                    <span className="flex-shrink-0">${(item.price * item.cartQty).toFixed(2)}</span>
                  </div>
                ))}
              </div>
              <div className="border-t border-beige/50 pt-4 mb-6">
                <div className="flex justify-between font-sans text-sm text-navy/60 mb-2">
                  <span>Delivery</span>
                  <span className="text-navy/40">Calculated at checkout</span>
                </div>
                <div className="flex justify-between font-serif text-lg text-navy mt-3">
                  <span>Subtotal</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
              </div>
              <button onClick={() => navigate('/checkout')} className="btn-primary w-full text-center">
                Proceed to Checkout
              </button>
              <Link to="/shop" className="block text-center font-sans text-xs tracking-widest uppercase text-navy/50 hover:text-navy mt-4 transition-colors">
                ← Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      </div>

      {limitToast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 px-6 py-3 bg-red-600 text-white font-sans text-sm z-50 shadow-lg">
          You have reached the stock limit available
        </div>
      )}
    </div>
  );
}
