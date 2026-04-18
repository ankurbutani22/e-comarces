import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  createSellerProduct,
  deleteSellerProduct,
  getMySellerProducts,
  getSellerOrders,
  getSellerPanel,
  updateSellerOrderStatus,
  uploadSellerMedia
} from '../services/authService';

function SellerPanel({ token, onProductAdded }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [panelData, setPanelData] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [myProducts, setMyProducts] = useState([]);
  const [sellerOrders, setSellerOrders] = useState([]);
  const [tableLoading, setTableLoading] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [imageFiles, setImageFiles] = useState([]);
  const [videoFile, setVideoFile] = useState(null);
  const [variants, setVariants] = useState([]);
  const [variantImageFiles, setVariantImageFiles] = useState({});
  const [sizes, setSizes] = useState([]);
  const [sizeInput, setSizeInput] = useState('');
  const [ramSizes, setRamSizes] = useState([]);
  const [ramSizeInput, setRamSizeInput] = useState('');
  const [romSizes, setRomSizes] = useState([]);
  const [romSizeInput, setRomSizeInput] = useState('');
  const [customOptions, setCustomOptions] = useState([]);
  const [customOptionInput, setCustomOptionInput] = useState('');
  const [activeTab, setActiveTab] = useState(() => new URLSearchParams(location.search).get('tab') || 'dashboard');
  const [form, setForm] = useState({
    name: '',
    description: '',
    price: '',
    discountPercent: '',
    category: 'Electronics',
    stock: '',
    image: '',
    images: [],
    video: '',
    variants: [],
    sizes: []
  });

  useEffect(() => {
    const load = async () => {
      try {
        setTableLoading(true);
        const data = await getSellerPanel(token);
        setPanelData(data.data);

        const productRes = await getMySellerProducts(token);
        setMyProducts(productRes.data || []);

        const orderRes = await getSellerOrders(token);
        setSellerOrders(orderRes.data || []);
      } catch (err) {
        setError(err.response?.data?.message || 'Unable to load seller panel');
      } finally {
        setTableLoading(false);
      }
    };

    load();
  }, [token]);

  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  useEffect(() => {
    if (success) {
      toast.success(success);
    }
  }, [success]);

  useEffect(() => {
    const currentTab = new URLSearchParams(location.search).get('tab') || 'dashboard';
    setActiveTab(currentTab);
  }, [location.search]);

  const setTab = (nextTab) => {
    setActiveTab(nextTab);
    navigate(`/seller?tab=${nextTab}`);
  };

  const stats = useMemo(() => ({
    products: myProducts.length,
    orders: sellerOrders.length,
    mediaReady: (form.images?.length || 0) + (form.video ? 1 : 0)
  }), [form.images, form.video, myProducts.length, sellerOrders.length]);

  const formBasePrice = Number(form.price || 0);
  const formDiscountPercent = Math.min(95, Math.max(0, Number(form.discountPercent || 0)));
  const formDiscountedPrice = Math.max(0, Math.round(formBasePrice - (formBasePrice * formDiscountPercent) / 100));

  const categoryOptionPresets = useMemo(() => ({
    Electronics: ['Warranty', 'Color', 'Plug Type'],
    Clothing: ['Sleeve Type', 'Fit', 'Fabric'],
    Mobile: ['Color', 'Network Type', 'Warranty'],
    Cosmetic: ['Skin Type', 'Shade', 'Fragrance'],
    Novelty: ['Theme', 'Material', 'Gift Wrap'],
    Books: ['Language', 'Binding', 'Edition'],
    Home: ['Material', 'Finish', 'Pack Size'],
    Sports: ['Grip', 'Weight', 'Usage Level'],
    Other: ['Color', 'Material', 'Pack Type']
  }), []);

  const onChange = (e) => {
    const { name, value } = e.target;

    if (name === 'category') {
      if (value !== 'Clothing') {
        setSizes([]);
        setSizeInput('');
      }
      if (value !== 'Mobile') {
        setRamSizes([]);
        setRamSizeInput('');
        setRomSizes([]);
        setRomSizeInput('');
      }
    }

    setForm({
      ...form,
      [name]: value
    });
  };

  const resetMediaSelection = () => {
    setImageFiles([]);
    setVideoFile(null);
  };

  const addVariant = () => {
    const newVariant = {
      id: Date.now(),
      name: '',
      images: []
    };
    setVariants([...variants, newVariant]);
  };

  const removeVariant = (variantId) => {
    setVariants(variants.filter(v => v.id !== variantId));
    setVariantImageFiles(prev => {
      const updated = { ...prev };
      delete updated[variantId];
      return updated;
    });
  };

  const updateVariantName = (variantId, name) => {
    setVariants(variants.map(v => v.id === variantId ? { ...v, name } : v));
  };

  const handleVariantImageSelect = (variantId, files) => {
    const fileArray = Array.from(files || []).slice(0, 5);
    setVariantImageFiles(prev => ({
      ...prev,
      [variantId]: fileArray
    }));
  };

  const addSize = () => {
    if (sizeInput.trim() && !sizes.includes(sizeInput.trim())) {
      setSizes([...sizes, sizeInput.trim().toUpperCase()]);
      setSizeInput('');
    }
  };

  const removeSize = (sizeToRemove) => {
    setSizes(sizes.filter(s => s !== sizeToRemove));
  };

  const addRamSize = () => {
    const normalizedValue = ramSizeInput.trim().toUpperCase();
    if (normalizedValue && !ramSizes.includes(normalizedValue)) {
      setRamSizes([...ramSizes, normalizedValue]);
      setRamSizeInput('');
    }
  };

  const removeRamSize = (ramToRemove) => {
    setRamSizes(ramSizes.filter(ram => ram !== ramToRemove));
  };

  const addRomSize = () => {
    const normalizedValue = romSizeInput.trim().toUpperCase();
    if (normalizedValue && !romSizes.includes(normalizedValue)) {
      setRomSizes([...romSizes, normalizedValue]);
      setRomSizeInput('');
    }
  };

  const removeRomSize = (romToRemove) => {
    setRomSizes(romSizes.filter(rom => rom !== romToRemove));
  };

  const addCustomOption = () => {
    const normalizedValue = customOptionInput.trim();
    if (normalizedValue && !customOptions.includes(normalizedValue)) {
      setCustomOptions([...customOptions, normalizedValue]);
      setCustomOptionInput('');
    }
  };

  const addCustomPreset = (option) => {
    if (option && !customOptions.includes(option)) {
      setCustomOptions([...customOptions, option]);
    }
  };

  const removeCustomOption = (optionToRemove) => {
    setCustomOptions(customOptions.filter(option => option !== optionToRemove));
  };

  const refreshProducts = async () => {
    const productRes = await getMySellerProducts(token);
    setMyProducts(productRes.data || []);

    if (typeof onProductAdded === 'function') {
      await onProductAdded();
    }
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSubmitting(true);

    try {
      let uploadedImage = form.image;
      let uploadedImages = Array.isArray(form.images) ? form.images : [];
      let uploadedVideo = form.video;

      if (imageFiles.length > 0 || videoFile) {
        const mediaRes = await uploadSellerMedia(token, imageFiles, videoFile);
        uploadedImage = mediaRes.data.image || uploadedImage;
        uploadedImages = mediaRes.data.images || uploadedImages;
        uploadedVideo = mediaRes.data.video || uploadedVideo;
      }

      const preparedVariants = await Promise.all(
        variants.map(async (variant) => {
          const queuedFiles = variantImageFiles[variant.id] || [];
          if (queuedFiles.length === 0) {
            return variant;
          }

          const variantUploadRes = await uploadSellerMedia(token, queuedFiles, null);
          return {
            ...variant,
            images: variantUploadRes.data.images || variant.images || []
          };
        })
      );

      await createSellerProduct(token, {
        name: form.name,
        description: form.description,
        price: Number(form.price),
        discountPercent: Number(form.discountPercent || 0),
        category: form.category,
        stock: Number(form.stock),
        image: uploadedImage || undefined,
        images: uploadedImages || undefined,
        video: uploadedVideo || undefined,
        variants: preparedVariants.map(v => ({
          name: v.name,
          images: v.images || []
        })) || undefined,
        sizes: form.category === 'Clothing' ? sizes : undefined,
        ramSizes: form.category === 'Mobile' ? ramSizes : undefined,
        romSizes: form.category === 'Mobile' ? romSizes : undefined,
        customOptions: customOptions.length > 0 ? customOptions : undefined
      });

      await refreshProducts();

      setSuccess('Product added successfully');
      setForm({
        name: '',
        description: '',
        price: '',
        discountPercent: '',
        category: 'Electronics',
        stock: '',
        image: '',
        images: [],
        video: '',
        variants: [],
        sizes: []
      });
      setVariants([]);
      setSizes([]);
      setSizeInput('');
      setRamSizes([]);
      setRamSizeInput('');
      setRomSizes([]);
      setRomSizeInput('');
      setCustomOptions([]);
      setCustomOptionInput('');
      setVariantImageFiles({});
      resetMediaSelection();
    } catch (err) {
      setError(err.response?.data?.message || 'Product add failed');
    } finally {
      setSubmitting(false);
    }
  };

  const uploadMediaFiles = async () => {
    if (imageFiles.length === 0 && !videoFile) {
      setError('Please choose image or video file to upload');
      return;
    }

    setUploading(true);
    setError('');
    setSuccess('');

    try {
      const res = await uploadSellerMedia(token, imageFiles, videoFile);
      setForm((prev) => ({
        ...prev,
        image: res.data.image || prev.image,
        images: res.data.images || prev.images,
        video: res.data.video || prev.video
      }));
      setSuccess('Media uploaded successfully');
    } catch (err) {
      setError(err.response?.data?.message || 'Media upload failed');
    } finally {
      setUploading(false);
    }
  };

  const uploadVariantMedia = async (variantId) => {
    if (!variantImageFiles[variantId] || variantImageFiles[variantId].length === 0) {
      setError('Please select images for this design');
      return;
    }

    setUploading(true);
    setError('');
    setSuccess('');

    try {
      const res = await uploadSellerMedia(token, variantImageFiles[variantId], null);
      
      setVariants(variants.map(v => 
        v.id === variantId 
          ? { ...v, images: res.data.images || [] }
          : v
      ));
      
      setSuccess(`Images uploaded for design`);
      handleVariantImageSelect(variantId, []);
    } catch (err) {
      setError(err.response?.data?.message || 'Variant image upload failed');
    } finally {
      setUploading(false);
    }
  };

  const removeProduct = async (productId) => {
    setError('');
    setSuccess('');
    setActionLoadingId(productId);

    try {
      await deleteSellerProduct(token, productId);
      await refreshProducts();
      setSuccess('Product deleted');
    } catch (err) {
      setError(err.response?.data?.message || 'Delete failed');
    } finally {
      setActionLoadingId('');
    }
  };

  const getOrderQrUrl = (order) => {
    const payload = encodeURIComponent(JSON.stringify({ orderId: order._id, status: order.status, total: order.sellerTotal }));
    return `https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${payload}`;
  };

  const acceptOrder = async (orderId) => {
    setError('');
    setSuccess('');
    setActionLoadingId(orderId);

    try {
      await updateSellerOrderStatus(token, orderId, 'processing');
      const orderRes = await getSellerOrders(token);
      setSellerOrders(orderRes.data || []);
      setSuccess('Order accepted and marked as processing');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update order status');
    } finally {
      setActionLoadingId('');
    }
  };

  const formatPaymentMethod = (method) => {
    if (method === 'credit_card') return 'Credit Card';
    if (method === 'debit_card') return 'Debit Card';
    return 'Cash On Delivery';
  };

  const printSellerBill = (order) => {
    const itemsHtml = order.items
      .map(
        (item) => `
          <tr>
            <td style="padding:8px;border:1px solid #ddd;">${item.productName}</td>
            <td style="padding:8px;border:1px solid #ddd;text-align:center;">${item.quantity}</td>
            <td style="padding:8px;border:1px solid #ddd;text-align:right;">Rs. ${item.price}</td>
            <td style="padding:8px;border:1px solid #ddd;text-align:right;">Rs. ${item.quantity * item.price}</td>
          </tr>
        `
      )
      .join('');

    const printWindow = window.open('', '_blank', 'width=900,height=700');
    if (!printWindow) {
      toast.warn('Please allow popups to print bill.');
      return;
    }

    printWindow.document.write(`
      <html>
        <head>
          <title>Seller Invoice ${order._id}</title>
        </head>
        <body style="font-family:Segoe UI,Arial,sans-serif;padding:24px;color:#222;">
          <h2 style="margin:0 0 8px;">Seller Invoice</h2>
          <p style="margin:0 0 4px;"><strong>Order ID:</strong> ${order._id}</p>
          <p style="margin:0 0 4px;"><strong>Date:</strong> ${new Date(order.createdAt).toLocaleString()}</p>
          <p style="margin:0 0 4px;"><strong>Buyer:</strong> ${order.customerName || order.user?.name || 'User'}</p>
          <p style="margin:0 0 4px;"><strong>Phone:</strong> ${order.customerPhone || order.user?.phone || ''}</p>
          <p style="margin:0 0 4px;"><strong>Email:</strong> ${order.customerEmail || order.user?.email || ''}</p>
          <p style="margin:0 0 16px;"><strong>Address:</strong> ${order.shippingAddress}</p>
          <div style="margin:0 0 16px;">
            <p style="margin:0 0 8px;"><strong>QR Code:</strong></p>
            <img src="${getOrderQrUrl(order)}" alt="Order QR Code" style="width:120px;height:120px;border:1px solid #ddd;padding:6px;border-radius:8px;" />
          </div>
          <table style="width:100%;border-collapse:collapse;margin-bottom:16px;">
            <thead>
              <tr style="background:#f5f5f5;">
                <th style="padding:8px;border:1px solid #ddd;text-align:left;">Product</th>
                <th style="padding:8px;border:1px solid #ddd;">Qty</th>
                <th style="padding:8px;border:1px solid #ddd;text-align:right;">Price</th>
                <th style="padding:8px;border:1px solid #ddd;text-align:right;">Total</th>
              </tr>
            </thead>
            <tbody>${itemsHtml}</tbody>
          </table>
          <p style="margin:0 0 6px;"><strong>Payment:</strong> ${formatPaymentMethod(order.paymentMethod)}</p>
          <h3 style="margin:0;">Seller Total: Rs. ${order.sellerTotal}</h3>
          <script>
            window.onload = function() {
              window.print();
              window.onafterprint = function() { window.close(); };
            }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  if (!panelData) return <div className="seller-dashboard"><p className="loading">Please refresh to load seller panel.</p></div>;

  const totalRevenue = sellerOrders.reduce((sum, order) => sum + (Number(order.sellerTotal) || 0), 0);
  const completedOrders = sellerOrders.filter(o => o.status === 'completed' || o.status === 'delivered').length;
  const pendingOrders = sellerOrders.filter(o => o.status === 'pending' || o.status === 'processing').length;

  return (
    <div className="seller-dashboard">
      <section className="seller-hero panel-page">
        <div className="seller-hero-copy-wrap">
          <p className="eyebrow">Seller Studio</p>
          <h2>Manage your store</h2>
          <p className="seller-hero-copy">
            View products, manage orders, and grow your business.
          </p>
        </div>

        <div className="seller-hero-stats">
          <div className="stat-pill">
            <span>Role</span>
            <strong>{panelData.role}</strong>
          </div>
          <div className="stat-pill">
            <span>Products</span>
            <strong>{stats.products}</strong>
          </div>
          <div className="stat-pill">
            <span>Orders</span>
            <strong>{stats.orders}</strong>
          </div>
          <div className="stat-pill">
            <span>Revenue</span>
            <strong>Rs. {totalRevenue}</strong>
          </div>
        </div>
        {tableLoading ? <p className="loading">Refreshing seller data...</p> : null}
      </section>

      <div className="seller-workspace">
        {activeTab === 'dashboard' && (
          <main className="seller-main-column">
            <section className="panel-page">
              <div className="section-head">
                <p className="section-kicker">Overview</p>
                <h3>Dashboard</h3>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
                <div style={{ padding: '1.5rem', border: '1px solid #e5e7eb', borderRadius: '8px', background: '#f9fafb' }}>
                  <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' }}>Total Products</p>
                  <h4 style={{ fontSize: '2rem', fontWeight: '700', color: '#1f2937' }}>{stats.products}</h4>
                </div>
                <div style={{ padding: '1.5rem', border: '1px solid #e5e7eb', borderRadius: '8px', background: '#f9fafb' }}>
                  <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' }}>Total Orders</p>
                  <h4 style={{ fontSize: '2rem', fontWeight: '700', color: '#1f2937' }}>{stats.orders}</h4>
                </div>
                <div style={{ padding: '1.5rem', border: '1px solid #e5e7eb', borderRadius: '8px', background: '#f9fafb' }}>
                  <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' }}>Completed</p>
                  <h4 style={{ fontSize: '2rem', fontWeight: '700', color: '#10b981' }}>{completedOrders}</h4>
                </div>
                <div style={{ padding: '1.5rem', border: '1px solid #e5e7eb', borderRadius: '8px', background: '#f9fafb' }}>
                  <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' }}>Pending</p>
                  <h4 style={{ fontSize: '2rem', fontWeight: '700', color: '#f59e0b' }}>{pendingOrders}</h4>
                </div>
                <div style={{ padding: '1.5rem', border: '1px solid #e5e7eb', borderRadius: '8px', background: '#f9fafb' }}>
                  <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' }}>Total Revenue</p>
                  <h4 style={{ fontSize: '2rem', fontWeight: '700', color: '#3b82f6' }}>Rs. {totalRevenue}</h4>
                </div>
              </div>
            </section>
          </main>
        )}

        {activeTab === 'my-products' && (
          <main className="seller-main-column">
            <section className="panel-page">
              <div className="section-head">
                <p className="section-kicker">Inventory</p>
                <h3>My Products</h3>
              </div>
              {myProducts.length === 0 ? (
                <p style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>No products added yet. <button type="button" onClick={() => setTab('add-products')} style={{ background: 'none', border: 'none', color: '#3b82f6', cursor: 'pointer', textDecoration: 'underline' }}>Create one now</button></p>
              ) : (
                <div className="seller-products-grid">
                  {myProducts.map((product) => (
                    <article className="seller-card" key={product._id}>
                      <div className="section-head compact">
                        <h4>{product.name}</h4>
                      </div>
                      {product.image ? <img src={product.image} alt={product.name} style={{ width: '100%', height: '200px', objectFit: 'cover', borderRadius: '6px', marginBottom: '1rem' }} /> : null}
                      <p><strong>Price:</strong> Rs. {product.price}</p>
                      {product.discountPercent ? <p><strong>Discount:</strong> {product.discountPercent}%</p> : null}
                      <p><strong>Stock:</strong> {product.stock}</p>
                      <p><strong>Category:</strong> {product.category}</p>
                      <p style={{ color: '#6b7280', fontSize: '0.875rem', marginTop: '0.5rem' }}>{product.description?.substring(0, 100)}...</p>
                      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                        <button type="button" onClick={() => removeProduct(product._id)} className="danger-btn" disabled={actionLoadingId === product._id}>
                          Delete
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>
          </main>
        )}

        {activeTab === 'add-products' && (
          <main className="seller-main-column">
          <section className="panel-page seller-product-form">
            <form onSubmit={onSubmit} className="product-form-grid">
              <div className="field-span-2">
                <label>Product name</label>
                <input
                  name="name"
                  placeholder="e.g., Cotton T-Shirt"
                  value={form.name}
                  onChange={onChange}
                  required
                />
              </div>

              <div className="field-span-2">
                <label>Description</label>
                <textarea
                  name="description"
                  placeholder="Write product details"
                  value={form.description}
                  onChange={onChange}
                  rows={4}
                  required
                />
              </div>

              <div>
                <label>Price (Rs.)</label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  name="price"
                  placeholder="999"
                  value={form.price}
                  onChange={onChange}
                  required
                />
              </div>

              <div>
                <label>Stock</label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  name="stock"
                  placeholder="10"
                  value={form.stock}
                  onChange={onChange}
                  required
                />
              </div>

              <div>
                <label>Discount (%)</label>
                <input
                  type="number"
                  min="0"
                  max="95"
                  step="1"
                  name="discountPercent"
                  placeholder="e.g., 3"
                  value={form.discountPercent}
                  onChange={onChange}
                />
                <p className="info-text" style={{ marginTop: '0.4rem' }}>
                  Final selling price: Rs. {formDiscountedPrice}
                  {formDiscountPercent > 0 ? ` (MRP Rs. ${formBasePrice})` : ''}
                </p>
              </div>

              <div>
                <label>Category</label>
                <select name="category" value={form.category} onChange={onChange}>
                  <option value="Electronics">Electronics</option>
                  <option value="Clothing">Clothing</option>
                  <option value="Mobile">Mobile</option>
                  <option value="Cosmetic">Cosmetic</option>
                  <option value="Novelty">Novelty</option>
                  <option value="Books">Books</option>
                  <option value="Home">Home</option>
                  <option value="Sports">Sports</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {form.category === 'Clothing' && (
                <div className="field-span-2 sizes-section">
                  <label>Available Sizes</label>
                  <div className="size-input-group">
                    <input
                      type="text"
                      placeholder="e.g., XS, S, M, L, XL, XXL"
                      value={sizeInput}
                      onChange={(e) => setSizeInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSize())}
                    />
                    <button type="button" className="ghost-btn" onClick={addSize}>
                      Add Size
                    </button>
                  </div>
                  <div className="size-chips">
                    {sizes.map((size) => (
                      <span key={size} className="size-chip">
                        {size}
                        <button type="button" onClick={() => removeSize(size)}>×</button>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {form.category === 'Mobile' && (
                <div className="field-span-2 sizes-section">
                  <label>Mobile Storage Options</label>
                  <div className="size-input-group" style={{ marginBottom: '0.75rem' }}>
                    <input
                      type="text"
                      placeholder="RAM: e.g., 4GB, 6GB, 8GB"
                      value={ramSizeInput}
                      onChange={(e) => setRamSizeInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addRamSize())}
                    />
                    <button type="button" className="ghost-btn" onClick={addRamSize}>
                      Add RAM
                    </button>
                  </div>
                  <div className="size-chips">
                    {ramSizes.map((ram) => (
                      <span key={ram} className="size-chip">
                        {ram}
                        <button type="button" onClick={() => removeRamSize(ram)}>×</button>
                      </span>
                    ))}
                  </div>

                  <div className="size-input-group" style={{ marginTop: '0.9rem' }}>
                    <input
                      type="text"
                      placeholder="ROM: e.g., 64GB, 128GB, 256GB"
                      value={romSizeInput}
                      onChange={(e) => setRomSizeInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addRomSize())}
                    />
                    <button type="button" className="ghost-btn" onClick={addRomSize}>
                      Add ROM
                    </button>
                  </div>
                  <div className="size-chips">
                    {romSizes.map((rom) => (
                      <span key={rom} className="size-chip">
                        {rom}
                        <button type="button" onClick={() => removeRomSize(rom)}>×</button>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="field-span-2 sizes-section">
                <label>Customizable Options (All Categories)</label>
                <div className="size-input-group">
                  <input
                    type="text"
                    placeholder="e.g., Color, Pattern, Packaging, Fragrance"
                    value={customOptionInput}
                    onChange={(e) => setCustomOptionInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomOption())}
                  />
                  <button type="button" className="ghost-btn" onClick={addCustomOption}>
                    Add Option
                  </button>
                </div>

                <div className="size-chips" style={{ marginTop: '0.6rem' }}>
                  {(categoryOptionPresets[form.category] || []).map((option) => (
                    <button
                      type="button"
                      key={`${form.category}-${option}`}
                      className="ghost-btn"
                      onClick={() => addCustomPreset(option)}
                      disabled={customOptions.includes(option)}
                    >
                      + {option}
                    </button>
                  ))}
                </div>

                <div className="size-chips">
                  {customOptions.map((option) => (
                    <span key={option} className="size-chip">
                      {option}
                      <button type="button" onClick={() => removeCustomOption(option)}>×</button>
                    </span>
                  ))}
                </div>
              </div>

              <div className="field-span-2 variants-section">
                <div className="variants-header">
                  <label>Design Variants</label>
                  <button type="button" className="ghost-btn" onClick={addVariant}>
                    + Add Design
                  </button>
                </div>
                {variants.length === 0 ? (
                  <p className="info-text">No variants added yet. Click "Add Design" to create product variations.</p>
                ) : (
                  <div className="variants-list">
                    {variants.map((variant) => (
                      <div key={variant.id} className="variant-card">
                        <div className="variant-header">
                          <input
                            type="text"
                            placeholder="e.g., Red, Blue, Large, etc."
                            value={variant.name}
                            onChange={(e) => updateVariantName(variant.id, e.target.value)}
                            className="variant-name-input"
                          />
                          <button type="button" className="danger-btn" onClick={() => removeVariant(variant.id)}>
                            Remove
                          </button>
                        </div>
                        <div className="variant-images">
                          <label>Images for this design (up to 5)</label>
                          <div className="thumb-strip">
                            {(variantImageFiles[variant.id] || []).map((file) => (
                              <div className="thumb-tile" key={file.name + file.lastModified}>
                                <span>{file.name}</span>
                              </div>
                            ))}
                            {(variant.images || []).map((img, idx) => (
                              <div className="thumb-tile uploaded" key={`uploaded-${idx}`} title="Already uploaded">
                                <span>✓</span>
                              </div>
                            ))}
                            <label className="thumb-tile add-tile" htmlFor={`variant-upload-${variant.id}`}>
                              +
                            </label>
                          </div>
                          <input
                            id={`variant-upload-${variant.id}`}
                            type="file"
                            multiple
                            accept="image/*"
                            onChange={(e) => handleVariantImageSelect(variant.id, e.target.files)}
                            className="hidden-file-input"
                          />
                          {variantImageFiles[variant.id] && variantImageFiles[variant.id].length > 0 && (
                            <button 
                              type="button" 
                              className="ghost-btn" 
                              onClick={() => uploadVariantMedia(variant.id)}
                              disabled={uploading}
                            >
                              {uploading ? 'Uploading...' : 'Upload Design Images'}
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="field-span-2">
                <div>
                  <label>Product images</label>
                  <div className="thumb-strip">
                    {imageFiles.map((file) => (
                      <div className="thumb-tile" key={file.name + file.lastModified}>
                        <span>{file.name}</span>
                      </div>
                    ))}
                    <label className="thumb-tile add-tile" htmlFor="seller-image-upload">
                      +
                    </label>
                  </div>
                  <input
                    id="seller-image-upload"
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={(e) => {
                      const files = Array.from(e.target.files || []).slice(0, 8);
                      setImageFiles(files);
                    }}
                    className="hidden-file-input"
                  />
                </div>
                <div>
                  <label>Upload video</label>
                  <input type="file" accept="video/*" onChange={(e) => setVideoFile(e.target.files?.[0] || null)} />
                </div>
                <button type="button" className="ghost-btn" onClick={uploadMediaFiles} disabled={uploading}>
                  {uploading ? 'Uploading Media...' : 'Upload Media'}
                </button>

              </div>

              <div>
                <label>Image URL</label>
                <input name="image" placeholder="Auto-filled after upload" value={form.image} onChange={onChange} />
              </div>

              <div>
                <label>Images count</label>
                <input value={form.images?.length || 0} readOnly />
              </div>

              <div className="field-span-2">
                <label>Video URL</label>
                <input name="video" placeholder="Auto-filled after upload" value={form.video} onChange={onChange} />
              </div>

              <div className="field-span-2 action-row">
                <button type="button" className="ghost-btn" onClick={resetMediaSelection}>
                  Clear media selection
                </button>
                <button type="submit" disabled={submitting} className="primary-btn">
                  {submitting ? 'Publishing...' : 'Publish Product'}
                </button>
              </div>
            </form>
          </section>
          </main>
        )}

        {activeTab === 'all-orders' && (
          <main className="seller-main-column">
          <section className="panel-page seller-list-wrap">
            <div className="section-head">
              <div>
                <p className="section-kicker">Orders</p>
                <h3>All orders on my products</h3>
              </div>
              <span className="count-chip">{sellerOrders.length}</span>
            </div>

            {sellerOrders.length === 0 ? <p>No orders received yet.</p> : null}

            {sellerOrders.length > 0 ? (
              <div className="seller-products-grid">
                {sellerOrders.map((order) => (
                  <article className="seller-card" key={order._id}>
                    <div className="section-head compact">
                      <h4>Order #{order._id.slice(-6)}</h4>
                      <span className="status-chip muted">{order.status}</span>
                    </div>
                    <p>Buyer: {order.customerName || order.user?.name || 'User'}</p>
                    <p>Phone: {order.customerPhone || order.user?.phone || '-'}</p>
                    <p>Email: {order.customerEmail || order.user?.email || '-'}</p>
                    <p>Address: {order.shippingAddress}</p>
                    <p>Payment: {formatPaymentMethod(order.paymentMethod)} ({order.paymentStatus})</p>
                    <p>Total For You: Rs. {order.sellerTotal}</p>
                    <div style={{ margin: '0.5rem 0' }}>
                      <img
                        src={getOrderQrUrl(order)}
                        alt="Order QR Code"
                        style={{ width: '96px', height: '96px', border: '1px solid #ddd', padding: '4px', borderRadius: '8px', background: '#fff' }}
                      />
                    </div>
                    <div className="order-items-list">
                      {order.items.map((item) => (
                        <p key={`${order._id}-${item.product}-${item.productName}`}>
                          {item.productName} x {item.quantity}
                        </p>
                      ))}
                    </div>
                    {order.status === 'pending' ? (
                      <button type="button" onClick={() => acceptOrder(order._id)} disabled={actionLoadingId === order._id}>
                        Accept Order
                      </button>
                    ) : null}
                    <button type="button" onClick={() => printSellerBill(order)}>
                      Print Bill
                    </button>
                  </article>
                ))}
              </div>
            ) : null}
          </section>
          </main>
        )}
      </div>

      <section className="seller-footer-note panel-page">
        <p>
          Manage your seller store efficiently with our streamlined dashboard.
        </p>
        <button type="button" onClick={() => window.location.assign('/seller/scan')} style={{ marginTop: '0.8rem' }}>
          Open QR Scanner
        </button>
      </section>
    </div>
  );
}

export default SellerPanel;
