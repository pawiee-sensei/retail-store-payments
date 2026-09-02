const orderService = require('../services/orderService');
const asyncHandler = require('../middleware/asyncHandler');

const orderController = {
  create: asyncHandler(async (req, res) => {
    const order = await orderService.createOrder(req.body);
    res.status(201).json({ success: true, data: order });
  }),

  getById: asyncHandler(async (req, res) => {
    const order = await orderService.getOrderById(req.params.id);
    res.json({ success: true, data: order });
  }),

  getAll: asyncHandler(async (req, res) => {
    const orders = await orderService.getAllOrders();
    res.json({ success: true, data: orders });
  })
};

module.exports = orderController;