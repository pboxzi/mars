import React from 'react';
import { Link } from 'react-router-dom';
import Navigation from '../components/Navigation';
import HomeFooter from '../components/HomeFooter';

const STORE_URL = 'https://brunomars.lnk.to/officialstore';
const ALBUM_URL = 'https://brunomars.lnk.to/theromantic';
const FOLLOW_URL = 'https://www.instagram.com/TheRomanticWorldTour';
const SUBSCRIBE_URL = 'https://drop.cobrand.com/d/BrunoMars/Subscribe';

const SECTION_LINKS = [
  { id: 'premium-access', label: 'Premium Access' },
  { id: 'merch', label: 'Hello Kitty' },
  { id: 'follow', label: 'Follow' },
  { id: 'listen', label: 'Listen' },
  { id: 'subscribe', label: 'Subscribe' }
];

const TOUR_STOPS = [
  { city: 'Las Vegas, NV', details: ['Apr 10 - Apr 11', 'Allegiant Stadium'] },
  { city: 'Glendale, AZ', details: ['Apr 14 - Apr 15', 'State Farm Stadium'] },
  { city: 'Arlington, TX', details: ['Apr 18 - Apr 19', 'Globe Life Field'] },
  { city: 'Atlanta, GA', details: ['Apr 25 - Apr 26', 'Mercedes-Benz Stadium'] },
  { city: 'Washington, DC', details: ['May 02 - May 03', 'Northwest Stadium'] },
  { city: 'Detroit, MI', details: ['May 09 - May 10', 'Ford Field'] }
];

