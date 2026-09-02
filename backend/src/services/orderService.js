const pool = require('../config/db');
const orderModel = require('../models/orderModel');
const productModel = require('../models/productModel');
const AppError = require('../utils/AppError');

const orderService = {
  async createOrder({ customer_name, customer_email, items }) {
    // items = [{ product_id, quantity }, ...]

    if (!items || items.length === 0) {
      throw new AppError('Order must contain at least one item', 400);
    }

    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      let total_amount = 0;
      const validatedItems = [];

      // Step 1: validate each product exists, has stock, and calculate total
      for (const item of items) {
        const [rows] = await connection.execute(
          'SELECT id, name, price, stock FROM products WHERE id = ? AND is_active = 1',
          [item.product_id]
        );
        const product = rows[0];

        if (!product) {
          throw new AppError(`Product ${item.product_id} not found`, 404);
        }
        if (product.stock < item.quantity) {
          throw new AppError(`Insufficient stock for ${product.name}`, 400);
        }

        const price_at_purchase = product.price;
        total_amount += price_at_purchase * item.quantity;

        validatedItems.push({
          product_id: product.id,
          quantity: item.quantity,
          price_at_purchase
        });
      }

      // Step 2: create the order
      const [orderResult] = await connection.execute(
        'INSERT INTO orders (customer_name, customer_email, total_amount) VALUES (?, ?, ?)',
        [customer_name, customer_email, total_amount]
      );
      const orderId = orderResult.insertId;

      // Step 3: insert order_items
      for (const item of validatedItems) {
        await connection.execute(
          'INSERT INTO order_items (order_id, product_id, quantity, price_at_purchase) VALUES (?, ?, ?, ?)',
          [orderId, item.product_id, item.quantity, item.price_at_purchase]
        );
      }

      await connection.commit();

      return await orderModel.findById(orderId);

    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  },

  async getOrderById(id) {
    const order = await orderModel.findById(id);
    if (!order) {
      throw new AppError('Order not found', 404);
    }
    const items = await orderModel.getOrderItems(id);
    return { ...order, items };
  },

  async getAllOrders() {
    return await orderModel.findAll();
  }
};

module.exports = orderService;