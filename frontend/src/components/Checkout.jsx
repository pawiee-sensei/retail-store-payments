import { useState } from 'react';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';

const API_BASE = 'http://localhost:5000/api';

function Checkout({ cart, onSuccess }) {
  const stripe = useStripe();
  const elements = useElements();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [clientSecret, setClientSecret] = useState(null);
  const [message, setMessage] = useState('');
  const [processing, setProcessing] = useState(false);

  async function handleProceedToPayment() {
    if (!name || !email) {
      alert('Please enter your name and email');
      return;
    }

    const items = cart.map(item => ({
      product_id: item.product_id,
      quantity: item.quantity
    }));

    try {
      const orderRes = await fetch(`${API_BASE}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customer_name: name, customer_email: email, items })
      });
      const orderData = await orderRes.json();

      if (!orderData.success) {
        alert('Order failed: ' + orderData.message);
        return;
      }

      const intentRes = await fetch(`${API_BASE}/payments/create-intent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_id: orderData.data.id })
      });
      const intentData = await intentRes.json();

      if (!intentData.success) {
        alert('Payment setup failed: ' + intentData.message);
        return;
      }

      setClientSecret(intentData.data.client_secret);

    } catch (err) {
      console.error(err);
      alert('Something went wrong: ' + err.message);
    }
  }

  async function handlePayNow() {
    if (!stripe || !elements || !clientSecret) return;

    setProcessing(true);
    setMessage('Processing...');

    try {
      const cardElement = elements.getElement(CardElement);

      const result = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
          billing_details: { name, email }
        }
      });

      console.log('Stripe confirmCardPayment result:', result);

      const { error, paymentIntent } = result;

      if (error) {
        console.error('Stripe confirm error:', error);
        setMessage('Payment failed: ' + error.message);
      } else if (paymentIntent) {
        console.log('Payment intent status was:', paymentIntent.status);
        setMessage('Payment successful! Order paid.');
        onSuccess();
      } else {
        setMessage('Payment failed: unknown error');
      }
    } catch (err) {
      console.error('handlePayNow threw an exception:', err);
      setMessage('Something went wrong: ' + err.message);
    } finally {
      setProcessing(false);
    }
  }

  return (
    <section>
      <h2>Checkout</h2>
      <input
        type="text"
        placeholder="Your name"
        value={name}
        onChange={e => setName(e.target.value)}
      />
      <input
        type="email"
        placeholder="Your email"
        value={email}
        onChange={e => setEmail(e.target.value)}
      />

      {!clientSecret ? (
        <button onClick={handleProceedToPayment}>Proceed to Payment</button>
      ) : (
        <div style={{ marginTop: '15px' }}>
          <CardElement />
          <button onClick={handlePayNow} disabled={processing} style={{ marginTop: '10px' }}>
            Pay Now
          </button>
          {message && <p>{message}</p>}
        </div>
      )}
    </section>
  );
}

export default Checkout;