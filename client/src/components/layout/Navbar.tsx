import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Sparkles, User as UserIcon, LogOut, Menu, X, FileText } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { Button } from '../common/Button';
import { Dropdown } from '../common/Dropdown';

export const Navbar: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuthStore();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const userMenuItems = [
    {
      label: 'Dashboard',
      icon: <FileText className="w-4 h-4" />,
      onClick: () => navigate('/dashboard'),
    },
    {
      label: 'Sign Out',
      icon: <LogOut className="w-4 h-4" />,
      danger: true,
      onClick: handleLogout,
    },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 font-bold text-xl text-charcoal tracking-tight">
            <span className="w-9 h-9 rounded-xl bg-primary text-white flex items-center justify-center shadow-xs">
              <Sparkles className="w-5 h-5" />
            </span>
            <span className="flex items-center">
              Resum<span className="text-primary">AI</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            <Link
              to="/#features"
              className="text-sm font-medium text-charcoal-light hover:text-charcoal transition-colors"
            >
              Features
            </Link>
            <Link
              to="/#templates"
              className="text-sm font-medium text-charcoal-light hover:text-charcoal transition-colors"
            >
              Templates
            </Link>
            <Link
              to="/#how-it-works"
              className="text-sm font-medium text-charcoal-light hover:text-charcoal transition-colors"
            >
              How It Works
            </Link>
            {isAuthenticated && (
              <Link
                to="/dashboard"
                className="text-sm font-semibold text-primary hover:text-primary-dark transition-colors"
              >
                My Resumes
              </Link>
            )}
          </nav>

          {/* Desktop Right Side CTA / Profile */}
          <div className="hidden md:flex items-center gap-3">
            {isAuthenticated && user ? (
              <Dropdown
                trigger={
                  <button className="flex items-center gap-2.5 pl-3 pr-3.5 py-1.5 rounded-full border border-gray-200 bg-gray-50/70 hover:bg-gray-100 transition-colors text-charcoal cursor-pointer">
                    <span className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-semibold">
                      {user.firstName?.[0]?.toUpperCase() || <UserIcon className="w-4 h-4" />}
                    </span>
                    <span className="text-sm font-medium">
                      {user.firstName}
                    </span>
                  </button>
                }
                items={userMenuItems}
              />
            ) : (
              <>
                <Link to="/login">
                  <Button variant="ghost" size="sm">
                    Sign In
                  </Button>
                </Link>
                <Link to="/register">
                  <Button variant="primary" size="sm">
                    Get Started Free
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex md:hidden items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-charcoal-light hover:text-charcoal hover:bg-gray-100"
              aria-label="Toggle Menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-gray-200 bg-white px-4 pt-3 pb-6 space-y-3">
          <Link
            to="/#features"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-md text-base font-medium text-charcoal hover:bg-gray-50"
          >
            Features
          </Link>
          <Link
            to="/#templates"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-md text-base font-medium text-charcoal hover:bg-gray-50"
          >
            Templates
          </Link>
          <Link
            to="/#how-it-works"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-md text-base font-medium text-charcoal hover:bg-gray-50"
          >
            How It Works
          </Link>
          {isAuthenticated ? (
            <>
              <Link
                to="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-md text-base font-medium text-primary hover:bg-orange-50"
              >
                Dashboard
              </Link>
              <button
                onClick={() => {
                  handleLogout();
                  setMobileMenuOpen(false);
                }}
                className="w-full text-left px-3 py-2 rounded-md text-base font-medium text-red-600 hover:bg-red-50"
              >
                Sign Out
              </button>
            </>
          ) : (
            <div className="pt-4 flex flex-col gap-2">
              <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
                <Button variant="outline" className="w-full">
                  Sign In
                </Button>
              </Link>
              <Link to="/register" onClick={() => setMobileMenuOpen(false)}>
                <Button variant="primary" className="w-full">
                  Get Started Free
                </Button>
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
};
