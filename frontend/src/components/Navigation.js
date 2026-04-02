import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';

const Navigation = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();

  return (
    <>
      {/* Fixed Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="text-3xl font-black tracking-tight">
            BRUNO MARS
          </Link>
          
          {/* Menu Icon */}
          <button 
            onClick={() => setIsMenuOpen(true)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Open menu"
          >
            <Menu className="w-7 h-7 text-black" />
          </button>
        </div>
      </header>

      {/* Full Screen Menu Overlay */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-[100] bg-white">
          {/* Close Button */}
          <button 
            onClick={() => setIsMenuOpen(false)}
            className="absolute top-6 right-6 p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Close menu"
          >
            <X className="w-7 h-7 text-black" />
          </button>

          {/* Menu Items */}
          <nav className="h-full flex flex-col items-center justify-center gap-8">
            <Link 
              to="/tour" 
              onClick={() => setIsMenuOpen(false)}
              className="text-4xl md:text-5xl font-bold tracking-tight hover:text-gray-600 transition-colors"
            >
              TOUR
            </Link>
            <a 
              href="https://shop.brunomars.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-4xl md:text-5xl font-bold tracking-tight hover:text-gray-600 transition-colors"
            >
              STORE
            </a>
            <Link 
              to="/music" 
              onClick={() => setIsMenuOpen(false)}
              className="text-4xl md:text-5xl font-bold tracking-tight hover:text-gray-600 transition-colors"
            >
              MUSIC
            </Link>
            <Link 
              to="/booking-status" 
              onClick={() => setIsMenuOpen(false)}
              className="text-4xl md:text-5xl font-bold tracking-tight hover:text-gray-600 transition-colors"
            >
              SUBSCRIBE
            </Link>
          </nav>
        </div>
      )}
    </>
  );
};

export default Navigation;
