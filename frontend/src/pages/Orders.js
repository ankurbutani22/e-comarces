import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMyOrders } from '../services/authService';

const ORDER_ITEM_PLACEHOLDER =
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96"><rect width="96" height="96" rx="12" fill="%23e5e7eb"/><rect x="20" y="22" width="56" height="50" rx="8" fill="%23ffffff" stroke="%23cbd5e1"/><circle cx="38" cy="42" r="6" fill="%2394a3b8"/><path d="M28 63l12-12 10 10 8-8 10 10" stroke="%2394a3b8" stroke-width="4" fill="none" stroke-linecap="round"/></svg>';

const resolveMediaUrl = (value) => {
  if (!value || typeof value !== 'string') return '';
  if (/^https?:\/\//i.test(value)) return value;

  const normalizedPath = value.startsWith('/') ? value : `/${value}`;
  if (normalizedPath.startsWith('/uploads/')) {
    const backendOrigin = process.env.REACT_APP_API_ORIGIN || 'http://localhost:2205';
    return `${backendOrigin}${normalizedPath}`;
  }

  return normalizedPath;
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

function Orders({ token }) {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const formatPaymentMethod = (method) => {
    if (method === 'credit_card') return 'Credit Card';
    if (method === 'debit_card') return 'Debit Card';
    return 'Cash On Delivery';
  };

  const getStatusClass = (status) => {
    if (status === 'processing') return 'tracking-pill processing';
    if (status === 'shipped') return 'tracking-pill shipped';
    if (status === 'delivered') return 'tracking-pill delivered';
    return 'tracking-pill pending';
  };

  const getQrUrl = (order) => {
    const qrPayload = encodeURIComponent(JSON.stringify({ orderId: order._id, status: order.status, total: order.totalAmount }));
    return `https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${qrPayload}`;
  };

  const loadOrders = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getMyOrders(token);
      setOrders(response.data || []);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load your orders');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

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
      alert('Please allow popups to print bill.');
      return;
    }

    printWindow.document.write(`
      <html>
        <head>
          <title>Order Invoice ${order._id}</title>
        </head>
        <body style="font-family:Segoe UI,Arial,sans-serif;padding:24px;color:#222;">
          <h2 style="margin:0 0 8px;">My Order Invoice</h2>
          <p style="margin:0 0 4px;"><strong>Order ID:</strong> ${order._id}</p>
          <p style="margin:0 0 4px;"><strong>Date:</strong> ${new Date(order.createdAt).toLocaleString()}</p>
          <p style="margin:0 0 4px;"><strong>Name:</strong> ${order.customerName}</p>
          <p style="margin:0 0 4px;"><strong>Phone:</strong> ${order.customerPhone}</p>
          <p style="margin:0 0 16px;"><strong>Address:</strong> ${order.shippingAddress}</p>
          <div style="margin:0 0 16px;">
            <p style="margin:0 0 8px;"><strong>QR Code:</strong></p>
            <img src="${getQrUrl(order)}" alt="Order QR Code" style="width:140px;height:140px;border:1px solid #ddd;padding:6px;border-radius:8px;" />
          </div>
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

  if (loading) {
    return <div className="loading">Loading your orders...</div>;
  }

  return (
    <div className="orders-shell">
      <div className="page-head">
        <h2 className="page-title">My Orders</h2>
        <button type="button" onClick={() => navigate('/')}>Continue Shopping</button>
      </div>

      {error ? <div className="error page-feedback">{error}</div> : null}

      {!error && orders.length === 0 ? <p>No orders placed yet.</p> : null}

      <div className="orders-grid">
        {orders.map((order) => (
          <article key={order._id} className="order-card">
            <div className="order-card-head">
              <div>
                <h3>Order #{order._id.slice(-6)}</h3>
                <p>Name: {order.customerName}</p>
                <p>Phone: {order.customerPhone}</p>
                <p>Address: {order.shippingAddress}</p>
                <p>Payment: {formatPaymentMethod(order.paymentMethod)}</p>
                <p>Status: <span className={getStatusClass(order.status)}>{order.status}</span></p>
              </div>
              <div className="order-total-wrap">
                <p className="order-total">Total: Rs. {order.totalAmount}</p>
                <button type="button" onClick={() => printOrderBill(order)}>Print Bill</button>
              </div>
            </div>

            <div className="tracking-card">
              <div className="tracking-head">
                <span className="section-kicker">Tracking</span>
                <strong>{getTrackingLabel(order.status)}</strong>
              </div>

              <div className="tracking-steps">
                {['Order Placed', 'Packed', 'Reached City', 'Delivered'].map((step, index) => {
                  const currentStep = getTrackingStepIndex(order.status);
                  const active = index <= currentStep;
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

            <div className="order-qr-wrap">
              <p className="order-qr-title">QR Code</p>
              <img
                src={getQrUrl(order)}
                alt="Order QR Code"
                className="order-qr-image"
              />
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
          </article>
        ))}
      </div>
    </div>
  );
}

export default Orders;
