import React from 'react';
import { Link } from 'react-router-dom';

const socialLinks = [
  {
    label: 'Facebook',
    href: 'https://www.facebook.com/brunomars',
    viewBox: '0 0 24 24',
    path: 'M13.5 8.25V6.5c0-.63.37-.75.64-.75h2.11V2.5h-2.89c-3.21 0-3.94 2.4-3.94 3.94v1.81H7.5v3.36h1.92V21.5h4.08v-9.89h2.45l.33-3.36H13.5z'
  },
  {
    label: 'X',
    href: 'https://twitter.com/BRUNOMARS',
    viewBox: '0 0 24 24',
    path: 'M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z'
  },
  {
    label: 'Instagram',
    href: 'https://www.instagram.com/brunomars/',
    viewBox: '0 0 24 24',
    path: 'M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z'
  },
  {
    label: 'YouTube',
    href: 'https://www.youtube.com/brunomars',
    viewBox: '0 0 24 24',
    path: 'M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z'
  },
  {
    label: 'Spotify',
    href: 'https://play.spotify.com/artist/0du5cEVh5yTK9QJze8zA0C',
    viewBox: '0 0 24 24',
    path: 'M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z'
  },
  {
    label: 'Apple Music',
    href: 'https://smarturl.it/BMappleartistpage',
    viewBox: '0 0 24 24',
    path: 'M23.997 6.124c0-.738-.065-1.47-.24-2.19-.317-1.31-1.062-2.31-2.18-3.043C21.003.517 20.373.285 19.7.164c-.517-.093-1.038-.135-1.564-.15-.04-.003-.083-.01-.124-.013H5.988c-.152.01-.303.017-.455.026C4.786.07 4.043.15 3.34.428 2.004.958 1.04 1.88.475 3.208c-.192.448-.292.925-.363 1.408-.056.392-.088.785-.1 1.18 0 .032-.007.062-.01.093v12.223c.01.14.017.283.027.424.05.815.154 1.624.497 2.373.65 1.42 1.738 2.353 3.234 2.801.42.127.856.187 1.293.228.555.053 1.11.06 1.667.06h11.03c.525 0 1.048-.034 1.57-.1.823-.106 1.597-.35 2.296-.81a5.28 5.28 0 0 0 1.88-2.207c.186-.42.293-.87.37-1.324.113-.675.138-1.358.137-2.04-.002-3.8 0-7.595-.003-11.393zm-6.423 3.99v5.712c0 .417-.058.827-.244 1.206-.29.59-.76 1.01-1.388 1.23-.882.308-1.77.293-2.647-.01-.817-.282-1.378-.802-1.63-1.65-.248-.84-.06-1.64.48-2.324.327-.414.753-.69 1.226-.9.18-.08.37-.14.558-.197.275-.086.555-.148.827-.238.28-.092.542-.21.79-.36.26-.16.458-.38.577-.66.115-.27.148-.56.148-.85 0-1.616 0-3.23-.002-4.848 0-.092-.013-.18-.03-.27-.02-.1-.06-.19-.12-.25-.055-.06-.13-.08-.2-.09-.24-.04-.49-.05-.74-.06l-4.523-.3c-.094-.006-.188-.01-.283-.004-.17.012-.333.034-.493.09-.27.092-.47.27-.6.528-.088.178-.13.368-.156.558-.01.076-.016.153-.016.23 0 2.28 0 4.56-.002 6.84 0 .26-.016.522-.063.78-.14.784-.55 1.408-1.24 1.86-.63.412-1.33.594-2.075.616-.96.027-1.876-.163-2.69-.68-.61-.387-1.058-.916-1.27-1.6-.17-.545-.17-1.104-.033-1.654.184-.738.595-1.32 1.24-1.742.47-.308 1-.49 1.56-.59.36-.064.727-.088 1.093-.125.12-.012.227-.04.34-.076.47-.15.73-.476.78-.96.004-.036 0-.073 0-.11-.002-2.15 0-4.302 0-6.453v-.228c0-.086.006-.17.017-.254.054-.412.24-.733.614-.922.23-.116.478-.164.733-.19.053-.006.107-.01.16-.014l5.622-.374c.164-.01.328-.01.492.01.372.04.695.17.96.44.24.245.37.543.416.876.015.117.018.235.018.353v8.48z'
  },
  {
    label: 'SoundCloud',
    href: 'https://soundcloud.com/brunomars',
    viewBox: '0 0 24 24',
    path: 'M1.175 12.225c-.051 0-.094.046-.101.1l-.233 2.154.233 2.105c.007.058.05.098.101.098.05 0 .09-.04.099-.098l.255-2.105-.27-2.154c0-.057-.045-.1-.09-.1m-.899.828c-.051 0-.09.04-.099.09l-.189 1.53.189 1.524c.009.05.048.09.099.09.05 0 .09-.04.099-.09l.216-1.524-.216-1.53c-.009-.05-.049-.09-.099-.09m2.693-1.663c-.05 0-.09.04-.1.098l-.254 2.816.254 2.74c.01.057.05.098.1.098.051 0 .09-.04.101-.098l.293-2.74-.293-2.816c-.011-.058-.05-.098-.101-.098m-.898.29c-.05 0-.09.04-.099.097l-.239 2.526.239 2.457c.009.057.049.097.099.097.05 0 .09-.04.099-.097l.27-2.457-.27-2.526c-.009-.057-.049-.097-.099-.097m.6-.488c-.05 0-.09.04-.099.098l-.255 3.014.255 2.921c.009.058.049.098.099.098.05 0 .09-.04.1-.098l.286-2.921-.286-3.014c-.01-.058-.05-.098-.1-.098zm.6-.444c-.05 0-.09.04-.099.098l-.255 3.458.255 3.355c.009.058.049.098.099.098.05 0 .09-.04.1-.098l.286-3.355-.286-3.458c-.01-.058-.05-.098-.1-.098zm.6-.444c-.051 0-.091.04-.1.098l-.254 3.902.254 3.786c.009.058.049.098.1.098.05 0 .09-.04.099-.098l.286-3.786-.286-3.902c-.009-.058-.049-.098-.099-.098m-6.587 1.377c-.05 0-.09.04-.099.098l-.196 2.18.196 2.114c.009.058.049.098.099.098.05 0 .09-.04.099-.098l.217-2.114-.217-2.18c-.009-.058-.049-.098-.099-.098m7.194-1.966c-.051 0-.091.04-.1.098l-.254 4.347.254 4.237c.009.057.049.098.1.098.05 0 .09-.041.099-.098l.286-4.237-.286-4.347c-.009-.058-.049-.098-.099-.098m.6-.517c-.051 0-.091.04-.1.098l-.255 4.864.255 4.728c.009.058.049.098.1.098.05 0 .09-.04.099-.098l.286-4.728-.286-4.864c-.009-.058-.049-.098-.099-.098m.6-.575c-.05 0-.09.04-.099.098l-.255 5.439.255 5.301c.009.058.049.098.099.098.05 0 .09-.04.1-.098l.286-5.301-.286-5.439c-.01-.058-.05-.098-.1-.098m.6-.574c-.051 0-.091.04-.1.098l-.254 6.013.254 5.874c.009.058.049.098.1.098.05 0 .09-.04.099-.098l.286-5.874-.286-6.013c-.009-.058-.049-.098-.099-.098m.6-.605c-.05 0-.09.04-.099.098l-.255 6.618.255 6.44c.009.058.049.098.099.098.05 0 .09-.04.1-.098l.285-6.44-.285-6.618c-.01-.058-.05-.098-.1-.098zm4.188-2.025c-.17 0-.34.012-.51.037-.054.007-.077.046-.087.097-.01.275-.013 1.945-.013 1.946l.271 8.041c0 .053.044.096.099.096h.24c.055 0 .098-.043.098-.096V7.174c0-.463-.375-.84-.838-.84h-.84z'
  }
];

