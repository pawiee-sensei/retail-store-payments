import { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import ProductList from './components/ProductList';
import Checkout from './components/Checkout';
import './App.css';

const stripePromise = loadStripe('pk_test_51UBWszCMziY5TSm3v6o3jgRAWxrgVnOXtwsi6b7tYgF1Xp6zgWFYezi2twNXNdvbP6F3HV0vvFsVVmZtGlGwqyx2003JB8GdrF');

function App() {
  const [cart, setCart] = useState([]);
  const [orderSuccess, setOrderSuccess] = useState(false);

  function handleAddToCart(product) {
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

  return (
    <div>
      <h1>Retail Store (Test)</h1>
      <ProductList onAddToCart={handleAddToCart} />
      <section>
        <h2>Cart</h2>
        {cart.length === 0 ? (
          <p>Cart is empty</p>
        ) : (
          cart.map(item => (
            <div key={item.product_id}>
              {item.name} x{item.quantity} — ₱{(item.price * item.quantity).toFixed(2)}
            </div>
          ))
        )}
        <p>Total: ₱{cart.reduce((sum, item) => sum + item.price * item.quantity, 0).toFixed(2)}</p>
      </section>

      {orderSuccess && (
        <section>
          <p>Thanks for your order!</p>
          <button onClick={() => setOrderSuccess(false)}>Start new order</button>
        </section>
      )}

      {!orderSuccess && cart.length > 0 && (
        <Elements stripe={stripePromise}>
          <Checkout
            cart={cart}
            onSuccess={() => {
              setCart([]);
              setOrderSuccess(true);
            }}
          />
        </Elements>
      )}
    </div>

  );
}

export default App;