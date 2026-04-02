import React from 'react';
import { Link } from 'react-router-dom';

const Navbar = () => {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-transparent" data-testid="navbar">
      <div className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
        <Link to="/" className="text-sm font-bold tracking-widest hover:opacity-80 transition-opacity" data-testid="logo">
          BRUNO MARS
        </Link>
        
        <div className="flex items-center gap-8 text-sm tracking-wide">
          <Link to="/booking-status" className="hover:opacity-80 transition-opacity" data-testid="check-booking-link">
            CHECK BOOKING
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;