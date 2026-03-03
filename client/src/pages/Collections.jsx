import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import axios from 'axios';
import ProductCard from '../components/ProductCard';

// /collections — list all collections
export function CollectionsPage() {
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get('/api/collections').then(r => setCollections(r.data)).finally(() => setLoading(false));
  }, []);

  return (
    <div className="page-enter pt-20">
      <div className="bg-cream-dark py-12 text-center">
        <p className="font-sans text-xs tracking-[0.35em] uppercase text-beige mb-2">Browse</p>
        <h1 className="section-title">Collections</h1>
      </div>
      <div className="max-w-screen-xl mx-auto px-6 lg:px-10 py-14">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1,2,3].map(i => <div key={i} className="aspect-[3/4] bg-cream-dark animate-pulse" />)}
          </div>
        ) : collections.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {collections.map(col => (
              <Link key={col.id} to={`/collections/${col.slug}`} className="group relative overflow-hidden aspect-[3/4] block bg-cream-dark">
                {col.image ? (
                  <img src={col.image} alt={col.name} className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-cream-dark to-beige/30" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-navy/70 via-navy/20 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <h3 className="font-serif text-xl text-cream">{col.name}</h3>
                  <p className="font-sans text-xs tracking-widest uppercase text-cream/70 mt-1">{col.product_count} pieces</p>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-24">
            <p className="font-serif text-2xl text-navy/40 italic">No collections yet</p>
          </div>
        )}
      </div>
    </div>
  );
}

// /collections/:slug — single collection
export function CollectionPage() {
  const { slug } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    axios.get(`/api/collections/${slug}`)
      .then(r => setData(r.data))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) return <div className="pt-20 min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-2 border-navy border-t-transparent rounded-full animate-spin" /></div>;
  if (error) return <div className="pt-20 min-h-screen flex items-center justify-center"><p className="font-serif text-2xl text-navy/40 italic">Collection not found</p></div>;

  return (
    <div className="page-enter pt-20">
      {/* Hero */}
      <div className="relative h-64 md:h-80 bg-cream-dark flex items-end">
        {data.image && <img src={data.image} alt={data.name} className="absolute inset-0 w-full h-full object-cover" />}
        <div className="absolute inset-0 bg-gradient-to-t from-navy/60 to-transparent" />
        <div className="relative z-10 p-8 md:p-12">
          <h1 className="font-serif text-4xl md:text-5xl text-cream font-medium">{data.name}</h1>
          <p className="font-sans text-xs tracking-widest uppercase text-cream/70 mt-2">{data.products?.length || 0} pieces</p>
        </div>
      </div>

      <div className="max-w-screen-xl mx-auto px-6 lg:px-10 py-12">
        {data.products?.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            {data.products.map(p => <ProductCard key={p.id} product={p} />)}
          </div>
        ) : (
          <div className="text-center py-24">
            <p className="font-serif text-2xl text-navy/40 italic">No products in this collection yet</p>
          </div>
        )}
      </div>
    </div>
  );
}
