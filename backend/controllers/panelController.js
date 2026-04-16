exports.adminPanel = async (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Welcome to Admin Panel',
    data: {
      role: 'admin',
      features: ['Manage users', 'Manage products', 'View all orders', 'Manage categories']
    }
  });
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
