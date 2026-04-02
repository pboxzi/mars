import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const Navigation = () => {
  const location = useLocation();
  
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-black/90 backdrop-blur-sm border-b border-zinc-800">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="text-2xl font-bold tracking-wider hover:opacity-80 transition-opacity">
            BRUNO MARS
          </Link>
          
          {/* Navigation Links */}
          <div className="flex items-center gap-8">
            <Link 
              to="/tour" 
              className={`text-sm tracking-wider hover:text-gray-300 transition-colors ${
                location.pathname === '/tour' ? 'text-white' : 'text-gray-400'
              }`}
            >
              Tour
            </Link>
            <a 
              href="https://shop.brunomars.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-sm tracking-wider text-gray-400 hover:text-gray-300 transition-colors"
            >
              Store
            </a>
            <Link 
              to="/music" 
              className={`text-sm tracking-wider hover:text-gray-300 transition-colors ${
                location.pathname === '/music' ? 'text-white' : 'text-gray-400'
              }`}
            >
              Music
            </Link>
            <Link 
              to="/booking-status" 
              className="text-sm tracking-wider text-gray-400 hover:text-gray-300 transition-colors"
            >
              Check Booking
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
