import React from 'react';
import ProductCard from '../components/ProductCard';

function ProductList({
  products,
  loading,
  error,
  onRefresh,
  searchQuery = '',
  sortBy = 'featured',
  onSortChange,
  onClearFilters
}) {
  const list = Array.isArray(products) ? products : [];
  const hasActiveFilters = searchQuery.trim() || sortBy !== 'featured';

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
    return (
      <div className="loading">
        {searchQuery.trim() ? 'No products match your search' : 'No products available'}
      </div>
    );
  }

  return (
    <div className="storefront-shell">
      <div className="storefront-head">
        <div className="storefront-kicker">Featured Collection</div>
        <h2>Discover products with a cleaner browsing flow</h2>
        <p>Search from the header and sort by price below for a faster shopping experience.</p>
      </div>
      <div className="product-toolbar">
        <div className="toolbar-group">
          <span className="toolbar-label">Price sort</span>
          <select
            className="toolbar-select"
            value={sortBy}
            onChange={(e) => onSortChange && onSortChange(e.target.value)}
          >
            <option value="price-low">Price: Low to High</option>
            <option value="price-high">Price: High to Low</option>
            <option value="featured">Default</option>
          </select>
        </div>

        {hasActiveFilters ? (
          <button type="button" className="toolbar-reset-btn" onClick={onClearFilters}>
            Clear Filters
          </button>
        ) : null}
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
