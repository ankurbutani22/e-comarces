const express = require('express');
const router = express.Router();
const {
  getMyProducts,
  getAllProducts,
  getProductById,
  rateProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  migrateImages
} = require('../controllers/productController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Admin migration endpoint (must come before GET routes)
router.post('/admin/migrate-images', protect, authorize('admin'), migrateImages);

router.get('/my-products', protect, authorize('seller', 'admin'), getMyProducts);

// Get all products
router.get('/', getAllProducts);

// Rate product (allowed only for users who have ordered)
router.post('/:id/rate', protect, authorize('user', 'admin'), rateProduct);

// Get single product
router.get('/:id', getProductById);

// Create product
router.post('/', protect, authorize('seller', 'admin'), createProduct);

// Update product
router.put('/:id', protect, authorize('seller', 'admin'), updateProduct);

// Delete product
router.delete('/:id', protect, authorize('seller', 'admin'), deleteProduct);

module.exports = router;
