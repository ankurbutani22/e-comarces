const express = require('express');
const router = express.Router();
const {
  getMyProducts,
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct
} = require('../controllers/productController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.get('/my-products', protect, authorize('seller', 'admin'), getMyProducts);

// Get all products
router.get('/', getAllProducts);

// Get single product
router.get('/:id', getProductById);

// Create product
router.post('/', protect, authorize('seller', 'admin'), createProduct);

// Update product
router.put('/:id', protect, authorize('seller', 'admin'), updateProduct);

// Delete product
router.delete('/:id', protect, authorize('seller', 'admin'), deleteProduct);

module.exports = router;
