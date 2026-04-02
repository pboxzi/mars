import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const Navigation = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800;900&display=swap');
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
            <h1 style={{
              fontSize: '3rem',
              fontFamily: 'Poppins, sans-serif',
              fontWeight: 600,
              letterSpacing: '0',
              color: '#000',
              margin: 0
            }}>
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
              style={{
                fontSize: '3rem',
                fontFamily: 'Poppins, sans-serif',
                fontWeight: 600,
                letterSpacing: '0',
                color: '#000',
                textDecoration: 'none',
                transition: 'color 0.2s'
              }}
              onMouseEnter={(e) => e.target.style.color = '#666'}
              onMouseLeave={(e) => e.target.style.color = '#000'}
            >
              TOUR
            </Link>
            <a 
              href="https://brunomars.lnk.to/officialstore" 
              target="_blank" 
              rel="noopener noreferrer"
              style={{
                fontSize: '3rem',
                fontFamily: 'Poppins, sans-serif',
                fontWeight: 600,
                letterSpacing: '0',
                color: '#000',
                textDecoration: 'none',
                transition: 'color 0.2s'
              }}
              onMouseEnter={(e) => e.target.style.color = '#666'}
              onMouseLeave={(e) => e.target.style.color = '#000'}
            >
              STORE
            </a>
            <Link 
              to="/music" 
              onClick={() => setIsMenuOpen(false)}
              style={{
                fontSize: '3rem',
                fontFamily: 'Poppins, sans-serif',
                fontWeight: 600,
                letterSpacing: '0',
                color: '#000',
                textDecoration: 'none',
                transition: 'color 0.2s'
              }}
              onMouseEnter={(e) => e.target.style.color = '#666'}
              onMouseLeave={(e) => e.target.style.color = '#000'}
            >
              MUSIC
            </Link>
            <Link 
              to="/booking-status" 
              onClick={() => setIsMenuOpen(false)}
              style={{
                fontSize: '3rem',
                fontFamily: 'Poppins, sans-serif',
                fontWeight: 600,
                letterSpacing: '0',
                color: '#000',
                textDecoration: 'none',
                transition: 'color 0.2s'
              }}
              onMouseEnter={(e) => e.target.style.color = '#666'}
              onMouseLeave={(e) => e.target.style.color = '#000'}
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
