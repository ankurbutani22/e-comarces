const express = require('express');
const router = express.Router();
const {
	createOrder,
	getSellerOrders,
	getDeliveryOrders,
	getMyOrders,
	updateSellerOrderStatus,
	updateDeliveryOrderStatus,
	sendDeliveryOtp,
	verifyDeliveryOtp
} = require('../controllers/orderController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.post('/', protect, authorize('user', 'admin'), createOrder);
router.get('/my-orders', protect, authorize('user', 'admin'), getMyOrders);
router.get('/seller', protect, authorize('seller', 'admin'), getSellerOrders);
router.get('/delivery', protect, authorize('delivery_boy', 'admin'), getDeliveryOrders);
router.post('/:id/delivery-otp/send', protect, authorize('delivery_boy', 'admin'), sendDeliveryOtp);
router.post('/:id/delivery-otp/verify', protect, authorize('delivery_boy', 'admin'), verifyDeliveryOtp);
router.patch('/:id/status', protect, authorize('seller', 'admin'), updateSellerOrderStatus);
router.patch('/:id/deliver', protect, authorize('delivery_boy', 'admin'), updateDeliveryOrderStatus);

module.exports = router;