const HomeFooter = () => {
  return (
    <>
      <style>{`
        .home-footer-wrapper {
          width: 100%;
          height: 100%;
          background: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1.56vw 1rem;
          text-align: center;
        }

        .home-footer-inner {
          width: 100%;
        }

        .home-footer-social {
          list-style: none;
          margin: 0;
          padding: 0;
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 1.15vw;
          flex-wrap: wrap;
        }

        .home-footer-social-item {
          margin: 0;
        }

        .home-footer-social-link {
          width: 1.25vw;
          min-width: 18px;
          max-width: 22px;
          height: 1.25vw;
          min-height: 18px;
          max-height: 22px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          color: #000;
          border: none;
          text-decoration: none;
          transition: opacity 0.2s ease;
        }

        .home-footer-social-link:hover {
          opacity: 0.6;
        }

        .home-footer-social-link svg {
          width: 100%;
          height: 100%;
          display: block;
          fill: currentColor;
        }

        .home-footer-track {
          margin-top: 0.95vw;
        }

        .home-footer-track a {
          color: #000;
          text-decoration: none;
          border: none;
          font-family: 'Poppins', sans-serif;
          font-weight: 600;
          font-size: 0.57vw;
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }

        .home-footer-track a:hover {
          opacity: 0.6;
        }

        .home-footer-meta {
          margin-top: 1.2vw;
          color: #000;
          font-family: 'Poppins', sans-serif;
          font-weight: 600;
          font-size: 0.57vw;
          line-height: 1.8;
          text-transform: uppercase;
        }

        .home-footer-meta a,
        .home-footer-meta button {
          color: #000;
          text-decoration: none;
          border: none;
          background: transparent;
          font: inherit;
          text-transform: uppercase;
          cursor: pointer;
          padding: 0;
        }

        .home-footer-meta a:hover,
        .home-footer-meta button:hover {
          opacity: 0.6;
        }

        .home-footer-break {
          display: none;
        }

        @media (max-width: 1024px) {
          .home-footer-wrapper {
            padding: 7vw 1rem;
          }

          .home-footer-social {
            gap: 4.2vw;
          }

          .home-footer-social-link {
            width: 4vw;
            min-width: 20px;
            height: 4vw;
            min-height: 20px;
          }

          .home-footer-track {
            margin-top: 4.4vw;
          }

          .home-footer-track a,
          .home-footer-meta,
          .home-footer-meta a,
          .home-footer-meta button {
            font-size: 2.4vw;
          }

          .home-footer-meta {
            margin-top: 5.2vw;
          }

          .home-footer-break {
            display: block;
          }
        }
      `}</style>

      <div className="home-footer-wrapper">
        <div className="home-footer-inner">
          <ul className="home-footer-social">
            {socialLinks.map((item) => (
              <li key={item.label} className="home-footer-social-item">
                <a
                  href={item.href}
                  target="_blank"
                  rel="noreferrer"
                  className="home-footer-social-link"
                  aria-label={item.label}
                  title={item.label}
                >
                  <svg viewBox={item.viewBox} aria-hidden="true">
                    <path d={item.path} />
                  </svg>
                </a>
              </li>
            ))}
          </ul>

          <div className="home-footer-track">
            <Link to="/booking-status">Track Booking</Link>
          </div>

          <div className="home-footer-meta">
            <span>Copyright {new Date().getFullYear()} Atlantic Records</span>
            <span> | </span>
            <a href="https://privacy.wmg.com/atlantic/privacy-policy" target="_blank" rel="noreferrer">Privacy Policy</a>
            <span> | </span>
            <a href="https://www.atlanticrecords.com/terms-of-use" target="_blank" rel="noreferrer">Terms of Use</a>
            <span> | </span>
            <br className="home-footer-break" />
            <a href="https://www.wminewmedia.com/cookies-policy/" target="_blank" rel="noreferrer">Cookies Policy</a>
            <span> | </span>
            <button type="button">Cookies Settings</button>
          </div>
        </div>
      </div>
    </>
  );
};

export default HomeFooter;

