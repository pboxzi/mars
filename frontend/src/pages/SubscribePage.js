import React, { useState } from 'react';
import Navigation from '../components/Navigation';
import Footer from '../components/Footer';
import TurnstileField, { isTurnstileEnabled } from '../components/TurnstileField';
import { trackSubscribeSubmitted } from '../utils/adTracking';
import { subscribeEmail } from '../utils/subscribe';

const SubscribePage = () => {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [honeypot, setHoneypot] = useState('');
  const [captchaToken, setCaptchaToken] = useState('');
  const [captchaError, setCaptchaError] = useState('');
  const [captchaResetSignal, setCaptchaResetSignal] = useState(0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setCaptchaError('');

    if (isTurnstileEnabled && !captchaToken) {
      setCaptchaError('Please complete the security check.');
      return;
    }

    setLoading(true);

    try {
      await subscribeEmail(email, 'subscribe-page', {
        captchaToken,
        website: honeypot
      });
      trackSubscribeSubmitted({ source: 'subscribe-page' });
      setSubmitted(true);
      setEmail('');
      setHoneypot('');
      setCaptchaToken('');
      setCaptchaResetSignal((current) => current + 1);
      setTimeout(() => setSubmitted(false), 3000);
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        .subscribe-page-container {
          background: #fff;
          min-height: 100vh;
          padding-top: 100px;
          padding-bottom: 60px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        }
        
        .subscribe-title {
          text-align: center;
          font-family: 'Poppins', sans-serif;
          font-weight: 300;
          font-size: 4.5rem;
          letter-spacing: 0.1em;
          color: #d32f2f;
          margin-bottom: 40px;
          text-transform: uppercase;
        }
        
        .subscribe-description {
          text-align: center;
          font-family: 'Poppins', sans-serif;
          font-weight: 400;
          font-size: 1.2rem;
          color: #666;
          max-width: 600px;
          margin-bottom: 60px;
          line-height: 1.6;
        }
        
        .subscribe-form {
          max-width: 500px;
          width: 100%;
          padding: 0 20px;
        }
        
        .subscribe-input {
          width: 100%;
          padding: 15px 20px;
          font-family: 'Poppins', sans-serif;
          font-size: 1rem;
          border: 2px solid #000;
          outline: none;
          margin-bottom: 20px;
          text-align: center;
          text-transform: uppercase;
        }
        
        .subscribe-button {
          width: 100%;
          background: #000;
          color: #fff;
          border: none;
          padding: 15px 40px;
          font-family: 'Poppins', sans-serif;
          font-weight: 600;
          font-size: 1rem;
          text-transform: uppercase;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .subscribe-button:hover {
          background: #333;
        }
        
        .subscribe-success {
          text-align: center;
          font-family: 'Poppins', sans-serif;
          font-weight: 600;
          font-size: 1.1rem;
          color: #d32f2f;
          margin-top: 20px;
        }

        .subscribe-error {
          text-align: center;
          font-family: 'Poppins', sans-serif;
          font-weight: 500;
          font-size: 0.95rem;
          color: #a61b1b;
          margin-top: 16px;
        }
        
        @media only screen and (max-width: 768px) {
          .subscribe-title {
            font-size: 2.5rem;
            margin-bottom: 30px;
          }
          
          .subscribe-description {
            font-size: 1rem;
            margin-bottom: 40px;
          }
        }
      `}</style>
      
      <Navigation />
      
      <div className="subscribe-page-container">
        <h1 className="subscribe-title">Stay Updated</h1>
        
        <p className="subscribe-description">
          Subscribe to get the latest news, tour dates, exclusive content, and special offers from Bruno Mars.
        </p>
        
        <form className="subscribe-form" onSubmit={handleSubmit}>
          <input
            type="text"
            value={honeypot}
            onChange={(e) => setHoneypot(e.target.value)}
            tabIndex="-1"
            autoComplete="off"
            className="hidden"
            aria-hidden="true"
          />
          <input
            type="email"
            className="subscribe-input"
            placeholder="Enter Your Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <TurnstileField
            token={captchaToken}
            onTokenChange={(nextToken) => {
              setCaptchaToken(nextToken);
              if (nextToken) {
                setCaptchaError('');
                setError('');
              }
            }}
            resetSignal={captchaResetSignal}
            error={captchaError}
          />
          <button type="submit" className="subscribe-button" disabled={loading}>
            {loading ? 'Submitting...' : 'Subscribe'}
          </button>
          
          {submitted && (
            <div className="subscribe-success">
              Thank you for subscribing!
            </div>
          )}
          {error && <div className="subscribe-error">{error}</div>}
        </form>
      </div>
      
      <Footer />
    </>
  );
};

export default SubscribePage;
