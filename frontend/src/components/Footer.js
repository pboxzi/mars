import React from 'react';
import { Facebook, Twitter, Instagram, Youtube, Music } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-black border-t border-zinc-800 py-12" data-testid="footer">
      <div className="max-w-7xl mx-auto px-4">
        {/* Social Media Links */}
        <div className="flex justify-center gap-6 mb-8">
          <a 
            href="https://www.facebook.com/brunomars" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="hover:text-red-600 hover:scale-110 transition-all cursor-pointer"
          >
            <Facebook className="w-6 h-6" />
          </a>
          <a 
            href="https://twitter.com/BRUNOMARS" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="hover:text-red-600 hover:scale-110 transition-all cursor-pointer"
          >
            <Twitter className="w-6 h-6" />
          </a>
          <a 
            href="https://www.instagram.com/brunomars/" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="hover:text-red-600 hover:scale-110 transition-all cursor-pointer"
          >
            <Instagram className="w-6 h-6" />
          </a>
          <a 
            href="https://www.youtube.com/brunomars" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="hover:text-red-600 hover:scale-110 transition-all cursor-pointer"
          >
            <Youtube className="w-6 h-6" />
          </a>
          <a 
            href="https://open.spotify.com/artist/0du5cEVh5yTK9QJze8zA0C" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="hover:text-red-600 hover:scale-110 transition-all cursor-pointer"
          >
            <Music className="w-6 h-6" />
          </a>
        </div>

        {/* Copyright and Links */}
        <div className="text-center text-gray-400 text-sm">
          <p className="mb-4">© 2026 Atlantic Records</p>
          <div className="flex justify-center gap-6 flex-wrap">
            <a href="https://privacy.wmg.com/atlantic/privacy-policy" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors cursor-pointer">Privacy Policy</a>
            <a href="https://www.atlanticrecords.com/terms-of-use" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors cursor-pointer">Terms of Use</a>
            <a href="https://www.wminewmedia.com/cookies-policy/" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors cursor-pointer">Cookies Policy</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
