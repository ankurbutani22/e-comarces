import React from 'react';
import { Link } from 'react-router-dom';
import { API_ORIGIN } from '../config/api';

const CARD_PLACEHOLDER =
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600" viewBox="0 0 600 600"><rect width="600" height="600" fill="%23e9eef3"/><rect x="160" y="165" width="280" height="230" rx="16" fill="%23ffffff" stroke="%23b8c4d1" stroke-width="7"/><circle cx="230" cy="245" r="24" fill="%2394a7ba"/><path d="M185 345l65-65 52 52 45-45 68 68v25H185z" fill="%23b6c5d5"/><text x="300" y="455" font-family="Segoe UI, Arial" font-size="28" text-anchor="middle" fill="%23667a8f">No Image</text></svg>';

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

const getBestCardImage = (product) => {
  const variantImages = Array.isArray(product?.variants)
    ? product.variants.flatMap((variant) => (Array.isArray(variant.images) ? variant.images : []))
    : [];

  const candidates = [
    product?.image,
    ...(Array.isArray(product?.images) ? product.images : []),
    ...variantImages
  ]
    .map(resolveMediaUrl)
    .filter(Boolean)
    .filter((url) => !url.includes('via.placeholder.com'));

  return candidates[0] || CARD_PLACEHOLDER;
};

function ProductCard({ product }) {
  const productImage = getBestCardImage(product);
  const basePrice = Number(product?.price || 0);
  const discountPercent = Math.min(95, Math.max(0, Number(product?.discountPercent || 0)));
  const discountedPrice = Math.max(0, Math.round(basePrice - (basePrice * discountPercent) / 100));

  return (
    <div className="product-card">
      <Link to={`/product/${product._id}`} className="product-card-link">
        <img
          src={productImage}
          alt={product.name}
          className="product-image"
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src = CARD_PLACEHOLDER;
          }}
        />
        <div className="product-info">
          <h3 className="product-name">{product.name}</h3>
          <p className="product-price">
            ₹{discountedPrice}
            {discountPercent > 0 ? (
              <>
                {' '}
                <span style={{ textDecoration: 'line-through', opacity: 0.65, marginLeft: '0.4rem' }}>₹{basePrice}</span>
                <span style={{ marginLeft: '0.4rem', color: '#0f766e', fontWeight: 700 }}>-{discountPercent}%</span>
              </>
            ) : null}
          </p>
          <p className="product-rating-meta">
            ⭐ {Number(product?.ratings || 0).toFixed(1)} • {Number(product?.numReviews || 0)} ratings • {Number(product?.ordersCount || 0)} orders
          </p>
          <p className="product-stock">
            {product.stock > 0 ? `In Stock: ${product.stock}` : 'Out of Stock'}
          </p>
        </div>
      </Link>
    </div>
  );
}

export default ProductCard;
