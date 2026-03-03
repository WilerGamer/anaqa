import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import ProductCard from '../components/ProductCard';

export default function Shop() {
  const [products, setProducts] = useState([]);
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();

  const activeCollection = searchParams.get('collection') || '';
  const searchQuery = searchParams.get('search') || '';

  useEffect(() => {
    axios.get('/api/collections').then(r => setCollections(r.data)).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (activeCollection) params.set('collection', activeCollection);
    if (searchQuery) params.set('search', searchQuery);
    axios.get(`/api/products?${params}`)
      .then(r => setProducts(r.data))
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, [activeCollection, searchQuery]);

  function setCollection(slug) {
    const p = new URLSearchParams(searchParams);
    if (slug) p.set('collection', slug); else p.delete('collection');
    p.delete('search');
    setSearchParams(p);
  }

  return (
    <div className="page-enter pt-20">
      {/* Header */}
      <div className="bg-cream-dark py-12 text-center">
        <p className="font-sans text-xs tracking-[0.35em] uppercase text-beige mb-2">Discover</p>
        <h1 className="section-title">
          {searchQuery ? `Results for "${searchQuery}"` : activeCollection ? collections.find(c => c.slug === activeCollection)?.name || 'Collection' : 'All Products'}
        </h1>
      </div>

      <div className="max-w-screen-xl mx-auto px-6 lg:px-10 py-10">
        {/* Filter tabs */}
        <div className="flex flex-wrap gap-2 mb-8">
          <button
            onClick={() => setCollection('')}
            className={`px-5 py-2 text-xs font-sans tracking-widest uppercase transition-all ${
              !activeCollection ? 'bg-navy text-cream' : 'border border-beige text-navy hover:border-navy'
            }`}
          >
            All
          </button>
          {collections.map(col => (
            <button
              key={col.id}
              onClick={() => setCollection(col.slug)}
              className={`px-5 py-2 text-xs font-sans tracking-widest uppercase transition-all ${
                activeCollection === col.slug ? 'bg-navy text-cream' : 'border border-beige text-navy hover:border-navy'
              }`}
            >
              {col.name}
            </button>
          ))}
        </div>

        {/* Results count */}
        <p className="font-sans text-xs text-navy/50 mb-6 tracking-wide">
          {loading ? 'Loading...' : `${products.length} ${products.length === 1 ? 'product' : 'products'}`}
        </p>

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            {Array(8).fill(0).map((_, i) => (
              <div key={i} className="aspect-[3/4] bg-cream-dark animate-pulse" />
            ))}
          </div>
        ) : products.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            {products.map(p => <ProductCard key={p.id} product={p} />)}
          </div>
        ) : (
          <div className="text-center py-24">
            <p className="font-serif text-2xl text-navy/40 italic mb-3">No products found</p>
            <p className="font-sans text-sm text-navy/40">Check back soon for new arrivals.</p>
          </div>
        )}
      </div>
    </div>
  );
}
