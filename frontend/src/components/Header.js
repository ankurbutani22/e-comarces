import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { getDeliveryOrders, getMyOrders, getSellerOrders } from '../services/authService';
import logo from '../utils/logo.svg';

const PROFILE_PLACEHOLDER =
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64"><rect width="64" height="64" rx="32" fill="%23dbeafe"/><circle cx="32" cy="25" r="12" fill="%236b7280"/><path d="M14 52c3-9 9-14 18-14s15 5 18 14" fill="%236b7280"/></svg>';

function Header({ user, token, onLogout, searchQuery, onSearchChange }) {
  const navigate = useNavigate();
  const location = useLocation();
  const isAdmin = user?.role === 'admin';
  const canUseCart = user && user.role === 'user';
  const canSeeOrders = user && user.role === 'user';
  const canUseScanner = user && (user.role === 'seller' || user.role === 'delivery_boy');
  const canUseDeliveryPanel = user && user.role === 'delivery_boy';
  const profileImageSrc = user?.profileImage || user?.avatar || user?.image || PROFILE_PLACEHOLDER;
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const notificationRef = useRef(null);

  useEffect(() => {
    const handleOutside = (event) => {
      if (!notificationRef.current) return;
      if (!notificationRef.current.contains(event.target)) {
        setNotificationsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  useEffect(() => {
    const loadNotifications = async () => {
      if (!user || !token) {
        setNotifications([]);
        return;
      }

      try {
        setNotificationsLoading(true);
        let response;

        if (user.role === 'user') {
          response = await getMyOrders(token);
        } else if (user.role === 'delivery_boy') {
          response = await getDeliveryOrders(token);
        } else {
          response = await getSellerOrders(token);
        }

        const recent = (response?.data || []).slice(0, 5).map((order) => ({
          id: order._id,
          title: `Order #${String(order._id).slice(-6)} is ${order.status}`,
          subTitle: user.role === 'user'
            ? `Total: Rs. ${order.totalAmount || 0}`
            : `Your total: Rs. ${order.sellerTotal || 0}`,
          status: order.status,
          createdAt: order.createdAt
        }));

        setNotifications(recent);
      } catch (error) {
        setNotifications([]);
      } finally {
        setNotificationsLoading(false);
      }
    };

    loadNotifications();
  }, [user, token]);

  const unreadCount = useMemo(
    () => notifications.filter((n) => n.status === 'pending' || n.status === 'processing').length,
    [notifications]
  );

  const handleOpenNotifications = () => {
    setNotificationsOpen((prev) => !prev);
  };

  const showSearch = location.pathname === '/';
  const navItems = isAdmin
    ? [
        { to: '/admin?tab=home', label: 'Dashboard', tab: 'home' },
        { to: '/admin?tab=ads', label: 'Ads', tab: 'ads' },
        { to: '/admin?tab=users', label: 'Users', tab: 'users' },
        { to: '/admin?tab=products', label: 'Products', tab: 'products' },
        { to: '/admin?tab=orders', label: 'Orders', tab: 'orders' }
      ]
    : user?.role === 'seller'
    ? [
        { to: '/seller?tab=dashboard', label: 'Seller Dashboard', tab: 'dashboard' },
        { to: '/seller?tab=my-products', label: 'My Products', tab: 'my-products' },
        { to: '/seller?tab=add-products', label: 'Add Products', tab: 'add-products' },
        { to: '/seller?tab=all-orders', label: 'All Orders', tab: 'all-orders' },
        { to: '/seller/scan', label: 'QR Scan', tab: 'scan' }
      ]
    : [
        { to: '/', label: 'Home' },
        ...(canUseCart ? [{ to: '/cart', label: 'Cart' }] : []),
        ...(canSeeOrders ? [{ to: '/orders', label: 'My Orders' }] : []),
        ...(canUseScanner ? [{ to: '/seller/scan', label: 'QR Scanner' }] : []),
        ...(canUseDeliveryPanel ? [{ to: '/delivery', label: 'Delivery Panel' }] : [])
      ];

  return (
    <header className="app-header">
      <div className="header-inner">
        <div className="header-top-row">
          <Link to="/" className="brand-link">
            <img src={logo} alt="Apna Bazaar Logo" className="brand-logo" style={{ height: '50px' }} />
          </Link>

          <nav className="header-nav">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) => {
                  const active = user?.role === 'seller' && item.tab
                    ? location.pathname === '/seller' && location.search === `?tab=${item.tab}`
                    : user?.role === 'admin' && item.tab
                    ? location.pathname === '/admin' && (location.search === `?tab=${item.tab}` || (!location.search && item.tab === 'home'))
                    : isActive;

                  return `header-nav-link${active ? ' active' : ''}`;
                }}
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="header-actions">
            {user ? (
              <div className="notification-wrap" ref={notificationRef}>
                <button
                  type="button"
                  className="nav-icon-btn"
                  aria-label="Notifications"
                  title="Notifications"
                  onClick={handleOpenNotifications}
                >
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 3a5 5 0 00-5 5v2.9c0 .6-.2 1.2-.57 1.67L5 14.5h14l-1.43-1.93a2.8 2.8 0 01-.57-1.67V8a5 5 0 00-5-5z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M9.5 17a2.5 2.5 0 005 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                </svg>
                {unreadCount > 0 ? <span className="icon-dot" /> : null}
                </button>

                {notificationsOpen ? (
                  <div className="notification-panel">
                    <div className="notification-head">
                      <strong>Notifications</strong>
                      {unreadCount > 0 ? <span>{unreadCount} new</span> : null}
                    </div>

                    {notificationsLoading ? <p className="notification-empty">Loading...</p> : null}

                    {!notificationsLoading && notifications.length === 0 ? (
                      <p className="notification-empty">No notifications yet.</p>
                    ) : null}

                    {!notificationsLoading && notifications.length > 0 ? (
                      <div className="notification-list">
                        {notifications.map((item) => (
                          <button
                            type="button"
                            key={item.id}
                            className="notification-item"
                            onClick={() => {
                              setNotificationsOpen(false);
                              if (user?.role === 'user') {
                                navigate('/orders');
                              } else if (user?.role === 'delivery_boy') {
                                navigate('/delivery');
                              } else {
                                navigate('/seller');
                              }
                            }}
                          >
                            <p>{item.title}</p>
                            <span>{item.subTitle}</span>
                          </button>
                        ))}
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </div>
            ) : null}

            {user ? (
              <Link to="/profile" className="nav-avatar-btn" aria-label="My Profile" title="My Profile">
                <img
                  src={profileImageSrc}
                  alt={user?.name || 'Profile'}
                  className="nav-avatar-img"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = PROFILE_PLACEHOLDER;
                  }}
                />
              </Link>
            ) : null}

            {!user ? <Link to="/login" className="auth-link">Login</Link> : null}
            {!user ? <Link to="/register" className="auth-link primary">Register</Link> : null}

            {user ? (
              <button type="button" onClick={onLogout} className="link-button logout-btn">
                Logout
              </button>
            ) : null}
          </div>
        </div>

        <div className="header-bottom-row">
          {showSearch ? (
            <div className="header-search-wrap">
              <label className="header-search-label" htmlFor="home-search">
                Search products
              </label>
              <div className="header-search-box">
                <svg viewBox="0 0 24 24" aria-hidden="true" className="header-search-icon">
                  <path
                    d="M10.5 4a6.5 6.5 0 104.11 11.53l4.43 4.43a1 1 0 001.41-1.42l-4.42-4.43A6.5 6.5 0 0010.5 4z"
                    fill="currentColor"
                  />
                </svg>
                <input
                  id="home-search"
                  type="search"
                  value={searchQuery}
                  onChange={(e) => onSearchChange(e.target.value)}
                  placeholder="Search products"
                  className="header-search-input"
                />
                {searchQuery ? (
                  <button
                    type="button"
                    className="header-search-clear"
                    onClick={() => onSearchChange('')}
                    aria-label="Clear search"
                  >
                    ×
                  </button>
                ) : null}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}

export default Header;
