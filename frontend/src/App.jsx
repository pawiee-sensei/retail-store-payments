import { Routes, Route } from 'react-router-dom';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import ShopPage from './pages/ShopPage';
import CheckoutPage from './pages/CheckoutPage';
import './App.css';

const stripePromise = loadStripe('pk_test_51UBWszCMziY5TSm3v6o3jgRAWxrgVnOXtwsi6b7tYgF1Xp6zgWFYezi2twNXNdvbP6F3HV0vvFsVVmZtGlGwqyx2003JB8GdrF');

function App() {
  return (
    <Routes>
      <Route path="/" element={<ShopPage />} />
      <Route
        path="/checkout"
        element={
          <Elements stripe={stripePromise}>
            <CheckoutPage />
          </Elements>
        }
      />
    </Routes>
  );
}

export default App;