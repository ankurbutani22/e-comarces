const mongoose = require('mongoose');

const adSchema = new mongoose.Schema(
  {
    image: {
      type: String,
      required: [true, 'Ad image is required']
    },
    companyName: {
      type: String,
      default: '',
      trim: true,
      maxlength: [120, 'Company name cannot exceed 120 characters']
    },
    productName: {
      type: String,
      default: '',
      trim: true,
      maxlength: [140, 'Product name cannot exceed 140 characters']
    },
    content: {
      type: String,
      default: '',
      trim: true,
      maxlength: [500, 'Content cannot exceed 500 characters']
    },
    title: {
      type: String,
      default: 'Featured Offer',
      trim: true,
      maxlength: [120, 'Title cannot exceed 120 characters']
    },
    subtitle: {
      type: String,
      default: '',
      trim: true,
      maxlength: [220, 'Subtitle cannot exceed 220 characters']
    },
    isActive: {
      type: Boolean,
      default: true
    },
    sortOrder: {
      type: Number,
      default: 0
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Ad', adSchema);
