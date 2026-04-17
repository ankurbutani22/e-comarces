import React, { useEffect, useMemo, useState } from 'react';
import ProductCard from '../components/ProductCard';
import { API_ORIGIN } from '../config/api';
import { getPublicAds } from '../services/authService';

const FALLBACK_CAROUSEL_SLIDES = [
  {
    image: 'https://placehold.co/1200x420/17384d/f8fbff?text=Trending+Deals',
    title: 'Trending Deals',
    subtitle: 'Fresh picks added daily'
  },
  {
    image: 'https://placehold.co/1200x420/2b6f87/f8fbff?text=Smart+Shopping+Flow',
    title: 'Smart Shopping Flow',
    subtitle: 'Compare prices and save more'
  },
  {
    image: 'https://placehold.co/1200x420/2f7f75/f8fbff?text=Seller+Offers+Live',
    title: 'Seller Offers Live',
    subtitle: 'Latest products and discounts'
  }
];

const resolveMediaUrl = (value) => {
  if (!value || typeof value !== 'string') return '';
  if (/^https?:\/\//i.test(value)) return value;

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
  const list = Array.isArray(products) ? products : [];
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
    const adminSlides = (Array.isArray(ads) ? ads : [])
      .filter((ad) => ad?.image)
      .map((ad) => ({
        image: resolveMediaUrl(ad.image),
        title: ad.productName || ad.title || 'Featured Offer',
        subtitle: ad.content || ad.subtitle || 'Latest updates from admin',
        companyName: ad.companyName || ''
      }))
      .filter((ad) => ad.image)
      .slice(0, 8);

    if (adminSlides.length > 0) {
      return adminSlides;
    }

    const productSlides = list
      .map((product) => {
        const candidates = [
          product?.image,
          ...(Array.isArray(product?.images) ? product.images : [])
        ]
          .map(resolveMediaUrl)
          .filter(Boolean)
          .filter((url) => !url.includes('via.placeholder.com'));

        if (candidates.length === 0) return null;

        const basePrice = Number(product?.price || 0);
        const discountPercent = Math.min(95, Math.max(0, Number(product?.discountPercent || 0)));
        const effectivePrice = Math.max(0, Math.round(basePrice - (basePrice * discountPercent) / 100));

        return {
          image: candidates[0],
          title: product?.name || 'Featured Product',
          subtitle: discountPercent > 0
            ? `Now Rs. ${effectivePrice} (MRP Rs. ${basePrice})`
            : `Price Rs. ${basePrice}`
        };
      })
      .filter(Boolean)
      .slice(0, 5);

    return productSlides.length > 0 ? productSlides : FALLBACK_CAROUSEL_SLIDES;
  }, [ads, list]);

  useEffect(() => {
    setActiveSlide(0);
  }, [carouselSlides.length]);

  useEffect(() => {
    if (carouselSlides.length <= 1) return undefined;

    const timer = window.setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % carouselSlides.length);
    }, 4200);

    return () => window.clearInterval(timer);
  }, [carouselSlides.length]);

  const goToPrevSlide = () => {
    setActiveSlide((prev) => (prev - 1 + carouselSlides.length) % carouselSlides.length);
  };

  const goToNextSlide = () => {
    setActiveSlide((prev) => (prev + 1) % carouselSlides.length);
  };

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
      <section className="home-carousel" aria-label="Featured products carousel">
        <div className="home-carousel-track" style={{ transform: `translateX(-${activeSlide * 100}%)` }}>
          {carouselSlides.map((slide, index) => (
            <article className="home-carousel-slide" key={`${slide.image}-${index}`}>
              <img src={slide.image} alt={slide.title} className="home-carousel-image" />
              <div className="home-carousel-overlay">
                <p className="home-carousel-kicker">{slide.companyName || 'Featured'}</p>
                <h3>{slide.title}</h3>
                <p>{slide.subtitle}</p>
              </div>
            </article>
          ))}
        </div>

        {carouselSlides.length > 1 ? (
          <>
            <button type="button" className="home-carousel-btn prev" onClick={goToPrevSlide} aria-label="Previous slide">
              ‹
            </button>
            <button type="button" className="home-carousel-btn next" onClick={goToNextSlide} aria-label="Next slide">
              ›
            </button>
            <div className="home-carousel-dots">
              {carouselSlides.map((_, index) => (
                <button
                  key={`dot-${index}`}
                  type="button"
                  className={`home-carousel-dot ${activeSlide === index ? 'active' : ''}`}
                  onClick={() => setActiveSlide(index)}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>
          </>
        ) : null}
      </section>

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
