const express = require('express');
const router = express.Router();
const { adminPanel, sellerPanel, deliveryPanel } = require('../controllers/panelController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.get('/admin', protect, authorize('admin'), adminPanel);
router.get('/seller', protect, authorize('seller'), sellerPanel);
router.get('/delivery', protect, authorize('delivery_boy', 'admin'), deliveryPanel);

module.exports = router;
