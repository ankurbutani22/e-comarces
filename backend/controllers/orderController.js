const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');
const crypto = require('crypto');
const https = require('https');

const OTP_TTL_MS = 10 * 60 * 1000;
const OTP_RESEND_COOLDOWN_MS = 30 * 1000;
const OTP_MAX_ATTEMPTS = 5;

const hashOtp = (orderId, otpCode) => {
  const secret = process.env.OTP_SECRET || 'dev-order-otp-secret';
  return crypto
    .createHash('sha256')
    .update(`${String(orderId)}:${String(otpCode)}:${secret}`)
    .digest('hex');
};

const generateOtpCode = () => String(Math.floor(100000 + Math.random() * 900000));

const normalizePhoneForSms = (rawPhone) => {
  const digits = String(rawPhone || '').replace(/\D/g, '');
  if (!digits) return '';

  if (digits.length === 10) {
    return `+91${digits}`;
  }

  if (digits.length > 10 && !String(rawPhone).trim().startsWith('+')) {
    return `+${digits}`;
  }

  return String(rawPhone).trim();
};

const resolveCustomerOtpPhone = async (order) => {
  const userDoc = await User.findById(order.user).select('phone');
  const preferredPhone = order.customerPhone || userDoc?.phone;
  return normalizePhoneForSms(preferredPhone);
};

const sendOtpSms = async ({ phone, otpCode, orderId }) => {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_PHONE_NUMBER;

  const body = `Your delivery OTP for order ${String(orderId).slice(-6)} is ${otpCode}. Valid for 10 minutes.`;

  if (!sid || !token || !from) {
    console.log(`[DEV_OTP] phone=${phone} order=${orderId} otp=${otpCode}`);
    return { sent: false, provider: 'console' };
  }

  const formBody = new URLSearchParams({
    To: phone,
    From: from,
    Body: body
  }).toString();

  await new Promise((resolve, reject) => {
    const request = https.request(
      {
        method: 'POST',
        hostname: 'api.twilio.com',
        path: `/2010-04-01/Accounts/${sid}/Messages.json`,
        headers: {
          Authorization: `Basic ${Buffer.from(`${sid}:${token}`).toString('base64')}`,
          'Content-Type': 'application/x-www-form-urlencoded',
          'Content-Length': Buffer.byteLength(formBody)
        }
      },
      (response) => {
        let payload = '';
        response.on('data', (chunk) => {
          payload += chunk;
        });
        response.on('end', () => {
          if (response.statusCode >= 200 && response.statusCode < 300) {
            resolve();
            return;
          }

          reject(new Error(`Failed to send OTP SMS: ${payload}`));
        });
      }
    );

    request.on('error', reject);
    request.write(formBody);
    request.end();
  });

  return { sent: true, provider: 'twilio' };
};

const ensureDeliveryOrderAccess = (order, user) => {
  if (!order) {
    return {
      ok: false,
      status: 404,
      message: 'Order not found'
    };
  }

  if (!['delivery_boy', 'admin'].includes(user.role)) {
    return {
      ok: false,
      status: 403,
      message: 'You are not allowed to manage this delivery order'
    };
  }

  return { ok: true };
};

const appendTrackingEvent = (order, { status, note, updatedByRole }) => {
  if (!Array.isArray(order.trackingEvents)) {
    order.trackingEvents = [];
  }

  order.trackingEvents.push({
    status,
    note: note || '',
    updatedByRole: updatedByRole || 'system',
    updatedAt: new Date()
  });
};

exports.createOrder = async (req, res) => {
  try {
    const { items, shippingAddress, customerName, customerPhone, paymentMethod } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Order items are required'
      });
    }

    if (!shippingAddress) {
      return res.status(400).json({
        success: false,
        message: 'Shipping address is required'
      });
    }

    if (!customerName || !String(customerName).trim()) {
      return res.status(400).json({
        success: false,
        message: 'Customer name is required'
      });
    }

    if (!customerPhone || !String(customerPhone).trim()) {
      return res.status(400).json({
        success: false,
        message: 'Phone number is required'
      });
    }

    if (!['cod', 'credit_card', 'debit_card'].includes(paymentMethod)) {
      return res.status(400).json({
        success: false,
        message: 'Please select a valid payment method'
      });
    }

    const productIds = items.map((item) => item.product);
    const products = await Product.find({ _id: { $in: productIds } });
    const productMap = new Map(products.map((p) => [String(p._id), p]));

    let totalAmount = 0;
    const normalizedItems = [];

    for (const item of items) {
      const matched = productMap.get(String(item.product));
      if (!matched) {
        return res.status(400).json({
          success: false,
          message: 'One or more products are invalid'
        });
      }

      const quantity = Number(item.quantity);
      if (!Number.isFinite(quantity) || quantity < 1) {
        return res.status(400).json({
          success: false,
          message: 'Invalid quantity'
        });
      }

      if (matched.stock < quantity) {
        return res.status(400).json({
          success: false,
          message: `${matched.name} is out of stock for requested quantity`
        });
      }

      const linePrice = Number(matched.price);
      totalAmount += linePrice * quantity;

      normalizedItems.push({
        product: matched._id,
        seller: matched.seller,
        productName: matched.name,
        productImage: matched.image || (Array.isArray(matched.images) && matched.images.length > 0 ? matched.images[0] : ''),
        quantity,
        price: linePrice
      });
    }

    for (const item of normalizedItems) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { stock: -item.quantity }
      });
    }

    // Persist latest checkout contact details on user profile for future prefill.
    await User.findByIdAndUpdate(req.user._id, {
      name: String(customerName).trim(),
      phone: String(customerPhone).trim(),
      address: String(shippingAddress).trim()
    });

    const order = await Order.create({
      user: req.user._id,
      items: normalizedItems,
      totalAmount,
      customerName: String(customerName).trim(),
      customerPhone: String(customerPhone).trim(),
      customerEmail: req.user.email || '',
      shippingAddress,
      paymentMethod,
      paymentStatus: paymentMethod === 'cod' ? 'pending' : 'completed',
      trackingEvents: [
        {
          status: 'pending',
          note: 'Order placed by customer',
          updatedByRole: req.user.role || 'user'
        }
      ]
    });

    res.status(201).json({
      success: true,
      data: order
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });

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

