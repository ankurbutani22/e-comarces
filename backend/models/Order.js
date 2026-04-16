const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    items: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Product',
          required: true
        },
        seller: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          required: true
        },
        productName: {
          type: String,
          required: true
        },
        productImage: {
          type: String,
          default: ''
        },
        quantity: {
          type: Number,
          required: true,
          min: 1
        },
        price: {
          type: Number,
          required: true
        }
      }
    ],
    totalAmount: {
      type: Number,
      required: true
    },
    customerName: {
      type: String,
      required: true,
      trim: true
    },
    customerPhone: {
      type: String,
      required: true,
      trim: true
    },
    customerEmail: {
      type: String,
      default: ''
    },
    shippingAddress: {
      type: String,
      required: true
    },
    paymentMethod: {
      type: String,
      enum: ['cod', 'credit_card', 'debit_card'],
      required: true
    },
    status: {
      type: String,
      enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
      default: 'pending'
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'completed', 'failed'],
      default: 'pending'
    },
    trackingEvents: [
      {
        status: {
          type: String,
          enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
          required: true
        },
        note: {
          type: String,
          default: ''
        },
        updatedByRole: {
          type: String,
          enum: ['user', 'seller', 'delivery_boy', 'admin', 'system'],
          default: 'system'
        },
        updatedAt: {
          type: Date,
          default: Date.now
        }
      }
    ],
    deliveryOtp: {
      codeHash: {
        type: String,
        default: ''
      },
      sentAt: {
        type: Date,
        default: null
      },
      expiresAt: {
        type: Date,
        default: null
      },
      verifiedAt: {
        type: Date,
        default: null
      },
      attempts: {
        type: Number,
        default: 0
      }
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Order', orderSchema);
