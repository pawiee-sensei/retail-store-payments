const productService = require('../services/productService');
const asyncHandler = require('../middleware/asyncHandler');

const productController = {
  getAll: asyncHandler(async (req, res) => {
    const products = await productService.getAllProducts();
    res.json({ success: true, data: products });
  }),

  getById: asyncHandler(async (req, res) => {
    const product = await productService.getProductById(req.params.id);
    res.json({ success: true, data: product });
  }),

  create: asyncHandler(async (req, res) => {
    const product = await productService.createProduct(req.body);
    res.status(201).json({ success: true, data: product });
  }),

  update: asyncHandler(async (req, res) => {
    const product = await productService.updateProduct(req.params.id, req.body);
    res.json({ success: true, data: product });
  }),

  remove: asyncHandler(async (req, res) => {
    await productService.deleteProduct(req.params.id);
    res.json({ success: true, message: 'Product deleted' });
  })
};

module.exports = productController;