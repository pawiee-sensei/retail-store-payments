const productModel = require('../models/productModel');
const AppError = require('../utils/AppError');

const productService = {
  async getAllProducts() {
    return await productModel.findAll();
  },

  async getProductById(id) {
    const product = await productModel.findById(id);
    if (!product) {
      throw new AppError('Product not found', 404);
    }
    return product;
  },

  async createProduct(data) {
    if (data.price <= 0) {
      throw new AppError('Price must be greater than 0', 400);
    }
    if (data.stock < 0) {
      throw new AppError('Stock cannot be negative', 400);
    }
    const insertId = await productModel.create(data);
    return await productModel.findById(insertId);
  },

  async updateProduct(id, data) {
    await this.getProductById(id); // throws 404 if not found
    if (data.price <= 0) {
      throw new AppError('Price must be greater than 0', 400);
    }
    await productModel.update(id, data);
    return await productModel.findById(id);
  },

  async deleteProduct(id) {
    await this.getProductById(id); // throws 404 if not found
    await productModel.softDelete(id);
  }
};

module.exports = productService;