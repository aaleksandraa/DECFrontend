import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  Bars3Icon, 
  XMarkIcon,
  ScissorsIcon,
  UserCircleIcon,
  ArrowRightOnRectangleIcon
} from '@heroicons/react/24/outline';

export const PublicNavbar: React.FC = () => {
  const location = useLocation();
  const { user } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const navLinks = [
    { path: '/', label: 'Početna' },
    { path: '/pretraga', label: 'Pretraga salona' },
    { path: '/o-nama', label: 'O nama' },
    { path: '/kontakt', label: 'Kontakt' },
  ];

  // Determine dashboard link based on user role
  const getDashboardLink = () => {
    if (!user) return null;
    
    switch (user.role) {
      case 'admin':
        return '/admin';
      case 'salon':
        return '/salon';
      case 'frizer':
        return '/frizer';
      case 'klijent':
        return '/client';
      default:
        return '/';
    }
  };

  return (
    <nav className="bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center group">
              <div className="bg-gradient-to-r from-orange-500 to-red-500 p-2 rounded-lg hover:from-orange-600 hover:to-red-600 transition-all">
                <ScissorsIcon className="w-6 h-6 text-white" />
              </div>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive(link.path)
                    ? 'bg-orange-50 text-orange-600'
                    : 'text-gray-600 hover:text-orange-600 hover:bg-orange-50'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Desktop Auth Buttons */}
          <div className="hidden md:flex items-center space-x-3">
            {user ? (
              <>
                <Link
                  to={getDashboardLink() || '/'}
                  className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-orange-600 transition-colors"
                >
                  <UserCircleIcon className="w-5 h-5" />
                  <span className="text-sm font-medium">{user.name}</span>
                </Link>
                <Link
                  to={getDashboardLink() || '/'}
                  className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  Moj Panel
                </Link>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="flex items-center gap-1 px-4 py-2 text-gray-600 hover:text-orange-600 transition-colors text-sm font-medium"
                >
                  <ArrowRightOnRectangleIcon className="w-5 h-5" />
                  Prijavi se
                </Link>
                <Link
                  to="/register"
                  className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  Registruj se
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-gray-600 hover:text-orange-600 hover:bg-orange-50 transition-colors"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <XMarkIcon className="w-6 h-6" />
              ) : (
                <Bars3Icon className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t bg-white">
          <div className="px-4 py-3 space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-4 py-3 rounded-lg text-base font-medium transition-colors ${
                  isActive(link.path)
                    ? 'bg-orange-50 text-orange-600'
                    : 'text-gray-600 hover:text-orange-600 hover:bg-orange-50'
                }`}
              >
                {link.label}
              </Link>
            ))}
            
            <div className="border-t my-3 pt-3">
              {user ? (
                <>
                  <div className="px-4 py-2 text-sm text-gray-500">
                    Prijavljeni kao: <span className="font-medium text-gray-900">{user.name}</span>
                  </div>
                  <Link
                    to={getDashboardLink() || '/'}
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-4 py-3 bg-orange-600 text-white rounded-lg text-center font-medium mt-2"
                  >
                    Moj Panel
                  </Link>
                </>
              ) : (
                <div className="space-y-2">
                  <Link
                    to="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-lg text-center font-medium border border-gray-200"
                  >
                    Prijavi se
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-4 py-3 bg-orange-600 text-white rounded-lg text-center font-medium"
                  >
                    Registruj se
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default PublicNavbar;
