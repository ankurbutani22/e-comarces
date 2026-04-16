import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  getDeliveryOrders,
  getDeliveryPanel,
  sendDeliveryOtp,
  updateDeliveryOrderStatus,
  verifyDeliveryOtp
} from '../services/authService';

function DeliveryPanel({ token }) {
  const [orders, setOrders] = useState([]);
  const [panelData, setPanelData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionId, setActionId] = useState('');
  const [success, setSuccess] = useState('');
  const [sendingOtpId, setSendingOtpId] = useState('');
  const [verifyingOtpId, setVerifyingOtpId] = useState('');
  const [otpValues, setOtpValues] = useState({});

  const loadOrders = useCallback(async () => {
    try {
      setLoading(true);
      const [orderResponse, panelResponse] = await Promise.all([
        getDeliveryOrders(token),
        getDeliveryPanel(token)
      ]);

      setOrders(orderResponse.data || []);
      setPanelData(panelResponse.data || null);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to load delivery orders');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const metrics = useMemo(() => ({
    orders: orders.length,
    shipped: orders.filter((order) => order.status === 'shipped').length,
    processing: orders.filter((order) => order.status === 'processing').length,
    totalValue: orders.reduce((sum, order) => sum + Number(order.totalAmount || 0), 0)
  }), [orders]);

  const updateStatus = async (orderId, status) => {
    try {
      setActionId(orderId);
      setError('');
      setSuccess('');
      await updateDeliveryOrderStatus(token, orderId, status);
      await loadOrders();
      setSuccess(status === 'shipped' ? 'Order marked as reached city' : 'Order marked as delivered');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update order status');
    } finally {
      setActionId('');
    }
  };

  const triggerOtp = async (orderId) => {
    try {
      setSendingOtpId(orderId);
      setError('');
      setSuccess('');
      const response = await sendDeliveryOtp(token, orderId);
      await loadOrders();

      const devHint = response?.data?.devOtp ? ` Dev OTP: ${response.data.devOtp}` : '';
      setSuccess(`${response.message || 'OTP sent successfully'}${devHint}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send OTP');
    } finally {
      setSendingOtpId('');
    }
  };

  const submitOtp = async (orderId) => {
    const otp = String(otpValues[orderId] || '').trim();
    if (!otp) {
      setError('Please enter OTP first');
      return;
    }

    try {
      setVerifyingOtpId(orderId);
      setError('');
      setSuccess('');
      await verifyDeliveryOtp(token, orderId, otp);
      await loadOrders();
      setSuccess('Customer OTP verified. You can now confirm delivery.');
      setOtpValues((prev) => ({ ...prev, [orderId]: '' }));
    } catch (err) {
      setError(err.response?.data?.message || 'OTP verification failed');
    } finally {
      setVerifyingOtpId('');
    }
  };

  const formatPaymentMethod = (method) => {
    if (method === 'credit_card') return 'Credit Card';
    if (method === 'debit_card') return 'Debit Card';
    return 'Cash On Delivery';
  };

  if (loading) return <div className="loading">Loading delivery panel...</div>;

  return (
    <div className="delivery-shell">
      <section className="delivery-hero panel-page">
        <p className="section-kicker">Delivery Hub</p>
        <h2>{panelData?.role === 'delivery_boy' ? 'Delivery Boy Panel' : 'Delivery Panel'}</h2>
        <p className="delivery-subtitle">
          Manage shipped and processing orders, then mark them as delivered from one place.
        </p>

        {panelData ? (
          <div className="delivery-feature-strip">
            {panelData.features.map((feature) => (
              <span key={feature} className="delivery-feature-chip">{feature}</span>
            ))}
          </div>
        ) : null}

        <div className="delivery-stats-grid">
          <div className="delivery-stat-card"><span>Orders</span><strong>{metrics.orders}</strong></div>
          <div className="delivery-stat-card"><span>Shipped</span><strong>{metrics.shipped}</strong></div>
          <div className="delivery-stat-card"><span>Processing</span><strong>{metrics.processing}</strong></div>
          <div className="delivery-stat-card"><span>Total Value</span><strong>Rs. {metrics.totalValue}</strong></div>
        </div>
      </section>

      {error ? <div className="error">{error}</div> : null}
      {success ? <div className="success-msg">{success}</div> : null}

      <section className="delivery-orders panel-page">
        <div className="section-head">
          <div>
            <p className="section-kicker">Queue</p>
            <h3>Assigned Orders</h3>
          </div>
        </div>

        {orders.length === 0 ? <p>No delivery orders available right now.</p> : null}

        <div className="delivery-grid">
          {orders.map((order) => (
            <article key={order._id} className="delivery-card">
              <div className="delivery-card-head">
                <div>
                  <h4>Order #{order._id.slice(-6)}</h4>
                  <p>{order.customerName}</p>
                </div>
                <span className={`status-chip ${order.status}`}>{order.status}</span>
              </div>

              <p>Phone: {order.customerPhone}</p>
              <p>Address: {order.shippingAddress}</p>
              <p>Payment: {formatPaymentMethod(order.paymentMethod)}</p>
              <p>Total: Rs. {order.totalAmount}</p>

              <div className="delivery-items-list">
                {order.items.map((item) => (
                  <div key={`${order._id}-${item.product}-${item.productName}`} className="delivery-item-row">
                    <span>{item.productName}</span>
                    <small>x {item.quantity}</small>
                  </div>
                ))}
              </div>

              {order.status === 'shipped' ? (
                <div className="delivery-otp-box">
                  <div className="delivery-otp-head">
                    <strong>Customer OTP Verification</strong>
                    <span className={order.deliveryOtpVerified ? 'otp-pill verified' : 'otp-pill pending'}>
                      {order.deliveryOtpVerified ? 'Verified' : 'Pending'}
                    </span>
                  </div>

                  <div className="delivery-otp-row">
                    <button
                      type="button"
                      className="delivery-otp-send-btn"
                      onClick={() => triggerOtp(order._id)}
                      disabled={sendingOtpId === order._id || actionId === order._id}
                    >
                      {sendingOtpId === order._id ? 'Sending...' : 'Send OTP'}
                    </button>

                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="Enter OTP"
                      value={otpValues[order._id] || ''}
                      onChange={(e) => setOtpValues((prev) => ({ ...prev, [order._id]: e.target.value }))}
                    />

                    <button
                      type="button"
                      className="delivery-otp-verify-btn"
                      onClick={() => submitOtp(order._id)}
                      disabled={verifyingOtpId === order._id || actionId === order._id}
                    >
                      {verifyingOtpId === order._id ? 'Verifying...' : 'Verify OTP'}
                    </button>
                  </div>
                </div>
              ) : null}

              <div className="delivery-action-row">
                <button
                  type="button"
                  className="delivery-city-btn"
                  onClick={() => updateStatus(order._id, 'shipped')}
                  disabled={actionId === order._id || order.status !== 'processing'}
                >
                  {actionId === order._id ? 'Updating...' : 'Confirm City Reached'}
                </button>

                <button
                  type="button"
                  className="delivery-delivered-btn"
                  onClick={() => updateStatus(order._id, 'delivered')}
                  disabled={actionId === order._id || order.status !== 'shipped' || !order.deliveryOtpVerified}
                >
                  {actionId === order._id ? 'Updating...' : 'Confirm Delivered'}
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

export default DeliveryPanel;