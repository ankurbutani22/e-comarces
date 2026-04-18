import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { createOrder, getMyOrders, getProfile } from '../services/authService';
import { readLocalJson } from '../utils/storage';
import { API_ORIGIN } from '../config/api';

const ORDER_ITEM_PLACEHOLDER =
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96"><rect width="96" height="96" rx="12" fill="%23e5e7eb"/><rect x="20" y="22" width="56" height="50" rx="8" fill="%23ffffff" stroke="%23cbd5e1"/><circle cx="38" cy="42" r="6" fill="%2394a3b8"/><path d="M28 63l12-12 10 10 8-8 10 10" stroke="%2394a3b8" stroke-width="4" fill="none" stroke-linecap="round"/></svg>';

const resolveMediaUrl = (value) => {
  if (!value || typeof value !== 'string') return '';
  if (/^https?:\/\//i.test(value)) return value;

  const localhostUploadMatch = String(value).match(/^https?:\/\/(?:localhost|127\.0\.0\.1)(?::\d+)?(\/uploads\/.*)$/i);
  if (localhostUploadMatch?.[1]) {
    return `${API_ORIGIN}${localhostUploadMatch[1]}`;
  }

  const normalizedPath = value.startsWith('/') ? value : `/${value}`;
  if (normalizedPath.startsWith('/uploads/')) {
    return `${API_ORIGIN}${normalizedPath}`;
  }

  return normalizedPath;
};

function Cart() {
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState([]);
  const [totalPrice, setTotalPrice] = useState(0);
  const [shippingAddress, setShippingAddress] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [cardNumber, setCardNumber] = useState('');
  const [cardHolder, setCardHolder] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [myOrders, setMyOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [user] = useState(() => readLocalJson('user', null));
  const [token] = useState(() => localStorage.getItem('token') || '');

  useEffect(() => {
    if (user) {
      setCustomerName(user.name || '');
      setCustomerPhone(user.phone || '');
      setShippingAddress(user.address || '');
    }
  }, [user]);

  useEffect(() => {
    const loadProfile = async () => {
      if (!token || !user || user.role === 'seller') return;

      try {
        const profileRes = await getProfile(token);
        const profileUser = profileRes?.user;
        if (!profileUser) return;

        setCustomerName(profileUser.name || '');
        setCustomerPhone(profileUser.phone || '');
        setShippingAddress(profileUser.address || '');

        const mergedUser = {
          ...(readLocalJson('user', {})),
          ...profileUser,
          id: profileUser._id || profileUser.id || user.id
        };
        localStorage.setItem('user', JSON.stringify(mergedUser));
      } catch (err) {
        console.error('Failed to load profile', err);
      }
    };

    loadProfile();
  }, [token, user]);

  useEffect(() => {
    if (user?.role === 'seller') {
      toast.error('Seller account cannot use cart.');
      navigate('/seller');
    }
  }, [user, navigate]);

  useEffect(() => {
    const cart = readLocalJson('cart', []) || [];
    setCartItems(cart);
  }, []);

  useEffect(() => {
    const total = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    setTotalPrice(total);
  }, [cartItems]);

  const loadMyOrders = useCallback(async () => {
    if (!token || !user || user.role === 'seller') {
      return;
    }

    try {
      setOrdersLoading(true);
      const response = await getMyOrders(token);
      setMyOrders(response.data || []);
    } catch (err) {
      console.error('Failed to fetch user orders', err);
    } finally {
      setOrdersLoading(false);
    }
  }, [token, user]);

  useEffect(() => {
    loadMyOrders();
  }, [loadMyOrders]);

  const formatPaymentMethod = (method) => {
    if (method === 'credit_card') return 'Credit Card';
    if (method === 'debit_card') return 'Debit Card';
    return 'Cash On Delivery';
  };

  const getTrackingStepIndex = (status) => {
    if (status === 'delivered') return 3;
    if (status === 'shipped') return 2;
    if (status === 'processing') return 1;
    return 0;
  };

  const getTrackingLabel = (status) => {
    if (status === 'processing') return 'Packed & Ready';
    if (status === 'shipped') return 'Reached City';
    if (status === 'delivered') return 'Delivered';
    return 'Order Placed';
  };

  const formatTrackingTime = (value) => {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleString();
  };

  const printOrderBill = (order) => {
    const itemsHtml = order.items
      .map(
        (item) => `
          <tr>
            <td style="padding:8px;border:1px solid #ddd;">
              ${item.productName}
              ${item.selectedVariantName ? `<div style="font-size:12px;color:#555;">Design: ${item.selectedVariantName}</div>` : ''}
              ${item.selectedSize ? `<div style="font-size:12px;color:#555;">Size: ${item.selectedSize}</div>` : ''}
              ${item.selectedRamSize ? `<div style="font-size:12px;color:#555;">RAM: ${item.selectedRamSize}</div>` : ''}
              ${item.selectedRomSize ? `<div style="font-size:12px;color:#555;">ROM: ${item.selectedRomSize}</div>` : ''}
              ${item.selectedCustomOption ? `<div style="font-size:12px;color:#555;">Option: ${item.selectedCustomOption}</div>` : ''}
            </td>
            <td style="padding:8px;border:1px solid #ddd;text-align:center;">${item.quantity}</td>
            <td style="padding:8px;border:1px solid #ddd;text-align:right;">Rs. ${item.price}</td>
            <td style="padding:8px;border:1px solid #ddd;text-align:right;">Rs. ${item.quantity * item.price}</td>
          </tr>
        `
      )
      .join('');

    const printWindow = window.open('', '_blank', 'width=900,height=700');
    if (!printWindow) {
      toast.warn('Please allow popups to print bill.');
      return;
    }

    printWindow.document.write(`
      <html>
        <head>
          <title>Invoice ${order._id}</title>
        </head>
        <body style="font-family:Segoe UI,Arial,sans-serif;padding:24px;color:#222;">
          <h2 style="margin:0 0 8px;">E-Commerce Store Invoice</h2>
          <p style="margin:0 0 4px;"><strong>Order ID:</strong> ${order._id}</p>
          <p style="margin:0 0 4px;"><strong>Date:</strong> ${new Date(order.createdAt).toLocaleString()}</p>
          <p style="margin:0 0 4px;"><strong>Customer:</strong> ${order.customerName}</p>
          <p style="margin:0 0 4px;"><strong>Phone:</strong> ${order.customerPhone}</p>
          <p style="margin:0 0 16px;"><strong>Address:</strong> ${order.shippingAddress}</p>
          <table style="width:100%;border-collapse:collapse;margin-bottom:16px;">
            <thead>
              <tr style="background:#f5f5f5;">
                <th style="padding:8px;border:1px solid #ddd;text-align:left;">Product</th>
                <th style="padding:8px;border:1px solid #ddd;">Qty</th>
                <th style="padding:8px;border:1px solid #ddd;text-align:right;">Price</th>
                <th style="padding:8px;border:1px solid #ddd;text-align:right;">Total</th>
              </tr>
            </thead>
            <tbody>${itemsHtml}</tbody>
          </table>
          <p style="margin:0 0 6px;"><strong>Payment:</strong> ${formatPaymentMethod(order.paymentMethod)}</p>
          <h3 style="margin:0;">Grand Total: Rs. ${order.totalAmount}</h3>
          <script>
            window.onload = function() {
              window.print();
              window.onafterprint = function() { window.close(); };
            }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const updateQuantity = (cartKeyOrId, quantity) => {
    if (quantity <= 0) {
      removeItem(cartKeyOrId);
      return;
    }

    const updatedCart = cartItems.map(item =>
      (item.cartKey || item._id) === cartKeyOrId ? { ...item, quantity } : item
    );
    setCartItems(updatedCart);
    localStorage.setItem('cart', JSON.stringify(updatedCart));
  };

  const removeItem = (cartKeyOrId) => {
    const updatedCart = cartItems.filter(item => (item.cartKey || item._id) !== cartKeyOrId);
    setCartItems(updatedCart);
    localStorage.setItem('cart', JSON.stringify(updatedCart));
  };

  const handleCheckout = async () => {
    if (!user) {
      toast.error('Please login first');
      navigate('/login');
      return;
    }

    if (user.role === 'seller') {
      toast.error('Seller account can not place order');
      return;
    }

    if (!shippingAddress.trim()) {
      toast.error('Please enter shipping address');
      return;
    }

    if (!customerName.trim()) {
      toast.error('Please enter full name');
      return;
    }

    if (!customerPhone.trim()) {
      toast.error('Please enter phone number');
      return;
    }

    if (!/^\d{10}$/.test(customerPhone.trim())) {
      toast.error('Please enter valid 10 digit phone number');
      return;
    }

    if (paymentMethod === 'credit_card' || paymentMethod === 'debit_card') {
      if (!cardNumber.trim() || !cardHolder.trim() || !expiry.trim() || !cvv.trim()) {
        toast.error('Please fill all card details');
        return;
      }
    }

    setCheckoutLoading(true);

    try {
      const payload = {
        customerName,
        customerPhone,
        shippingAddress,
        paymentMethod,
        items: cartItems.map((item) => ({
          product: item._id,
          quantity: item.quantity,
          selectedSize: item.selectedSize || '',
          selectedRamSize: item.selectedRamSize || '',
          selectedRomSize: item.selectedRomSize || '',
          selectedCustomOption: item.selectedCustomOption || '',
          selectedVariantId: item.selectedVariantId || '',
          selectedVariantName: item.selectedVariantName || '',
          selectedVariantImage: item.selectedVariantImage || ''
        }))
      };

      await createOrder(token, payload);
      localStorage.removeItem('cart');
      setCartItems([]);
      setCardNumber('');
      setCardHolder('');
      setExpiry('');
      setCvv('');
      await loadMyOrders();
      toast.success('Order placed successfully');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Checkout failed');
    } finally {
      setCheckoutLoading(false);
    }
  };

  return (
    <div className="cart-shell">
      <h2 className="page-title">Shopping Cart</h2>

      {cartItems.length === 0 ? (
        <div className="cart-empty-card">
          <h3>Your Cart is Empty</h3>
          <button onClick={() => navigate('/')}>Continue Shopping</button>
        </div>
      ) : (
        <>
          <div className="cart-table-wrap">
            <table className="cart-table">
              <thead>
              <tr>
                <th>Product</th>
                <th>Price</th>
                <th>Quantity</th>
                <th>Total</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {cartItems.map(item => (
                <tr key={item.cartKey || item._id}>
                  <td data-label="Product">
                    <p className="cart-item-name">{item.name}</p>
                    {item.selectedSize ? <p className="cart-item-meta">Size: {item.selectedSize}</p> : null}
                    {item.selectedRamSize ? <p className="cart-item-meta">RAM: {item.selectedRamSize}</p> : null}
                    {item.selectedRomSize ? <p className="cart-item-meta">ROM: {item.selectedRomSize}</p> : null}
                    {item.selectedCustomOption ? <p className="cart-item-meta">Option: {item.selectedCustomOption}</p> : null}
                    {item.selectedVariantName ? <p className="cart-item-meta">Design: {item.selectedVariantName}</p> : null}
                  </td>
                  <td className="cart-center" data-label="Price">₹{item.price}</td>
                  <td className="cart-center" data-label="Quantity">
                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => updateQuantity(item.cartKey || item._id, parseInt(e.target.value, 10) || 1)}
                      className="cart-qty-input"
                    />
                  </td>
                  <td className="cart-center cart-amount" data-label="Total">
                    ₹{item.price * item.quantity}
                  </td>
                  <td className="cart-center" data-label="Action">
                    <button
                      onClick={() => removeItem(item.cartKey || item._id)}
                      className="cart-remove-btn"
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
            </table>
          </div>

          <div className="checkout-card">
            <h3>Checkout Details</h3>
            <div className="checkout-grid-2">
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Full Name"
              />
              <input
                type="text"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="Phone Number"
              />
            </div>
            <textarea
              value={shippingAddress}
              onChange={(e) => setShippingAddress(e.target.value)}
              placeholder="Full Shipping Address"
              rows={3}
              className="checkout-address"
            />

            <div className="checkout-payment">
              <p>Payment Method</p>
              <div className="checkout-payment-options">
                <label>
                  <input
                    type="radio"
                    name="payment"
                    checked={paymentMethod === 'cod'}
                    onChange={() => setPaymentMethod('cod')}
                  />{' '}
                  Cash On Delivery
                </label>
                <label>
                  <input
                    type="radio"
                    name="payment"
                    checked={paymentMethod === 'credit_card'}
                    onChange={() => setPaymentMethod('credit_card')}
                  />{' '}
                  Credit Card
                </label>
                <label>
                  <input
                    type="radio"
                    name="payment"
                    checked={paymentMethod === 'debit_card'}
                    onChange={() => setPaymentMethod('debit_card')}
                  />{' '}
                  Debit Card
                </label>
              </div>
            </div>

            {(paymentMethod === 'credit_card' || paymentMethod === 'debit_card') ? (
              <div className="checkout-card-grid">
                <input
                  type="text"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value)}
                  placeholder="Card Number"
                />
                <input
                  type="text"
                  value={expiry}
                  onChange={(e) => setExpiry(e.target.value)}
                  placeholder="MM/YY"
                />
                <input
                  type="password"
                  value={cvv}
                  onChange={(e) => setCvv(e.target.value)}
                  placeholder="CVV"
                />
                <input
                  type="text"
                  value={cardHolder}
                  onChange={(e) => setCardHolder(e.target.value)}
                  placeholder="Card Holder Name"
                  className="checkout-card-holder"
                />
              </div>
            ) : null}

            <div className="checkout-summary-row">
              <h3>Total: ₹{totalPrice}</h3>
              <div className="checkout-summary-actions">
                <button onClick={() => navigate('/')}>Continue Shopping</button>
                <button
                  onClick={handleCheckout}
                  disabled={checkoutLoading}
                  className="checkout-confirm-btn"
                >
                  {checkoutLoading ? 'Placing...' : 'Confirm Order'}
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      <section className="cart-orders-section">
        <h2 className="page-title small">My Orders</h2>
        {ordersLoading ? <p>Loading orders...</p> : null}
        {!ordersLoading && myOrders.length === 0 ? <p>No confirmed orders yet.</p> : null}

        {!ordersLoading && myOrders.length > 0 ? (
          <div className="cart-orders-grid">
            {myOrders.map((order) => (
              <article key={order._id} className="cart-order-card">
                <h4>Order #{order._id.slice(-6)}</h4>
                <p>Name: {order.customerName}</p>
                <p>Phone: {order.customerPhone}</p>
                <p>Address: {order.shippingAddress}</p>
                <p>Payment: {formatPaymentMethod(order.paymentMethod)}</p>
                <p>Status: {order.status}</p>
                <p className="cart-order-total">Total: Rs. {order.totalAmount}</p>

                <div className="tracking-card compact">
                  <div className="tracking-head">
                    <span className="section-kicker">Tracking</span>
                    <strong>{getTrackingLabel(order.status)}</strong>
                  </div>
                  <div className="tracking-steps">
                    {['Order Placed', 'Packed', 'Reached City', 'Delivered'].map((step, index) => {
                      const active = index <= getTrackingStepIndex(order.status);
                      return (
                        <div key={step} className={`tracking-step ${active ? 'active' : ''}`}>
                          <span>{step}</span>
                        </div>
                      );
                    })}
                  </div>
                  {Array.isArray(order.trackingEvents) && order.trackingEvents.length > 0 ? (
                    <div className="tracking-event-list">
                      {order.trackingEvents.slice().reverse().map((event, idx) => (
                        <div key={`${order._id}-${event.status}-${idx}`} className="tracking-event-item">
                          <p>{event.note || event.status}</p>
                          <span>{formatTrackingTime(event.updatedAt)}</span>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>

                <div className="order-items-wrap">
                  {order.items.map((item) => (
                    <div
                      key={`${order._id}-${item.product}-${item.productName}`}
                      className="order-item-row"
                    >
                      <img
                        src={resolveMediaUrl(item.selectedVariantImage || item.productImage) || ORDER_ITEM_PLACEHOLDER}
                        alt={item.productName}
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = ORDER_ITEM_PLACEHOLDER;
                        }}
                        className="order-item-thumb"
                      />
                      <div>
                        <p className="order-item-name">{item.productName}</p>
                        <p className="order-item-qty">Qty: {item.quantity}</p>
                        {item.selectedVariantName ? <p className="order-item-qty">Design: {item.selectedVariantName}</p> : null}
                        {item.selectedSize ? <p className="order-item-qty">Size: {item.selectedSize}</p> : null}
                        {item.selectedRamSize ? <p className="order-item-qty">RAM: {item.selectedRamSize}</p> : null}
                        {item.selectedRomSize ? <p className="order-item-qty">ROM: {item.selectedRomSize}</p> : null}
                        {item.selectedCustomOption ? <p className="order-item-qty">Option: {item.selectedCustomOption}</p> : null}
                      </div>
                    </div>
                  ))}
                </div>
                <button type="button" onClick={() => printOrderBill(order)}>
                  Print Bill
                </button>
              </article>
            ))}
          </div>
        ) : null}
      </section>
    </div>
  );
}

export default Cart;
