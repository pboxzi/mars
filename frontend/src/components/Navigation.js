import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const Navigation = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <>
      <style>{`
        /* devanagari */
        @font-face {
          font-family: 'Poppins';
          font-style: normal;
          font-weight: 600;
          font-display: swap;
          src: url(https://fonts.gstatic.com/s/poppins/v24/pxiByp8kv8JHgFVrLEj6Z11lFc-K.woff2) format('woff2');
          unicode-range: U+0900-097F, U+1CD0-1CF9, U+200C-200D, U+20A8, U+20B9, U+20F0, U+25CC, U+A830-A839, U+A8E0-A8FF, U+11B00-11B09;
        }
        /* latin-ext */
        @font-face {
          font-family: 'Poppins';
          font-style: normal;
          font-weight: 600;
          font-display: swap;
          src: url(https://fonts.gstatic.com/s/poppins/v24/pxiByp8kv8JHgFVrLEj6Z1JlFc-K.woff2) format('woff2');
          unicode-range: U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C0, U+2113, U+2C60-2C7F, U+A720-A7FF;
        }
        /* latin */
        @font-face {
          font-family: 'Poppins';
          font-style: normal;
          font-weight: 600;
          font-display: swap;
          src: url(https://fonts.gstatic.com/s/poppins/v24/pxiByp8kv8JHgFVrLEj6Z1xlFQ.woff2) format('woff2');
          unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD;
        }
        /* devanagari */
        @font-face {
          font-family: 'Poppins';
          font-style: normal;
          font-weight: 900;
          font-display: swap;
          src: url(https://fonts.gstatic.com/s/poppins/v24/pxiByp8kv8JHgFVrLBT5Z11lFc-K.woff2) format('woff2');
          unicode-range: U+0900-097F, U+1CD0-1CF9, U+200C-200D, U+20A8, U+20B9, U+20F0, U+25CC, U+A830-A839, U+A8E0-A8FF, U+11B00-11B09;
        }
        /* latin-ext */
        @font-face {
          font-family: 'Poppins';
          font-style: normal;
          font-weight: 900;
          font-display: swap;
          src: url(https://fonts.gstatic.com/s/poppins/v24/pxiByp8kv8JHgFVrLBT5Z1JlFc-K.woff2) format('woff2');
          unicode-range: U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C0, U+2113, U+2C60-2C7F, U+A720-A7FF;
        }
        /* latin */
        @font-face {
          font-family: 'Poppins';
          font-style: normal;
          font-weight: 900;
          font-display: swap;
          src: url(https://fonts.gstatic.com/s/poppins/v24/pxiByp8kv8JHgFVrLBT5Z1xlFQ.woff2) format('woff2');
          unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD;
        }
        
        /* Mobile responsive font sizes */
        @media only screen and (max-width: 768px) {
          .nav-menu-item {
            font-size: 6vw !important;
          }
          .nav-header-title {
            font-size: 6vw !important;
          }
        }
      `}</style>

      {/* Fixed Header */}
      <header style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        backgroundColor: '#fff',
        borderBottom: '1px solid #e5e7eb'
      }}>
        <div style={{
          maxWidth: '1280px',
          margin: '0 auto',
          padding: '1rem 1.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          {/* Logo */}
          <Link 
            to="/" 
            style={{
              fontSize: '1.875rem',
              fontFamily: 'Poppins, sans-serif',
              fontWeight: 900,
              letterSpacing: '-0.025em',
              color: '#000',
              textDecoration: 'none'
            }}
          >
            BRUNO MARS
          </Link>
          
          {/* Menu Icon - Hamburger */}
          <button 
            onClick={() => setIsMenuOpen(true)}
            style={{
              padding: '0.5rem',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px'
            }}
            aria-label="Open menu"
          >
            <span style={{ display: 'block', width: '24px', height: '3px', backgroundColor: '#000' }}></span>
            <span style={{ display: 'block', width: '24px', height: '3px', backgroundColor: '#000' }}></span>
            <span style={{ display: 'block', width: '24px', height: '3px', backgroundColor: '#000' }}></span>
          </button>
        </div>
      </header>

      {/* Full Screen Menu Overlay */}
      {isMenuOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 100,
          backgroundColor: '#fff'
        }}>
          {/* BRUNO MARS Header */}
          <div style={{
            position: 'absolute',
            top: '2.5rem',
            left: 0,
            right: 0,
            textAlign: 'center'
          }}>
            <h1 
              className="nav-header-title"
              style={{
                fontSize: '1.04vw',
                fontFamily: 'Poppins, sans-serif',
                fontWeight: 600,
                letterSpacing: 'normal',
                color: '#000',
                margin: 0,
                textTransform: 'uppercase'
              }}
            >
              BRUNO MARS
            </h1>
          </div>

          {/* Close Button */}
          <button 
            onClick={() => setIsMenuOpen(false)}
            style={{
              position: 'absolute',
              top: '2.5rem',
              right: '2rem',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              fontSize: '2.5rem',
              lineHeight: 1,
              color: '#000',
              fontWeight: 300,
              fontFamily: 'Poppins, sans-serif'
            }}
            aria-label="Close menu"
          >
            ×
          </button>

          {/* Menu Items */}
          <nav style={{
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '2rem'
          }}>
            <Link 
              to="/tour" 
              onClick={() => setIsMenuOpen(false)}
              className="nav-menu-item"
              style={{
                fontSize: '1.04vw',
                fontFamily: 'Poppins, sans-serif',
                fontWeight: 600,
                letterSpacing: 'normal',
                color: '#000',
                textDecoration: 'none',
                textTransform: 'uppercase',
                transition: 'opacity 0.2s'
              }}
              onMouseEnter={(e) => e.target.style.opacity = '0.6'}
              onMouseLeave={(e) => e.target.style.opacity = '1'}
            >
              TOUR
            </Link>
            <a 
              href="https://brunomars.lnk.to/officialstore" 
              target="_blank" 
              rel="noopener noreferrer"
              className="nav-menu-item"
              style={{
                fontSize: '1.04vw',
                fontFamily: 'Poppins, sans-serif',
                fontWeight: 600,
                letterSpacing: 'normal',
                color: '#000',
                textDecoration: 'none',
                textTransform: 'uppercase',
                transition: 'opacity 0.2s'
              }}
              onMouseEnter={(e) => e.target.style.opacity = '0.6'}
              onMouseLeave={(e) => e.target.style.opacity = '1'}
            >
              STORE
            </a>
            <Link 
              to="/music" 
              onClick={() => setIsMenuOpen(false)}
              className="nav-menu-item"
              style={{
                fontSize: '1.04vw',
                fontFamily: 'Poppins, sans-serif',
                fontWeight: 600,
                letterSpacing: 'normal',
                color: '#000',
                textDecoration: 'none',
                textTransform: 'uppercase',
                transition: 'opacity 0.2s'
              }}
              onMouseEnter={(e) => e.target.style.opacity = '0.6'}
              onMouseLeave={(e) => e.target.style.opacity = '1'}
            >
              MUSIC
            </Link>
            <Link 
              to="/booking-status" 
              onClick={() => setIsMenuOpen(false)}
              className="nav-menu-item"
              style={{
                fontSize: '1.04vw',
                fontFamily: 'Poppins, sans-serif',
                fontWeight: 600,
                letterSpacing: 'normal',
                color: '#000',
                textDecoration: 'none',
                textTransform: 'uppercase',
                transition: 'opacity 0.2s'
              }}
              onMouseEnter={(e) => e.target.style.opacity = '0.6'}
              onMouseLeave={(e) => e.target.style.opacity = '1'}
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
