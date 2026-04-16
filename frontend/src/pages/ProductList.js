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
  const sortOptions = [
    { value: 'featured', label: 'Default' },
    { value: 'price-low', label: 'Price Low to High' },
    { value: 'price-high', label: 'Price High to Low' }
  ];
  const resultLabel = searchQuery.trim()
    ? `${list.length} result${list.length === 1 ? '' : 's'} found`
    : `${list.length} product${list.length === 1 ? '' : 's'} available`;

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
        <p>Search from the header and use the price sort below for a focused shopping experience.</p>
      </div>
      <div className="product-toolbar-shell">
        <div className="product-toolbar-head">
          <div>
            <span className="toolbar-kicker">Quick controls</span>
            <h3>Price sorting</h3>
            <p>Keep the view simple and sort products by your preferred price order.</p>
          </div>
          <div className="toolbar-count-pill">{resultLabel}</div>
        </div>

        <div className="product-toolbar">
          <div className="toolbar-group">
            <span className="toolbar-label">Sort by price</span>
            <div className="toolbar-sort-options" role="group" aria-label="Sort products by price">
              {sortOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className={`sort-pill-btn ${sortBy === option.value ? 'active' : ''}`}
                  onClick={() => onSortChange && onSortChange(option.value)}
                  aria-pressed={sortBy === option.value}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {hasActiveFilters ? (
            <button type="button" className="toolbar-reset-btn" onClick={onClearFilters}>
              Reset View
            </button>
          ) : null}
        </div>
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
