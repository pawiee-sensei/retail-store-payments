const express = require('express');
const router = express.Router();

const orderController = require('../controllers/orderController');
const { orderValidationRules } = require('../middleware/validators/orderValidator');
const validateRequest = require('../middleware/validateRequest');

router.post('/', orderValidationRules, validateRequest, orderController.create);
router.get('/', orderController.getAll);
router.get('/:id', orderController.getById);

module.exports = router;