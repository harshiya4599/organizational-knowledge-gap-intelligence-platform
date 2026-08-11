import { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import Footer from './Footer';
import ErrorBoundary from '../common/ErrorBoundary';

/**
 * DashboardLayout
 * Shell that wraps every protected page with sticky Navbar, collapsible Sidebar, ErrorBoundary, and Footer.
 */
export default function DashboardLayout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  // Auto-close mobile drawer when switching routes
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <Navbar onToggleMobileMenu={() => setMobileMenuOpen((prev) => !prev)} />

      <div className="flex flex-1 overflow-hidden relative">
        <Sidebar
          mobileOpen={mobileMenuOpen}
          onCloseMobile={() => setMobileMenuOpen(false)}
        />
        <main className="flex-1 overflow-y-auto bg-slate-50">
          <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-6 sm:py-7">
            <ErrorBoundary key={location.pathname}>
              <Outlet />
            </ErrorBoundary>
          </div>
        </main>
      </div>

      <Footer />
    </div>
  );
}
