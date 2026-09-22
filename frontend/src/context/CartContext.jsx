import { createContext, useState } from 'react';

export const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [cart, setCart] = useState([]);

  function addToCart(product) {
    setCart(prev => {
      const existing = prev.find(item => item.product_id === product.id);
      if (existing) {
        return prev.map(item =>
          item.product_id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { product_id: product.id, name: product.name, price: Number(product.price), quantity: 1 }];
    });
  }

  function increment(product_id) {
    setCart(prev => prev.map(item =>
      item.product_id === product_id ? { ...item, quantity: item.quantity + 1 } : item
    ));
  }

  function decrement(product_id) {
    setCart(prev =>
      prev
        .map(item =>
          item.product_id === product_id ? { ...item, quantity: item.quantity - 1 } : item
        )
        .filter(item => item.quantity > 0)
    );
  }

  function clearCart() {
    setCart([]);
  }

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <CartContext.Provider value={{ cart, addToCart, increment, decrement, clearCart, subtotal }}>
      {children}
    </CartContext.Provider>
  );
}