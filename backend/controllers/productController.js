const Product = require('../models/Product');

// Get products for logged in seller/admin
exports.getMyProducts = async (req, res) => {
  try {
    let products;

    if (req.user.role === 'admin') {
      products = await Product.find().sort({ createdAt: -1 });
    } else {
      products = await Product.find({ seller: req.user._id }).sort({ createdAt: -1 });
    }

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

// Get all products
exports.getAllProducts = async (req, res) => {
  try {
    const products = await Product.find();
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

// Get single product
exports.getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }
    res.status(200).json({
      success: true,
      data: product
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Create product
exports.createProduct = async (req, res) => {
  try {
    const normalizedImages = Array.isArray(req.body.images)
      ? req.body.images.filter(Boolean)
      : [];

    const cleanedVariants = Array.isArray(req.body.variants)
      ? req.body.variants
          .map((variant) => ({
            ...variant,
            images: Array.isArray(variant?.images) ? variant.images.filter(Boolean) : []
          }))
          .filter((variant) => variant?.name)
      : [];

    const fallbackImage =
      req.body.image ||
      normalizedImages[0] ||
      (cleanedVariants.find((variant) => Array.isArray(variant.images) && variant.images.length > 0)?.images?.[0] || '') ||
      'https://via.placeholder.com/400';

    const payload = {
      ...req.body,
      images: normalizedImages,
      image: fallbackImage,
      variants: cleanedVariants,
      seller: req.user._id
    };

    const product = await Product.create(payload);
    res.status(201).json({
      success: true,
      data: product
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Update product
exports.updateProduct = async (req, res) => {
  try {
    const existingProduct = await Product.findById(req.params.id);
    if (!existingProduct) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    if (req.user.role === 'seller' && existingProduct.seller.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only update your own products'
      });
    }

    const normalizedImages = Array.isArray(req.body.images)
      ? req.body.images.filter(Boolean)
      : undefined;

    const cleanedVariants = Array.isArray(req.body.variants)
      ? req.body.variants
          .map((variant) => ({
            ...variant,
            images: Array.isArray(variant?.images) ? variant.images.filter(Boolean) : []
          }))
          .filter((variant) => variant?.name)
      : undefined;

    const updatePayload = {
      ...req.body,
      ...(normalizedImages ? { images: normalizedImages } : {}),
      ...(cleanedVariants ? { variants: cleanedVariants } : {})
    };

    const candidateImage =
      updatePayload.image ||
      (Array.isArray(updatePayload.images) && updatePayload.images.length > 0 ? updatePayload.images[0] : '') ||
      (Array.isArray(updatePayload.variants)
        ? updatePayload.variants.find((variant) => Array.isArray(variant.images) && variant.images.length > 0)?.images?.[0]
        : '') ||
      existingProduct.image;

    updatePayload.image = candidateImage;

    const product = await Product.findByIdAndUpdate(req.params.id, updatePayload, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      success: true,
      data: product
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Delete product
exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    if (req.user.role === 'seller' && product.seller.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only delete your own products'
      });
    }

    await Product.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
