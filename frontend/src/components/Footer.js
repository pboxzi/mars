import React, { useState } from 'react';

const Footer = () => {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 3000);
    setEmail('');
  };

  return (
    <>
      <style>{`
        .footer-container {
          background: #000;
          color: #fff;
          padding: 80px 20px 40px;
          font-family: 'Poppins', sans-serif;
        }
        
        .footer-content {
          max-width: 500px;
          margin: 0 auto;
          text-align: center;
        }
        
        .footer-image {
          width: 200px;
          height: 280px;
          margin: 0 auto 30px;
          border-radius: 8px;
          overflow: hidden;
        }
        
        .footer-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        
        .footer-artist-name {
          font-family: 'Poppins', sans-serif;
          font-weight: 600;
          font-size: 1.2rem;
          margin-bottom: 30px;
          letter-spacing: 0.05em;
        }
        
        .footer-social-icons {
          display: flex;
          justify-content: center;
          gap: 20px;
          margin-bottom: 40px;
          flex-wrap: wrap;
        }
        
        .footer-social-icon {
          color: #fff;
          font-size: 24px;
          transition: opacity 0.2s;
        }
        
        .footer-social-icon:hover {
          opacity: 0.6;
        }
        
        .footer-subscribe-section {
          margin-bottom: 50px;
        }
        
        .footer-subscribe-title {
          font-family: 'Poppins', sans-serif;
          font-weight: 700;
          font-size: 1.8rem;
          margin-bottom: 15px;
          letter-spacing: 0.1em;
          text-transform: uppercase;
        }
        
        .footer-subscribe-subtitle {
          font-family: 'Poppins', sans-serif;
          font-weight: 400;
          font-size: 0.95rem;
          margin-bottom: 25px;
          color: #ccc;
        }
        
        .footer-subscribe-form {
          max-width: 400px;
          margin: 0 auto;
        }
        
        .footer-form-group {
          margin-bottom: 20px;
          text-align: left;
        }
        
        .footer-form-group label {
          display: block;
          font-family: 'Poppins', sans-serif;
          font-weight: 600;
          font-size: 0.75rem;
          margin-bottom: 8px;
          color: #fff;
          letter-spacing: 0.1em;
          text-transform: uppercase;
        }
        
        .footer-email-input {
          width: 100%;
          background: transparent;
          border: none;
          border-bottom: 2px solid #444;
          color: #fff;
          padding: 10px 0;
          font-size: 1rem;
          font-family: 'Poppins', sans-serif;
          transition: border-color 0.3s;
        }
        
        .footer-email-input:focus {
          outline: none;
          border-bottom-color: #fff;
        }
        
        .footer-subscribe-button {
          width: 100%;
          background: transparent;
          color: #fff;
          border: 2px solid #fff;
          padding: 14px 30px;
          font-family: 'Poppins', sans-serif;
          font-weight: 700;
          font-size: 0.9rem;
          cursor: pointer;
          transition: all 0.3s;
          text-transform: uppercase;
          letter-spacing: 0.15em;
        }
        
        .footer-subscribe-button:hover {
          background: #fff;
          color: #000;
        }
        
        .footer-success-message {
          color: #4ade80;
          font-size: 0.9rem;
          margin-top: 10px;
        }
        
        .footer-copyright {
          text-align: center;
          color: #666;
          font-size: 0.85rem;
          padding-top: 30px;
          border-top: 1px solid #333;
        }
        
        .footer-links {
          margin-top: 15px;
        }
        
        .footer-links a {
          color: #888;
          text-decoration: none;
          margin: 0 10px;
          font-size: 0.85rem;
        }
        
        .footer-links a:hover {
          color: #fff;
        }
        
        @media (max-width: 768px) {
          .footer-container {
            padding: 60px 20px 30px;
          }
          
          .footer-subscribe-title {
            font-size: 1.5rem;
          }
          
          .footer-social-icons {
            gap: 15px;
          }
        }
      `}</style>
      
      <footer className="footer-container">
        <div className="footer-content">
          {/* Artist Image */}
          <div className="footer-image">
            <img 
              src="https://www.brunomars.com/sites/g/files/g2000021861/files/2024-05/bruno-mars-footer.jpg"
              alt="Bruno Mars"
            />
          </div>
          
          {/* Artist Name */}
          <div className="footer-artist-name">Bruno Mars</div>
          
          {/* Social Media Icons */}
          <div className="footer-social-icons">
            <a href="https://open.spotify.com/artist/0du5cEVh5yTK9QJze8zA0C" target="_blank" rel="noopener noreferrer" className="footer-social-icon" title="Spotify">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/></svg>
            </a>
            <a href="https://music.apple.com/us/artist/bruno-mars/278873078" target="_blank" rel="noopener noreferrer" className="footer-social-icon" title="Apple Music">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M23.997 6.124c0-.738-.065-1.47-.24-2.19-.317-1.31-1.062-2.31-2.18-3.043C21.003.517 20.373.285 19.7.164c-.517-.093-1.038-.135-1.564-.15-.04-.003-.083-.01-.124-.013H5.988c-.152.01-.303.017-.455.026C4.786.07 4.043.15 3.34.428 2.004.958 1.04 1.88.475 3.208c-.192.448-.292.925-.363 1.408-.056.392-.088.785-.1 1.18 0 .032-.007.062-.01.093v12.223c.01.14.017.283.027.424.05.815.154 1.624.497 2.373.65 1.42 1.738 2.353 3.234 2.801.42.127.856.187 1.293.228.555.053 1.11.06 1.667.06h11.03c.525 0 1.048-.034 1.57-.1.823-.106 1.597-.35 2.296-.81a5.28 5.28 0 0 0 1.88-2.207c.186-.42.293-.87.37-1.324.113-.675.138-1.358.137-2.04-.002-3.8 0-7.595-.003-11.393zm-6.423 3.99v5.712c0 .417-.058.827-.244 1.206-.29.59-.76 1.01-1.388 1.23-.882.308-1.77.293-2.647-.01-.817-.282-1.378-.802-1.63-1.65-.248-.84-.06-1.64.48-2.324.327-.414.753-.69 1.226-.9.18-.08.37-.14.558-.197.275-.086.555-.148.827-.238.28-.092.542-.21.79-.36.26-.16.458-.38.577-.66.115-.27.148-.56.148-.85 0-1.616 0-3.23-.002-4.848 0-.092-.013-.18-.03-.27-.02-.1-.06-.19-.12-.25-.055-.06-.13-.08-.2-.09-.24-.04-.49-.05-.74-.06l-4.523-.3c-.094-.006-.188-.01-.283-.004-.17.012-.333.034-.493.09-.27.092-.47.27-.6.528-.088.178-.13.368-.156.558-.01.076-.016.153-.016.23 0 2.28 0 4.56-.002 6.84 0 .26-.016.522-.063.78-.14.784-.55 1.408-1.24 1.86-.63.412-1.33.594-2.075.616-.96.027-1.876-.163-2.69-.68-.61-.387-1.058-.916-1.27-1.6-.17-.545-.17-1.104-.033-1.654.184-.738.595-1.32 1.24-1.742.47-.308 1-.49 1.56-.59.36-.064.727-.088 1.093-.125.12-.012.227-.04.34-.076.47-.15.73-.476.78-.96.004-.036 0-.073 0-.11-.002-2.15 0-4.302 0-6.453v-.228c0-.086.006-.17.017-.254.054-.412.24-.733.614-.922.23-.116.478-.164.733-.19.053-.006.107-.01.16-.014l5.622-.374c.164-.01.328-.01.492.01.372.04.695.17.96.44.24.245.37.543.416.876.015.117.018.235.018.353v8.48z"/></svg>
            </a>
            <a href="https://www.youtube.com/brunomars" target="_blank" rel="noopener noreferrer" className="footer-social-icon" title="YouTube">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
            </a>
            <a href="https://soundcloud.com/brunomars" target="_blank" rel="noopener noreferrer" className="footer-social-icon" title="SoundCloud">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M1.175 12.225c-.051 0-.094.046-.101.1l-.233 2.154.233 2.105c.007.058.05.098.101.098.05 0 .09-.04.099-.098l.255-2.105-.27-2.154c0-.057-.045-.1-.09-.1m-.899.828c-.051 0-.09.04-.099.09l-.189 1.53.189 1.524c.009.05.048.09.099.09.05 0 .09-.04.099-.09l.216-1.524-.216-1.53c-.009-.05-.049-.09-.099-.09m2.693-1.663c-.05 0-.09.04-.1.098l-.254 2.816.254 2.74c.01.057.05.098.1.098.051 0 .09-.04.101-.098l.293-2.74-.293-2.816c-.011-.058-.05-.098-.101-.098m-.898.29c-.05 0-.09.04-.099.097l-.239 2.526.239 2.457c.009.057.049.097.099.097.05 0 .09-.04.099-.097l.27-2.457-.27-2.526c-.009-.057-.049-.097-.099-.097m.6-.488c-.05 0-.09.04-.099.098l-.255 3.014.255 2.921c.009.058.049.098.099.098.05 0 .09-.04.1-.098l.286-2.921-.286-3.014c-.01-.058-.05-.098-.1-.098zm.6-.444c-.05 0-.09.04-.099.098l-.255 3.458.255 3.355c.009.058.049.098.099.098.05 0 .09-.04.1-.098l.286-3.355-.286-3.458c-.01-.058-.05-.098-.1-.098zm.6-.444c-.051 0-.091.04-.1.098l-.254 3.902.254 3.786c.009.058.049.098.1.098.05 0 .09-.04.099-.098l.286-3.786-.286-3.902c-.009-.058-.049-.098-.099-.098m-6.587 1.377c-.05 0-.09.04-.099.098l-.196 2.18.196 2.114c.009.058.049.098.099.098.05 0 .09-.04.099-.098l.217-2.114-.217-2.18c-.009-.058-.049-.098-.099-.098m7.194-1.966c-.051 0-.091.04-.1.098l-.254 4.347.254 4.237c.009.057.049.098.1.098.05 0 .09-.041.099-.098l.286-4.237-.286-4.347c-.009-.058-.049-.098-.099-.098m.6-.517c-.051 0-.091.04-.1.098l-.255 4.864.255 4.728c.009.058.049.098.1.098.05 0 .09-.04.099-.098l.286-4.728-.286-4.864c-.009-.058-.049-.098-.099-.098m.6-.575c-.05 0-.09.04-.099.098l-.255 5.439.255 5.301c.009.058.049.098.099.098.05 0 .09-.04.1-.098l.286-5.301-.286-5.439c-.01-.058-.05-.098-.1-.098m.6-.574c-.051 0-.091.04-.1.098l-.254 6.013.254 5.874c.009.058.049.098.1.098.05 0 .09-.04.099-.098l.286-5.874-.286-6.013c-.009-.058-.049-.098-.099-.098m.6-.605c-.05 0-.09.04-.099.098l-.255 6.618.255 6.44c.009.058.049.098.099.098.05 0 .09-.04.1-.098l.285-6.44-.285-6.618c-.01-.058-.05-.098-.1-.098zm4.188-2.025c-.17 0-.34.012-.51.037-.054.007-.077.046-.087.097-.01.275-.013 1.945-.013 1.946l.271 8.041c0 .053.044.096.099.096h.24c.055 0 .098-.043.098-.096V7.174c0-.463-.375-.84-.838-.84h-.84z"/></svg>
            </a>
            <a href="https://www.instagram.com/brunomars/" target="_blank" rel="noopener noreferrer" className="footer-social-icon" title="Instagram">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/></svg>
            </a>
            <a href="https://www.tiktok.com/@brunomars" target="_blank" rel="noopener noreferrer" className="footer-social-icon" title="TikTok">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/></svg>
            </a>
            <a href="https://twitter.com/BRUNOMARS" target="_blank" rel="noopener noreferrer" className="footer-social-icon" title="X (Twitter)">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
            </a>
            <a href="https://www.amazon.com/Bruno-Mars/e/B003UJQX8K" target="_blank" rel="noopener noreferrer" className="footer-social-icon" title="Amazon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M.045 18.02c.072-.116.187-.124.348-.022 3.636 2.11 7.594 3.166 11.87 3.166 2.852 0 5.668-.533 8.447-1.595l.315-.14c.138-.06.234-.1.293-.13.226-.088.39-.046.525.13.12.174.09.336-.12.48-.256.19-.6.41-1.006.654-1.244.743-2.64 1.316-4.185 1.726-1.53.406-3.045.61-4.516.61-2.265 0-4.448-.353-6.545-1.053-2.098-.703-3.975-1.687-5.633-2.95-.236-.18-.348-.316-.348-.41 0-.09.04-.156.12-.205zm8.553-8.788c-.478.098-.84.377-1.084.837-.243.46-.365.983-.365 1.564 0 .58.113 1.104.337 1.564.226.46.582.84 1.067 1.14.487.3 1.043.45 1.667.45.624 0 1.18-.15 1.667-.45.485-.3.84-.68 1.066-1.14.225-.46.337-.983.337-1.564 0-.58-.122-1.104-.365-1.564-.244-.46-.606-.74-1.084-.837l-.337-.045c-.625 0-1.18.15-1.667.45-.486.3-.84.68-1.066 1.14-.225.46-.337.983-.337 1.564 0 .58.122 1.104.365 1.564.244.46.606.74 1.084.837.478-.098.84-.377 1.084-.837.243-.46.365-.983.365-1.564 0-.58-.113-1.104-.337-1.564-.226-.46-.582-.84-1.067-1.14-.487-.3-1.043-.45-1.667-.45-.624 0-1.18.15-1.667.45-.485.3-.84.68-1.066 1.14-.225.46-.337.983-.337 1.564z"/></svg>
            </a>
            <a href="https://www.pandora.com/artist/bruno-mars/ARrZlc7jP9vKJ6K" target="_blank" rel="noopener noreferrer" className="footer-social-icon" title="Pandora">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm-1.5 17.72V6.28c0-.193.157-.35.35-.35h1.3c.193 0 .35.157.35.35v11.44c0 .193-.157.35-.35.35h-1.3c-.193 0-.35-.157-.35-.35z"/></svg>
            </a>
            <a href="https://www.deezer.com/us/artist/145" target="_blank" rel="noopener noreferrer" className="footer-social-icon" title="Deezer">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M18.81 4.16v3.03H24V4.16h-5.19zm0 6.06v3.03H24v-3.03h-5.19zm0 6.06v3.03H24v-3.03h-5.19zM12.54 4.16v3.03h5.19V4.16h-5.19zm0 6.06v3.03h5.19v-3.03h-5.19zm0 6.06v3.03h5.19v-3.03h-5.19zM6.27 10.22v3.03h5.19v-3.03H6.27zm0 6.06v3.03h5.19v-3.03H6.27zM0 10.22v3.03h5.19v-3.03H0zm0 6.06v3.03h5.19v-3.03H0z"/></svg>
            </a>
            <a href="https://www.iheart.com/artist/bruno-mars-152939/" target="_blank" rel="noopener noreferrer" className="footer-social-icon" title="iHeartRadio">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm0 18.75c-3.728 0-6.75-3.022-6.75-6.75S8.272 5.25 12 5.25s6.75 3.022 6.75 6.75-3.022 6.75-6.75 6.75zm0-11.25c-2.485 0-4.5 2.015-4.5 4.5s2.015 4.5 4.5 4.5 4.5-2.015 4.5-4.5-2.015-4.5-4.5-4.5z"/></svg>
            </a>
          </div>
          
          {/* Subscribe Section */}
          <div className="footer-subscribe-section">
            <h2 className="footer-subscribe-title">SUBSCRIBE</h2>
            <p className="footer-subscribe-subtitle">
              Sign up for Bruno Mars news and updates
            </p>
            
            <form className="footer-subscribe-form" onSubmit={handleSubmit}>
              <div className="footer-form-group">
                <label htmlFor="email">EMAIL</label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder=""
                  className="footer-email-input"
                  required
                />
              </div>
              <button type="submit" className="footer-subscribe-button">
                SUBMIT
              </button>
              {submitted && (
                <div className="footer-success-message">✓ THANK YOU FOR SUBSCRIBING</div>
              )}
            </form>
          </div>
          
          {/* Copyright */}
          <div className="footer-copyright">
            <p>&copy; {new Date().getFullYear()} Atlantic Records</p>
            <div className="footer-links">
              <a href="https://privacy.wmg.com/atlantic/privacy-policy" target="_blank" rel="noopener noreferrer">Privacy Policy</a>
              <span> | </span>
              <a href="https://www.atlanticrecords.com/terms-of-use" target="_blank" rel="noopener noreferrer">Terms of Use</a>
              <span> | </span>
              <a href="https://www.wminewmedia.com/cookies-policy/" target="_blank" rel="noopener noreferrer">Cookies Policy</a>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
};

export default Footer;
