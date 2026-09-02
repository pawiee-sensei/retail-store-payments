const { body } = require('express-validator');

const orderValidationRules = [
  body('customer_name')
    .notEmpty().withMessage('Customer name is required')
    .isString().withMessage('Customer name must be text'),
  body('customer_email')
    .notEmpty().withMessage('Customer email is required')
    .isEmail().withMessage('Must be a valid email'),
  body('items')
    .isArray({ min: 1 }).withMessage('Order must contain at least one item'),
  body('items.*.product_id')
    .isInt({ gt: 0 }).withMessage('Each item must have a valid product_id'),
  body('items.*.quantity')
    .isInt({ gt: 0 }).withMessage('Each item quantity must be a positive integer')
];

module.exports = { orderValidationRules };