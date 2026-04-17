import React, { useEffect, useState } from 'react';
import {
  deleteAdminUser,
  getAdminDashboard,
  getAdminOrders,
  getAdminPanel,
  getAdminProducts,
  getAdminUsers,
  updateAdminUserRole
} from '../services/authService';

function AdminPanel({ token }) {
  const [panelData, setPanelData] = useState(null);
  const [dashboard, setDashboard] = useState(null);
  const [users, setUsers] = useState([]);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [selectedRoles, setSelectedRoles] = useState({});
  const [activeSection, setActiveSection] = useState('dashboard');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const roleOptions = ['user', 'seller', 'delivery_boy', 'admin'];
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'features', label: 'Features' },
    { id: 'users', label: 'Users' },
    { id: 'products', label: 'Products' },
    { id: 'orders', label: 'Orders' }
  ];

  const loadAdminData = async () => {
    setLoading(true);
    setError('');

    try {
      const [panelRes, dashboardRes, usersRes, productsRes, ordersRes] = await Promise.all([
        getAdminPanel(token),
        getAdminDashboard(token),
        getAdminUsers(token),
        getAdminProducts(token),
        getAdminOrders(token)
      ]);

      setPanelData(panelRes.data);
      setDashboard(dashboardRes.data);
      setUsers(usersRes.data || []);
      setProducts(productsRes.data || []);
      setOrders(ordersRes.data || []);

      const initialRoles = {};
      (usersRes.data || []).forEach((user) => {
        initialRoles[user._id] = user.role;
      });
      setSelectedRoles(initialRoles);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to load admin panel');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const onChangeRole = (userId, role) => {
    setSelectedRoles((prev) => ({
      ...prev,
      [userId]: role
    }));
  };

  const saveRole = async (userId) => {
    setError('');
    setSuccess('');

    try {
      await updateAdminUserRole(token, userId, selectedRoles[userId]);
      await loadAdminData();
      setSuccess('User role updated');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update role');
    }
  };

  const removeUser = async (userId) => {
    setError('');
    setSuccess('');

    if (!window.confirm('Are you sure you want to delete this user?')) {
      return;
    }

    try {
      await deleteAdminUser(token, userId);
      await loadAdminData();
      setSuccess('User deleted');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete user');
    }
  };

  if (error) return <p className="error">{error}</p>;
  if (loading || !panelData || !dashboard) return <p className="loading">Loading admin panel...</p>;

  return (
    <div className="admin-shell">
      {success ? <p className="success-msg">{success}</p> : null}

      <section className="admin-hero panel-page">
        <p className="section-kicker">Control Center</p>
        <h2>Admin Panel</h2>
        <p className="admin-subtitle">Manage platform operations with a clean, high-visibility dashboard.</p>
        <div className="admin-role-pill">Role: {panelData.role}</div>
      </section>

      <section className="panel-page admin-menu-wrap">
        <div className="admin-menu-row" role="tablist" aria-label="Admin Sections">
          {menuItems.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`admin-menu-btn ${activeSection === item.id ? 'active' : ''}`}
              onClick={() => setActiveSection(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>
      </section>

      {activeSection === 'dashboard' ? (
      <section className="panel-page">
        <h3>Dashboard Summary</h3>
        <div className="admin-feature-grid">
          <article className="admin-feature-card">
            <span className="admin-feature-dot" />
            <p>Total Users: {dashboard.stats?.users || 0}</p>
          </article>
          <article className="admin-feature-card">
            <span className="admin-feature-dot" />
            <p>Total Products: {dashboard.stats?.products || 0}</p>
          </article>
          <article className="admin-feature-card">
            <span className="admin-feature-dot" />
            <p>Total Orders: {dashboard.stats?.orders || 0}</p>
          </article>
        </div>
      </section>
      ) : null}

      {activeSection === 'features' ? (
      <section className="admin-features panel-page">
        <h3>Access & Features</h3>
        <div className="admin-feature-grid">
          {panelData.features.map((feature) => (
            <article key={feature} className="admin-feature-card">
              <span className="admin-feature-dot" />
              <p>{feature}</p>
            </article>
          ))}
        </div>
      </section>
      ) : null}

      {activeSection === 'users' ? (
      <section className="panel-page">
        <h3>User Management</h3>
        <div className="cart-table-wrap">
          <table className="cart-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user._id}>
                  <td>{user.name}</td>
                  <td>{user.email}</td>
                  <td>
                    <select
                      value={selectedRoles[user._id] || user.role}
                      onChange={(e) => onChangeRole(user._id, e.target.value)}
                    >
                      {roleOptions.map((role) => (
                        <option value={role} key={`${user._id}-${role}`}>
                          {role}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <button type="button" onClick={() => saveRole(user._id)}>Save Role</button>
                      <button type="button" className="danger-btn" onClick={() => removeUser(user._id)}>
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      ) : null}

      {activeSection === 'products' ? (
      <section className="panel-page">
        <h3>All Products</h3>
        <div className="cart-table-wrap">
          <table className="cart-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Category</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Seller</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product._id}>
                  <td>{product.name}</td>
                  <td>{product.category}</td>
                  <td>Rs. {product.price}</td>
                  <td>{product.stock}</td>
                  <td>{product.seller?.name || product.seller?.email || 'Unknown'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      ) : null}

      {activeSection === 'orders' ? (
      <section className="panel-page">
        <h3>All Orders</h3>
        <div className="cart-table-wrap">
          <table className="cart-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Customer</th>
                <th>Total</th>
                <th>Status</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order._id}>
                  <td>{order._id.slice(-8)}</td>
                  <td>{order.customerName || order.user?.name || 'User'}</td>
                  <td>Rs. {order.totalAmount}</td>
                  <td>{order.status}</td>
                  <td>{new Date(order.createdAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      ) : null}
    </div>
  );
}

export default AdminPanel;
