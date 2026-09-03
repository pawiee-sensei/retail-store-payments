const Stripe = require('stripe');
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

const paymentService = require('../services/paymentService');
const asyncHandler = require('../middleware/asyncHandler');
const AppError = require('../utils/AppError');

const paymentController = {
  // Called by YOUR frontend when customer proceeds to checkout
  createIntent: asyncHandler(async (req, res) => {
    const { order_id } = req.body;
    const result = await paymentService.createPaymentIntent(order_id);
    res.status(201).json({ success: true, data: result });
  }),

  // Called by STRIPE, not your frontend — this is the webhook endpoint
  handleWebhook: asyncHandler(async (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;

    try {
      // This verifies the request genuinely came from Stripe, not a spoofed request
      event = stripe.webhooks.constructEvent(
        req.body, // must be raw body, not JSON-parsed — see route note below
        sig,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      throw new AppError(`Webhook signature verification failed: ${err.message}`, 400);
    }

    await paymentService.handleWebhookEvent(event);

    res.json({ received: true });
  })
};

module.exports = paymentController;