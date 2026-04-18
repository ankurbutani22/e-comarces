import React, { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  createAdminAd,
  deleteAdminAd,
  deleteAdminUser,
  getAdminAds,
  getAdminDashboard,
  getAdminOrders,
  getAdminPanel,
  getAdminProducts,
  getAdminUsers,
  updateAdminAd,
  updateAdminUserRole,
  uploadSellerMedia
} from '../services/authService';

function AdminPanel({ token }) {
  const location = useLocation();
  const [panelData, setPanelData] = useState(null);
  const [dashboard, setDashboard] = useState(null);
  const [users, setUsers] = useState([]);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [ads, setAds] = useState([]);
  const [selectedRoles, setSelectedRoles] = useState({});
  const [activeSection, setActiveSection] = useState(() => new URLSearchParams(location.search).get('tab') || 'home');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [adSubmitting, setAdSubmitting] = useState(false);
  const [adImageFile, setAdImageFile] = useState(null);
  const [adForm, setAdForm] = useState({
    image: '',
    isActive: true
  });

  const roleOptions = ['user', 'seller', 'delivery_boy', 'admin'];

  const adPreviewUrl = useMemo(() => {
    if (adForm.image && String(adForm.image).trim()) {
      return String(adForm.image).trim();
    }

    if (adImageFile) {
      return URL.createObjectURL(adImageFile);
    }

    return '';
  }, [adForm.image, adImageFile]);

  useEffect(() => {
    return () => {
      if (adPreviewUrl && adImageFile && adPreviewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(adPreviewUrl);
      }
    };
  }, [adPreviewUrl, adImageFile]);

  const loadAdminData = async () => {
    setLoading(true);
    setError('');

    try {
      const [panelRes, dashboardRes, usersRes, productsRes, ordersRes, adsRes] = await Promise.all([
        getAdminPanel(token),
        getAdminDashboard(token),
        getAdminUsers(token),
        getAdminProducts(token),
        getAdminOrders(token),
        getAdminAds(token)
      ]);

      setPanelData(panelRes.data);
      setDashboard(dashboardRes.data);
      setUsers(usersRes.data || []);
      setProducts(productsRes.data || []);
      setOrders(ordersRes.data || []);
      setAds(adsRes.data || []);

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

  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  useEffect(() => {
    if (success) {
      toast.success(success);
    }
  }, [success]);

  useEffect(() => {
    const currentTab = new URLSearchParams(location.search).get('tab') || 'home';
    const allowedTabs = new Set(['home', 'ads', 'users', 'products', 'orders']);
    setActiveSection(allowedTabs.has(currentTab) ? currentTab : 'home');
  }, [location.search]);

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

  const onAdFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setAdForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const onAdImageFileChange = (e) => {
    const nextFile = e.target.files?.[0] || null;
    setAdImageFile(nextFile);

    if (nextFile) {
      setAdForm((prev) => ({
        ...prev,
        image: ''
      }));
    }
  };

  const clearAdImageFile = () => {
    setAdImageFile(null);
  };

  const clearAdImageUrl = () => {
    setAdForm((prev) => ({
      ...prev,
      image: ''
    }));
  };

  const addAd = async () => {
    setError('');
    setSuccess('');

    try {
      setAdSubmitting(true);
      let imageUrl = String(adForm.image || '').trim();

      if (!imageUrl && adImageFile) {
        const uploadRes = await uploadSellerMedia(token, [adImageFile], null);
        imageUrl = uploadRes.data.image || uploadRes.data.images?.[0] || '';
      }

      if (!imageUrl) {
        setError('Please provide ad image URL or upload image file');
        return;
      }

      await createAdminAd(token, {
        image: imageUrl,
        title: '',
        subtitle: '',
        companyName: '',
        productName: '',
        content: '',
        sortOrder: 0,
        isActive: Boolean(adForm.isActive)
      });

      setAdForm({
        image: '',
        isActive: true
      });
      setAdImageFile(null);

      await loadAdminData();
      setSuccess('Ad added successfully');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add ad');
    } finally {
      setAdSubmitting(false);
    }
  };

  const toggleAdStatus = async (ad) => {
    setError('');
    setSuccess('');

    try {
      await updateAdminAd(token, ad._id, { isActive: !ad.isActive });
      await loadAdminData();
      setSuccess('Ad status updated');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update ad status');
    }
  };

  const removeAd = async (adId) => {
    setError('');
    setSuccess('');

    if (!window.confirm('Are you sure you want to delete this ad image?')) {
      return;
    }

    try {
      await deleteAdminAd(token, adId);
      await loadAdminData();
      setSuccess('Ad deleted');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete ad');
    }
  };

  if (!panelData || !dashboard) return <div className="admin-shell"><p className="loading">Please refresh to load admin panel.</p></div>;

  return (
    <div className="admin-shell">
      <section className="admin-hero panel-page">
        <p className="section-kicker">Control Center</p>
        <h2>Admin Panel</h2>
        <p className="admin-subtitle">Manage platform operations with a clean, high-visibility dashboard.</p>
        <div className="admin-role-pill">Role: {panelData.role}</div>
        {loading ? <p className="loading">Refreshing panel data...</p> : null}
      </section>

      {activeSection === 'home' ? (
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
                  <td data-label="Name">{user.name}</td>
                  <td data-label="Email">{user.email}</td>
                  <td data-label="Role">
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
                  <td data-label="Actions">
                    <div className="admin-action-row">
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
                  <td data-label="Name">{product.name}</td>
                  <td data-label="Category">{product.category}</td>
                  <td data-label="Price">Rs. {product.price}</td>
                  <td data-label="Stock">{product.stock}</td>
                  <td data-label="Seller">{product.seller?.name || product.seller?.email || 'Unknown'}</td>
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
                  <td data-label="Order ID">{order._id.slice(-8)}</td>
                  <td data-label="Customer">{order.customerName || order.user?.name || 'User'}</td>
                  <td data-label="Total">Rs. {order.totalAmount}</td>
                  <td data-label="Status">{order.status}</td>
                  <td data-label="Created">{new Date(order.createdAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      ) : null}

      {activeSection === 'ads' ? (
      <section className="panel-page">
        <h3>Ads Management</h3>
        <div className="admin-ads-layout">
          <div className="admin-ads-form-card">
            <div className="admin-ads-form">
              <div className="admin-url-box">
                <label className="admin-field-label" htmlFor="admin-ad-image-url">Ad Image URL</label>
                <p className="admin-field-help">Paste direct image link from Cloudinary/CDN for faster add.</p>
                <div className="admin-url-row">
                  <input
                    id="admin-ad-image-url"
                    type="text"
                    name="image"
                    className="admin-url-input"
                    placeholder="https://example.com/ad-banner.jpg"
                    value={adForm.image}
                    onChange={onAdFormChange}
                  />
                  {adForm.image ? (
                    <button type="button" className="admin-url-clear-btn" onClick={clearAdImageUrl}>
                      Clear
                    </button>
                  ) : null}
                </div>
              </div>

              <p className="admin-upload-divider">OR</p>

              <div className="admin-upload-box">
                <input
                  id="admin-ad-image-file"
                  type="file"
                  accept="image/*"
                  className="admin-file-input"
                  onChange={onAdImageFileChange}
                />
                <label htmlFor="admin-ad-image-file" className="admin-file-trigger">
                  <span>Upload Ad Image</span>
                  <small>JPG, PNG, WEBP</small>
                </label>

                {adImageFile ? (
                  <div className="admin-file-chip">
                    <span>{adImageFile.name}</span>
                    <button type="button" className="admin-file-remove" onClick={clearAdImageFile}>
                      Remove
                    </button>
                  </div>
                ) : null}
              </div>

              <label className="admin-checkbox-row">
                <input
                  type="checkbox"
                  name="isActive"
                  checked={adForm.isActive}
                  onChange={onAdFormChange}
                />
                Active
              </label>
              <div className="admin-submit-row">
                <button type="button" onClick={addAd} disabled={adSubmitting}>
                  {adSubmitting ? 'Saving...' : 'Add Ad'}
                </button>
              </div>
            </div>

            <div className="admin-ads-preview-card">
              <p className="admin-ads-preview-label">Preview</p>
              {adPreviewUrl ? (
                <img src={adPreviewUrl} alt="Ad preview" className="admin-ads-preview-image" />
              ) : (
                <div className="admin-ads-preview-empty">Image preview will appear here</div>
              )}
            </div>
          </div>

          <div className="admin-ads-gallery">
            {ads.length === 0 ? <p className="admin-ads-empty">No ads added yet.</p> : null}

            {ads.map((ad) => (
              <article key={ad._id} className="admin-ad-card">
                <img
                  src={ad.image}
                  alt={ad.title || 'Ad'}
                  className="admin-ad-thumb"
                />
                <div className="admin-ad-card-body">
                  <span className={`admin-ad-status ${ad.isActive ? 'active' : 'inactive'}`}>
                    {ad.isActive ? 'Active' : 'Inactive'}
                  </span>
                  <div className="admin-action-row">
                    <button type="button" onClick={() => toggleAdStatus(ad)}>
                      {ad.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                    <button type="button" className="danger-btn" onClick={() => removeAd(ad._id)}>
                      Delete
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
      ) : null}
    </div>
  );
}

export default AdminPanel;
