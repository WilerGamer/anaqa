import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useCart } from '../context/CartContext';

export default function Product() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addItem } = useCart();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState('');
  const [qty, setQty] = useState(1);
  const [toast, setToast] = useState('');
  const [toastType, setToastType] = useState('success');

  useEffect(() => {
    axios.get(`/api/products/${id}`)
      .then(r => {
        setProduct(r.data);
        const firstInStock = r.data.sizes?.find(s => s.quantity > 0);
        if (firstInStock) setSelectedSize(firstInStock.size);
        else if (r.data.sizes?.length > 0) setSelectedSize(r.data.sizes[0].size);
      })
      .catch(() => navigate('/shop'))
      .finally(() => setLoading(false));
  }, [id]);

  const images = product?.images || [];
  const totalImages = images.length;

  const prevImage = useCallback(() => setActiveImage(i => (i - 1 + totalImages) % totalImages), [totalImages]);
  const nextImage = useCallback(() => setActiveImage(i => (i + 1) % totalImages), [totalImages]);

  useEffect(() => {
    if (totalImages <= 1) return;
    const onKey = e => {
      if (e.key === 'ArrowLeft') prevImage();
      if (e.key === 'ArrowRight') nextImage();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [prevImage, nextImage, totalImages]);

  function showToast(msg, type = 'success') {
    setToast(msg); setToastType(type);
    setTimeout(() => setToast(''), 2500);
  }

  function handleAddToCart() {
    if (!selectedSize) return showToast('Please select a size', 'error');
    if (!inStock) return showToast('This size is out of stock', 'error');
    const result = addItem(product, selectedSize, qty);
    if (result === 'limit') return showToast('You have reached the stock limit available', 'error');
    showToast('Added to cart!');
  }

  function handleBuyNow() {
    if (!selectedSize) return showToast('Please select a size', 'error');
    if (!inStock) return showToast('This size is out of stock', 'error');
    const result = addItem(product, selectedSize, qty);
    if (result === 'limit') return showToast('You have reached the stock limit available', 'error');
    navigate('/cart');
  }

  if (loading) return (
    <div className="pt-20 min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-navy border-t-transparent rounded-full animate-spin" />
    </div>
  );
  if (!product) return null;

  const isOnSale = product.old_price && Number(product.old_price) > Number(product.price);
  const selectedSizeData = product.sizes?.find(s => s.size === selectedSize);
  const inStock = selectedSizeData ? selectedSizeData.quantity > 0 : false;

  return (
    <div className="page-enter pt-20">
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-10 py-8 md:py-12">

        {/* Breadcrumb */}
        <nav className="flex flex-wrap gap-1.5 text-xs font-sans text-navy/50 mb-8 tracking-wide">
          <Link to="/" className="hover:text-navy transition-colors">Home</Link>
          <span>/</span>
          <Link to="/shop" className="hover:text-navy transition-colors">Shop</Link>
          {product.collection_name && (
            <><span>/</span>
            <Link to={`/collections/${product.collection_slug}`} className="hover:text-navy transition-colors">
              {product.collection_name}
            </Link></>
          )}
          <span>/</span>
          <span className="text-navy truncate max-w-[160px]">{product.name}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-start">

          {/* ── LEFT: Carousel ─────────────────────────────────────────── */}
          <div className="space-y-3">

            {/* Main image */}
            <div className="relative aspect-[3/4] bg-cream-dark overflow-hidden group select-none">
              {images.length > 0 ? (
                <>
                  {images.map((img, i) => (
                    <img
                      key={img.id}
                      src={img.url}
                      alt={`${product.name} — view ${i + 1}`}
                      className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500
                        ${activeImage === i ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                    />
                  ))}

                  {isOnSale && (
                    <span className="absolute top-4 left-4 bg-navy text-cream text-[10px] tracking-widest uppercase font-sans px-2.5 py-1 z-10">
                      Sale
                    </span>
                  )}

                  {totalImages > 1 && (
                    <>
                      {/* Arrows */}
                      <button onClick={prevImage} aria-label="Previous"
                        className="absolute left-3 top-1/2 -translate-y-1/2 z-10 w-9 h-9 bg-white/80 hover:bg-white
                          flex items-center justify-center shadow-sm transition-all
                          opacity-100 md:opacity-0 md:group-hover:opacity-100">
                        <svg className="w-4 h-4 text-navy" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
                        </svg>
                      </button>
                      <button onClick={nextImage} aria-label="Next"
                        className="absolute right-3 top-1/2 -translate-y-1/2 z-10 w-9 h-9 bg-white/80 hover:bg-white
                          flex items-center justify-center shadow-sm transition-all
                          opacity-100 md:opacity-0 md:group-hover:opacity-100">
                        <svg className="w-4 h-4 text-navy" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                        </svg>
                      </button>

                      {/* Dot indicators */}
                      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
                        {images.map((_, i) => (
                          <button key={i} onClick={() => setActiveImage(i)} aria-label={`View ${i + 1}`}
                            className={`rounded-full transition-all duration-300 ${
                              activeImage === i ? 'w-5 h-1.5 bg-white' : 'w-1.5 h-1.5 bg-white/55 hover:bg-white/80'
                            }`}
                          />
                        ))}
                      </div>
                    </>
                  )}
                </>
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <svg className="w-16 h-16 text-beige" fill="none" stroke="currentColor" strokeWidth={1} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 18h16.5a1.5 1.5 0 0 0 1.5-1.5v-12A1.5 1.5 0 0 0 20.25 3H3.75A1.5 1.5 0 0 0 2.25 4.5v12A1.5 1.5 0 0 0 3.75 18Z" />
                  </svg>
                </div>
              )}
            </div>

            {/* Thumbnail strip */}
            {totalImages > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {images.map((img, i) => (
                  <button key={img.id} onClick={() => setActiveImage(i)}
                    className={`flex-shrink-0 w-16 h-20 sm:w-20 sm:h-24 overflow-hidden border-2 transition-all duration-200 ${
                      activeImage === i ? 'border-navy' : 'border-transparent opacity-55 hover:opacity-100'
                    }`}>
                    <img src={img.url} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ── RIGHT: Product Info ────────────────────────────────────── */}
          <div className="flex flex-col">

            {product.collection_name && (
              <Link to={`/collections/${product.collection_slug}`}
                className="font-sans text-xs tracking-[0.3em] uppercase text-beige hover:text-beige-dark transition-colors mb-2">
                {product.collection_name}
              </Link>
            )}

            <h1 className="font-serif text-3xl md:text-4xl text-navy font-medium leading-tight mb-4">
              {product.name}
            </h1>

            {/* Price */}
            <div className="flex items-center gap-3 mb-5">
              <span className="font-sans text-2xl font-semibold text-navy">
                ${Number(product.price).toFixed(2)}
              </span>
              {isOnSale && (
                <>
                  <span className="font-sans text-lg text-beige line-through">
                    ${Number(product.old_price).toFixed(2)}
                  </span>
                  <span className="bg-navy text-cream text-[10px] tracking-widest uppercase font-sans px-2 py-0.5">
                    Sale
                  </span>
                </>
              )}
            </div>

            {product.description && (
              <p className="font-sans text-sm text-navy/65 leading-relaxed mb-6">
                {product.description}
              </p>
            )}

            <div className="border-t border-cream-dark mb-6" />

            {/* Size selector */}
            {product.sizes?.length > 0 && (
              <div className="mb-6">
                <p className="font-sans text-xs tracking-widest uppercase text-navy font-medium mb-3">
                  Size {selectedSize && <span className="text-beige normal-case tracking-normal ml-1">— {selectedSize}</span>}
                </p>
                <div className="flex gap-2 flex-wrap">
                  {product.sizes.map(s => {
                    const outOfStock = s.quantity === 0;
                    const isSelected = selectedSize === s.size;
                    return (
                      <button key={s.size}
                        onClick={() => !outOfStock && setSelectedSize(s.size)}
                        disabled={outOfStock}
                        title={outOfStock ? 'Out of stock' : `${s.quantity} in stock`}
                        className={`relative w-12 h-12 text-sm font-sans font-medium transition-all duration-200 ${
                          isSelected
                            ? 'bg-navy text-cream border-2 border-navy'
                            : outOfStock
                              ? 'border border-cream-dark text-navy/25 cursor-not-allowed'
                              : 'border border-beige text-navy hover:border-navy cursor-pointer'
                        }`}>
                        {s.size}
                        {/* Strike-through line for out of stock */}
                        {outOfStock && (
                          <span className="absolute inset-0 pointer-events-none overflow-hidden">
                            <span className="absolute top-1/2 left-0 right-0 h-px bg-beige/60 rotate-[30deg] origin-center" />
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
                {selectedSizeData && (
                  <p className={`font-sans text-xs mt-2 ${inStock ? 'text-navy/40' : 'text-red-500 font-medium'}`}>
                    {inStock ? `${selectedSizeData.quantity} in stock` : 'Out of stock'}
                  </p>
                )}
              </div>
            )}

            {/* Quantity */}
            <div className="mb-7">
              <p className="font-sans text-xs tracking-widest uppercase text-navy font-medium mb-3">Quantity</p>
              <div className="flex items-center border border-beige w-fit">
                <button onClick={() => setQty(q => Math.max(1, q - 1))}
                  className="w-10 h-10 flex items-center justify-center hover:bg-cream-dark transition-colors text-navy text-xl leading-none select-none">
                  −
                </button>
                <span className="w-12 h-10 flex items-center justify-center font-sans text-sm text-navy border-x border-beige select-none">
                  {qty}
                </span>
                <button onClick={() => setQty(q => q + 1)}
                  className="w-10 h-10 flex items-center justify-center hover:bg-cream-dark transition-colors text-navy text-xl leading-none select-none">
                  +
                </button>
              </div>
            </div>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-3 mb-7">
              <button onClick={handleAddToCart} disabled={!inStock}
                className="btn-primary flex-1 text-center disabled:opacity-40 disabled:cursor-not-allowed">
                {inStock ? 'Add to Cart' : 'Out of Stock'}
              </button>
              <button onClick={handleBuyNow} disabled={!inStock}
                className="btn-outline flex-1 text-center disabled:opacity-40 disabled:cursor-not-allowed">
                Buy Now
              </button>
            </div>

            {/* Delivery perks */}
            <div className="border-t border-cream-dark pt-5 space-y-2.5">
              {[
                'Free delivery on all orders',
                'Cash on delivery available',
                'Easy returns within 14 days',
              ].map(text => (
                <div key={text} className="flex items-center gap-2.5">
                  <svg className="w-3.5 h-3.5 text-beige flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                  </svg>
                  <p className="font-sans text-xs text-navy/55">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 px-6 py-3 font-sans text-sm z-50 shadow-lg
          ${toastType === 'error' ? 'bg-red-600 text-white' : 'bg-navy text-cream'}`}>
          {toast}
        </div>
      )}
    </div>
  );
}
