import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import Navigation from '../components/Navigation';
import Footer from '../components/Footer';
import BookingModal from '../components/BookingModal';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const HomePage = () => {
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [footerOpen, setFooterOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  
  const slideRefs = useRef([]);
  const touchStartY = useRef(0);

  // Define slide IDs based on viewport
  const SLIDE_IDS = isMobile 
    ? ['store-tour-section', 'video-section-1', 'header-section', 'video-section-2']
    : ['store-tour-section', 'video-section-1', 'header-section', 'video-section-2'];
  
  const totalSlides = SLIDE_IDS.length;

  useEffect(() => {
    fetchEvents();
    
    // Check if mobile
    const checkMobile = () => {
      setIsMobile(window.matchMedia('(max-width:1024px) and (orientation:portrait)').matches);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Smooth scroll logic
  useEffect(() => {
    const toggleFooter = (show) => {
      setIsAnimating(true);
      setFooterOpen(show);
      setTimeout(() => setIsAnimating(false), 600);
    };

    const goToSlide = (targetIndex) => {
      if (isAnimating || targetIndex === currentSlide || targetIndex < 0) return;

      if (targetIndex >= totalSlides) {
        if (!footerOpen) toggleFooter(true);
        return;
      }

      if (footerOpen && targetIndex < totalSlides) {
        toggleFooter(false);
        return;
      }

      setIsAnimating(true);
      const direction = targetIndex > currentSlide ? 'down' : 'up';

      if (direction === 'down') {
        for (let i = currentSlide + 1; i <= targetIndex; i++) {
          if (slideRefs.current[i]) {
            slideRefs.current[i].classList.add('transitioning');
            slideRefs.current[i].style.transform = 'translateY(0)';
          }
        }
      } else {
        for (let i = currentSlide; i > targetIndex; i--) {
          if (slideRefs.current[i]) {
            slideRefs.current[i].classList.add('transitioning');
            slideRefs.current[i].style.transform = 'translateY(100%)';
          }
        }
      }

      setCurrentSlide(targetIndex);
      setTimeout(() => {
        slideRefs.current.forEach(s => s && s.classList.remove('transitioning'));
        setIsAnimating(false);
      }, 600);
    };

    // Wheel event
    const handleWheel = (e) => {
      if (isAnimating) return;
      if (e.deltaY > 20) {
        if (currentSlide === totalSlides - 1 && !footerOpen) toggleFooter(true);
        else if (!footerOpen) goToSlide(currentSlide + 1);
      } else if (e.deltaY < -20) {
        if (footerOpen) toggleFooter(false);
        else goToSlide(currentSlide - 1);
      }
    };

    // Touch events
    const handleTouchStart = (e) => {
      touchStartY.current = e.changedTouches[0].screenY;
    };

    const handleTouchEnd = (e) => {
      const touchEndY = e.changedTouches[0].screenY;
      const diff = touchStartY.current - touchEndY;
      if (isAnimating) return;
      if (diff > 50) {
        if (currentSlide === totalSlides - 1 && !footerOpen) toggleFooter(true);
        else if (!footerOpen) goToSlide(currentSlide + 1);
      } else if (diff < -50) {
        if (footerOpen) toggleFooter(false);
        else goToSlide(currentSlide - 1);
      }
    };

    // Keyboard events
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowDown') {
        if (currentSlide === totalSlides - 1 && !footerOpen) toggleFooter(true);
        else if (!footerOpen) goToSlide(currentSlide + 1);
      }
      if (e.key === 'ArrowUp') {
        if (footerOpen) toggleFooter(false);
        else goToSlide(currentSlide - 1);
      }
    };

    window.addEventListener('wheel', handleWheel, { passive: false });
    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchend', handleTouchEnd);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [currentSlide, isAnimating, footerOpen, totalSlides]);

  const fetchEvents = async () => {
    try {
      const response = await axios.get(`${API}/events`);
      setEvents(response.data);
    } catch (error) {
      console.error('Error fetching events:', error);
    }
  };

  const handleTicketsClick = () => {
    if (events.length > 0) {
      setSelectedEvent(events[0]);
      setShowBookingModal(true);
    }
  };

  return (
    <>
      <style>{`
        /* Poppins Font - Weight 600 */
        @font-face {
          font-family: 'Poppins';
          font-style: normal;
          font-weight: 600;
          font-display: swap;
          src: url(https://fonts.gstatic.com/s/poppins/v24/pxiByp8kv8JHgFVrLEj6Z11lFc-K.woff2) format('woff2');
          unicode-range: U+0900-097F, U+1CD0-1CF9, U+200C-200D, U+20A8, U+20B9, U+20F0, U+25CC, U+A830-A839, U+A8E0-A8FF, U+11B00-11B09;
        }
        @font-face {
          font-family: 'Poppins';
          font-style: normal;
          font-weight: 600;
          font-display: swap;
          src: url(https://fonts.gstatic.com/s/poppins/v24/pxiByp8kv8JHgFVrLEj6Z1JlFc-K.woff2) format('woff2');
          unicode-range: U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C0, U+2113, U+2C60-2C7F, U+A720-A7FF;
        }
        @font-face {
          font-family: 'Poppins';
          font-style: normal;
          font-weight: 600;
          font-display: swap;
          src: url(https://fonts.gstatic.com/s/poppins/v24/pxiByp8kv8JHgFVrLEj6Z1xlFQ.woff2) format('woff2');
          unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD;
        }
        
        /* Poppins Font - Weight 700 */
        @font-face {
          font-family: 'Poppins';
          font-style: normal;
          font-weight: 700;
          font-display: swap;
          src: url(https://fonts.gstatic.com/s/poppins/v24/pxiByp8kv8JHgFVrLCz7Z11lFc-K.woff2) format('woff2');
          unicode-range: U+0900-097F, U+1CD0-1CF9, U+200C-200D, U+20A8, U+20B9, U+20F0, U+25CC, U+A830-A839, U+A8E0-A8FF, U+11B00-11B09;
        }
        @font-face {
          font-family: 'Poppins';
          font-style: normal;
          font-weight: 700;
          font-display: swap;
          src: url(https://fonts.gstatic.com/s/poppins/v24/pxiByp8kv8JHgFVrLCz7Z1JlFc-K.woff2) format('woff2');
          unicode-range: U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C0, U+2113, U+2C60-2C7F, U+A720-A7FF;
        }
        @font-face {
          font-family: 'Poppins';
          font-style: normal;
          font-weight: 700;
          font-display: swap;
          src: url(https://fonts.gstatic.com/s/poppins/v24/pxiByp8kv8JHgFVrLCz7Z1xlFQ.woff2) format('woff2');
          unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD;
        }
        
        /* Poppins Font - Weight 900 */
        @font-face {
          font-family: 'Poppins';
          font-style: normal;
          font-weight: 900;
          font-display: swap;
          src: url(https://fonts.gstatic.com/s/poppins/v24/pxiByp8kv8JHgFVrLBT5Z11lFc-K.woff2) format('woff2');
          unicode-range: U+0900-097F, U+1CD0-1CF9, U+200C-200D, U+20A8, U+20B9, U+20F0, U+25CC, U+A830-A839, U+A8E0-A8FF, U+11B00-11B09;
        }
        @font-face {
          font-family: 'Poppins';
          font-style: normal;
          font-weight: 900;
          font-display: swap;
          src: url(https://fonts.gstatic.com/s/poppins/v24/pxiByp8kv8JHgFVrLBT5Z1JlFc-K.woff2) format('woff2');
          unicode-range: U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C0, U+2113, U+2C60-2C7F, U+A720-A7FF;
        }
        @font-face {
          font-family: 'Poppins';
          font-style: normal;
          font-weight: 900;
          font-display: swap;
          src: url(https://fonts.gstatic.com/s/poppins/v24/pxiByp8kv8JHgFVrLBT5Z1xlFQ.woff2) format('woff2');
          unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD;
        }
        
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
          font-family: 'Poppins', sans-serif;
        }
        
        body {
          overflow: hidden;
        }

        .smoothslide {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          will-change: transform;
          text-align: center;
          box-sizing: border-box;
        }

        .smoothslide.transitioning {
          transition: transform 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94);
        }

        #store-tour-section {
          z-index: 1;
        }

        #video-section-1 {
          z-index: 2;
          transform: translateY(100%);
        }

        #header-section {
          z-index: 3;
          transform: translateY(100%);
        }

        #video-section-2 {
          z-index: 4;
          transform: translateY(100%);
        }

        .site-footer-custom {
          position: fixed;
          bottom: 0;
          left: 0;
          width: 100vw;
          background: #fff;
          color: #000;
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 5;
          transform: translateY(100%);
          transition: transform 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94);
        }

        body.showfooter .site-footer-custom {
          transform: translateY(0);
          z-index: 1;
        }

        .flex-container-split {
          display: flex;
          width: 100%;
          height: 100%;
        }

        .flex-container-split > div {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 4rem 2rem;
        }

        .section-title {
          font-family: 'Poppins', sans-serif;
          font-size: 2.5rem;
          font-weight: 700;
          letter-spacing: 0.05em;
          color: #000;
          margin: 2rem 0 1.5rem;
          text-transform: uppercase;
        }

        .section-button {
          font-family: 'Poppins', sans-serif;
          font-size: 1rem;
          font-weight: 600;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          background-color: #000;
          color: #fff;
          padding: 1rem 3rem;
          border: 2px solid #000;
          cursor: pointer;
          text-decoration: none;
          display: inline-block;
          transition: all 0.3s;
        }

        .section-button:hover {
          background-color: #fff;
          color: #000;
        }

        .video-title {
          font-family: 'Poppins', sans-serif;
          font-size: 3.5rem;
          font-weight: 900;
          letter-spacing: 0.02em;
          text-transform: uppercase;
        }

        .video-button {
          font-family: 'Poppins', sans-serif;
          font-size: 1rem;
          font-weight: 600;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          background-color: #fff;
          color: #000;
          padding: 1rem 3rem;
          border: none;
          cursor: pointer;
          text-decoration: none;
          display: inline-block;
          transition: all 0.3s;
        }

        .video-button:hover {
          background-color: #000;
          color: #fff;
        }

        @media only screen and (max-width: 1024px) and (orientation: portrait) {
          .flex-container-split {
            flex-direction: column;
          }
        }
      `}</style>

      <a 
        href="#main-content" 
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:bg-black focus:text-white focus:px-4 focus:py-2"
      >
        Skip to main content
      </a>

      <Navigation />

      <main id="main-content">
        {/* Section 1: Store and Tour */}
        <div 
          id="store-tour-section" 
          className="smoothslide"
          ref={el => slideRefs.current[0] = el}
        >
          <div className="flex-container-split">
            {/* STORE */}
            <div style={{ backgroundColor: '#f7f7f7' }}>
              <a href="https://brunomars.lnk.to/officialstore" target="_blank" rel="noopener noreferrer">
                <img 
                  src="https://www.brunomars.com/sites/g/files/g2000021861/files/2026-03/Store_Block-img43dfddf.jpg"
                  alt="Store"
                  style={{ width: '100%', maxWidth: '700px', height: 'auto' }}
                />
              </a>
              <div className="section-title">Store</div>
              <a 
                href="https://brunomars.lnk.to/officialstore" 
                target="_blank" 
                rel="noopener noreferrer"
                className="section-button"
              >
                SHOP THE ROMANTIC
              </a>
            </div>

            {/* TOUR */}
            <div style={{ backgroundColor: '#ffffff' }}>
              <a href="https://www.brunomars.com/tour" target="_blank" rel="noopener noreferrer">
                <img 
                  src="https://www.brunomars.com/sites/g/files/g2000021861/files/2026-03/BrunoTheRomanticTour_Creative10_1080x1440hetvdvre.jpg"
                  alt="Tour"
                  style={{ width: '100%', maxWidth: '700px', height: 'auto' }}
                />
              </a>
              <div className="section-title">Tour</div>
              <button
                onClick={handleTicketsClick}
                className="section-button"
              >
                TICKETS
              </button>
            </div>
          </div>
        </div>

        {/* Section 2: Risk It All Video */}
        <div 
          id="video-section-1" 
          className="smoothslide"
          ref={el => slideRefs.current[1] = el}
          style={{ backgroundColor: '#000' }}
        >
          <div style={{ position: 'relative', width: '100%', height: '100%' }}>
            <picture>
              <source 
                media="(max-width: 1024px)" 
                srcSet="https://www.brunomars.com/sites/g/files/g2000021861/files/2026-02/home_mobbb.jpg"
              />
              <img 
                src="https://www.brunomars.com/sites/g/files/g2000021861/files/2026-03/Group%205%402x.jpg"
                alt="Risk It All"
                style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', top: 0, left: 0 }}
              />
            </picture>
            <div style={{ position: 'absolute', bottom: '15%', left: '50%', transform: 'translateX(-50%)', textAlign: 'center', color: '#fff', zIndex: 10, width: '90%' }}>
              <a href="https://brunomars.lnk.to/theromantic/youtube" target="_blank" rel="noopener noreferrer">
                <img 
                  src="https://www.brunomars.com/sites/g/files/g2000021861/files/2025-12/lance_playicon.svg"
                  alt="Play"
                  style={{ width: '80px', height: 'auto', margin: '0 auto 2rem', display: 'block', cursor: 'pointer' }}
                />
              </a>
              <div className="video-title" style={{ marginBottom: '2rem' }}>RISK IT ALL</div>
              <a 
                href="https://brunomars.lnk.to/theromantic/youtube" 
                target="_blank" 
                rel="noopener noreferrer"
                className="video-button"
              >
                WATCH NOW
              </a>
            </div>
          </div>
        </div>

        {/* Section 3: Header Banner - Vinyl Colors */}
        <div 
          id="header-section" 
          className="smoothslide"
          ref={el => slideRefs.current[2] = el}
        >
          <div style={{ position: 'relative', width: '100%', height: '100%' }}>
            <a href="https://brunomars.lnk.to/theromantic" target="_blank" rel="noopener noreferrer">
              <picture>
                <source 
                  media="(max-width: 1024px)" 
                  srcSet="https://www.brunomars.com/sites/g/files/g2000021861/files/2026-01/Vinyl.png"
                />
                <img 
                  src="https://www.brunomars.com/sites/g/files/g2000021861/files/2026-01/allstore_desktop_wider_1_0.jpg"
                  alt="Exclusive Vinyl Colors"
                  style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', top: 0, left: 0 }}
                />
              </picture>
              <div style={{ position: 'absolute', bottom: '8%', left: '50%', transform: 'translateX(-50%)', textAlign: 'center', zIndex: 10 }}>
                <div style={{ 
                  fontFamily: 'Poppins, sans-serif',
                  fontSize: '1.75rem', 
                  fontWeight: 700, 
                  marginBottom: '1.5rem', 
                  color: '#000',
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase'
                }}>
                  EXCLUSIVE VINYL COLORS
                </div>
                <span 
                  className="section-button"
                  style={{ backgroundColor: '#000', color: '#fff' }}
                >
                  FIND RETAILERS
                </span>
              </div>
            </a>
          </div>
        </div>

        {/* Section 4: I Just Might Video */}
        <div 
          id="video-section-2" 
          className="smoothslide"
          ref={el => slideRefs.current[3] = el}
          style={{ backgroundColor: '#000' }}
        >
          <div style={{ position: 'relative', width: '100%', height: '100%' }}>
            <picture>
              <source 
                media="(max-width: 1024px)" 
                srcSet="https://www.brunomars.com/sites/g/files/g2000021861/files/2026-01/Group%208%402x.jpg"
              />
              <img 
                src="https://www.brunomars.com/sites/g/files/g2000021861/files/2026-01/Video_Desktop-s3ff.jpg"
                alt="I Just Might"
                style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', top: 0, left: 0 }}
              />
            </picture>
            <div style={{ position: 'absolute', bottom: '15%', left: '50%', transform: 'translateX(-50%)', textAlign: 'center', color: '#fff', zIndex: 10, width: '90%' }}>
              <a href="http://brunomars.lnk.to/ijustmight/youtube" target="_blank" rel="noopener noreferrer">
                <img 
                  src="https://www.brunomars.com/sites/g/files/g2000021861/files/2025-12/lance_playicon.svg"
                  alt="Play"
                  style={{ width: '80px', height: 'auto', margin: '0 auto 2rem', display: 'block', cursor: 'pointer' }}
                />
              </a>
              <div className="video-title" style={{ marginBottom: '2rem' }}>I JUST MIGHT</div>
              <a 
                href="http://brunomars.lnk.to/ijustmight/youtube" 
                target="_blank" 
                rel="noopener noreferrer"
                className="video-button"
              >
                WATCH NOW
              </a>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <div className={`site-footer-custom ${footerOpen ? 'show' : ''}`}>
        <Footer />
      </div>

      {/* Booking Modal */}
      {showBookingModal && selectedEvent && (
        <BookingModal 
          event={selectedEvent}
          onClose={() => {
            setShowBookingModal(false);
            setSelectedEvent(null);
          }}
        />
      )}
    </>
  );
};

export default HomePage;
