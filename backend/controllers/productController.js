const Product = require('../models/Product');
const Order = require('../models/Order');

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
    const [products, orderStats] = await Promise.all([
      Product.find(),
      Order.aggregate([
        { $unwind: '$items' },
        { $match: { status: { $ne: 'cancelled' } } },
        { $group: { _id: '$items.product', count: { $sum: '$items.quantity' } } }
      ])
    ]);

    const orderCountMap = new Map(
      orderStats.map((entry) => [String(entry._id), Number(entry.count || 0)])
    );

    const enrichedProducts = products.map((product) => {
      const plain = product.toObject();
      plain.ordersCount = orderCountMap.get(String(product._id)) || 0;
      return plain;
    });

    enrichedProducts.sort((left, right) => {
      const leftReviewCount = Number(left.numReviews || 0);
      const rightReviewCount = Number(right.numReviews || 0);
      if (rightReviewCount !== leftReviewCount) {
        return rightReviewCount - leftReviewCount;
      }

      const leftOrders = Number(left.ordersCount || 0);
      const rightOrders = Number(right.ordersCount || 0);
      if (rightOrders !== leftOrders) {
        return rightOrders - leftOrders;
      }

      const leftRating = Number(left.ratings || 0);
      const rightRating = Number(right.ratings || 0);
      return rightRating - leftRating;
    });

    res.status(200).json({
      success: true,
      count: enrichedProducts.length,
      data: enrichedProducts
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Add/Update product rating (allowed only after user has ordered the product)
exports.rateProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    const rawRating = Number(req.body?.rating);
    if (!Number.isFinite(rawRating)) {
      return res.status(400).json({
        success: false,
        message: 'Rating is required'
      });
    }

    const rating = Math.min(5, Math.max(1, Math.round(rawRating)));

    const hasOrdered = await Order.exists({
      user: req.user._id,
      status: { $ne: 'cancelled' },
      'items.product': product._id
    });

    if (!hasOrdered) {
      return res.status(403).json({
        success: false,
        message: 'You can rate this product only after placing an order for it'
      });
    }

    if (!Array.isArray(product.reviews)) {
      product.reviews = [];
    }

    const existingReview = product.reviews.find(
      (review) => String(review.user) === String(req.user._id)
    );

    if (existingReview) {
      existingReview.rating = rating;
      existingReview.name = req.user.name || existingReview.name || '';
      existingReview.createdAt = new Date();
    } else {
      product.reviews.push({
        user: req.user._id,
        name: req.user.name || '',
        rating,
        createdAt: new Date()
      });
    }

    product.numReviews = product.reviews.length;
    const totalRating = product.reviews.reduce((sum, review) => sum + Number(review.rating || 0), 0);
    product.ratings = product.numReviews > 0 ? Number((totalRating / product.numReviews).toFixed(1)) : 0;

    await product.save();

    res.status(200).json({
      success: true,
      message: existingReview ? 'Rating updated successfully' : 'Rating submitted successfully',
      data: product
    });
  } catch (error) {
    res.status(400).json({
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

// Migrate broken image URLs to placeholder (admin only)
exports.migrateImages = async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only admins can perform this migration'
      });
    }

    const placeholder = 'https://via.placeholder.com/400';
    const products = await Product.find();
    let updated = 0;

    for (const product of products) {
      let modified = false;

      // Filter out /uploads/ URLs from images array
      if (Array.isArray(product.images)) {
        const filteredImages = product.images.filter(
          (img) => img && typeof img === 'string' && !img.includes('/uploads/')
        );
        if (filteredImages.length !== product.images.length) {
          product.images = filteredImages;
          modified = true;
        }
      }

      // Fix main image if it's a local file URL
      if (product.image && typeof product.image === 'string' && product.image.includes('/uploads/')) {
        product.image = placeholder;
        modified = true;
      }

      // If no valid image after cleanup, use placeholder
      if (!product.image || product.image === '') {
        product.image = placeholder;
        modified = true;
      }

      // Clean up variant images
      if (Array.isArray(product.variants)) {
        for (const variant of product.variants) {
          if (Array.isArray(variant.images)) {
            const filteredVariantImages = variant.images.filter(
              (img) => img && typeof img === 'string' && !img.includes('/uploads/')
            );
            if (filteredVariantImages.length !== variant.images.length) {
              variant.images = filteredVariantImages;
              modified = true;
            }
          }
        }
      }

      if (modified) {
        await product.save();
        updated++;
      }
    }

    res.status(200).json({
      success: true,
      message: `Migration completed. Updated ${updated} products.`,
      updatedCount: updated,
      totalProducts: products.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
