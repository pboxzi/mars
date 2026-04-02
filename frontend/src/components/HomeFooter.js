import React from 'react';

const HomeFooter = () => {
  return (
    <>
      <style>{`
        .home-footer-wrapper {
          background: #fff;
          padding: 60px 20px 40px;
          text-align: center;
        }
        
        .home-footer-social {
          list-style: none;
          padding: 0;
          margin: 0 0 40px 0;
          display: flex;
          justify-content: center;
          gap: 30px;
          flex-wrap: wrap;
        }
        
        .home-footer-social li {
          margin: 0;
        }
        
        .home-footer-social a {
          color: #000;
          text-decoration: none;
          font-family: 'Poppins', sans-serif;
          font-size: 0.9rem;
          font-weight: 500;
          transition: opacity 0.2s;
          text-transform: capitalize;
        }
        
        .home-footer-social a:hover {
          opacity: 0.6;
        }
        
        .home-footer-copyright {
          color: #666;
          font-size: 0.85rem;
          font-family: 'Poppins', sans-serif;
          line-height: 1.8;
        }
        
        .home-footer-copyright a {
          color: #666;
          text-decoration: none;
        }
        
        .home-footer-copyright a:hover {
          color: #000;
        }
        
        @media (max-width: 768px) {
          .home-footer-social {
            gap: 20px;
          }
          
          .home-footer-social a {
            font-size: 0.85rem;
          }
        }
      `}</style>
      
      <div className="home-footer-wrapper">
        <ul className="home-footer-social">
          <li>
            <a href="https://www.facebook.com/brunomars" target="_blank" rel="noopener noreferrer">
              Facebook
            </a>
          </li>
          <li>
            <a href="https://twitter.com/BRUNOMARS" target="_blank" rel="noopener noreferrer">
              X
            </a>
          </li>
          <li>
            <a href="https://www.instagram.com/brunomars/" target="_blank" rel="noopener noreferrer">
              Instagram
            </a>
          </li>
          <li>
            <a href="https://www.youtube.com/brunomars" target="_blank" rel="noopener noreferrer">
              YouTube
            </a>
          </li>
          <li>
            <a href="https://play.spotify.com/artist/0du5cEVh5yTK9QJze8zA0C" target="_blank" rel="noopener noreferrer">
              Spotify
            </a>
          </li>
          <li>
            <a href="https://smarturl.it/BMappleartistpage" target="_blank" rel="noopener noreferrer">
              Apple Music
            </a>
          </li>
          <li>
            <a href="https://soundcloud.com/brunomars" target="_blank" rel="noopener noreferrer">
              SoundCloud
            </a>
          </li>
        </ul>
        
        <div className="home-footer-copyright">
          <span>© </span>
          <span>{new Date().getFullYear()} Atlantic records</span>
          <span> | </span>
          <a href="https://privacy.wmg.com/atlantic/privacy-policy" target="_blank" rel="noopener noreferrer">Privacy Policy</a>
          <span> | </span>
          <a href="https://www.atlanticrecords.com/terms-of-use" target="_blank" rel="noopener noreferrer">Terms of Use</a>
          <span> | </span>
          <br className="br-mob" />
          <a href="https://www.wminewmedia.com/cookies-policy/" target="_blank" rel="noopener noreferrer">Cookies Policy</a>
          <span> | </span>
          <a href="#" className="cookies-settings" style={{ cursor: 'pointer' }}>Cookies Settings</a>
        </div>
      </div>
    </>
  );
};

export default HomeFooter;
