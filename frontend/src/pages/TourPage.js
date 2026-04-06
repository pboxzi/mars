import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import Navigation from '../components/Navigation';
import HomeFooter from '../components/HomeFooter';
import BookingModal from '../components/BookingModal';
import useSupportSettings from '../hooks/useSupportSettings';
import {
  PREMIUM_TICKET_DETAILS,
  getTicketTierDescription,
  getTicketTierLabel
} from '../utils/ticketTiers';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;
const TOUR_TITLE_IMAGE =
  'https://www.brunomars.com/sites/g/files/g2000021186/files/2026-01/Tour_title_img.png';

const FEATURED_ACCESS_KEYS = ['vip', 'meetgreet', 'soundcheck', 'hospitality'];

const benefitCards = [
  {
    title: 'Arrive Better',
    body: 'Start the night with a smoother premium-entry experience and a more elevated arrival flow.'
  },
  {
    title: 'Choose Your Night',
    body: 'Pick the experience that fits your plans, from VIP access to hosted premium hospitality.'
  },
  {
    title: 'Stay In Control',
    body: 'Your request comes with a confirmation number and a clear path to follow from start to finish.'
  }
];

const requestSteps = [
  {
    step: '01',
    title: 'Choose Your Experience',
    body: 'Start with the featured premium options and pick the access level that fits your night.'
  },
  {
    step: '02',
    title: 'Enter Your Details',
    body: 'Complete the short form with your guest details and preferred date so your access request can be prepared.'
  },
  {
    step: '03',
    title: 'Continue To Confirmation',
    body: 'Once the request is accepted, you receive the next steps and can track the booking through confirmation.'
  }
];

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0
});

const formatTourDate = (dateValue) => {
  if (!dateValue) {
    return '';
  }

  const parsedDate = new Date(`${dateValue}T00:00:00`);
  if (Number.isNaN(parsedDate.getTime())) {
    return dateValue;
  }

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric'
  }).format(parsedDate);
};

const formatTourTime = (timeValue) => {
  if (!timeValue) {
    return '';
  }

  if (timeValue.toUpperCase().includes('AM') || timeValue.toUpperCase().includes('PM')) {
    return timeValue;
  }

  const parsedDate = new Date(`1970-01-01T${timeValue}`);
  if (Number.isNaN(parsedDate.getTime())) {
    return timeValue;
  }

  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit'
  }).format(parsedDate);
};

const getEventTimestamp = (event) => {
  const parsedDate = new Date(`${event.date || ''}T${event.time || '00:00'}`);
  if (!Number.isNaN(parsedDate.getTime())) {
    return parsedDate.getTime();
  }

  const fallbackDate = new Date(`${event.date || ''}T00:00:00`);
  if (!Number.isNaN(fallbackDate.getTime())) {
    return fallbackDate.getTime();
  }

  return Number.MAX_SAFE_INTEGER;
};

