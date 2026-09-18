const API_BASE = 'http://localhost:5000/api';
let cart = []; // { product_id, name, price, quantity }

const stripe = Stripe('pk_test_51UBWszCMziY5TSm3oJVZT1dDJABnXIiEPrDeYzzJFw0bUf1x4emOruXv4QUeoM4UEfIjImuNuvZtLSsO8csY1y0Q00ml5Ub2uK');
const elements = stripe.elements();
const cardElement = elements.create('card');

async function loadProducts() {
  const res = await fetch(`${API_BASE}/products`);
  const { data } = await res.json();

  const container = document.getElementById('product-list');
  container.innerHTML = '';

  data.forEach(product => {
    const div = document.createElement('div');
    div.className = 'product-item';
    div.innerHTML = `
      <span>${product.name} — ₱${product.price} (stock: ${product.stock})</span>
      <button onclick="addToCart(${product.id}, '${product.name}', ${product.price})">Add</button>
    `;
    container.appendChild(div);
  });
}

function addToCart(product_id, name, price) {
  const existing = cart.find(item => item.product_id === product_id);
  if (existing) {
    existing.quantity += 1;
  } else {
    cart.push({ product_id, name, price, quantity: 1 });
  }
  renderCart();
}

function renderCart() {
  const container = document.getElementById('cart-items');
  const checkoutSection = document.getElementById('checkout');

  if (cart.length === 0) {
    container.innerHTML = 'Cart is empty';
    checkoutSection.style.display = 'none';
    return;
  }

  container.innerHTML = cart.map(item =>
    `<div>${item.name} x${item.quantity} — ₱${(item.price * item.quantity).toFixed(2)}</div>`
  ).join('');

  const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  document.getElementById('cart-total').textContent = total.toFixed(2);

  checkoutSection.style.display = 'block';
}

loadProducts();

let currentClientSecret = null;

document.getElementById('checkout-btn').addEventListener('click', async () => {
  const name = document.getElementById('customer-name').value.trim();
  const email = document.getElementById('customer-email').value.trim();

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

    const order_id = orderData.data.id;

    const intentRes = await fetch(`${API_BASE}/payments/create-intent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ order_id })
    });
    const intentData = await intentRes.json();

    if (!intentData.success) {
      alert('Payment setup failed: ' + intentData.message);
      return;
    }

    currentClientSecret = intentData.data.client_secret;

    document.getElementById('card-section').style.display = 'block';
    cardElement.mount('#card-element');

    document.getElementById('checkout-btn').disabled = true;

  } catch (err) {
    console.error(err);
    alert('Something went wrong: ' + err.message);
  }
});

document.getElementById('pay-btn').addEventListener('click', async () => {
  const messageEl = document.getElementById('payment-message');
  messageEl.textContent = 'Processing...';

  const { error, paymentIntent } = await stripe.confirmCardPayment(currentClientSecret, {
    payment_method: {
      card: cardElement,
      billing_details: {
        name: document.getElementById('customer-name').value.trim(),
        email: document.getElementById('customer-email').value.trim()
      }
    }
  });

  if (error) {
    messageEl.textContent = 'Payment failed: ' + error.message;
    messageEl.style.color = 'red';
  } else if (paymentIntent.status === 'succeeded') {
    messageEl.textContent = 'Payment successful! Order paid.';
    messageEl.style.color = 'green';
    cart = [];
    renderCart();
  }
});