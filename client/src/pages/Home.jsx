import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import ProductCard from '../components/ProductCard';

export default function Home() {
  const [collections, setCollections] = useState([]);
  const [latestProducts, setLatestProducts] = useState([]);

  useEffect(() => {
    axios.get('/api/collections').then(r => setCollections(r.data)).catch(() => {});
    axios.get('/api/products?limit=8').then(r => setLatestProducts(r.data)).catch(() => {});
  }, []);

  return (
    <div className="page-enter">

      {/* ── Hero ──────────────────────────────────────────────────────── */}
      <section className="relative h-screen min-h-[600px] flex items-center justify-center overflow-hidden">
        {/* Mobile hero (portrait editorial shot) */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat block md:hidden"
          style={{ backgroundImage: "url('/images/hero-mobile.jpg')" }}
        />
        {/* Desktop hero (landscape banner with baked-in text) */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat hidden md:block"
          style={{ backgroundImage: "url('/images/hero-banner.jpg')" }}
        />
        <div className="absolute inset-0 bg-navy/20" />
        {/* Shop Now button — positioned lower on desktop where the banner text ends */}
        <div className="relative z-10 flex flex-col items-center">
          <Link to="/shop" className="btn-primary bg-cream text-navy hover:bg-cream-dark inline-block mt-40 md:mt-80">
            Shop Now
          </Link>
        </div>
        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-cream/60 animate-bounce">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
          </svg>
        </div>
      </section>

      {/* ── Shop by Collection ─────────────────────────────────────────── */}
      <section className="max-w-screen-xl mx-auto px-6 lg:px-10 py-20">
        <div className="text-center mb-12">
          <p className="font-sans text-xs tracking-[0.35em] uppercase text-beige mb-2">Curated For You</p>
          <h2 className="section-title">Shop by Collection</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {collections.length > 0 ? collections.map(col => (
            <CollectionCard key={col.id} collection={col} />
          )) : (
            // Skeleton placeholders
            [1, 2, 3].map(i => (
              <div key={i} className="aspect-[3/4] bg-cream-dark animate-pulse" />
            ))
          )}
        </div>
      </section>

      {/* ── Latest Drops ──────────────────────────────────────────────── */}
      <section className="bg-navy py-20">
        <div className="max-w-screen-xl mx-auto px-6 lg:px-10">
          {/* Section header */}
          <div className="flex items-end justify-between mb-10">
            <div>
              <p className="font-sans text-xs tracking-[0.35em] uppercase text-beige mb-2">Just Arrived</p>
              <h2 className="font-serif text-3xl md:text-4xl text-cream font-medium">Latest Drops</h2>
            </div>
            <Link to="/shop" className="font-sans text-xs tracking-widest uppercase text-beige hover:text-cream transition-colors">
              View All →
            </Link>
          </div>

          {latestProducts.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {latestProducts.map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <p className="font-serif text-xl text-cream/50 italic">New arrivals coming soon</p>
            </div>
          )}
        </div>
      </section>

      {/* ── Brand Promise ─────────────────────────────────────────────── */}
      <section className="max-w-screen-xl mx-auto px-6 lg:px-10 py-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 text-center">
          {[
            { icon: '✦', title: 'Premium Quality', desc: 'Every piece crafted from the finest materials.' },
            { icon: '◈', title: 'Free Delivery', desc: 'Complimentary shipping on all orders.' },
            { icon: '◇', title: 'Easy Returns', desc: 'Hassle-free returns within 14 days.' },
          ].map(item => (
            <div key={item.title} className="px-4">
              <span className="block text-beige text-2xl mb-4">{item.icon}</span>
              <h3 className="font-serif text-lg text-navy mb-2">{item.title}</h3>
              <p className="font-sans text-sm text-navy/60">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

    </div>
  );
}

function CollectionCard({ collection }) {
  return (
    <Link to={`/collections/${collection.slug}`} className="group relative overflow-hidden aspect-[3/4] block bg-cream-dark">
      {collection.image ? (
        <img
          src={collection.image}
          alt={collection.name}
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-cream-dark to-beige/30 flex items-center justify-center">
          <span className="font-sans text-xs tracking-widest uppercase text-beige">No Image</span>
        </div>
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-navy/70 via-navy/20 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 p-6">
        <h3 className="font-serif text-xl text-cream font-medium">{collection.name}</h3>
        <p className="font-sans text-xs tracking-widest uppercase text-cream/70 mt-1">
          {collection.product_count} {collection.product_count === 1 ? 'piece' : 'pieces'}
        </p>
        <span className="inline-block mt-3 font-sans text-xs tracking-widest uppercase text-cream border-b border-cream/50 pb-0.5">
          Explore →
        </span>
      </div>
    </Link>
  );
}
