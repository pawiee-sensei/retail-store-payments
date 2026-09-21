const express = require('express');
const router = express.Router();

const paymentController = require('../controllers/paymentController');

router.post('/create-intent', paymentController.createIntent);
router.get('/order/:order_id', paymentController.getByOrderId);

// Note: raw body parsing for this specific route happens in server.js,
// applied BEFORE express.json() runs globally
router.post('/webhook', paymentController.handleWebhook);

module.exports = router;