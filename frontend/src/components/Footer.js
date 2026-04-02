import React from 'react';
import { Facebook, Twitter, Instagram, Youtube, Music, Cloud } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-black border-t border-zinc-800 py-12" data-testid="footer">
      <div className="max-w-7xl mx-auto px-4">
        {/* Social Media Links */}
        <div className="flex justify-center gap-6 mb-8 flex-wrap">
          <a 
            href="https://www.facebook.com/brunomars" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="hover:text-red-600 hover:scale-110 transition-all cursor-pointer"
            aria-label="Facebook"
          >
            <Facebook className="w-6 h-6" />
          </a>
          <a 
            href="https://twitter.com/BRUNOMARS" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="hover:text-red-600 hover:scale-110 transition-all cursor-pointer"
            aria-label="X (Twitter)"
          >
            <Twitter className="w-6 h-6" />
          </a>
          <a 
            href="https://www.instagram.com/brunomars/" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="hover:text-red-600 hover:scale-110 transition-all cursor-pointer"
            aria-label="Instagram"
          >
            <Instagram className="w-6 h-6" />
          </a>
          <a 
            href="https://www.youtube.com/brunomars" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="hover:text-red-600 hover:scale-110 transition-all cursor-pointer"
            aria-label="YouTube"
          >
            <Youtube className="w-6 h-6" />
          </a>
          <a 
            href="https://open.spotify.com/artist/0du5cEVh5yTK9QJze8zA0C" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="hover:text-red-600 hover:scale-110 transition-all cursor-pointer"
            aria-label="Spotify"
          >
            <Music className="w-6 h-6" />
          </a>
          <a 
            href="https://music.apple.com/us/artist/bruno-mars/278873078" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="hover:text-red-600 hover:scale-110 transition-all cursor-pointer"
            aria-label="Apple Music"
          >
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M23.997 6.124a9.23 9.23 0 0 0-.24-2.19c-.317-1.31-1.062-2.31-2.18-3.043a5.022 5.022 0 0 0-1.877-.726 10.496 10.496 0 0 0-1.564-.15c-.04-.003-.083-.01-.124-.013H5.988c-.152.01-.303.017-.455.026-.747.043-1.49.123-2.193.37-1.312.46-2.315 1.234-3.05 2.41-.33.53-.525 1.118-.663 1.737-.034.145-.06.29-.085.436-.024.14-.044.28-.06.418-.043.385-.063.773-.064 1.16V17.473c0 .14.01.28.017.42.024.515.05 1.03.15 1.535.198 1.012.596 1.926 1.32 2.674.89.92 1.97 1.442 3.22 1.638.347.055.696.085 1.046.105.16.01.32.014.48.014h12.024c.15 0 .3-.003.45-.01.48-.02.96-.05 1.43-.134 1.41-.25 2.55-.83 3.43-1.95.6-.76.98-1.64 1.18-2.61.11-.55.14-1.11.15-1.67.01-.15.01-.3.01-.45V6.124zm-3.12 11.323c-.01.43-.05.86-.13 1.28-.14.75-.49 1.38-1.09 1.86-.62.49-1.35.67-2.14.67H6.508c-.82 0-1.55-.18-2.18-.7-.56-.46-.88-1.06-1.02-1.77-.08-.42-.12-.85-.13-1.28V6.488c0-.85.18-1.58.7-2.18.46-.56 1.06-.88 1.77-1.02.42-.08.85-.12 1.28-.13h11.009c.85 0 1.58.18 2.18.7.56.46.88 1.06 1.02 1.77.08.42.12.85.13 1.28v11.009z"/>
            </svg>
          </a>
          <a 
            href="https://soundcloud.com/brunomars" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="hover:text-red-600 hover:scale-110 transition-all cursor-pointer"
            aria-label="SoundCloud"
          >
            <Cloud className="w-6 h-6" />
          </a>
        </div>

        {/* Copyright and Links */}
        <div className="text-center text-gray-400 text-sm">
          <p className="mb-4">
            © 2026 Atlantic records | <a href="https://privacy.wmg.com/atlantic/privacy-policy" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Privacy Policy</a> | <a href="https://www.atlanticrecords.com/terms-of-use" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Terms of Use</a> | <a href="https://www.wminewmedia.com/cookies-policy/" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Cookies Policy</a> | <button className="hover:text-white transition-colors">Cookies Settings</button>
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