const HomePage = () => {
  return (
    <>
      <style>{`
        body {
          margin: 0;
          font-family: 'Poppins', sans-serif;
          background: #a6192e;
        }

        .romantic-home {
          min-height: 100vh;
          padding-top: clamp(102px, 8vw, 150px);
          color: #fff;
          background-color: #a6192e;
          background-image: url('https://www.brunomars.com/sites/g/files/g2000021861/files/2026-04/romtrBG_d.jpg');
          background-size: cover;
          background-position: center top;
          background-attachment: fixed;
        }

        .romantic-home__inner {
          width: min(92vw, 1220px);
          margin: 0 auto;
          padding-bottom: 4rem;
        }

        .romantic-home__section-nav {
          position: sticky;
          top: clamp(76px, 6.4vw, 112px);
          z-index: 12;
          width: fit-content;
          margin: 0 auto;
          margin-bottom: clamp(2rem, 4vw, 3.8rem);
          padding: 0.9rem 1.25rem;
          display: flex;
          gap: 1.3rem;
          border: 1px solid rgba(255, 255, 255, 0.16);
          border-radius: 999px;
          background: rgba(120, 17, 31, 0.82);
          backdrop-filter: blur(10px);
        }

        .romantic-home__section-nav a {
          color: #fff;
          text-decoration: none;
          font-size: 0.9rem;
          font-weight: 600;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          opacity: 0.85;
          transition: opacity 0.2s ease;
        }

        .romantic-home__section-nav a:hover {
          opacity: 1;
        }

        .romantic-home__section {
          scroll-margin-top: 180px;
          margin-bottom: clamp(2.8rem, 7vw, 5.5rem);
        }

        .romantic-home__hero {
          text-align: center;
        }

        .romantic-home__hero-art {
          width: min(100%, 760px);
          display: block;
          margin: 0 auto;
        }

        .romantic-home__hero-cta {
          margin-top: 1.35rem;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 220px;
          padding: 0.95rem 1.8rem;
          background: #171717;
          color: #fff;
          text-decoration: none;
          font-size: 1rem;
          font-weight: 700;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          transition: opacity 0.2s ease, transform 0.2s ease;
        }

        .romantic-home__hero-cta:hover {
          opacity: 0.88;
          transform: translateY(-1px);
        }

        .romantic-home__eyebrow {
          margin-bottom: 0.7rem;
          font-size: 0.85rem;
          font-weight: 700;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          text-align: center;
        }

        .romantic-home__title {
          margin: 0;
          font-size: clamp(2.2rem, 4.5vw, 4.2rem);
          line-height: 0.95;
          text-align: center;
          text-transform: uppercase;
          letter-spacing: -0.05em;
        }

        .romantic-home__subcopy {
          max-width: 760px;
          margin: 1rem auto 0;
          font-size: clamp(1rem, 1.6vw, 1.25rem);
          line-height: 1.6;
          text-align: center;
        }

        .romantic-home__panel {
          padding: clamp(1.5rem, 3vw, 2.5rem);
          border: 1px solid rgba(255, 255, 255, 0.16);
          background: rgba(122, 17, 31, 0.7);
          backdrop-filter: blur(6px);
        }

        .romantic-home__merch-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: clamp(1rem, 2vw, 2rem);
          margin-top: 2rem;
        }

        .romantic-home__art-card {
          background: rgba(0, 0, 0, 0.08);
          padding: 1rem;
        }

        .romantic-home__art-card img {
          width: 100%;
          display: block;
        }

        .romantic-home__button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 220px;
          margin-top: 1.5rem;
          padding: 0.95rem 1.8rem;
          background: #171717;
          color: #fff;
          text-decoration: none;
          font-size: 1rem;
          font-weight: 700;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          transition: opacity 0.2s ease, transform 0.2s ease;
        }

        .romantic-home__button:hover {
          opacity: 0.88;
          transform: translateY(-1px);
        }

        .romantic-home__tour-grid {
          margin-top: 2rem;
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 1rem 1.2rem;
        }

        .romantic-home__tour-stop {
          padding: 1.25rem;
          background: rgba(255, 255, 255, 0.08);
        }

        .romantic-home__tour-city {
          font-size: 1.15rem;
          font-weight: 700;
          text-transform: uppercase;
        }

        .romantic-home__tour-detail {
          margin-top: 0.35rem;
          font-size: 0.98rem;
          line-height: 1.6;
        }

        .romantic-home__follow {
          text-align: center;
        }

        .romantic-home__follow-lines {
          font-size: clamp(1.25rem, 2.6vw, 2.4rem);
          line-height: 1.15;
          text-transform: uppercase;
          letter-spacing: -0.03em;
        }

        .romantic-home__follow-lines a {
          color: #fff;
          text-decoration: underline;
          text-underline-offset: 0.2em;
        }

        .romantic-home__listen-art {
          width: min(100%, 420px);
          display: block;
          margin: 2rem auto 0;
        }

        .romantic-home__subscribe {
          text-align: center;
          padding-bottom: 1rem;
        }

        .romantic-home__footer {
          background: #fff;
          margin-top: clamp(3rem, 7vw, 5rem);
        }

        @media (max-width: 1024px) {
          .romantic-home {
            padding-top: 110px;
            background-image: url('https://www.brunomars.com/sites/g/files/g2000021861/files/2026-04/romtrBG_m.jpg');
            background-attachment: scroll;
          }

          .romantic-home__section-nav {
            top: 84px;
            width: 100%;
            overflow-x: auto;
            justify-content: flex-start;
            gap: 1rem;
            padding: 0.85rem 1rem;
            border-radius: 22px;
            margin-bottom: 2rem;
          }

          .romantic-home__section-nav::-webkit-scrollbar {
            display: none;
          }

          .romantic-home__section-nav a {
            white-space: nowrap;
            font-size: 0.78rem;
          }

          .romantic-home__merch-grid,
          .romantic-home__tour-grid {
            grid-template-columns: 1fr;
          }

          .romantic-home__button,
          .romantic-home__hero-cta {
            width: 100%;
            min-width: 0;
          }

          .romantic-home__follow-lines {
            font-size: 1.7rem;
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

      <main id="main-content" className="romantic-home">
        <div className="romantic-home__inner">
          <nav className="romantic-home__section-nav" aria-label="Homepage sections">
            {SECTION_LINKS.map((section) => (
              <a key={section.id} href={`#${section.id}`}>
                {section.label}
              </a>
            ))}
          </nav>

          <section id="premium-access" className="romantic-home__section romantic-home__hero">
            <img
              src="https://www.brunomars.com/sites/g/files/g2000021861/files/2026-04/romtr_hdr.png"
              alt="The Romantic Tour"
              className="romantic-home__hero-art"
            />
            <Link to="/tour" className="romantic-home__hero-cta">
              Explore Premium Access
            </Link>
          </section>

          <section id="merch" className="romantic-home__section romantic-home__panel">
            <div className="romantic-home__eyebrow">Hello Kitty x Bruno Mars</div>
            <h2 className="romantic-home__title">Exclusive Tour Merchandise</h2>
            <p className="romantic-home__subcopy">
              Shop the exclusive collection inspired by The Romantic Tour and available through Bruno Mars official channels.
            </p>

            <div className="romantic-home__merch-grid">
              <div className="romantic-home__art-card">
                <img
                  src="https://www.brunomars.com/sites/g/files/g2000021861/files/2026-04/hellokitty_merch_ayhnkowl.png"
                  alt="Hello Kitty x Bruno Mars merchandise"
                />
              </div>
              <div className="romantic-home__art-card">
                <img
                  src="https://www.brunomars.com/sites/g/files/g2000021861/files/2026-04/romtrhlo_kty.png"
                  alt="The Romantic Tour Hello Kitty collection"
                />
              </div>
            </div>

            <div style={{ textAlign: 'center' }}>
              <a href={STORE_URL} target="_blank" rel="noreferrer" className="romantic-home__button">
                Shop The Store
              </a>
            </div>
          </section>

          <section className="romantic-home__section romantic-home__panel">
            <div className="romantic-home__eyebrow">Selected Tour Stops</div>
            <h2 className="romantic-home__title">Current Tour Cities</h2>
            <p className="romantic-home__subcopy">
              Browse featured stops and continue to the full tour page to view availability and request premium access.
            </p>

            <div className="romantic-home__tour-grid">
              {TOUR_STOPS.map((stop) => (
                <div key={stop.city} className="romantic-home__tour-stop">
                  <div className="romantic-home__tour-city">{stop.city}</div>
                  {stop.details.map((detail) => (
                    <div key={detail} className="romantic-home__tour-detail">
                      {detail}
                    </div>
                  ))}
                </div>
              ))}
            </div>

            <div style={{ textAlign: 'center' }}>
              <Link to="/tour" className="romantic-home__button">
                View Tour Dates
              </Link>
            </div>
          </section>

          <section id="follow" className="romantic-home__section romantic-home__panel romantic-home__follow">
            <div className="romantic-home__follow-lines">
              <div>
                Follow <a href={FOLLOW_URL} target="_blank" rel="noreferrer">@THEROMANTICWORLDTOUR</a>
              </div>
              <div>and tag the page from your show-night moments.</div>
            </div>

            <a href={FOLLOW_URL} target="_blank" rel="noreferrer" className="romantic-home__button">
              Follow
            </a>
          </section>

          <section id="listen" className="romantic-home__section romantic-home__panel" style={{ textAlign: 'center' }}>
            <div className="romantic-home__eyebrow">Listen</div>
            <h2 className="romantic-home__title">The Romantic</h2>
            <p className="romantic-home__subcopy">
              Stream the latest release and stay inside the world of The Romantic Tour.
            </p>

            <img
              src="https://www.brunomars.com/sites/g/files/g2000021861/files/2026-04/romcvr_img.png"
              alt="The Romantic cover art"
              className="romantic-home__listen-art"
            />

            <a href={ALBUM_URL} target="_blank" rel="noreferrer" className="romantic-home__button">
              Listen Now
            </a>
          </section>

          <section id="subscribe" className="romantic-home__section romantic-home__panel romantic-home__subscribe">
            <div className="romantic-home__eyebrow">Community</div>
            <h2 className="romantic-home__title">Join Bruno's Community</h2>
            <p className="romantic-home__subcopy">
              Subscribe for official updates, new drops, and first access to future announcements.
            </p>

            <a href={SUBSCRIBE_URL} target="_blank" rel="noreferrer" className="romantic-home__button">
              Subscribe
            </a>
          </section>
        </div>

        <div className="romantic-home__footer">
          <HomeFooter />
        </div>
      </main>
    </>
  );
};

export default HomePage;
