const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide a product name'],
      trim: true,
      maxlength: [100, 'Product name cannot exceed 100 characters']
    },
    description: {
      type: String,
      required: [true, 'Please provide a product description'],
      maxlength: [1000, 'Description cannot exceed 1000 characters']
    },
    price: {
      type: Number,
      required: [true, 'Please provide a product price'],
      min: [0, 'Price cannot be negative']
    },
    category: {
      type: String,
      required: [true, 'Please provide a product category'],
      enum: ['Electronics', 'Clothing', 'Mobile', 'Cosmetic', 'Novelty', 'Books', 'Home', 'Sports', 'Other']
    },
    stock: {
      type: Number,
      required: [true, 'Please provide stock quantity'],
      default: 0,
      min: [0, 'Stock cannot be negative']
    },
    image: {
      type: String,
      default: 'https://via.placeholder.com/400'
    },
    images: {
      type: [String],
      default: []
    },
    video: {
      type: String,
      default: ''
    },
    ratings: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    numReviews: {
      type: Number,
      default: 0
    },
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    variants: {
      type: [
        {
          name: {
            type: String,
            required: true
          },
          images: {
            type: [String],
            default: []
          }
        }
      ],
      default: []
    },
    sizes: {
      type: [String],
      default: []
    },
    ramSizes: {
      type: [String],
      default: []
    },
    romSizes: {
      type: [String],
      default: []
    },
    customOptions: {
      type: [String],
      default: []
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Product', productSchema);