exports.getSellerOrders = async (req, res) => {
  try {
    const orders = await Order.find({ 'items.seller': req.user._id })
      .populate('user', 'name email phone')
      .sort({ createdAt: -1 });

    const sellerOrders = orders.map((order) => {
      const sellerItems = order.items.filter(
        (item) => String(item.seller) === String(req.user._id)
      );

      return {
        _id: order._id,
        user: order.user,
        status: order.status,
        paymentStatus: order.paymentStatus,
        paymentMethod: order.paymentMethod,
        shippingAddress: order.shippingAddress,
        customerName: order.customerName,
        customerPhone: order.customerPhone,
        customerEmail: order.customerEmail,
        createdAt: order.createdAt,
        items: sellerItems,
        sellerTotal: sellerItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
      };
    });

    res.status(200).json({
      success: true,
      count: sellerOrders.length,
      data: sellerOrders
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.getDeliveryOrders = async (req, res) => {
  try {
    const orders = await Order.find({ status: { $in: ['processing', 'shipped'] } })
      .populate('user', 'name email phone')
      .sort({ createdAt: -1 });

    const deliveryOrders = orders.map((order) => ({
      _id: order._id,
      user: order.user,
      status: order.status,
      paymentStatus: order.paymentStatus,
      paymentMethod: order.paymentMethod,
      shippingAddress: order.shippingAddress,
      customerName: order.customerName,
      customerPhone: order.customerPhone,
      customerEmail: order.customerEmail,
      createdAt: order.createdAt,
      items: order.items,
      totalAmount: order.totalAmount,
      deliveryOtpSentAt: order.deliveryOtp?.sentAt || null,
      deliveryOtpExpiresAt: order.deliveryOtp?.expiresAt || null,
      deliveryOtpVerified: Boolean(order.deliveryOtp?.verifiedAt)
    }));

    res.status(200).json({
      success: true,
      count: deliveryOrders.length,
      data: deliveryOrders
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.sendDeliveryOtp = async (req, res) => {
  try {
    const { id } = req.params;
    const order = await Order.findById(id);
    const access = ensureDeliveryOrderAccess(order, req.user);

    if (!access.ok) {
      return res.status(access.status).json({
        success: false,
        message: access.message
      });
    }

    if (order.status !== 'shipped') {
      return res.status(400).json({
        success: false,
        message: 'OTP can be sent only when order is in shipped status'
      });
    }

    const lastSentAt = order.deliveryOtp?.sentAt ? new Date(order.deliveryOtp.sentAt).getTime() : 0;
    if (Date.now() - lastSentAt < OTP_RESEND_COOLDOWN_MS) {
      return res.status(429).json({
        success: false,
        message: 'Please wait a few seconds before sending OTP again'
      });
    }

    const otpCode = generateOtpCode();
    const expiresAt = new Date(Date.now() + OTP_TTL_MS);
    const customerOtpPhone = await resolveCustomerOtpPhone(order);

    if (!customerOtpPhone) {
      return res.status(400).json({
        success: false,
        message: 'Customer phone number is missing. Please update customer profile phone.'
      });
    }

    order.deliveryOtp = {
      codeHash: hashOtp(order._id, otpCode),
      sentAt: new Date(),
      expiresAt,
      verifiedAt: null,
      attempts: 0
    };
    await order.save();

    const smsResult = await sendOtpSms({
      phone: customerOtpPhone,
      otpCode,
      orderId: order._id
    });

    const payload = {
      success: true,
      message: smsResult.sent
        ? 'OTP sent to customer phone number'
        : 'OTP generated. SMS provider is not configured, check backend logs for OTP.',
      data: {
        orderId: order._id,
        expiresAt,
        smsProvider: smsResult.provider
      }
    };

    if (process.env.NODE_ENV !== 'production' && !smsResult.sent) {
      payload.data.devOtp = otpCode;
    }

    res.status(200).json(payload);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.verifyDeliveryOtp = async (req, res) => {
  try {
    const { id } = req.params;
    const { otp } = req.body;

    if (!otp || !/^\d{4,8}$/.test(String(otp))) {
      return res.status(400).json({
        success: false,
        message: 'Please enter a valid OTP'
      });
    }

    const order = await Order.findById(id);
    const access = ensureDeliveryOrderAccess(order, req.user);

    if (!access.ok) {
      return res.status(access.status).json({
        success: false,
        message: access.message
      });
    }

    if (order.status !== 'shipped') {
      return res.status(400).json({
        success: false,
        message: 'OTP can be verified only when order is in shipped status'
      });
    }

    if (!order.deliveryOtp?.codeHash || !order.deliveryOtp?.expiresAt) {
      return res.status(400).json({
        success: false,
        message: 'OTP not sent yet. Please send OTP first.'
      });
    }

    if (new Date(order.deliveryOtp.expiresAt).getTime() < Date.now()) {
      return res.status(400).json({
        success: false,
        message: 'OTP expired. Please send a new OTP.'
      });
    }

    if (Number(order.deliveryOtp.attempts || 0) >= OTP_MAX_ATTEMPTS) {
      return res.status(429).json({
        success: false,
        message: 'Too many invalid attempts. Please request a new OTP.'
      });
    }

    const incomingHash = hashOtp(order._id, String(otp));
    if (incomingHash !== order.deliveryOtp.codeHash) {
      order.deliveryOtp.attempts = Number(order.deliveryOtp.attempts || 0) + 1;
      await order.save();

      return res.status(400).json({
        success: false,
        message: 'Invalid OTP'
      });
    }

    order.deliveryOtp.verifiedAt = new Date();
    order.deliveryOtp.attempts = 0;
    await order.save();

    res.status(200).json({
      success: true,
      message: 'OTP verified successfully',
      data: {
        orderId: order._id,
        verifiedAt: order.deliveryOtp.verifiedAt
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.updateSellerOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['pending', 'processing', 'shipped', 'delivered', 'cancelled'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid order status'
      });
    }

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    const isSellerOrder = order.items.some((item) => String(item.seller) === String(req.user._id));
    if (!isSellerOrder && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'You are not allowed to update this order'
      });
    }

    if (req.user.role === 'seller') {
      const allowedBySeller = ['processing', 'cancelled'];
      if (!allowedBySeller.includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Seller can only mark orders as processing or cancelled'
        });
      }

      if (status === 'processing' && order.status !== 'pending') {
        return res.status(400).json({
          success: false,
          message: 'Only pending orders can be moved to processing'
        });
      }

      if (status === 'cancelled' && !['pending', 'processing'].includes(order.status)) {
        return res.status(400).json({
          success: false,
          message: 'Only pending or processing orders can be cancelled'
        });
      }
    }

    order.status = status;
    appendTrackingEvent(order, {
      status,
      note: status === 'processing' ? 'Seller accepted order' : status === 'cancelled' ? 'Seller cancelled order' : `Status changed to ${status}`,
      updatedByRole: req.user.role || 'seller'
    });
    await order.save();

    res.status(200).json({
      success: true,
      data: order
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.updateDeliveryOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['shipped', 'delivered'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Delivery boy can only mark orders as shipped or delivered'
      });
    }

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    if (!['processing', 'shipped'].includes(order.status) && req.user.role !== 'admin') {
      return res.status(400).json({
        success: false,
        message: 'Only processing or shipped orders can be updated by delivery boys'
      });
    }

    if (status === 'shipped' && order.status !== 'processing') {
      return res.status(400).json({
        success: false,
        message: 'City reached can be confirmed only after processing status'
      });
    }

    if (status === 'delivered' && order.status !== 'shipped') {
      return res.status(400).json({
        success: false,
        message: 'Delivered can be confirmed only after city reached'
      });
    }

    if (status === 'delivered') {
      const verifiedAt = order.deliveryOtp?.verifiedAt ? new Date(order.deliveryOtp.verifiedAt).getTime() : 0;
      if (!verifiedAt) {
        return res.status(400).json({
          success: false,
          message: 'Please verify customer OTP before confirming delivery'
        });
      }

      if (Date.now() - verifiedAt > OTP_TTL_MS) {
        return res.status(400).json({
          success: false,
          message: 'OTP verification expired. Please send and verify OTP again.'
        });
      }
    }

    order.status = status;

    if (status === 'shipped') {
      order.deliveryOtp = {
        codeHash: '',
        sentAt: null,
        expiresAt: null,
        verifiedAt: null,
        attempts: 0
      };
    }

    if (status === 'delivered' && order.paymentMethod === 'cod') {
      order.paymentStatus = 'completed';
      order.deliveryOtp = {
        codeHash: '',
        sentAt: null,
        expiresAt: null,
        verifiedAt: null,
        attempts: 0
      };
    }

    appendTrackingEvent(order, {
      status,
      note: status === 'shipped' ? 'Parcel reached destination city' : 'Parcel delivered to customer',
      updatedByRole: req.user.role || 'delivery_boy'
    });

    await order.save();

    res.status(200).json({
      success: true,
      data: order
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
