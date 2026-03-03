import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-navy text-cream mt-20">
      <div className="max-w-screen-xl mx-auto px-6 lg:px-10 py-14">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">

          {/* Brand */}
          <div>
            <img src="/images/logo.png" alt="Anaqa" className="h-12 w-auto mb-4 brightness-0 invert" />
            <p className="font-sans text-sm text-cream/70 leading-relaxed max-w-xs">
              Luxury essentials crafted for those who appreciate timeless elegance and refined style.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-serif text-sm tracking-widest uppercase text-beige mb-4">Quick Links</h4>
            <ul className="space-y-2">
              {[['/', 'Home'], ['/shop', 'Shop'], ['/collections', 'Collections'], ['/contact', 'Contact']].map(([to, label]) => (
                <li key={to}>
                  <Link to={to} className="font-sans text-sm text-cream/70 hover:text-cream transition-colors">{label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-serif text-sm tracking-widest uppercase text-beige mb-4">Contact</h4>
            <ul className="space-y-2 font-sans text-sm text-cream/70">
              <li>contact@anaqa.com</li>
              <li>Luxury Boutique, Your City</li>
            </ul>
            <div className="flex gap-4 mt-5">
              {/* Instagram icon */}
              <a href="#" className="text-cream/50 hover:text-cream transition-colors" aria-label="Instagram">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/>
                </svg>
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-cream/10 mt-10 pt-6 text-center">
          <p className="font-sans text-xs text-cream/40 tracking-widest">
            © {new Date().getFullYear()} ANAQA. ALL RIGHTS RESERVED.
          </p>
        </div>
      </div>
    </footer>
  );
}
