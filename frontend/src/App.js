import React, { useEffect, useMemo, useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import axios from 'axios';
import './App.css';
import { readLocalJson } from './utils/storage';
import Header from './components/Header';
import ProtectedRoute from './components/ProtectedRoute';
import ProductList from './pages/ProductList';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import Orders from './pages/Orders';
import QRScanner from './pages/QRScanner';
import MyProfile from './pages/MyProfile';
import Login from './pages/Login';
import Register from './pages/Register';
import AdminPanel from './pages/AdminPanel';
import DeliveryPanel from './pages/DeliveryPanel';
import SellerPanel from './pages/SellerPanel';
import Unauthorized from './pages/Unauthorized';

const getEffectiveProductPrice = (product) => {
  const basePrice = Number(product?.price || 0);
  const discountPercent = Math.min(95, Math.max(0, Number(product?.discountPercent || 0)));
  return Math.max(0, Math.round(basePrice - (basePrice * discountPercent) / 100));
};

function App() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(() => readLocalJson('user', null));
  const [token, setToken] = useState(() => localStorage.getItem('token') || '');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('featured');

  const visibleProducts = useMemo(() => {
    if (!user || user.role !== 'seller') {
      return products;
    }

    const currentSellerId = user._id || user.id;
    if (!currentSellerId) {
      return products;
    }

    return products.filter((product) => {
      if (!product?.seller) return false;
      const productSellerId = typeof product.seller === 'string' ? product.seller : product.seller?._id;
      return String(productSellerId) === String(currentSellerId);
    });
  }, [products, user]);

  const filteredProducts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    let nextProducts = [...visibleProducts];

    if (query) {
      nextProducts = nextProducts.filter((product) => {
        const haystack = [product?.name, product?.category, product?.description]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();

        return haystack.includes(query);
      });
    }

    if (sortBy === 'price-low') {
      nextProducts.sort((left, right) => getEffectiveProductPrice(left) - getEffectiveProductPrice(right));
    } else if (sortBy === 'price-high') {
      nextProducts.sort((left, right) => getEffectiveProductPrice(right) - getEffectiveProductPrice(left));
    }

    return nextProducts;
  }, [visibleProducts, searchQuery, sortBy]);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/products');

      const payload = response?.data;
      const nextProducts = Array.isArray(payload)
        ? payload
        : Array.isArray(payload?.data)
          ? payload.data
          : [];

      setProducts(nextProducts);
      setError(null);
    } catch (err) {
      setError('Failed to fetch products');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAuthSuccess = (nextUser, nextToken) => {
    setUser(nextUser);
    setToken(nextToken);
    localStorage.setItem('user', JSON.stringify(nextUser));
    localStorage.setItem('token', nextToken);
  };

  const handleLogout = () => {
    setUser(null);
    setToken('');
    localStorage.removeItem('user');
    localStorage.removeItem('token');
  };

  const handleProfileUpdated = (nextUser) => {
    setUser(nextUser);
    localStorage.setItem('user', JSON.stringify(nextUser));
  };

  return (
    <Router>
      <div className="App">
        <Header
          user={user}
          token={token}
          onLogout={handleLogout}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />
        <main className="main-content">
          <Routes>
            <Route 
              path="/" 
              element={
                <ProductList 
                  products={filteredProducts} 
                  loading={loading} 
                  error={error} 
                  onRefresh={fetchProducts}
                  searchQuery={searchQuery}
                  sortBy={sortBy}
                  onSortChange={setSortBy}
                  onClearFilters={() => {
                    setSearchQuery('');
                    setSortBy('featured');
                  }}
                />
              } 
            />
            <Route path="/product/:id" element={<ProductDetail />} />
            <Route
              path="/cart"
              element={
                <ProtectedRoute user={user} allowedRoles={['user', 'admin']}>
                  <Cart />
                </ProtectedRoute>
              }
            />
            <Route
              path="/orders"
              element={
                <ProtectedRoute user={user} allowedRoles={['user', 'admin']}>
                  <Orders token={token} />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute user={user} allowedRoles={['user', 'seller', 'admin', 'delivery_boy']}>
                  <MyProfile token={token} onProfileUpdated={handleProfileUpdated} />
                </ProtectedRoute>
              }
            />
            <Route path="/login" element={<Login onAuthSuccess={handleAuthSuccess} />} />
            <Route path="/register" element={<Register onAuthSuccess={handleAuthSuccess} />} />
            <Route
              path="/admin"
              element={
                <ProtectedRoute user={user} allowedRoles={['admin']}>
                  <AdminPanel token={token} />
                </ProtectedRoute>
              }
            />
            <Route
              path="/seller"
              element={
                <ProtectedRoute user={user} allowedRoles={['seller']}>
                  <SellerPanel token={token} onProductAdded={fetchProducts} />
                </ProtectedRoute>
              }
            />
            <Route
              path="/delivery"
              element={
                <ProtectedRoute user={user} allowedRoles={['delivery_boy']}>
                  <DeliveryPanel token={token} />
                </ProtectedRoute>
              }
            />
            <Route
              path="/seller/scan"
              element={
                <ProtectedRoute user={user} allowedRoles={['seller', 'admin', 'delivery_boy']}>
                  <QRScanner token={token} user={user} />
                </ProtectedRoute>
              }
            />
            <Route path="/unauthorized" element={<Unauthorized />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
