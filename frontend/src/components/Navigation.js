import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const NAV_LINKS = [
  { label: 'TOUR', to: '/tour', external: false, group: 'left' },
  { label: 'STORE', to: 'https://brunomars.lnk.to/officialstore', external: true, group: 'left' },
  { label: 'MUSIC', to: '/music', external: false, group: 'right' },
  { label: 'SUBSCRIBE', to: '/subscribe', external: false, group: 'right' },
  { label: 'TRACK BOOKING', to: '/booking-status', external: false, group: 'right' }
];

const renderLink = (item, className, onClick) => {
  if (item.external) {
    return (
      <a
        key={item.label}
        href={item.to}
        target="_blank"
        rel="noreferrer"
        className={className}
        onClick={onClick}
      >
        {item.label}
      </a>
    );
  }

  return (
    <Link
      key={item.label}
      to={item.to}
      className={className}
      onClick={onClick}
    >
      {item.label}
    </Link>
  );
};

const Navigation = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <>
      <style>{`
        .site-header {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          z-index: 90;
          background: #fff;
          border-bottom: 1px solid rgba(0, 0, 0, 0.08);
        }

        .site-header-inner {
          width: 90%;
          margin: 0 auto;
          min-height: 6.41vw;
          display: flex;
          align-items: center;
          justify-content: space-between;
          position: relative;
        }

        .desktop-header-shell {
          width: 100%;
          display: grid;
          grid-template-columns: 1fr auto 1fr;
          align-items: center;
        }

        .desktop-nav {
          display: flex;
          align-items: center;
          gap: 2.6vw;
        }

        .desktop-nav-right {
          justify-content: flex-end;
        }

        .site-logo {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          text-decoration: none;
          border: none;
        }

        .site-logo img {
          width: clamp(150px, 12.4vw, 220px);
          height: auto;
          display: block;
        }

        .nav-link {
          text-decoration: none;
          color: #000;
          font-family: 'Poppins', sans-serif;
          font-weight: 600;
          font-size: clamp(0.8rem, 1.04vw, 0.95rem);
          letter-spacing: 0.02em;
          text-transform: uppercase;
          transition: opacity 0.2s ease;
          border: none;
        }

        .nav-link:hover {
          opacity: 0.6;
        }

        .mobile-logo,
        .mobile-menu-button {
          display: none;
        }

        .site-menu-overlay {
          position: fixed;
          inset: 0;
          z-index: 120;
          background: #fff;
        }

        .site-menu-overlay-header {
          position: absolute;
          top: 2.5rem;
          left: 0;
          right: 0;
          text-align: center;
        }

        .site-menu-close {
          position: absolute;
          top: 2rem;
          right: 2rem;
          border: none;
          background: transparent;
          color: #000;
          font-size: 2.5rem;
          font-weight: 300;
          cursor: pointer;
          line-height: 1;
        }

        .site-menu-nav {
          height: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 2rem;
        }

        .site-menu-link {
          text-decoration: none;
          color: #000;
          font-family: 'Poppins', sans-serif;
          font-weight: 600;
          font-size: 1.04vw;
          letter-spacing: 0.02em;
          text-transform: uppercase;
          transition: opacity 0.2s ease;
          border: none;
        }

        .site-menu-link:hover {
          opacity: 0.6;
        }

        @media only screen and (max-width: 1024px) {
          .site-header-inner {
            min-height: 17vw;
          }

          .desktop-header-shell {
            display: none;
          }

          .mobile-logo {
            display: inline-flex;
            align-items: center;
          }

          .mobile-logo img {
            width: 36.8vw;
            min-width: 140px;
            max-width: 220px;
            display: block;
          }

          .mobile-menu-button {
            display: flex;
            flex-direction: column;
            gap: 0.9vw;
            background: transparent;
            border: none;
            cursor: pointer;
            padding: 0;
          }

          .mobile-menu-button span {
            display: block;
            width: 5.59vw;
            min-width: 22px;
            height: 0.7vw;
            min-height: 3px;
            background: #000;
          }

          .site-menu-overlay-header .site-logo img {
            width: 36.8vw;
            min-width: 140px;
          }

          .site-menu-link {
            font-size: 6vw;
          }
        }
      `}</style>

      <header className="site-header">
        <div className="site-header-inner">
          <div className="desktop-header-shell">
            <nav className="desktop-nav">
              {NAV_LINKS.filter((item) => item.group === 'left').map((item) =>
                renderLink(item, 'nav-link')
              )}
            </nav>

            <Link to="/" className="site-logo" aria-label="Bruno Mars home">
              <img
                src="https://www.brunomars.com/sites/g/files/g2000021861/files/2026-01/BRUNONAME_black.svg"
                alt="Bruno Mars"
              />
            </Link>

            <nav className="desktop-nav desktop-nav-right">
              {NAV_LINKS.filter((item) => item.group === 'right').map((item) =>
                renderLink(item, 'nav-link')
              )}
            </nav>
          </div>

          <Link to="/" className="site-logo mobile-logo" aria-label="Bruno Mars home">
            <img
              src="https://www.brunomars.com/sites/g/files/g2000021861/files/2026-01/BRUNONAME_black.svg"
              alt="Bruno Mars"
            />
          </Link>

          <button
            type="button"
            className="mobile-menu-button"
            onClick={() => setIsMenuOpen(true)}
            aria-label="Open menu"
          >
            <span />
            <span />
            <span />
          </button>
        </div>
      </header>

      {isMenuOpen && (
        <div className="site-menu-overlay">
          <div className="site-menu-overlay-header">
            <Link to="/" className="site-logo" aria-label="Bruno Mars home" onClick={() => setIsMenuOpen(false)}>
              <img
                src="https://www.brunomars.com/sites/g/files/g2000021861/files/2026-01/BRUNONAME_black.svg"
                alt="Bruno Mars"
              />
            </Link>
          </div>

          <button
            type="button"
            className="site-menu-close"
            onClick={() => setIsMenuOpen(false)}
            aria-label="Close menu"
          >
            ×
          </button>

          <nav className="site-menu-nav">
            {NAV_LINKS.map((item) => renderLink(item, 'site-menu-link', () => setIsMenuOpen(false)))}
          </nav>
        </div>
      )}
    </>
  );
};

export default Navigation;
