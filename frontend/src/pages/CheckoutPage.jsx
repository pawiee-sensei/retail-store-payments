import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CardNumberElement, CardExpiryElement, CardCvcElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { useCart } from '../hooks/useCart';
import { useToast } from '../hooks/useToast';

const API_BASE = 'http://localhost:5000/api';

function CheckoutPage() {
  const { cart, subtotal, clearCart } = useCart();
  const { showToast } = useToast();
  const stripe = useStripe();
  const elements = useElements();
  const navigate = useNavigate();

  const [step, setStep] = useState('payment'); // 'payment' | 'review'
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [zip, setZip] = useState('');
  const [clientSecret, setClientSecret] = useState(null);
  const [processing, setProcessing] = useState(false);

  async function handleContinueToReview() {
    if (!name || !email) {
      showToast('Please enter your name and email', 'error');
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
        showToast('Order failed: ' + orderData.message, 'error');
        return;
      }

      const intentRes = await fetch(`${API_BASE}/payments/create-intent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_id: orderData.data.id })
      });
      const intentData = await intentRes.json();

      if (!intentData.success) {
        showToast('Payment setup failed: ' + intentData.message, 'error');
        return;
      }

      setClientSecret(intentData.data.client_secret);
      setStep('review');
    } catch (err) {
      showToast('Something went wrong: ' + err.message, 'error');
    }
  }

  async function handlePlaceOrder() {
    if (!stripe || !elements || !clientSecret) return;

    setProcessing(true);

    try {
      const cardElement = elements.getElement(CardNumberElement);
      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
          billing_details: {
            name,
            email,
            address: { postal_code: zip }
          }
        }
      });

      if (error) {
        showToast('Payment failed: ' + error.message, 'error');
      } else if (paymentIntent) {
        showToast('Payment successful! Order paid.', 'success');
        clearCart();
        navigate('/');
      }
    } catch (err) {
      showToast('Something went wrong: ' + err.message, 'error');
    } finally {
      setProcessing(false);
    }
  }

  if (cart.length === 0) {
    return (
      <div className="checkout-layout">
        <p>Your cart is empty. <a href="/">Go back to shop</a></p>
      </div>
    );
  }

  return (
    <div className="checkout-layout">
      <div className="checkout-form">
        <div className="step-indicator">
          <div className="step step-done">
            <span className="step-circle">✓</span> Shipping
          </div>
          <div className="step-line" />
          <div className={`step ${step === 'payment' ? 'step-active' : 'step-done'}`}>
            <span className="step-circle">{step === 'payment' ? '2' : '✓'}</span> Payment
          </div>
          <div className="step-line" />
          <div className={`step ${step === 'review' ? 'step-active' : ''}`}>
            <span className="step-circle">3</span> Review
          </div>
        </div>

        <div style={{ display: step === 'payment' ? 'block' : 'none' }}>
          <h2>Payment method</h2>
          <p className="step-subtitle">Choose how you'd like to pay for your order.</p>

          <div className="contact-fields">
            <input type="text" placeholder="Your name" value={name} onChange={e => setName(e.target.value)} />
            <input type="email" placeholder="Your email" value={email} onChange={e => setEmail(e.target.value)} />
          </div>

          <div className="payment-options">
            <label className="payment-option payment-option-selected">
              <div className="payment-option-left">
                <input type="radio" name="payment-method" checked readOnly />
                <span className="payment-icon">💳</span>
                <div className="payment-option-info">
                  <span className="payment-option-title">Credit or debit card</span>
                  <span className="payment-option-desc">Pay securely with your card.</span>
                </div>
              </div>
              <div className="card-brand-icons">
                <span className="card-brand card-brand-visa">VISA</span>
                <span className="card-brand card-brand-mc">MC</span>
                <span className="card-brand card-brand-amex">AMEX</span>
                <span className="card-brand card-brand-disc">DISC</span>
              </div>
            </label>

            <label
              className="payment-option"
              onClick={() => showToast('Saved cards aren\'t available in this demo', 'info')}
            >
              <div className="payment-option-left">
                <input type="radio" name="payment-method" checked={false} readOnly />
                <span className="payment-icon">💳</span>
                <div className="payment-option-info">
                  <span className="payment-option-title">Saved card</span>
                  <span className="payment-option-desc">Use your saved card ending in 4242.</span>
                </div>
              </div>
            </label>

            <label
              className="payment-option"
              onClick={() => showToast('PayPal isn\'t available in this demo', 'info')}
            >
              <div className="payment-option-left">
                <input type="radio" name="payment-method" checked={false} readOnly />
                <span className="payment-icon payment-icon-paypal">P</span>
                <div className="payment-option-info">
                  <span className="payment-option-title">PayPal</span>
                  <span className="payment-option-desc">Pay with your PayPal account.</span>
                </div>
              </div>
            </label>
          </div>

          <div className="card-details-box">
            <h3>Card details</h3>

            <label className="card-field-label">Card number</label>
            <div className="card-element-wrapper">
              <CardNumberElement options={{ showIcon: true }} />
            </div>

            <div className="card-row">
              <div className="card-col">
                <label className="card-field-label">Expiry date</label>
                <div className="card-element-wrapper">
                  <CardExpiryElement />
                </div>
              </div>
              <div className="card-col">
                <label className="card-field-label">CVC</label>
                <div className="card-element-wrapper">
                  <CardCvcElement />
                </div>
              </div>
              <div className="card-col">
                <label className="card-field-label">ZIP</label>
                <input
                  type="text"
                  className="zip-input"
                  placeholder="12345"
                  value={zip}
                  onChange={e => setZip(e.target.value)}
                  maxLength={10}
                />
              </div>
            </div>

            <label className="fake-checkbox">
              <input type="checkbox" readOnly onClick={e => e.preventDefault()} />
              Save this card for future purchases
            </label>
          </div>

          <button className="checkout-btn" onClick={handleContinueToReview}>
            Continue to review →
          </button>
        </div>

        {step === 'review' && (
          <>
            <h2>Review your order</h2>
            <p className="step-subtitle">Confirm your details before placing your order.</p>

            <div className="review-info">
              <div><strong>Name:</strong> {name}</div>
              <div><strong>Email:</strong> {email}</div>
              <div><strong>Payment:</strong> Credit or debit card</div>
            </div>

            <button className="checkout-btn" onClick={handlePlaceOrder} disabled={processing}>
              {processing ? 'Processing...' : 'Place Order'}
            </button>
          </>
        )}
      </div>

      <div className="order-summary">
        <h2>Order Summary</h2>
        {cart.map(item => (
          <div className="summary-item" key={item.product_id}>
            <span>{item.name} x{item.quantity}</span>
            <span>₱{(item.price * item.quantity).toFixed(2)}</span>
          </div>
        ))}
        <div className="summary-total">
          <span>Total</span>
          <span>₱{subtotal.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
}

export default CheckoutPage;