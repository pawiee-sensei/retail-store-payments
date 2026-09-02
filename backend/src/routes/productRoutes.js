const express = require('express');
const router = express.Router();

const productController = require('../controllers/productController');
const { productValidationRules } = require('../middleware/validators/productValidator');
const validateRequest = require('../middleware/validateRequest');

router.get('/', productController.getAll);
router.get('/:id', productController.getById);
router.post('/', productValidationRules, validateRequest, productController.create);
router.put('/:id', productValidationRules, validateRequest, productController.update);
router.delete('/:id', productController.remove);

module.exports = router;