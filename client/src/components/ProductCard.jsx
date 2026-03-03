import { Link } from 'react-router-dom';

export default function ProductCard({ product }) {
  const image = product.primary_image || (product.images && product.images[0]?.url);
  const isOnSale = product.old_price && product.old_price > product.price;

  return (
    <Link to={`/product/${product.id}`} className="product-card block">
      {/* Image */}
      <div className="relative overflow-hidden aspect-[3/4] bg-cream-dark">
        {image ? (
          <img
            src={image}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <svg className="w-12 h-12 text-beige" fill="none" stroke="currentColor" strokeWidth={1} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 18h16.5a1.5 1.5 0 0 0 1.5-1.5v-12a1.5 1.5 0 0 0-1.5-1.5H3.75a1.5 1.5 0 0 0-1.5 1.5v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V7.5Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
            </svg>
          </div>
        )}
        {isOnSale && (
          <span className="absolute top-3 left-3 bg-navy text-cream text-[10px] tracking-widest uppercase font-sans px-2 py-1">
            Sale
          </span>
        )}
      </div>

      {/* Info */}
      <div className="p-4">
        <h3 className="font-serif text-base text-navy group-hover:text-beige-dark transition-colors line-clamp-1">
          {product.name}
        </h3>
        <div className="flex items-center gap-2 mt-1">
          <span className="font-sans text-sm font-medium text-navy">
            ${Number(product.price).toFixed(2)}
          </span>
          {isOnSale && (
            <span className="font-sans text-xs text-beige line-through">
              ${Number(product.old_price).toFixed(2)}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
