const pool = require('../config/db');

const orderModel = {
  async create({ customer_name, customer_email, total_amount }) {
    const [result] = await pool.execute(
      'INSERT INTO orders (customer_name, customer_email, total_amount) VALUES (?, ?, ?)',
      [customer_name, customer_email, total_amount]
    );
    return result.insertId;
  },

  async findById(id) {
    const [rows] = await pool.execute(
      'SELECT * FROM orders WHERE id = ?',
      [id]
    );
    return rows[0] || null;
  },

  async findAll() {
    const [rows] = await pool.execute(
      'SELECT * FROM orders ORDER BY created_at DESC'
    );
    return rows;
  },

  async updateStatus(id, status) {
    await pool.execute(
      'UPDATE orders SET status = ? WHERE id = ?',
      [status, id]
    );
  },

  // Order items — separate concern, but lives here since it's tightly coupled to orders
  async addOrderItem({ order_id, product_id, quantity, price_at_purchase }) {
    const [result] = await pool.execute(
      'INSERT INTO order_items (order_id, product_id, quantity, price_at_purchase) VALUES (?, ?, ?, ?)',
      [order_id, product_id, quantity, price_at_purchase]
    );
    return result.insertId;
  },

  // This is the JOIN — pulls product details alongside each order item
  async getOrderItems(orderId) {
    const [rows] = await pool.execute(
      `SELECT 
        oi.id, oi.quantity, oi.price_at_purchase,
        p.id AS product_id, p.name AS product_name, p.image_url
       FROM order_items oi
       JOIN products p ON oi.product_id = p.id
       WHERE oi.order_id = ?`,
      [orderId]
    );
    return rows;
  }
};

module.exports = orderModel;