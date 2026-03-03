import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { CartProvider } from './context/CartContext';
import { AuthProvider, useAuth } from './context/AuthContext';

import AnnouncementBar from './components/AnnouncementBar';
import Navbar from './components/Navbar';
import Footer from './components/Footer';

import Home from './pages/Home';
import Shop from './pages/Shop';
import { CollectionsPage, CollectionPage } from './pages/Collections';
import Product from './pages/Product';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import Contact from './pages/Contact';

import AdminLogin from './pages/admin/Login';
import { AdminLayout } from './pages/admin/Dashboard';
import DashboardHome from './pages/admin/Dashboard';
import AdminProducts from './pages/admin/Products';
import AdminCollections from './pages/admin/Collections';
import AdminOrders from './pages/admin/Orders';
import AdminDiscounts from './pages/admin/Discounts';

// Protect admin routes
function RequireAuth({ children }) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? children : <Navigate to="/admin" replace />;
}

// Public layout wrapper (announcement bar + navbar + footer)
function PublicLayout({ children }) {
  return (
    <>
      <AnnouncementBar />
      <Navbar />
      {/* pt-10 offsets the announcement bar (h-10); individual pages add pt-16/pt-20 for navbar (h-20) */}
      <div className="pt-10">
        {children}
      </div>
      <Footer />
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <Routes>
            {/* ── Public store routes ───────────────────────────────────── */}
            <Route path="/" element={<PublicLayout><Home /></PublicLayout>} />
            <Route path="/shop" element={<PublicLayout><Shop /></PublicLayout>} />
            <Route path="/collections" element={<PublicLayout><CollectionsPage /></PublicLayout>} />
            <Route path="/collections/:slug" element={<PublicLayout><CollectionPage /></PublicLayout>} />
            <Route path="/product/:id" element={<PublicLayout><Product /></PublicLayout>} />
            <Route path="/cart" element={<PublicLayout><Cart /></PublicLayout>} />
            <Route path="/checkout" element={<PublicLayout><Checkout /></PublicLayout>} />
            <Route path="/contact" element={<PublicLayout><Contact /></PublicLayout>} />

            {/* ── Admin routes ──────────────────────────────────────────── */}
            <Route path="/admin" element={<AdminLogin />} />
            <Route path="/admin" element={<RequireAuth><AdminLayout /></RequireAuth>}>
              <Route path="dashboard" element={<DashboardHome />} />
              <Route path="products" element={<AdminProducts />} />
              <Route path="collections" element={<AdminCollections />} />
              <Route path="orders" element={<AdminOrders />} />
              <Route path="discounts" element={<AdminDiscounts />} />
            </Route>

            {/* Catch-all */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
