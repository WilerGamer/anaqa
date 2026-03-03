import { useState, useEffect } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';

export default function Navbar() {
  const { count } = useCart();
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  function handleSearch(e) {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/shop?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
      setSearchQuery('');
    }
  }

  const navLinkClass = ({ isActive }) =>
    `font-sans text-xs tracking-widest uppercase transition-colors duration-200 ${
      isActive ? 'text-beige' : 'text-navy hover:text-beige-dark'
    }`;

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      scrolled ? 'bg-cream/95 backdrop-blur-sm shadow-sm' : 'bg-cream'
    }`}>
      {/* Main Nav */}
      <div className="max-w-screen-xl mx-auto px-6 lg:px-10 h-20 flex items-center justify-between">

        {/* Left — nav links (desktop) */}
        <nav className="hidden md:flex items-center gap-8">
          <NavLink to="/" className={navLinkClass}>Home</NavLink>
          <NavLink to="/shop" className={navLinkClass}>Shop</NavLink>
          <NavLink to="/collections" className={navLinkClass}>Collections</NavLink>
          <NavLink to="/contact" className={navLinkClass}>Contact</NavLink>
        </nav>

        {/* Center — Logo */}
        <Link to="/" className="absolute left-1/2 -translate-x-1/2">
          <img src="/images/logo.png" alt="Anaqa" className="h-16 w-auto" />
        </Link>

        {/* Right — icons */}
        <div className="flex items-center gap-5 ml-auto">
          {/* Search */}
          <button onClick={() => setSearchOpen(v => !v)} className="text-navy hover:text-beige-dark transition-colors" aria-label="Search">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
            </svg>
          </button>

          {/* Cart */}
          <Link to="/cart" className="relative text-navy hover:text-beige-dark transition-colors" aria-label="Cart">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" />
            </svg>
            {count > 0 && (
              <span className="absolute -top-2 -right-2 bg-navy text-cream text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-sans font-medium">
                {count}
              </span>
            )}
          </Link>

          {/* Mobile menu button */}
          <button onClick={() => setMenuOpen(v => !v)} className="md:hidden text-navy" aria-label="Menu">
            {menuOpen ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Search bar */}
      {searchOpen && (
        <div className="border-t border-cream-dark bg-cream px-6 py-3">
          <form onSubmit={handleSearch} className="max-w-lg mx-auto flex gap-2">
            <input
              autoFocus
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search products..."
              className="input-field flex-1"
            />
            <button type="submit" className="btn-primary px-5">Search</button>
          </form>
        </div>
      )}

      {/* Mobile menu */}
      {menuOpen && (
        <nav className="md:hidden border-t border-cream-dark bg-cream px-6 py-4 flex flex-col gap-4">
          {[['/', 'Home'], ['/shop', 'Shop'], ['/collections', 'Collections'], ['/contact', 'Contact']].map(([to, label]) => (
            <NavLink key={to} to={to} onClick={() => setMenuOpen(false)}
              className={({ isActive }) => `font-sans text-xs tracking-widest uppercase ${isActive ? 'text-beige' : 'text-navy'}`}>
              {label}
            </NavLink>
          ))}
        </nav>
      )}
    </header>
  );
}
