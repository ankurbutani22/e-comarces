import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { createOrder } from '../services/authService';
import { readLocalJson } from '../utils/storage';

const MEDIA_PLACEHOLDER =
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="800" height="800" viewBox="0 0 800 800"><rect width="800" height="800" fill="%23e9eef3"/><rect x="220" y="220" width="360" height="360" rx="18" fill="%23ffffff" stroke="%23b8c4d1" stroke-width="8"/><circle cx="330" cy="340" r="34" fill="%2394a7ba"/><path d="M250 500l95-95 80 80 70-70 55 55v70H250z" fill="%23b6c5d5"/><text x="400" y="610" font-family="Segoe UI, Arial" font-size="32" text-anchor="middle" fill="%23667a8f">No product image</text></svg>';

const resolveMediaUrl = (value) => {
  if (!value || typeof value !== 'string') return '';

  if (/^https?:\/\//i.test(value)) {
    return value;
  }

  const normalizedPath = value.startsWith('/') ? value : `/${value}`;
  if (normalizedPath.startsWith('/uploads/')) {
    const backendOrigin = process.env.REACT_APP_API_ORIGIN || 'http://localhost:2205';
    return `${backendOrigin}${normalizedPath}`;
  }

  return normalizedPath;
};

function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const user = readLocalJson('user', null);
  const isSeller = user?.role === 'seller';
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedImage, setSelectedImage] = useState('');
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedVariantId, setSelectedVariantId] = useState('');
  const [showBuyModal, setShowBuyModal] = useState(false);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [buyName, setBuyName] = useState('');
  const [buyPhone, setBuyPhone] = useState('');
  const [buyAddress, setBuyAddress] = useState('');
  const [buyPaymentMethod, setBuyPaymentMethod] = useState('cod');
  const [buyCardNumber, setBuyCardNumber] = useState('');
  const [buyCardHolder, setBuyCardHolder] = useState('');
  const [buyCardExpiry, setBuyCardExpiry] = useState('');
  const [buyCardCvv, setBuyCardCvv] = useState('');

  const handleAddToCart = () => {
    if (isSeller) {
      alert('Seller account cannot add products to cart.');
      return;
    }

    if (product.stock === 0) {
      alert('This product is out of stock.');
      return;
    }

    if (Array.isArray(product.sizes) && product.sizes.length > 0 && !selectedSize) {
      alert('Please select size first.');
      return;
    }

    if (Array.isArray(product.variants) && product.variants.length > 0 && !selectedVariantId) {
      alert('Please select design first.');
      return;
    }

    const selectedVariant = (Array.isArray(product.variants) ? product.variants : []).find(
      (variant) => String(variant._id || variant.id) === String(selectedVariantId)
    );

    const cartKey = `${product._id}__${selectedSize || 'nosize'}__${selectedVariant?.name || 'nodefault'}`;

    const cart = readLocalJson('cart', []);
    const existing = cart.find((item) => item.cartKey === cartKey);

    if (existing) {
      existing.quantity += 1;
    } else {
      cart.push({
        ...product,
        quantity: 1,
        cartKey,
        selectedSize: selectedSize || '',
        selectedVariantId: selectedVariant ? String(selectedVariant._id || selectedVariant.id) : '',
        selectedVariantName: selectedVariant?.name || ''
      });
    }

    localStorage.setItem('cart', JSON.stringify(cart));
    alert('Added to cart!');
  };

  const canProceedWithVariantSelection = () => {
    if (product.stock === 0) {
      alert('This product is out of stock.');
      return false;
    }

    if (Array.isArray(product.sizes) && product.sizes.length > 0 && !selectedSize) {
      alert('Please select size first.');
      return false;
    }

    if (Array.isArray(product.variants) && product.variants.length > 0 && !selectedVariantId) {
      alert('Please select design first.');
      return false;
    }

    return true;
  };

  const openBuyModal = () => {
    if (isSeller) {
      alert('Seller account cannot place order.');
      return;
    }

    if (!user) {
      alert('Please login first.');
      navigate('/login');
      return;
    }

    if (!canProceedWithVariantSelection()) {
      return;
    }

    setBuyName(user?.name || '');
    setBuyPhone(user?.phone || '');
    setBuyAddress(user?.address || '');
    setBuyPaymentMethod('cod');
    setBuyCardNumber('');
    setBuyCardHolder('');
    setBuyCardExpiry('');
    setBuyCardCvv('');
    setShowBuyModal(true);
  };

  const confirmBuyOrder = async () => {
    const token = localStorage.getItem('token') || '';

    if (!token) {
      alert('Please login first.');
      navigate('/login');
      return;
    }

    if (!buyName.trim()) {
      alert('Please enter name.');
      return;
    }

    if (!/^\d{10}$/.test(buyPhone.trim())) {
      alert('Please enter valid 10 digit phone number.');
      return;
    }

    if (!buyAddress.trim()) {
      alert('Please enter address.');
      return;
    }

    if (buyPaymentMethod === 'credit_card' || buyPaymentMethod === 'debit_card') {
      if (!/^\d{16}$/.test((buyCardNumber || '').replace(/\s+/g, ''))) {
        alert('Please enter valid 16 digit card number.');
        return;
      }

      if (!buyCardHolder.trim()) {
        alert('Please enter card holder name.');
        return;
      }

      if (!/^(0[1-9]|1[0-2])\/(\d{2})$/.test(buyCardExpiry.trim())) {
        alert('Please enter expiry in MM/YY format.');
        return;
      }

      if (!/^\d{3,4}$/.test(buyCardCvv.trim())) {
        alert('Please enter valid CVV.');
        return;
      }
    }

    try {
      setPlacingOrder(true);
      await createOrder(token, {
        customerName: buyName.trim(),
        customerPhone: buyPhone.trim(),
        shippingAddress: buyAddress.trim(),
        paymentMethod: buyPaymentMethod,
        items: [
          {
            product: product._id,
            quantity: 1
          }
        ]
      });

      setShowBuyModal(false);
      alert('Order confirmed successfully!');
      navigate('/orders');
    } catch (err) {
      alert(err.response?.data?.message || 'Order confirm failed');
    } finally {
      setPlacingOrder(false);
    }
  };

  const fetchProductDetail = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/products/${id}`);
      setProduct(response.data.data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch product details');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchProductDetail();
  }, [fetchProductDetail]);

  const allImages = useMemo(() => {
    if (!product) return [MEDIA_PLACEHOLDER];

    const variantImages = Array.isArray(product.variants)
      ? product.variants.flatMap((variant) => (Array.isArray(variant.images) ? variant.images : []))
      : [];

    const rawImages = [product.image, ...(Array.isArray(product.images) ? product.images : []), ...variantImages];
    const normalized = rawImages.map(resolveMediaUrl).filter(Boolean);
    const unique = [...new Set(normalized)].filter((url) => !url.includes('via.placeholder.com'));

    return unique.length > 0 ? unique : [MEDIA_PLACEHOLDER];
  }, [product]);

  useEffect(() => {
    if (allImages.length > 0) {
      setSelectedImage(allImages[0]);
    }
  }, [allImages]);

  const variantOptions = useMemo(
    () => (Array.isArray(product?.variants) ? product.variants.filter((variant) => variant?.name) : []),
    [product]
  );

  const sizeOptions = useMemo(
    () => (Array.isArray(product?.sizes) ? product.sizes : []),
    [product]
  );

  const selectedVariant = useMemo(
    () => variantOptions.find((variant) => String(variant._id || variant.id) === String(selectedVariantId)) || null,
    [variantOptions, selectedVariantId]
  );

  useEffect(() => {
    setSelectedSize('');
    if (variantOptions.length === 1) {
      setSelectedVariantId(String(variantOptions[0]._id || variantOptions[0].id));
    } else {
      setSelectedVariantId('');
    }
  }, [id, variantOptions]);

  const galleryImages = useMemo(() => {
    if (selectedVariant?.images?.length) {
      const normalized = selectedVariant.images.map(resolveMediaUrl).filter(Boolean);
      return normalized.length ? normalized : allImages;
    }
    return allImages;
  }, [selectedVariant, allImages]);

  useEffect(() => {
    if (galleryImages.length > 0) {
      setSelectedImage(galleryImages[0]);
    }
  }, [galleryImages]);

  if (loading) return <div className="loading">Loading...</div>;
  if (error) return <div className="error">{error}</div>;
  if (!product) return <div className="loading">Product not found</div>;

  return (
    <div className="product-detail-page">
      <button className="back-link-btn" onClick={() => navigate('/')}>
        ← Back to Products
      </button>

      <div className="product-detail-shell">
        <div className="product-media-column">
          <img
            src={selectedImage || galleryImages[0]}
            alt={product.name}
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = MEDIA_PLACEHOLDER;
            }}
            className="product-main-image"
          />
          {galleryImages.length > 1 ? (
            <div className="product-thumb-grid">
              {galleryImages.map((imageUrl, index) => (
                <button
                  key={`${imageUrl}-${index}`}
                  type="button"
                  onClick={() => setSelectedImage(imageUrl)}
                  className={`product-thumb-btn ${selectedImage === imageUrl ? 'active' : ''}`}
                >
                  <img
                    src={imageUrl}
                    alt={`${product.name} ${index + 1}`}
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = MEDIA_PLACEHOLDER;
                    }}
                    className="product-thumb-image"
                  />
                </button>
              ))}
            </div>
          ) : null}
          {product.video ? (
            <video controls className="product-video" src={product.video}>
              Your browser does not support video playback.
            </video>
          ) : null}
        </div>

        <div className="product-meta-column">
          <h1 className="detail-title">{product.name}</h1>
          <p className="detail-price">₹{product.price}</p>

          <p className="detail-description">
            {product.description}
          </p>

          <p className="detail-line">
            <strong>Category:</strong> {product.category}
          </p>

          <p className="detail-line">
            <strong>Stock:</strong> {product.stock > 0 ? product.stock : 'Out of Stock'}
          </p>

          <p className="detail-line">
            <strong>Rating:</strong> {product.ratings} ⭐ ({product.numReviews} reviews)
          </p>

          {sizeOptions.length > 0 ? (
            <div className="selection-block">
              <p className="selector-label">Select Size</p>
              <div className="chip-row">
                {sizeOptions.map((size) => (
                  <button
                    key={size}
                    type="button"
                    className={`option-chip ${selectedSize === size ? 'active' : ''}`}
                    onClick={() => setSelectedSize(size)}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {variantOptions.length > 0 ? (
            <div className="selection-block">
              <p className="selector-label">Select Design</p>
              <div className="chip-row">
                {variantOptions.map((variant) => {
                  const variantId = String(variant._id || variant.id);
                  const variantImage = resolveMediaUrl(
                    Array.isArray(variant.images) && variant.images.length > 0 ? variant.images[0] : ''
                  );
                  return (
                    <button
                      key={variantId}
                      type="button"
                      className={`option-chip option-chip-with-image ${selectedVariantId === variantId ? 'active' : ''}`}
                      onClick={() => setSelectedVariantId(variantId)}
                    >
                      <img
                        src={variantImage || MEDIA_PLACEHOLDER}
                        alt={variant.name}
                        className="option-chip-thumb"
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = MEDIA_PLACEHOLDER;
                        }}
                      />
                      <span>{variant.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}

          <div className="detail-action-row">
            <button
              className="detail-add-cart-btn"
              onClick={handleAddToCart}
              disabled={product.stock === 0 || isSeller}
            >
              {isSeller ? 'Seller Can Not Buy' : 'Add to Cart'}
            </button>
            <button
              className="detail-buy-btn"
              onClick={openBuyModal}
              disabled={product.stock === 0 || isSeller}
            >
              Buy Order
            </button>
          </div>

          {(sizeOptions.length > 0 || variantOptions.length > 0) && (
            <p className="selection-hint">
              {sizeOptions.length > 0 && !selectedSize ? 'Please select size. ' : ''}
              {variantOptions.length > 0 && !selectedVariantId ? 'Please select design.' : ''}
            </p>
          )}
        </div>
      </div>

      {showBuyModal ? (
        <div className="buy-modal-backdrop" role="dialog" aria-modal="true" aria-label="Buy Order">
          <div className="buy-modal-card">
            <h3>Confirm Order</h3>
            <p className="buy-modal-subtitle">{product.name} - ₹{product.price}</p>
            {selectedSize ? <p className="buy-modal-subtitle">Size: {selectedSize}</p> : null}
            {selectedVariant?.name ? <p className="buy-modal-subtitle">Design: {selectedVariant.name}</p> : null}

            <label>Name</label>
            <input value={buyName} onChange={(e) => setBuyName(e.target.value)} placeholder="Full Name" />

            <label>Phone Number</label>
            <input value={buyPhone} onChange={(e) => setBuyPhone(e.target.value)} placeholder="10 digit number" />

            <label>Address</label>
            <textarea
              rows={3}
              value={buyAddress}
              onChange={(e) => setBuyAddress(e.target.value)}
              placeholder="Shipping address"
            />

            <label>Payment</label>
            <select value={buyPaymentMethod} onChange={(e) => setBuyPaymentMethod(e.target.value)}>
              <option value="cod">Cash On Delivery</option>
              <option value="credit_card">Credit Card</option>
              <option value="debit_card">Debit Card</option>
            </select>

            {(buyPaymentMethod === 'credit_card' || buyPaymentMethod === 'debit_card') ? (
              <div className="buy-card-grid">
                <label>Card Number</label>
                <input
                  value={buyCardNumber}
                  onChange={(e) => setBuyCardNumber(e.target.value.replace(/[^\d\s]/g, '').slice(0, 19))}
                  placeholder="1234 5678 9012 3456"
                />

                <label>Card Holder</label>
                <input
                  value={buyCardHolder}
                  onChange={(e) => setBuyCardHolder(e.target.value)}
                  placeholder="Card holder name"
                />

                <div className="buy-card-inline">
                  <div>
                    <label>Expiry (MM/YY)</label>
                    <input
                      value={buyCardExpiry}
                      onChange={(e) => setBuyCardExpiry(e.target.value.slice(0, 5))}
                      placeholder="MM/YY"
                    />
                  </div>
                  <div>
                    <label>CVV</label>
                    <input
                      type="password"
                      value={buyCardCvv}
                      onChange={(e) => setBuyCardCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
                      placeholder="CVV"
                    />
                  </div>
                </div>
              </div>
            ) : null}

            <div className="buy-modal-actions">
              <button type="button" className="buy-cancel-btn" onClick={() => setShowBuyModal(false)} disabled={placingOrder}>
                Cancel
              </button>
              <button type="button" className="buy-confirm-btn" onClick={confirmBuyOrder} disabled={placingOrder}>
                {placingOrder ? 'Confirming...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default ProductDetail;
