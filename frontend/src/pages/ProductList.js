import React, { useEffect, useMemo, useState } from 'react';
import ProductCard from '../components/ProductCard';
import { API_ORIGIN } from '../config/api';
import { getPublicAds } from '../services/authService';

const resolveMediaUrl = (value) => {
  if (!value || typeof value !== 'string') return '';
  if (/^https?:\/\//i.test(value)) return value;

  const localhostUploadMatch = String(value).match(/^https?:\/\/localhost(?::\d+)?(\/uploads\/.*)$/i);
  if (localhostUploadMatch?.[1]) {
    return `${API_ORIGIN}${localhostUploadMatch[1]}`;
  }

  const normalizedPath = value.startsWith('/') ? value : `/${value}`;
  if (normalizedPath.startsWith('/uploads/')) {
    return `${API_ORIGIN}${normalizedPath}`;
  }

  return normalizedPath;
};

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
  const list = useMemo(() => (Array.isArray(products) ? products : []), [products]);
  const [ads, setAds] = useState([]);
  const [activeSlide, setActiveSlide] = useState(0);
  const hasActiveFilters = searchQuery.trim() || sortBy !== 'featured';
  const sortOptions = [
    { value: 'featured', label: 'Default' },
    { value: 'price-low', label: 'Price Low to High' },
    { value: 'price-high', label: 'Price High to Low' }
  ];
  const resultLabel = searchQuery.trim()
    ? `${list.length} result${list.length === 1 ? '' : 's'} found`
    : `${list.length} product${list.length === 1 ? '' : 's'} available`;

  useEffect(() => {
    const loadAds = async () => {
      try {
        const adRes = await getPublicAds();
        setAds(adRes.data || []);
      } catch (err) {
        setAds([]);
      }
    };

    loadAds();
    const poller = window.setInterval(loadAds, 15000);

    return () => window.clearInterval(poller);
  }, []);

  const carouselSlides = useMemo(() => {
    return (Array.isArray(ads) ? ads : [])
      .filter((ad) => ad?.image)
      .map((ad) => ({
        image: resolveMediaUrl(ad.image)
      }))
      .filter((ad) => ad.image)
      .slice(0, 20);
  }, [ads]);

  const groupedSlides = useMemo(() => {
    const groups = [];
    for (let index = 0; index < carouselSlides.length; index += 4) {
      groups.push(carouselSlides.slice(index, index + 4));
    }
    return groups;
  }, [carouselSlides]);

  useEffect(() => {
    setActiveSlide(0);
  }, [groupedSlides.length]);

  useEffect(() => {
    if (groupedSlides.length <= 1) return undefined;

    const timer = window.setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % groupedSlides.length);
    }, 4200);

    return () => window.clearInterval(timer);
  }, [groupedSlides.length]);

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

  return (
    <div className="storefront-shell">
      {groupedSlides.length > 0 ? (
        <section className="home-ad-grid-carousel" aria-label="Featured ads showcase">
          <div className="home-ad-grid-track" style={{ transform: `translateX(-${activeSlide * 100}%)` }}>
            {groupedSlides.map((slideGroup, groupIndex) => (
              <div className="home-ad-grid-page" key={`group-${groupIndex}`}>
                {slideGroup.map((slide, itemIndex) => (
                  <article className="home-ad-grid-item" key={`${slide.image}-${groupIndex}-${itemIndex}`}>
                    <img src={slide.image} alt="Ad banner" className="home-ad-grid-image" />
                  </article>
                ))}
              </div>
            ))}
          </div>

          {groupedSlides.length > 1 ? (
            <div className="home-carousel-dots">
              {groupedSlides.map((_, index) => (
                <button
                  key={`dot-${index}`}
                  type="button"
                  className={`home-carousel-dot ${activeSlide === index ? 'active' : ''}`}
                  onClick={() => setActiveSlide(index)}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>
          ) : null}
        </section>
      ) : null}

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
      {list.length > 0 ? (
        <div className="product-grid">
          {list.map((product) => (
            <ProductCard key={product._id} product={product} />
          ))}
        </div>
      ) : (
        <div className="loading">
          {searchQuery.trim() ? 'No products match your search' : 'No products available'}
        </div>
      )}
    </div>
  );
}

export default ProductList;