const TourPage = () => {
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [selectedTicketType, setSelectedTicketType] = useState('vip');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [slowLoad, setSlowLoad] = useState(false);
  const { supportSettings } = useSupportSettings();

  useEffect(() => {
    if (!loading) {
      setSlowLoad(false);
      return undefined;
    }

    const timer = window.setTimeout(() => {
      setSlowLoad(true);
    }, 6000);

    return () => {
      window.clearTimeout(timer);
    };
  }, [loading]);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await axios.get(`${API}/events`);
        setEvents(Array.isArray(response.data) ? response.data : []);
      } catch (fetchError) {
        console.error('Error fetching events:', fetchError);
        setError('Unable to load tour dates right now.');
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  const sortedEvents = useMemo(
    () =>
      [...events].sort((left, right) => {
        return getEventTimestamp(left) - getEventTimestamp(right);
      }),
    [events]
  );

  const headlineEvent = sortedEvents[0] || null;

  const featuredAccess = useMemo(
    () =>
      FEATURED_ACCESS_KEYS.map((ticketType) => PREMIUM_TICKET_DETAILS[ticketType]).filter(Boolean),
    []
  );

  const contactLine = [
    supportSettings.support_whatsapp ? `WhatsApp: ${supportSettings.support_whatsapp}` : null,
    supportSettings.support_phone ? `Phone: ${supportSettings.support_phone}` : null,
    supportSettings.support_email ? supportSettings.support_email : null
  ]
    .filter(Boolean)
    .join(' | ');

  const openRequest = (event, ticketType = 'vip') => {
    if (!event) {
      return;
    }

    setSelectedTicketType(ticketType);
    setSelectedEvent(event);
  };

  return (
    <>
      <style>{`
        body {
          margin: 0;
          background: #fff;
          font-family: 'Poppins', sans-serif;
        }

        .tour-sales-shell {
          min-height: 100vh;
          background:
            radial-gradient(circle at top, rgba(157, 23, 43, 0.09), transparent 28%),
            linear-gradient(180deg, #fffaf3 0%, #ffffff 30%, #f8f3eb 100%);
          padding-top: clamp(100px, 9vw, 150px);
        }

        .tour-sales-container {
          width: min(1180px, calc(100vw - 32px));
          margin: 0 auto;
          padding-bottom: clamp(56px, 7vw, 110px);
        }

        .tour-sales-section {
          scroll-margin-top: 120px;
        }

        .tour-sales-hero {
          display: grid;
          grid-template-columns: minmax(0, 1.15fr) minmax(320px, 0.85fr);
          gap: clamp(22px, 4vw, 54px);
          align-items: center;
        }

        .tour-sales-kicker {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          border-radius: 999px;
          border: 1px solid rgba(157, 23, 43, 0.14);
          background: rgba(157, 23, 43, 0.06);
          padding: 10px 16px;
          color: #9d172b;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.22em;
          text-transform: uppercase;
        }

        .tour-sales-copy h1 {
          margin: 18px 0 0;
          color: #151515;
          font-size: clamp(40px, 6vw, 82px);
          line-height: 0.94;
          letter-spacing: -0.07em;
          text-transform: uppercase;
        }

        .tour-sales-copy p {
          margin: 18px 0 0;
          max-width: 680px;
          color: #594f46;
          font-size: clamp(16px, 1.45vw, 18px);
          line-height: 1.8;
        }

        .tour-sales-trust {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          margin-top: 22px;
        }

        .tour-sales-trust span {
          border-radius: 999px;
          background: #fff;
          border: 1px solid #eadcca;
          padding: 10px 14px;
          color: #4f453c;
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        .tour-sales-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          margin-top: 28px;
        }

        .tour-sales-action-primary,
        .tour-sales-action-secondary,
        .tour-request-button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 999px;
          padding: 15px 22px;
          font-size: 13px;
          font-weight: 800;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          text-decoration: none;
          transition: transform 0.18s ease, opacity 0.18s ease, background-color 0.18s ease;
          cursor: pointer;
        }

        .tour-sales-action-primary,
        .tour-request-button {
          background: #151515;
          color: #fff;
          border: 1px solid #151515;
        }

        .tour-sales-action-secondary {
          background: transparent;
          color: #151515;
          border: 1px solid #cfbea8;
        }

        .tour-sales-action-primary:hover,
        .tour-sales-action-secondary:hover,
        .tour-request-button:hover {
          transform: translateY(-1px);
          opacity: 0.92;
        }

        .tour-hero-card {
          overflow: hidden;
          border-radius: 30px;
          border: 1px solid #eadcca;
          background: linear-gradient(180deg, #fff9f0 0%, #fff 100%);
          box-shadow: 0 24px 70px rgba(47, 25, 10, 0.08);
        }

        .tour-hero-card-image {
          padding: 26px 26px 10px;
          background: linear-gradient(180deg, #f6eadc 0%, #fffaf2 100%);
        }

        .tour-hero-card-image img {
          display: block;
          width: 100%;
          max-width: 360px;
          margin: 0 auto;
          height: auto;
        }

        .tour-hero-card-body {
          padding: 0 26px 26px;
        }

        .tour-hero-card-label {
          color: #8b7c6d;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.2em;
          text-transform: uppercase;
        }

        .tour-hero-card-body h2 {
          margin: 10px 0 0;
          color: #151515;
          font-size: clamp(28px, 3vw, 40px);
          line-height: 0.98;
          letter-spacing: -0.05em;
          text-transform: uppercase;
        }

        .tour-hero-card-meta {
          margin-top: 16px;
          padding-top: 16px;
          border-top: 1px solid #efe3d3;
          color: #4f453c;
          font-size: 14px;
          line-height: 1.8;
        }

        .tour-hero-card-note {
          margin-top: 14px;
          border-radius: 18px;
          background: #f5ecdf;
          padding: 14px 16px;
          color: #594f46;
          font-size: 13px;
          line-height: 1.7;
        }

        .tour-hero-card-cta {
          width: 100%;
          margin-top: 18px;
        }

        .tour-sales-grid-3 {
          display: grid;
          gap: 16px;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          margin-top: 22px;
        }

        .tour-sales-card {
          border-radius: 26px;
          border: 1px solid #e7dac8;
          background: #fff;
          padding: 22px;
          box-shadow: 0 18px 46px rgba(47, 25, 10, 0.05);
        }

        .tour-sales-card h3 {
          margin: 0;
          color: #151515;
          font-size: 22px;
          line-height: 1.08;
          letter-spacing: -0.04em;
          text-transform: uppercase;
        }

        .tour-sales-card p {
          margin: 12px 0 0;
          color: #5e544a;
          font-size: 14px;
          line-height: 1.8;
        }

        .tour-section-heading {
          margin-top: clamp(42px, 6vw, 74px);
        }

        .tour-section-heading .tour-sales-kicker {
          margin-bottom: 14px;
        }

        .tour-section-heading h2 {
          margin: 0;
          color: #151515;
          font-size: clamp(30px, 4vw, 54px);
          line-height: 0.96;
          letter-spacing: -0.06em;
          text-transform: uppercase;
        }

        .tour-section-heading p {
          margin: 14px 0 0;
          max-width: 760px;
          color: #5c5248;
          font-size: 15px;
          line-height: 1.85;
        }

        .tour-access-grid {
          display: grid;
          gap: 16px;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          margin-top: 24px;
        }

        .tour-access-card {
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          gap: 18px;
          border-radius: 26px;
          border: 1px solid #e6d8c7;
          background: linear-gradient(180deg, #fffdf9 0%, #fff 100%);
          padding: 22px;
        }

        .tour-access-price {
          margin-top: 14px;
          color: #151515;
          font-size: 28px;
          font-weight: 900;
          line-height: 1;
          letter-spacing: -0.04em;
        }

        .tour-access-meta {
          margin-top: 6px;
          color: #87786a;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.18em;
          text-transform: uppercase;
        }

        .tour-access-note {
          margin-top: 14px;
          color: #5e544a;
          font-size: 13px;
          line-height: 1.75;
        }

        .tour-steps-grid {
          display: grid;
          gap: 16px;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          margin-top: 24px;
        }

        .tour-step-card {
          border-radius: 26px;
          border: 1px solid #e7dac8;
          background: #fff;
          padding: 22px;
        }

        .tour-step-number {
          color: #9d172b;
          font-size: 12px;
          font-weight: 800;
          letter-spacing: 0.2em;
          text-transform: uppercase;
        }

        .tour-step-card h3 {
          margin: 12px 0 0;
          color: #151515;
          font-size: 22px;
          line-height: 1.08;
          letter-spacing: -0.04em;
          text-transform: uppercase;
        }

        .tour-step-card p {
          margin: 12px 0 0;
          color: #5d5349;
          font-size: 14px;
          line-height: 1.8;
        }

        .tour-date-grid {
          display: grid;
          gap: 14px;
          margin-top: 24px;
        }

        .tour-date-card {
          display: grid;
          grid-template-columns: minmax(140px, 0.26fr) minmax(0, 1fr) auto;
          gap: 18px;
          align-items: center;
          border-radius: 24px;
          border: 1px solid #e5d8c7;
          background: #fff;
          padding: 18px 20px;
        }

        .tour-date-card-date {
          color: #151515;
          font-size: 18px;
          font-weight: 800;
          line-height: 1.3;
          text-transform: uppercase;
        }

        .tour-date-card-time {
          margin-top: 4px;
          color: #8b7c6d;
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.16em;
          text-transform: uppercase;
        }

        .tour-date-card h3 {
          margin: 0;
          color: #151515;
          font-size: 22px;
          line-height: 1.06;
          letter-spacing: -0.04em;
          text-transform: uppercase;
        }

        .tour-date-card p {
          margin: 6px 0 0;
          color: #5b5147;
          font-size: 14px;
          line-height: 1.7;
        }

        .tour-status-message {
          border-radius: 24px;
          border: 1px solid #e7dac8;
          background: #fff;
          padding: 20px;
          color: #151515;
          font-size: 15px;
          font-weight: 600;
          line-height: 1.8;
          text-align: center;
        }

        .tour-status-message span {
          display: block;
          margin-top: 10px;
          color: #6d6257;
          font-size: 13px;
          font-weight: 500;
        }

        .tour-support-card {
          display: grid;
          grid-template-columns: minmax(0, 1.15fr) auto;
          gap: 18px;
          align-items: center;
          border-radius: 28px;
          border: 1px solid #eadcca;
          background: linear-gradient(180deg, #fff9f1 0%, #fff 100%);
          padding: 24px;
          margin-top: 24px;
        }

        .tour-support-card h3 {
          margin: 0;
          color: #151515;
          font-size: 28px;
          line-height: 1;
          letter-spacing: -0.05em;
          text-transform: uppercase;
        }

        .tour-support-card p {
          margin: 12px 0 0;
          color: #5e544a;
          font-size: 14px;
          line-height: 1.8;
        }

        .tour-support-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          justify-content: flex-end;
        }

        .tour-footer-shell {
          background: #fff;
        }

        @media only screen and (max-width: 1024px) {
          .tour-sales-shell {
            padding-top: 110px;
          }

          .tour-sales-container {
            width: min(100vw - 24px, 100%);
          }

          .tour-sales-hero,
          .tour-support-card,
          .tour-date-card {
            grid-template-columns: 1fr;
          }

          .tour-sales-grid-3,
          .tour-access-grid,
          .tour-steps-grid {
            grid-template-columns: 1fr;
          }

          .tour-sales-copy h1 {
            font-size: clamp(38px, 14vw, 66px);
          }

          .tour-support-actions {
            justify-content: flex-start;
          }

          .tour-request-button,
          .tour-sales-action-primary,
          .tour-sales-action-secondary {
            width: 100%;
          }
        }
      `}</style>

      <Navigation />

      <main className="tour-sales-shell">
        <div className="tour-sales-container">
          <section className="tour-sales-hero tour-sales-section">
            <div className="tour-sales-copy">
              <div className="tour-sales-kicker">The Romantic Tour Premium Access</div>
              <h1>Choose How You Want To Experience The Night</h1>
              <p>
                From VIP arrival to private hosted access, select the experience that fits your night and continue into
                the premium access flow for your preferred Bruno Mars date.
              </p>

              <div className="tour-sales-trust">
                <span>VIP Entry Options</span>
                <span>Hosted Premium Access</span>
                <span>Trackable Confirmation</span>
              </div>

              <div className="tour-sales-actions">
                <a href="#access-options" className="tour-sales-action-primary">
                  View Access Options
                </a>
                <a href="#tour-dates" className="tour-sales-action-secondary">
                  View Tour Dates
                </a>
              </div>
            </div>

            <div className="tour-hero-card">
              <div className="tour-hero-card-image">
                <img src={TOUR_TITLE_IMAGE} alt="The Romantic Tour" />
              </div>

              <div className="tour-hero-card-body">
                {headlineEvent ? (
                  <>
                    <div className="tour-hero-card-label">Now Open For</div>
                    <h2>{headlineEvent.city}</h2>

                    <div className="tour-hero-card-meta">
                      <strong>{headlineEvent.venue}</strong>
                      <br />
                      {formatTourDate(headlineEvent.date)}
                      {headlineEvent.time ? ` | ${formatTourTime(headlineEvent.time)}` : ''}
                    </div>

                    <div className="tour-hero-card-note">
                      Choose your preferred access, continue with your request, and keep your confirmation number ready
                      for the next step.
                    </div>

                    <button
                      type="button"
                      className="tour-request-button tour-hero-card-cta"
                      onClick={() => openRequest(headlineEvent, 'vip')}
                    >
                      Get Premium Access
                    </button>
                  </>
                ) : (
                  <>
                    <div className="tour-hero-card-label">Tour Access Status</div>
                    <h2>{loading ? 'Loading' : 'Unavailable'}</h2>
                    <div className="tour-hero-card-note">
                      {loading
                        ? 'Tour dates are loading now. You can still review the featured access options below.'
                        : 'Tour dates are not available right now. Please check back shortly.'}
                    </div>
                  </>
                )}
              </div>
            </div>
          </section>

          <section className="tour-sales-section">
            <div className="tour-section-heading">
              <div className="tour-sales-kicker">Why Continue</div>
              <h2>Make The Night Feel Bigger</h2>
              <p>
                Premium access should feel exciting, simple, and worth continuing. These options are designed to give
                the night more comfort, more access, and a more elevated feel from the start.
              </p>
            </div>

            <div className="tour-sales-grid-3">
              {benefitCards.map((card) => (
                <div key={card.title} className="tour-sales-card">
                  <h3>{card.title}</h3>
                  <p>{card.body}</p>
                </div>
              ))}
            </div>
          </section>

          <section id="access-options" className="tour-sales-section">
            <div className="tour-section-heading">
              <div className="tour-sales-kicker">Featured Access</div>
              <h2>Choose Your Experience</h2>
              <p>
                Start with the featured access levels below. If you want something more private or more hosted, you can
                continue to additional options inside the premium access flow.
              </p>
            </div>

            <div className="tour-access-grid">
              {featuredAccess.map((tier) => (
                <div key={tier.type} className="tour-access-card">
                  <div>
                    <h3>{getTicketTierLabel(tier.type)}</h3>
                    <div className="tour-access-price">{currencyFormatter.format(tier.priceUsd)}</div>
                    <div className="tour-access-meta">Starting Price</div>
                    <p className="tour-access-note">{getTicketTierDescription(tier.type)}</p>
                  </div>

                  <button
                    type="button"
                    className="tour-request-button"
                    disabled={!headlineEvent}
                    onClick={() => openRequest(headlineEvent, tier.type)}
                  >
                    {headlineEvent ? 'Choose This Access' : 'Tour Dates Loading'}
                  </button>
                </div>
              ))}
            </div>
          </section>

          <section className="tour-sales-section">
            <div className="tour-section-heading">
              <div className="tour-sales-kicker">What Happens Next</div>
              <h2>Simple Next Steps</h2>
              <p>
                The process is simple: choose your experience, enter your details, and continue with your confirmation.
              </p>
            </div>

            <div className="tour-steps-grid">
              {requestSteps.map((item) => (
                <div key={item.step} className="tour-step-card">
                  <div className="tour-step-number">Step {item.step}</div>
                  <h3>{item.title}</h3>
                  <p>{item.body}</p>
                </div>
              ))}
            </div>
          </section>

          <section id="tour-dates" className="tour-sales-section">
            <div className="tour-section-heading">
              <div className="tour-sales-kicker">Choose Your Show</div>
              <h2>Pick Your Show Date</h2>
              <p>
                Choose the city you want, then continue into the premium access flow for that show.
              </p>
            </div>

            {loading && (
              <div className="tour-status-message">
                Loading Tour Dates
                {slowLoad && <span>First visit may take a few seconds while the live server wakes up.</span>}
              </div>
            )}

            {!loading && error && <div className="tour-status-message">{error}</div>}

            {!loading && !error && sortedEvents.length === 0 && (
              <div className="tour-status-message">No tour dates are available right now.</div>
            )}

            {!loading && !error && sortedEvents.length > 0 && (
              <div className="tour-date-grid">
                {sortedEvents.map((event) => (
                  <div key={event.id} className="tour-date-card" data-testid={`tour-event-${event.id}`}>
                    <div>
                      <div className="tour-date-card-date">{formatTourDate(event.date)}</div>
                      <div className="tour-date-card-time">{formatTourTime(event.time)}</div>
                    </div>

                    <div>
                      <h3>{event.venue}</h3>
                      <p>{event.city}</p>
                    </div>

                    <button
                      type="button"
                      className="tour-request-button"
                      onClick={() => openRequest(event, 'vip')}
                      data-testid={`request-access-button-${event.id}`}
                    >
                      Choose Date
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="tour-sales-section">
            <div className="tour-support-card">
              <div>
                <h3>Need Help Choosing?</h3>
                <p>
                  Speak with guest support if you need help choosing the right access level or following your confirmation.
                  {contactLine ? ` ${contactLine}` : ''}
                  {supportSettings.support_hours ? ` Response hours: ${supportSettings.support_hours}.` : ''}
                </p>
              </div>

              <div className="tour-support-actions">
                <Link to="/booking-status" className="tour-sales-action-secondary">
                  Track Booking
                </Link>
                {headlineEvent ? (
                  <button
                    type="button"
                    className="tour-sales-action-primary"
                    onClick={() => openRequest(headlineEvent, 'vip')}
                  >
                    Continue To Access
                  </button>
                ) : null}
              </div>
            </div>
          </section>
        </div>
      </main>

      <div className="tour-footer-shell">
        <HomeFooter />
      </div>

      {selectedEvent && (
        <BookingModal
          event={selectedEvent}
          initialTicketType={selectedTicketType}
          onClose={() => {
            setSelectedEvent(null);
            setSelectedTicketType('vip');
          }}
        />
      )}
    </>
  );
};

export default TourPage;
