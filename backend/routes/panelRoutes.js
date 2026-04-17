const express = require('express');
const router = express.Router();
const {
	adminPanel,
	sellerPanel,
	deliveryPanel,
	getAdminDashboard,
	getAdminUsers,
	updateAdminUserRole,
	deleteAdminUser,
	getAdminProducts,
	getAdminOrders,
	getPublicAds,
	getAdminAds,
	createAdminAd,
	updateAdminAd,
	deleteAdminAd
} = require('../controllers/panelController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.get('/ads', getPublicAds);

router.get('/admin', protect, authorize('admin'), adminPanel);
router.get('/admin/dashboard', protect, authorize('admin'), getAdminDashboard);
router.get('/admin/users', protect, authorize('admin'), getAdminUsers);
router.patch('/admin/users/:id/role', protect, authorize('admin'), updateAdminUserRole);
router.delete('/admin/users/:id', protect, authorize('admin'), deleteAdminUser);
router.get('/admin/products', protect, authorize('admin'), getAdminProducts);
router.get('/admin/orders', protect, authorize('admin'), getAdminOrders);
router.get('/admin/ads', protect, authorize('admin'), getAdminAds);
router.post('/admin/ads', protect, authorize('admin'), createAdminAd);
router.put('/admin/ads/:id', protect, authorize('admin'), updateAdminAd);
router.delete('/admin/ads/:id', protect, authorize('admin'), deleteAdminAd);
router.get('/seller', protect, authorize('seller'), sellerPanel);
router.get('/delivery', protect, authorize('delivery_boy', 'admin'), deliveryPanel);

module.exports = router;
