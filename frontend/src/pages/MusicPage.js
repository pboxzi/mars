import React from 'react';
import Navigation from '../components/Navigation';
import Footer from '../components/Footer';

const MusicPage = () => {
  return (
    <>
      <style>{`
        .music-page-container {
          background: #fff;
          min-height: 100vh;
          padding-top: 100px;
          padding-bottom: 60px;
        }
        
        .music-title {
          text-align: center;
          font-family: 'Poppins', sans-serif;
          font-weight: 300;
          font-size: 4.5rem;
          letter-spacing: 0.1em;
          color: #d32f2f;
          margin: 60px auto 80px;
          text-transform: uppercase;
        }
        
        .music-grid {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 40px;
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 40px;
        }
        
        .music-item {
          text-align: center;
        }
        
        .music-item img {
          width: 100%;
          height: auto;
          margin-bottom: 20px;
          transition: transform 0.3s ease;
        }
        
        .music-item img:hover {
          transform: scale(1.05);
        }
        
        .music-item-title {
          font-family: 'Poppins', sans-serif;
          font-weight: 600;
          font-size: 1.1rem;
          color: #000;
          text-transform: uppercase;
          margin-bottom: 10px;
        }
        
        .music-item-link {
          display: inline-block;
          background: #000;
          color: #fff;
          padding: 10px 30px;
          font-family: 'Poppins', sans-serif;
          font-weight: 600;
          font-size: 0.85rem;
          text-transform: uppercase;
          text-decoration: none;
          transition: background 0.2s ease;
        }
        
        .music-item-link:hover {
          background: #333;
        }
        
        @media only screen and (max-width: 768px) {
          .music-title {
            font-size: 2.5rem;
            margin: 40px auto 50px;
          }
          
          .music-grid {
            padding: 0 20px;
            gap: 30px;
          }
        }
      `}</style>
      
      <Navigation />
      
      <div className="music-page-container">
        <h1 className="music-title">Music</h1>
        
        <div className="music-grid">
          {/* The Romantic Album */}
          <div className="music-item">
            <a href="https://brunomars.lnk.to/theromantic" target="_blank" rel="noopener noreferrer">
              <img 
                src="https://www.brunomars.com/sites/g/files/g2000021861/files/2026-01/Vinyl.png"
                alt="The Romantic"
              />
            </a>
            <div className="music-item-title">The Romantic</div>
            <a 
              href="https://brunomars.lnk.to/theromantic" 
              target="_blank" 
              rel="noopener noreferrer"
              className="music-item-link"
            >
              Listen Now
            </a>
          </div>
          
          {/* Risk It All Video */}
          <div className="music-item">
            <a href="https://brunomars.lnk.to/theromantic/youtube" target="_blank" rel="noopener noreferrer">
              <img 
                src="https://www.brunomars.com/sites/g/files/g2000021861/files/2026-03/Group%205%402x.jpg"
                alt="Risk It All"
              />
            </a>
            <div className="music-item-title">Risk It All</div>
            <a 
              href="https://brunomars.lnk.to/theromantic/youtube" 
              target="_blank" 
              rel="noopener noreferrer"
              className="music-item-link"
            >
              Watch Video
            </a>
          </div>
          
          {/* I Just Might Video */}
          <div className="music-item">
            <a href="https://brunomars.lnk.to/ijustmight/youtube" target="_blank" rel="noopener noreferrer">
              <img 
                src="https://www.brunomars.com/sites/g/files/g2000021861/files/2026-01/Video_Desktop-s3ff.jpg"
                alt="I Just Might"
              />
            </a>
            <div className="music-item-title">I Just Might</div>
            <a 
              href="https://brunomars.lnk.to/ijustmight/youtube" 
              target="_blank" 
              rel="noopener noreferrer"
              className="music-item-link"
            >
              Watch Video
            </a>
          </div>
        </div>
      </div>
      
      <Footer />
    </>
  );
};

export default MusicPage;
