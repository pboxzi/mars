import React from 'react';
import { Link } from 'react-router-dom';
import { Menu, Search } from 'lucide-react';

const Navbar = () => {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-md border-b border-zinc-800" data-testid="navbar">
      <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
        <Link to="/" className="text-2xl font-bold" data-testid="logo">BRUNO MARS</Link>
        
        <div className="hidden md:flex items-center gap-8">
          <a href="#tour" className="hover:text-red-600 transition-colors">TOUR</a>
          <a href="#" className="hover:text-red-600 transition-colors">MUSIC</a>
          <a href="#" className="hover:text-red-600 transition-colors">STORE</a>
          <Link to="/booking-status" className="hover:text-red-600 transition-colors" data-testid="check-booking-link">CHECK BOOKING</Link>
        </div>
        
        <div className="flex items-center gap-4">
          <Search className="w-5 h-5 cursor-pointer hover:text-red-600 transition-colors" />
          <Menu className="w-6 h-6 md:hidden cursor-pointer" />
        </div>
      </div>
    </nav>
  );
};

export default Navbar;