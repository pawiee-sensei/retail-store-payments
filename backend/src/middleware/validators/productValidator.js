const { body } = require('express-validator');

const productValidationRules = [
  body('name')
    .notEmpty().withMessage('Name is required').bail()
    .isString().withMessage('Name must be text').bail()
    .trim(),

  body('price')
    .notEmpty().withMessage('Price is required').bail()
    .isFloat({ gt: 0 }).withMessage('Price must be a positive number').bail(),

  body('stock')
    .notEmpty().withMessage('Stock is required').bail()
    .isInt({ min: 0 }).withMessage('Stock must be a non-negative integer').bail(),

  body('image_url')
    .optional()
    .isString().withMessage('Image URL must be text').bail()
];

module.exports = { productValidationRules };