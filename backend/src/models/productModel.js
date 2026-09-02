const pool = require('../config/db');

const productModel = {
  async findAll() {
    const [rows] = await pool.execute(
      'SELECT * FROM products WHERE is_active = 1 ORDER BY id DESC'
    );
    return rows;
  },

  async findById(id) {
    const [rows] = await pool.execute(
      'SELECT * FROM products WHERE id = ? AND is_active = 1',
      [id]
    );
    return rows[0] || null;
  },

  async create({ name, price, stock, image_url }) {
    const [result] = await pool.execute(
      'INSERT INTO products (name, price, stock, image_url) VALUES (?, ?, ?, ?)',
      [name, price, stock, image_url || null]
    );
    return result.insertId;
  },

  async update(id, { name, price, stock, image_url }) {
    await pool.execute(
      'UPDATE products SET name = ?, price = ?, stock = ?, image_url = ? WHERE id = ?',
      [name, price, stock, image_url || null, id]
    );
  },

  async softDelete(id) {
    await pool.execute(
      'UPDATE products SET is_active = 0 WHERE id = ?',
      [id]
    );
  }
};

module.exports = productModel;