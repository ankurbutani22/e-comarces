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
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const headerControlsRef = useRef(null);

  useEffect(() => {
    const handleOutside = (event) => {
      if (!headerControlsRef.current) return;
      if (!headerControlsRef.current.contains(event.target)) {
        setProfileMenuOpen(false);
        setNotificationsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
    setProfileMenuOpen(false);
    setNotificationsOpen(false);
  }, [location.pathname, location.search]);

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
    setProfileMenuOpen(false);
    setNotificationsOpen((prev) => !prev);
  };

  const handleToggleProfileMenu = () => {
    setNotificationsOpen(false);
    setProfileMenuOpen((prev) => {
      return !prev;
    });
  };

  const closeAllMenus = () => {
    setMobileMenuOpen(false);
    setProfileMenuOpen(false);
    setNotificationsOpen(false);
  };

  const showSearch = location.pathname === '/';
  const navItems = isAdmin
    ? [
        { to: '/admin?tab=home', label: 'Dashboard', tab: 'home', icon: 'dashboard' },
        { to: '/admin?tab=ads', label: 'Ads', tab: 'ads', icon: 'ads' },
        { to: '/admin?tab=users', label: 'Users', tab: 'users', icon: 'users' },
        { to: '/admin?tab=products', label: 'Products', tab: 'products', icon: 'products' },
        { to: '/admin?tab=orders', label: 'Orders', tab: 'orders', icon: 'orders' }
      ]
    : user?.role === 'seller'
    ? [
        { to: '/seller?tab=dashboard', label: 'Dashboard', tab: 'dashboard', icon: 'dashboard' },
        { to: '/seller?tab=my-products', label: 'Products', tab: 'my-products', icon: 'products' },
        { to: '/seller?tab=add-products', label: 'Add', tab: 'add-products', icon: 'add' },
        { to: '/seller?tab=all-orders', label: 'Orders', tab: 'all-orders', icon: 'orders' },
        { to: '/seller/scan', label: 'Scan', tab: 'scan', icon: 'scan' }
      ]
    : [
        { to: '/', label: 'Home', icon: 'home' },
        ...(canUseCart ? [{ to: '/cart', label: 'Cart', icon: 'cart' }] : []),
        ...(canSeeOrders ? [{ to: '/orders', label: 'Orders', icon: 'orders' }] : []),
        ...(canUseScanner ? [{ to: '/seller/scan', label: 'Scan', icon: 'scan' }] : []),
        ...(canUseDeliveryPanel ? [{ to: '/delivery', label: 'Delivery', icon: 'delivery' }] : [])
      ];
  const mobileNavCountClass = `mobile-nav-count-${Math.min(Math.max(navItems.length, 1), 5)}`;
  const roleLabel = user?.role ? user.role.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase()) : '';

  const renderNavIcon = (icon) => {
    switch (icon) {
      case 'home':
        return <path d="M3 11.5L12 4l9 7.5V20a1 1 0 01-1 1h-5v-6h-6v6H4a1 1 0 01-1-1v-8.5z" fill="currentColor" />;
      case 'cart':
        return <path d="M3 5h2l2 10h10l2-7H8" stroke="currentColor" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" />;
      case 'orders':
        return <path d="M6 4h12v16H6zM9 8h6M9 12h6M9 16h4" stroke="currentColor" strokeWidth="1.8" fill="none" strokeLinecap="round" />;
      case 'scan':
        return <path d="M7 4H4v3M17 4h3v3M4 17v3h3M20 17v3h-3M8 12h8" stroke="currentColor" strokeWidth="1.8" fill="none" strokeLinecap="round" />;
      case 'delivery':
        return <path d="M4 8h10v8H4zM14 10h3l3 3v3h-6zM7 18a1.5 1.5 0 100 3 1.5 1.5 0 000-3zM17 18a1.5 1.5 0 100 3 1.5 1.5 0 000-3z" fill="currentColor" />;
      case 'dashboard':
        return <path d="M4 4h7v7H4zM13 4h7v4h-7zM13 10h7v10h-7zM4 13h7v7H4z" fill="currentColor" />;
      case 'users':
        return <path d="M9 11a3 3 0 100-6 3 3 0 000 6zm6 1a2.5 2.5 0 100-5 2.5 2.5 0 000 5zM4 20a5 5 0 0110 0M13 20a4 4 0 018 0" stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinecap="round" />;
      case 'products':
        return <path d="M4 7l8-4 8 4-8 4-8-4zm0 5l8 4 8-4M4 12v5l8 4 8-4v-5" stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinejoin="round" />;
      case 'ads':
        return <path d="M4 12l12-5v10L4 12zm12-2h3a2 2 0 010 4h-3" stroke="currentColor" strokeWidth="1.8" fill="none" strokeLinecap="round" />;
      case 'add':
        return <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />;
      default:
        return <circle cx="12" cy="12" r="4" fill="currentColor" />;
    }
  };

  const getNavBadge = (item) => {
    if (!user || unreadCount <= 0) {
      return null;
    }

    if (item.icon === 'orders' || item.icon === 'delivery') {
      return unreadCount > 9 ? '9+' : String(unreadCount);
    }

    return null;
  };

  return (
    <header className={`app-header ${mobileMenuOpen ? 'mobile-menu-open' : ''} ${user ? 'has-user' : 'is-guest'}`}>
      <div className="header-inner">
        <div className="header-top-row">
          <Link to="/" className="brand-link">
            <img src={logo} alt="Apna Bazaar Logo" className="brand-logo" />
          </Link>

          <button
            type="button"
            className="mobile-menu-toggle"
            aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileMenuOpen}
            onClick={() => setMobileMenuOpen((prev) => !prev)}
          >
            <span />
            <span />
            <span />
          </button>

          <nav
            className={`header-nav ${user?.role ? `header-nav-${user.role}` : ''} ${mobileNavCountClass}`}
          >
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                onClick={closeAllMenus}
                className={({ isActive }) => {
                  const active = user?.role === 'seller' && item.tab
                    ? location.pathname === '/seller' && location.search === `?tab=${item.tab}`
                    : user?.role === 'admin' && item.tab
                    ? location.pathname === '/admin' && (location.search === `?tab=${item.tab}` || (!location.search && item.tab === 'home'))
                    : isActive;

                  return `header-nav-link${active ? ' active' : ''}`;
                }}
              >
                <span className="header-nav-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    {renderNavIcon(item.icon)}
                  </svg>
                  {getNavBadge(item) ? <span className="header-nav-badge">{getNavBadge(item)}</span> : null}
                </span>
                <span className="header-nav-text">{item.label}</span>
              </NavLink>
            ))}
          </nav>

          <div className="header-actions">
            {user ? (
              <div className="header-user-controls" ref={headerControlsRef}>
                <div className="notification-wrap">
                  <button
                    type="button"
                    className="nav-icon-btn notification-btn"
                    aria-label="Notifications"
                    title="Notifications"
                    aria-expanded={notificationsOpen}
                    onClick={handleOpenNotifications}
                  >
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M12 4a5 5 0 00-5 5v2.5c0 .9-.34 1.77-.96 2.43L4.6 15.4a1 1 0 00.7 1.7h13.4a1 1 0 00.7-1.7l-1.44-1.47a3.5 3.5 0 01-.96-2.43V9a5 5 0 00-5-5zm0 17a2.5 2.5 0 002.45-2h-4.9A2.5 2.5 0 0012 21z" fill="currentColor" />
                    </svg>
                    {unreadCount > 0 ? <span className="nav-icon-badge">{unreadCount > 9 ? '9+' : unreadCount}</span> : null}
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

                <div className="profile-menu-wrap">
                  <button
                    type="button"
                    className="profile-trigger-btn"
                    aria-label="My Profile"
                    title="My Profile"
                    aria-expanded={profileMenuOpen}
                    onClick={handleToggleProfileMenu}
                  >
                    <span className="profile-trigger-avatar" aria-hidden="true">
                      <img
                        src={profileImageSrc}
                        alt={user?.name || 'Profile'}
                        className="nav-avatar-img"
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = PROFILE_PLACEHOLDER;
                        }}
                      />
                    </span>
                    <span className="profile-trigger-label">My Profile</span>
                  </button>

                  {profileMenuOpen ? (
                    <div className="profile-menu-panel">
                      <div className="profile-menu-head">
                        <img
                          src={profileImageSrc}
                          alt={user?.name || 'Profile'}
                          className="profile-menu-avatar"
                          onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = PROFILE_PLACEHOLDER;
                          }}
                        />
                        <div>
                          <strong>{user?.name || 'User'}</strong>
                          <span>{roleLabel || 'Member'}</span>
                        </div>
                      </div>

                      <Link to="/profile" className="profile-menu-item" onClick={closeAllMenus}>
                        View Profile Details
                      </Link>

                      <button
                        type="button"
                        className="profile-menu-item danger"
                        onClick={() => {
                          closeAllMenus();
                          onLogout();
                        }}
                      >
                        Logout
                      </button>
                    </div>
                  ) : null}
                </div>
              </div>
            ) : null}

            {!user ? <Link to="/login" className="auth-link" onClick={closeAllMenus}>Login</Link> : null}
            {!user ? <Link to="/register" className="auth-link primary" onClick={closeAllMenus}>Register</Link> : null}
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
