const pool = require('../config/db');

const paymentModel = {
  // Create a new payment record
  async create({
    order_id,
    stripe_payment_intent_id,
    amount,
    method,
    status,
    raw_response
  }) {
    const [result] = await pool.execute(
      `INSERT INTO payments (
            order_id,
            stripe_payment_intent_id,
            amount,
            method,
            status,
            raw_response
        )
        VALUES (?, ?, ?, ?, ?, ?)`,
      [
        order_id,
        stripe_payment_intent_id,
        amount,
        method || null,
        status,
        JSON.stringify(raw_response)
      ]
    );

    return result.insertId;
  },

  // Find the latest payment belonging to an order
  // order_id = payments.order_id → orders.id
  async findByOrderId(order_id) {
    const [rows] = await pool.execute(
      `SELECT *
       FROM payments
       WHERE order_id = ?
       ORDER BY created_at DESC
       LIMIT 1`,
      [order_id]
    );

    return rows[0] || null;
  },

  // Find a payment using Stripe's Payment Intent ID
  async findByStripeIntentId(stripe_payment_intent_id) {
    const [rows] = await pool.execute(
      `SELECT *
       FROM payments
       WHERE stripe_payment_intent_id = ?`,
      [stripe_payment_intent_id]
    );

    return rows[0] || null;
  },

  // Update the status and Stripe response of an existing payment
  // id = payments.id
  async updateStatus(id, status, raw_response) {
    await pool.execute(
      `UPDATE payments
       SET
            status = ?,
            raw_response = ?
       WHERE id = ?`,
      [
        status,
        JSON.stringify(raw_response),
        id
      ]
    );
  },

  // Record a payment status change in the payment_logs table
  // payment_id = payment_logs.payment_id → payments.id
  async addLog({
    payment_id,
    previous_status,
    new_status,
    source
  }) {
    await pool.execute(
      `INSERT INTO payment_logs (
            payment_id,
            previous_status,
            new_status,
            source
        )
        VALUES (?, ?, ?, ?)`,
      [
        payment_id,
        previous_status,
        new_status,
        source
      ]
    );
  }
};

module.exports = paymentModel;