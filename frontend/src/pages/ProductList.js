import React from 'react';
import ProductCard from '../components/ProductCard';

function ProductList({ products, loading, error, onRefresh }) {
  const list = Array.isArray(products) ? products : [];

  if (loading) {
    return <div className="loading">Loading products...</div>;
  }

  if (error) {
    return (
      <div>
        <div className="error">{error}</div>
        <button onClick={onRefresh}>Retry</button>
      </div>
    );
  }

  if (list.length === 0) {
    return <div className="loading">No products available</div>;
  }

  return (
    <div className="storefront-shell">
      <div className="storefront-head">
        <h2>Featured Products</h2>
        <p>Curated picks with premium quality and fast delivery.</p>
      </div>
      <div className="product-grid">
        {list.map((product) => (
          <ProductCard key={product._id} product={product} />
        ))}
      </div>
    </div>
  );
}

export default ProductList;
