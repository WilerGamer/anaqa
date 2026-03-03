import { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [items, setItems] = useState(() => {
    try { return JSON.parse(localStorage.getItem('anaqa_cart')) || []; }
    catch { return []; }
  });

  useEffect(() => {
    localStorage.setItem('anaqa_cart', JSON.stringify(items));
  }, [items]);

  function addItem(product, size, quantity = 1) {
    const key = `${product.id}-${size}`;
    const existing = items.find(i => `${i.id}-${i.selectedSize}` === key);
    const currentQty = existing ? existing.cartQty : 0;
    const sizeData = product.sizes?.find(s => s.size === size);
    const maxStock = sizeData ? sizeData.quantity : Infinity;

    if (currentQty + quantity > maxStock) return 'limit';

    setItems(prev => {
      const e = prev.find(i => `${i.id}-${i.selectedSize}` === key);
      if (e) {
        return prev.map(i =>
          `${i.id}-${i.selectedSize}` === key
            ? { ...i, cartQty: i.cartQty + quantity }
            : i
        );
      }
      return [...prev, { ...product, selectedSize: size, cartQty: quantity, availableStock: maxStock }];
    });
    return 'ok';
  }

  function removeItem(productId, size) {
    setItems(prev => prev.filter(i => !(i.id === productId && i.selectedSize === size)));
  }

  function updateQty(productId, size, quantity) {
    if (quantity < 1) return removeItem(productId, size);
    const item = items.find(i => i.id === productId && i.selectedSize === size);
    if (item && item.availableStock !== undefined && quantity > item.availableStock) return 'limit';
    setItems(prev =>
      prev.map(i =>
        i.id === productId && i.selectedSize === size ? { ...i, cartQty: quantity } : i
      )
    );
    return 'ok';
  }

  function clearCart() { setItems([]); }

  const count = items.reduce((sum, i) => sum + i.cartQty, 0);
  const subtotal = items.reduce((sum, i) => sum + i.price * i.cartQty, 0);

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, updateQty, clearCart, count, subtotal }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
