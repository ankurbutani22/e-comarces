const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');
const Ad = require('../models/Ad');

exports.adminPanel = async (req, res) => {
  try {
    const [usersCount, productsCount, ordersCount] = await Promise.all([
      User.countDocuments(),
      Product.countDocuments(),
      Order.countDocuments()
    ]);

    res.status(200).json({
      success: true,
      message: 'Welcome to Admin Panel',
      data: {
        role: 'admin',
        features: ['Manage users', 'Manage products', 'View all orders', 'Manage categories'],
        stats: {
          users: usersCount,
          products: productsCount,
          orders: ordersCount
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.getAdminDashboard = async (req, res) => {
  try {
    const [usersCount, productsCount, ordersCount, recentOrders] = await Promise.all([
      User.countDocuments(),
      Product.countDocuments(),
      Order.countDocuments(),
      Order.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('user', 'name email')
    ]);

    res.status(200).json({
      success: true,
      data: {
        role: 'admin',
        stats: {
          users: usersCount,
          products: productsCount,
          orders: ordersCount
        },
        recentOrders
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.getAdminUsers = async (req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 }).select('-password');

    res.status(200).json({
      success: true,
      count: users.length,
      data: users
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.updateAdminUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;
    const allowedRoles = ['user', 'admin', 'seller', 'delivery_boy'];

    if (!allowedRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role'
      });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    user.role = role;
    await user.save();

    res.status(200).json({
      success: true,
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.deleteAdminUser = async (req, res) => {
  try {
    const { id } = req.params;

    if (String(req.user._id) === String(id)) {
      return res.status(400).json({
        success: false,
        message: 'You cannot delete your own admin account'
      });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    await User.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.getAdminProducts = async (req, res) => {
  try {
    const products = await Product.find()
      .populate('seller', 'name email role')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: products.length,
      data: products
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.getAdminOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      .populate('user', 'name email phone')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: orders.length,
      data: orders
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.getPublicAds = async (req, res) => {
  try {
    const ads = await Ad.find({ isActive: true })
      .sort({ sortOrder: 1, createdAt: -1 })
      .limit(12)
      .select('-createdBy');

    res.status(200).json({
      success: true,
      count: ads.length,
      data: ads
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.getAdminAds = async (req, res) => {
  try {
    const ads = await Ad.find()
      .sort({ createdAt: -1 })
      .populate('createdBy', 'name email');

    res.status(200).json({
      success: true,
      count: ads.length,
      data: ads
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.createAdminAd = async (req, res) => {
  try {
    const { image, title, subtitle, sortOrder, isActive } = req.body;

    if (!image || !String(image).trim()) {
      return res.status(400).json({
        success: false,
        message: 'Ad image is required'
      });
    }

    const ad = await Ad.create({
      image: String(image).trim(),
      title: String(title || 'Featured Offer').trim(),
      subtitle: String(subtitle || '').trim(),
      sortOrder: Number.isFinite(Number(sortOrder)) ? Number(sortOrder) : 0,
      isActive: typeof isActive === 'boolean' ? isActive : true,
      createdBy: req.user._id
    });

    res.status(201).json({
      success: true,
      data: ad
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

exports.updateAdminAd = async (req, res) => {
  try {
    const { id } = req.params;
    const updatePayload = {};

    if (typeof req.body.image === 'string' && req.body.image.trim()) {
      updatePayload.image = req.body.image.trim();
    }

    if (typeof req.body.title === 'string') {
      updatePayload.title = req.body.title.trim() || 'Featured Offer';
    }

    if (typeof req.body.subtitle === 'string') {
      updatePayload.subtitle = req.body.subtitle.trim();
    }

    if (typeof req.body.sortOrder !== 'undefined') {
      const parsed = Number(req.body.sortOrder);
      if (!Number.isFinite(parsed)) {
        return res.status(400).json({
          success: false,
          message: 'Sort order must be a valid number'
        });
      }
      updatePayload.sortOrder = parsed;
    }

    if (typeof req.body.isActive === 'boolean') {
      updatePayload.isActive = req.body.isActive;
    }

    const ad = await Ad.findByIdAndUpdate(id, updatePayload, {
      new: true,
      runValidators: true
    });

    if (!ad) {
      return res.status(404).json({
        success: false,
        message: 'Ad not found'
      });
    }

    res.status(200).json({
      success: true,
      data: ad
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

exports.deleteAdminAd = async (req, res) => {
  try {
    const { id } = req.params;
    const ad = await Ad.findById(id);

    if (!ad) {
      return res.status(404).json({
        success: false,
        message: 'Ad not found'
      });
    }

    await Ad.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: 'Ad deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.sellerPanel = async (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Welcome to Seller Panel',
    data: {
      role: 'seller',
      features: ['Manage own products', 'View sales', 'Update inventory', 'Track orders']
    }
  });
};

exports.deliveryPanel = async (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Welcome to Delivery Panel',
    data: {
      role: 'delivery_boy',
      features: ['View delivery queue', 'Mark orders delivered', 'Track shipping status', 'Access profile details']
    }
  });
};
