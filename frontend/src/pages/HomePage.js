import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import Navigation from '../components/Navigation';
import HomeFooter from '../components/HomeFooter';
import BookingModal from '../components/BookingModal';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const STORE_URL = 'https://brunomars.lnk.to/officialstore';
const ALBUM_URL = 'https://brunomars.lnk.to/theromantic';
const RISK_IT_ALL_URL = 'https://brunomars.lnk.to/theromantic/youtube';
const I_JUST_MIGHT_URL = 'https://brunomars.lnk.to/ijustmight/youtube';

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

  const sections = useMemo(
    () =>
      isMobile
        ? [
            { id: 'store-section', type: 'store' },
            { id: 'tour-section', type: 'tour' },
            { id: 'video-section-risk-it-all', type: 'video-1' },
            { id: 'header-section', type: 'hero' },
            { id: 'video-section-i-just-might', type: 'video-2' }
          ]
        : [
            { id: 'store-tour-section', type: 'split' },
            { id: 'video-section-risk-it-all', type: 'video-1' },
            { id: 'header-section', type: 'hero' },
            { id: 'video-section-i-just-might', type: 'video-2' }
          ],
    [isMobile]
  );

  const totalSlides = sections.length;

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await axios.get(`${API}/events`);
        setEvents(response.data);
      } catch (error) {
        console.error('Error fetching events:', error);
      }
    };

    fetchEvents();

    const checkMobile = () => {
      setIsMobile(window.matchMedia('(max-width:1024px) and (orientation:portrait)').matches);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const resetSlides = useCallback(() => {
    slideRefs.current.forEach((slide, index) => {
      if (!slide) {
        return;
      }

      slide.classList.remove('transitioning');
      slide.style.transform = index === 0 ? 'translateY(0)' : 'translateY(100%)';
    });
  }, []);

  useEffect(() => {
    setCurrentSlide(0);
    setFooterOpen(false);
    setIsAnimating(false);

    requestAnimationFrame(() => {
      resetSlides();
    });
  }, [isMobile, resetSlides]);

  const toggleFooter = useCallback((show) => {
    setIsAnimating(true);
    setFooterOpen(show);
    setTimeout(() => setIsAnimating(false), 600);
  }, []);

  const goToSlide = useCallback(
    (targetIndex) => {
      if (isAnimating || targetIndex === currentSlide || targetIndex < 0) {
        return;
      }

      if (targetIndex >= totalSlides) {
        if (!footerOpen) {
          toggleFooter(true);
        }
        return;
      }

      if (footerOpen && targetIndex < totalSlides) {
        toggleFooter(false);
        return;
      }

      setIsAnimating(true);
      const direction = targetIndex > currentSlide ? 'down' : 'up';

      if (direction === 'down') {
        for (let i = currentSlide + 1; i <= targetIndex; i += 1) {
          if (slideRefs.current[i]) {
            slideRefs.current[i].classList.add('transitioning');
            slideRefs.current[i].style.transform = 'translateY(0)';
          }
        }
      } else {
        for (let i = currentSlide; i > targetIndex; i -= 1) {
          if (slideRefs.current[i]) {
            slideRefs.current[i].classList.add('transitioning');
            slideRefs.current[i].style.transform = 'translateY(100%)';
          }
        }
      }

      setCurrentSlide(targetIndex);

      setTimeout(() => {
        slideRefs.current.forEach((slide) => {
          if (slide) {
            slide.classList.remove('transitioning');
          }
        });
        setIsAnimating(false);
      }, 600);
    },
    [currentSlide, footerOpen, isAnimating, toggleFooter, totalSlides]
  );

  useEffect(() => {
    const handleWheel = (event) => {
      if (isAnimating) {
        return;
      }

      if (event.deltaY > 20) {
        if (currentSlide === totalSlides - 1 && !footerOpen) {
          toggleFooter(true);
        } else if (!footerOpen) {
          goToSlide(currentSlide + 1);
        }
      } else if (event.deltaY < -20) {
        if (footerOpen) {
          toggleFooter(false);
        } else {
          goToSlide(currentSlide - 1);
        }
      }
    };

    const handleTouchStart = (event) => {
      touchStartY.current = event.changedTouches[0].screenY;
    };

    const handleTouchEnd = (event) => {
      const touchEndY = event.changedTouches[0].screenY;
      const diff = touchStartY.current - touchEndY;

      if (isAnimating) {
        return;
      }

      if (diff > 50) {
        if (currentSlide === totalSlides - 1 && !footerOpen) {
          toggleFooter(true);
        } else if (!footerOpen) {
          goToSlide(currentSlide + 1);
        }
      } else if (diff < -50) {
        if (footerOpen) {
          toggleFooter(false);
        } else {
          goToSlide(currentSlide - 1);
        }
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === 'ArrowDown') {
        if (currentSlide === totalSlides - 1 && !footerOpen) {
          toggleFooter(true);
        } else if (!footerOpen) {
          goToSlide(currentSlide + 1);
        }
      }

      if (event.key === 'ArrowUp') {
        if (footerOpen) {
          toggleFooter(false);
        } else {
          goToSlide(currentSlide - 1);
        }
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
  }, [currentSlide, footerOpen, goToSlide, isAnimating, toggleFooter, totalSlides]);

  const openBookingRequest = () => {
    if (events.length > 0) {
      setSelectedEvent(events[0]);
      setShowBookingModal(true);
    }
  };

  const renderPromoCard = (kind) => {
    const isStore = kind === 'store';

    return (
      <div className="homepage-single-promo">
        <div className="homepage-promo-card">
          {isStore ? (
            <a href={STORE_URL} target="_blank" rel="noreferrer" className="homepage-image-link">
              <img
                src="https://www.brunomars.com/sites/g/files/g2000021861/files/2026-03/Store_Block-img43dfddf.jpg"
                alt="Store"
                className="homepage-promo-image"
              />
            </a>
          ) : (
            <Link to="/tour" className="homepage-image-link">
              <img
                src="https://www.brunomars.com/sites/g/files/g2000021861/files/2026-03/BrunoTheRomanticTour_Creative10_1080x1440hetvdvre.jpg"
                alt="Tour"
                className="homepage-promo-image"
              />
            </Link>
          )}

          <div className="homepage-promo-label">{isStore ? 'Store' : 'Tour'}</div>

          {isStore ? (
            <a href={STORE_URL} target="_blank" rel="noreferrer" className="homepage-promo-button">
              SHOP THE ROMANTIC
            </a>
          ) : (
            <button type="button" onClick={openBookingRequest} className="homepage-promo-button">
              TICKETS
            </button>
          )}
        </div>
      </div>
    );
  };

  const renderSplitSection = () => (
    <div className="homepage-split-layout">
      <div className="homepage-split-panel homepage-split-store">{renderPromoCard('store')}</div>
      <div className="homepage-split-panel homepage-split-tour">{renderPromoCard('tour')}</div>
    </div>
  );

  const renderVideoSection = (kind) => {
    const isRiskItAll = kind === 'video-1';
    const desktopImage = isRiskItAll
      ? 'https://www.brunomars.com/sites/g/files/g2000021861/files/2026-03/Group%205%402x.jpg'
      : 'https://www.brunomars.com/sites/g/files/g2000021861/files/2026-01/Video_Desktop-s3ff.jpg';
    const mobileImage = isRiskItAll
      ? 'https://www.brunomars.com/sites/g/files/g2000021861/files/2026-02/home_mobbb.jpg'
      : 'https://www.brunomars.com/sites/g/files/g2000021861/files/2026-01/Group%208%402x.jpg';
    const title = isRiskItAll ? 'RISK IT ALL' : 'I JUST MIGHT';
    const link = isRiskItAll ? RISK_IT_ALL_URL : I_JUST_MIGHT_URL;

    return (
      <div className="homepage-media-panel homepage-media-dark">
        <picture>
          <source media="(max-width: 1024px)" srcSet={mobileImage} />
          <img src={desktopImage} alt={title} className="homepage-media-image" />
        </picture>

        <div className="homepage-media-overlay">
          <a href={link} target="_blank" rel="noreferrer" className="homepage-play-link" aria-label={`Watch ${title}`}>
            <img
              src="https://www.brunomars.com/sites/g/files/g2000021861/files/2025-12/lance_playicon.svg"
              alt="Play"
              className="homepage-play-icon"
            />
          </a>
          <div className="homepage-video-title">{title}</div>
          <a href={link} target="_blank" rel="noreferrer" className="homepage-video-button">
            WATCH NOW
          </a>
        </div>
      </div>
    );
  };

  const renderHeroSection = () => (
    <div className="homepage-media-panel homepage-media-light">
      <a href={ALBUM_URL} target="_blank" rel="noreferrer" className="homepage-hero-link">
        <picture>
          <source
            media="(max-width: 1024px)"
            srcSet="https://www.brunomars.com/sites/g/files/g2000021861/files/2026-01/Vinyl.png"
          />
          <img
            src="https://www.brunomars.com/sites/g/files/g2000021861/files/2026-01/allstore_desktop_wider_1_0.jpg"
            alt="Exclusive Vinyl Colors"
            className="homepage-media-image homepage-hero-image"
          />
        </picture>

        <div className="homepage-hero-copy">
          <div className="homepage-hero-title">EXCLUSIVE VINYL COLORS</div>
          <span className="homepage-hero-button">FIND RETAILERS</span>
        </div>
      </a>
    </div>
  );

  const renderSection = (section) => {
    switch (section.type) {
      case 'store':
        return renderPromoCard('store');
      case 'tour':
        return renderPromoCard('tour');
      case 'video-1':
        return renderVideoSection('video-1');
      case 'video-2':
        return renderVideoSection('video-2');
      case 'hero':
        return renderHeroSection();
      case 'split':
      default:
        return renderSplitSection();
    }
  };

  return (
    <>
      <style>{`
        * {
          box-sizing: border-box;
        }

        body {
          margin: 0;
          overflow: hidden;
          font-family: 'Poppins', sans-serif;
          background: #fff;
        }

        .homepage-main {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          transition: transform 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94);
          z-index: 1;
        }

        .homepage-main.footer-open {
          transform: translateY(-128px);
        }

        .smoothslide {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          transform: translateY(100%);
          will-change: transform;
          background: #fff;
        }

        .smoothslide.is-first {
          transform: translateY(0);
        }

        .smoothslide.transitioning {
          transition: transform 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94);
        }

        .homepage-split-layout {
          width: 97%;
          min-height: 100vh;
          margin: 0 auto;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 2.5vw;
          padding-top: 6.5vw;
        }

        .homepage-split-panel {
          flex: 0 0 auto;
          min-height: calc(100vh - 6.5vw);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .homepage-split-store {
          margin-right: 2%;
        }

        .homepage-single-promo {
          width: 100%;
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding-top: 6.5vw;
          background: #fff;
        }

        .homepage-promo-card {
          width: auto;
          text-align: center;
        }

        .homepage-image-link {
          display: block;
          border: none;
        }

        .homepage-promo-image {
          display: block;
          width: auto;
          max-width: min(34.38vw, 660px);
          max-height: 70vh;
          margin: 0 auto 1vw;
          object-fit: cover;
        }

        .homepage-promo-label {
          font-size: 1.04vw;
          font-weight: 600;
          text-transform: uppercase;
          color: #000;
        }

        .homepage-promo-button,
        .homepage-video-button,
        .homepage-hero-button {
          border: 1px solid #000;
          font-family: 'Poppins', sans-serif;
          font-weight: 500;
          font-size: 1.0417vw;
          line-height: 1.5104vw;
          text-transform: uppercase;
          color: #fff;
          background: #000;
          width: 14.12vw;
          display: inline-block;
          padding: 0.5208vw 0;
          margin: 0.5208vw auto 0;
          text-align: center;
          text-decoration: none;
          cursor: pointer;
          transition: background-color 0.2s ease, color 0.2s ease, opacity 0.2s ease;
        }

        .homepage-promo-button:hover,
        .homepage-video-button:hover,
        .homepage-hero-button:hover {
          background: #fff;
          color: #000;
          opacity: 1;
        }

        .homepage-media-panel {
          position: relative;
          width: 100%;
          height: 100%;
          background: #000;
        }

        .homepage-media-panel picture,
        .homepage-hero-link {
          display: block;
          width: 100%;
          height: 100%;
          border: none;
        }

        .homepage-media-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }

        .homepage-media-overlay,
        .homepage-hero-copy {
          position: absolute;
          left: 50%;
          transform: translateX(-50%);
          width: min(90vw, 700px);
          text-align: center;
          z-index: 2;
        }

        .homepage-media-overlay {
          bottom: 0.5vw;
          color: #fff;
        }

        .homepage-play-link {
          display: inline-block;
          border: none;
        }

        .homepage-play-icon {
          display: block;
          width: 2vw;
          min-width: 28px;
          max-width: 44px;
          margin: 0 auto 0.8vw;
        }

        .homepage-video-title {
          font-size: 1.04vw;
          text-transform: uppercase;
          font-weight: 600;
          letter-spacing: 0.02em;
        }

        .homepage-hero-copy {
          bottom: 2.2vw;
        }

        .homepage-hero-title {
          color: #000;
          font-size: 1.04vw;
          font-weight: 700;
          text-transform: uppercase;
          margin-bottom: 0.5208vw;
          letter-spacing: 0.02em;
        }

        .homepage-hero-button {
          margin-top: 0;
        }

        .site-footer-custom {
          position: fixed;
          bottom: 0;
          left: 0;
          width: 100vw;
          height: 128px;
          background: #fff;
          z-index: 6;
          transform: translateY(100%);
          transition: transform 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94);
        }

        .site-footer-custom.show {
          transform: translateY(0);
        }

        @media only screen and (max-width: 1024px) and (orientation: portrait) {
          html,
          body {
            overscroll-behavior: none;
            touch-action: pan-y;
          }

          .homepage-main.footer-open {
            transform: translateY(-172px);
          }

          .homepage-single-promo {
            padding: 22vw 5.865vw 8vw;
          }

          .homepage-promo-image {
            width: 100%;
            max-width: 88.27vw;
            max-height: none;
            margin-bottom: 4vw;
          }

          .homepage-promo-label {
            font-size: 4.8vw;
            line-height: 10vw;
            padding-bottom: 1vw;
          }

          .homepage-promo-button,
          .homepage-video-button,
          .homepage-hero-button {
            font-size: 3.73vw;
            width: 49.0667vw;
            line-height: 5.3333vw;
            padding: 2.1333vw 0;
            margin-top: 4.5333vw;
          }

          .homepage-media-overlay,
          .homepage-hero-copy {
            width: 55vw;
            bottom: 10vw;
          }

          .homepage-video-title,
          .homepage-hero-title {
            font-size: 4.8vw;
          }

          .homepage-play-icon {
            width: 5vw;
            min-width: 24px;
            max-width: none;
            margin-bottom: 4vw;
          }

          .homepage-hero-copy {
            width: min(90vw, 500px);
            bottom: 30vw;
          }

          .homepage-hero-image {
            object-fit: contain;
            background: #fff;
          }

          .site-footer-custom {
            height: 172px;
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

      <main id="main-content" className={`homepage-main ${footerOpen ? 'footer-open' : ''}`}>
        {sections.map((section, index) => (
          <section
            key={section.id}
            id={section.id}
            className={`smoothslide ${index === 0 ? 'is-first' : ''}`}
            ref={(element) => {
              slideRefs.current[index] = element;
            }}
            style={{ zIndex: index + 1 }}
          >
            {renderSection(section)}
          </section>
        ))}
      </main>

      <div className={`site-footer-custom ${footerOpen ? 'show' : ''}`}>
        <HomeFooter />
      </div>

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
