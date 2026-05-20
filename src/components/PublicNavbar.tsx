import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import Logo from './ui/Logo';
import { useAuthStore } from '../stores/authStore';

export default function PublicNavbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Properties', path: '/properties' },
    { name: 'About Us', path: '/#about' },
    { name: 'Contact', path: '/contact' },
  ];

  const getPortalLabel = () => {
    if (!isAuthenticated || !user) return 'Client Portal';
    if (user.role === 'client') return 'My Client Portal';
    if (user.role === 'landlord') return 'My Landlord Portal';
    return 'Go to Dashboard';
  };

  return (
    <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${isScrolled ? 'bg-white shadow-nav py-3' : 'bg-transparent py-5'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center">
          <Link to="/">
            <Logo variant={isScrolled ? 'dark' : (location.pathname === '/' ? 'light' : 'dark')} size="md" />
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => {
              const isHash = link.path.startsWith('/#');
              const className = `text-sm font-semibold transition-colors ${
                isScrolled || location.pathname !== '/' ? 'text-text-primary hover:text-vedama-emerald' : 'text-white/90 hover:text-white'
              }`;

              if (isHash) {
                return (
                  <a 
                    key={link.name}
                    href={link.path}
                    className={className}
                  >
                    {link.name}
                  </a>
                );
              }

              return (
                <Link 
                  key={link.name}
                  to={link.path}
                  className={className}
                >
                  {link.name}
                </Link>
              );
            })}
            <Link to="/login" className={`px-5 py-2.5 rounded-button font-semibold text-sm transition-all ${
              isScrolled || location.pathname !== '/' 
                ? 'bg-vedama-emerald text-white hover:bg-vedama-emerald-light shadow-sm' 
                : 'bg-white text-vedama-emerald hover:bg-gray-100 shadow-md'
            }`}>
              {getPortalLabel()}
            </Link>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className={`${isScrolled || location.pathname !== '/' ? 'text-text-primary' : 'text-white'}`}
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden absolute top-full left-0 w-full bg-white shadow-lg border-t border-surface-border animate-slide-up">
          <div className="px-4 pt-2 pb-6 space-y-1">
            {navLinks.map((link) => {
              const isHash = link.path.startsWith('/#');
              const className = "block px-3 py-3 text-base font-medium text-text-primary hover:text-vedama-emerald hover:bg-surface-hover rounded-md";

              if (isHash) {
                return (
                  <a
                    key={link.name}
                    href={link.path}
                    className={className}
                  >
                    {link.name}
                  </a>
                );
              }

              return (
                <Link
                  key={link.name}
                  to={link.path}
                  className={className}
                >
                  {link.name}
                </Link>
              );
            })}
            <div className="pt-4 mt-2 border-t border-surface-border">
              <Link to="/login" className="block w-full text-center bg-vedama-emerald text-white px-4 py-3 rounded-button font-semibold">
                {getPortalLabel()}
              </Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
