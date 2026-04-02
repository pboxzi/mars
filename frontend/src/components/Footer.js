import React from 'react';
import { Facebook, Twitter, Instagram, Youtube, Music } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-black border-t border-zinc-800 py-12" data-testid="footer">
      <div className="max-w-7xl mx-auto px-4">
        {/* Social Media Links */}
        <div className="flex justify-center gap-6 mb-8">
          <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="hover:text-red-600 transition-colors">
            <Facebook className="w-6 h-6" />
          </a>
          <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="hover:text-red-600 transition-colors">
            <Twitter className="w-6 h-6" />
          </a>
          <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="hover:text-red-600 transition-colors">
            <Instagram className="w-6 h-6" />
          </a>
          <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" className="hover:text-red-600 transition-colors">
            <Youtube className="w-6 h-6" />
          </a>
          <a href="https://spotify.com" target="_blank" rel="noopener noreferrer" className="hover:text-red-600 transition-colors">
            <Music className="w-6 h-6" />
          </a>
        </div>

        {/* Copyright and Links */}
        <div className="text-center text-gray-400 text-sm">
          <p className="mb-4">© 2026 Atlantic Records</p>
          <div className="flex justify-center gap-6 flex-wrap">
            <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-white transition-colors">Terms of Use</a>
            <a href="#" className="hover:text-white transition-colors">Cookies Policy</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;