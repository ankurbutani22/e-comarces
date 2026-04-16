import React from 'react';
import ProductCard from '../components/ProductCard';

function ProductList({
  products,
  loading,
  error,
  onRefresh,
  searchQuery = '',
  selectedCategory = 'all',
  sortBy = 'featured',
  categoryOptions = ['all'],
  onCategoryChange,
  onSortChange,
  onClearFilters
}) {
  const list = Array.isArray(products) ? products : [];
  const hasActiveFilters = searchQuery.trim() || selectedCategory !== 'all' || sortBy !== 'featured';

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
        <h2>Featured Products</h2>
        <p>Curated picks with premium quality and fast delivery.</p>
      </div>
      <div className="product-toolbar">
        <div className="toolbar-group">
          <span className="toolbar-label">Category</span>
          <select
            className="toolbar-select"
            value={selectedCategory}
            onChange={(e) => onCategoryChange && onCategoryChange(e.target.value)}
          >
            {categoryOptions.map((category) => (
              <option key={category} value={category}>
                {category === 'all' ? 'All categories' : category}
              </option>
            ))}
          </select>
        </div>

        <div className="toolbar-group">
          <span className="toolbar-label">Sort by</span>
          <select
            className="toolbar-select"
            value={sortBy}
            onChange={(e) => onSortChange && onSortChange(e.target.value)}
          >
            <option value="featured">Featured</option>
            <option value="price-low">Price: Low to High</option>
            <option value="price-high">Price: High to Low</option>
            <option value="name-az">Name: A to Z</option>
            <option value="stock-high">Stock: High to Low</option>
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
