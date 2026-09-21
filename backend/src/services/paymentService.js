const Stripe = require('stripe');
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

const pool = require('../config/db');
const paymentModel = require('../models/paymentModel');
const orderModel = require('../models/orderModel');
const AppError = require('../utils/AppError');

const paymentService = {
  async getPaymentByOrderId(order_id) {
    const payment = await paymentModel.findByOrderId(order_id);
    if (!payment) {
      throw new AppError('No payment found for this order', 404);
    }
    return {
      order_id: payment.order_id,
      status: payment.status,
      amount: payment.amount,
      created_at: payment.created_at
    };
  },

  // Step 1: called when customer proceeds to checkout on an existing PENDING order
  async createPaymentIntent(order_id) {
    const order = await orderModel.findById(order_id);
    if (!order) {
      throw new AppError('Order not found', 404);
    }
    if (order.status !== 'PENDING') {
      throw new AppError(`Order is already ${order.status}`, 400);
    }

    // Stripe wants the smallest currency unit (centavos for PHP)
    const amountInCentavos = Math.round(order.total_amount * 100);

    const intent = await stripe.paymentIntents.create({
      amount: amountInCentavos,
      currency: 'php',
      metadata: { order_id: order.id.toString() }, // ties Stripe object back to our order
      automatic_payment_methods: {
        enabled: true,
        allow_redirects: 'never'
      }
    });

    await paymentModel.create({
      order_id: order.id,
      stripe_payment_intent_id: intent.id,
      amount: order.total_amount,
      method: null, // unknown until customer actually pays
      status: 'PENDING',
      raw_response: intent
    });

    // client_secret is what the frontend needs to actually collect card details
    return {
        client_secret: intent.client_secret,
        payment_intent_id: intent.id
    };
  },

  // Step 2: called by Stripe's webhook when payment status changes
  async handleWebhookEvent(event) {
    const intent = event.data.object;
    const payment = await paymentModel.findByStripeIntentId(intent.id);

    if (!payment) {
      return;
    }

    let newStatus;
    if (event.type === 'payment_intent.succeeded') {
      newStatus = 'PAID';
    } else if (event.type === 'payment_intent.payment_failed') {
      newStatus = 'FAILED';
    } else {
      return;
    }

    const previousStatus = payment.status;
    if (previousStatus === newStatus) return;

    // If payment succeeded, check stock BEFORE opening the transaction that commits everything
    if (newStatus === 'PAID') {
      const [items] = await pool.execute(
        'SELECT product_id, quantity FROM order_items WHERE order_id = ?',
        [payment.order_id]
      );

      for (const item of items) {
        const [rows] = await pool.execute(
          'SELECT stock FROM products WHERE id = ?',
          [item.product_id]
        );
        if (rows[0].stock < item.quantity) {
          // Can't fulfill — refund the customer since Stripe already charged them
          await stripe.refunds.create({ payment_intent: intent.id });

          await pool.execute(
            'UPDATE payments SET status = ?, raw_response = ? WHERE id = ?',
            ['REFUNDED', JSON.stringify(intent), payment.id]
          );
          await pool.execute(
            'UPDATE orders SET status = ? WHERE id = ?',
            ['FAILED', payment.order_id]
          );
          await pool.execute(
            `INSERT INTO payment_logs (payment_id, previous_status, new_status, source) VALUES (?, ?, ?, ?)`,
            [payment.id, previousStatus, 'REFUNDED', 'WEBHOOK_AUTO_REFUND']
          );

          return;
        }
      }
    }

    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      await connection.execute(
        'UPDATE payments SET status = ?, raw_response = ? WHERE id = ?',
        [newStatus, JSON.stringify(intent), payment.id]
      );

      await connection.execute(
        'UPDATE orders SET status = ? WHERE id = ?',
        [newStatus, payment.order_id]
      );

      if (newStatus === 'PAID') {
        const [items] = await connection.execute(
          'SELECT product_id, quantity FROM order_items WHERE order_id = ?',
          [payment.order_id]
        );

        for (const item of items) {
          const [rows] = await connection.execute(
            'SELECT stock FROM products WHERE id = ? FOR UPDATE',
            [item.product_id]
          );
          if (rows[0].stock < item.quantity) {
            await stripe.refunds.create({ payment_intent: intent.id });
            await connection.execute(
              'UPDATE payments SET status = ? WHERE id = ?',
              ['REFUNDED', payment.id]
            );
            await connection.execute(
              'UPDATE orders SET status = ? WHERE id = ?',
              ['FAILED', payment.order_id]
            );
            await connection.commit();
            return;
          }
          await connection.execute(
            'UPDATE products SET stock = stock - ? WHERE id = ?',
            [item.quantity, item.product_id]
          );
        }
      }

      await connection.execute(
        `INSERT INTO payment_logs (payment_id, previous_status, new_status, source) 
         VALUES (?, ?, ?, ?)`,
        [payment.id, previousStatus, newStatus, 'WEBHOOK']
      );

      await connection.commit();
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  }
};

module.exports = paymentService;