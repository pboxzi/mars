import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import Navigation from '../components/Navigation';
import HomeFooter from '../components/HomeFooter';
import BookingModal from '../components/BookingModal';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;
const TOUR_TITLE_IMAGE =
  'https://www.brunomars.com/sites/g/files/g2000021186/files/2026-01/Tour_title_img.png';

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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [slowLoad, setSlowLoad] = useState(false);

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

  return (
    <>
      <style>{`
        body {
          margin: 0;
          background: #fff;
          font-family: 'Poppins', sans-serif;
        }

        .tour-page-shell {
          min-height: 100vh;
          background: #fff;
          padding-top: clamp(100px, 9vw, 150px);
        }

        .tour-page-header {
          text-align: center;
        }

        .tour-page-title-image {
          width: min(46vw, 920px);
          margin: 2.5vw auto 0;
        }

        .tour-page-title-image img {
          display: block;
          width: 100%;
          height: auto;
        }

        .tour-page-content {
          padding-top: 3vw;
          padding-bottom: 5vw;
          min-height: calc(100vh - 19.4vw);
        }

        .tour-status-message {
          width: 39.7708vw;
          margin: 0 auto;
          text-align: center;
          color: #000;
          font-size: 1.0417vw;
          font-weight: 600;
          text-transform: uppercase;
          padding: 4vw 0;
        }

        .tour-status-loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.8vw;
        }

        .tour-status-kicker {
          font-size: 0.78vw;
          font-weight: 700;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: #8b1d2c;
        }

        .tour-status-title {
          font-size: 1.3021vw;
          font-weight: 700;
          text-transform: uppercase;
        }

        .tour-status-loader {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 0.45vw;
          margin-top: 0.2vw;
        }

        .tour-status-loader span {
          width: 0.5vw;
          height: 0.5vw;
          border-radius: 999px;
          background: #000;
          opacity: 0.2;
          animation: tourStatusPulse 1.2s infinite ease-in-out;
        }

        .tour-status-loader span:nth-child(2) {
          animation-delay: 0.15s;
        }

        .tour-status-loader span:nth-child(3) {
          animation-delay: 0.3s;
        }

        .tour-status-message span {
          display: block;
          margin-top: 0.8vw;
          font-size: 0.78vw;
          font-weight: 500;
          letter-spacing: 0.02em;
          text-transform: none;
          color: #4f4f4f;
        }

        @keyframes tourStatusPulse {
          0%,
          80%,
          100% {
            opacity: 0.2;
            transform: scale(1);
          }

          40% {
            opacity: 1;
            transform: scale(1.1);
          }
        }

        .tour-events-list {
          width: 39.7708vw;
          margin: 0 auto;
        }

        .tour-event-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 1.5vw;
          padding: 1vw 0;
        }

        .tour-event-description {
          width: 65%;
          display: flex;
        }

        .tour-event-date {
          width: 35%;
          min-width: auto;
          color: #000;
          font-size: 1.0417vw;
          font-weight: 600;
          text-transform: uppercase;
        }

        .tour-event-time {
          display: block;
          margin-top: 0.28vw;
          font-size: 0.78vw;
          letter-spacing: 0.08em;
        }

        .tour-event-venue {
          width: 60%;
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          color: #000;
          font-size: 1.0417vw;
          font-weight: 600;
          text-transform: uppercase;
        }

        .tour-event-venue-name,
        .tour-event-city {
          width: 100%;
        }

        .tour-event-actions {
          display: flex;
          justify-content: flex-end;
        }

        .tour-event-button {
          width: 5.5729vw;
          display: inline-block;
          background: #000;
          color: #fff;
          border: 1px solid transparent;
          padding: 0.5208vw 0;
          font-family: 'Poppins', sans-serif;
          font-size: 0.93vw;
          font-weight: 500;
          text-transform: uppercase;
          text-align: center;
          cursor: pointer;
          transition: background-color 0.2s ease, color 0.2s ease, border-color 0.2s ease;
        }

        .tour-event-button:hover {
          background: transparent;
          color: #000;
          border-color: #000;
        }

        .tour-footer-shell {
          background: #fff;
        }

        @media only screen and (max-width: 1024px) and (orientation: portrait) {
          .tour-page-shell {
            padding-top: 21vw;
          }

          .tour-page-title-image {
            width: 78vw;
            margin-top: 8vw;
          }

          .tour-page-content {
            padding-top: 10vw;
            padding-bottom: 12vw;
            min-height: auto;
          }

          .tour-events-list,
          .tour-status-message {
            width: 80%;
          }

          .tour-event-row {
            flex-direction: column;
            gap: 0;
            padding: 4vw 0;
          }

          .tour-event-description {
            width: 100%;
            display: block;
            text-align: center;
          }

          .tour-event-date,
          .tour-event-venue {
            width: 100%;
            text-align: center;
            align-items: center;
            font-size: 4.2667vw;
          }

          .tour-event-time {
            margin-top: 1.1vw;
            font-size: 2.8vw;
          }

          .tour-event-venue {
            margin-top: 1vw;
          }

          .tour-event-actions {
            width: 100%;
            justify-content: center;
            margin-top: 3.7333vw;
          }

          .tour-event-button {
            width: 23.4667vw;
            padding: 2.1333vw 0;
            font-size: 3.7333vw;
          }

          .tour-status-message {
            font-size: 4.2667vw;
            padding: 8vw 0;
          }

          .tour-status-loading {
            gap: 2.5vw;
          }

          .tour-status-kicker {
            font-size: 2.8vw;
          }

          .tour-status-title {
            font-size: 5.2vw;
            line-height: 1.15;
          }

          .tour-status-loader {
            gap: 1.6vw;
          }

          .tour-status-loader span {
            width: 1.8vw;
            height: 1.8vw;
          }

          .tour-status-message span {
            margin-top: 2.5vw;
            font-size: 3.2vw;
          }
        }
      `}</style>

      <Navigation />

      <main className="tour-page-shell">
        <header className="tour-page-header">
          <div className="tour-page-title-image">
            <img src={TOUR_TITLE_IMAGE} alt="The Romantic Tour" />
          </div>
        </header>

        <section className="tour-page-content">
          {loading && (
            <div className="tour-status-message tour-status-loading">
              <div className="tour-status-kicker">Please Wait</div>
              <div className="tour-status-title">Updating Current Tour Dates</div>
              <div className="tour-status-loader" aria-hidden="true">
                <span />
                <span />
                <span />
              </div>
              <span>
                Please stay on this page while we update the current tour dates for this tour.
                {slowLoad ? ' First visit may take a few seconds while the live server wakes up.' : ''}
              </span>
            </div>
          )}

          {!loading && error && <div className="tour-status-message">{error}</div>}

          {!loading && !error && sortedEvents.length === 0 && (
            <div className="tour-status-message">No Tour Dates Available</div>
          )}

          {!loading && !error && sortedEvents.length > 0 && (
            <div className="tour-events-list">
              {sortedEvents.map((event) => (
                <div key={event.id} className="tour-event-row" data-testid={`tour-event-${event.id}`}>
                  <div className="tour-event-description">
                    <div className="tour-event-date">
                      {formatTourDate(event.date)}
                      <span className="tour-event-time">{formatTourTime(event.time)}</span>
                    </div>

                    <div className="tour-event-venue">
                      <div className="tour-event-venue-name">{event.venue}</div>
                      <div className="tour-event-city">{event.city}</div>
                    </div>
                  </div>

                  <div className="tour-event-actions">
                    <button
                      type="button"
                      className="tour-event-button"
                      onClick={() => setSelectedEvent(event)}
                      data-testid={`tickets-button-${event.id}`}
                    >
                      Premium Tickets
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      <div className="tour-footer-shell">
        <HomeFooter />
      </div>

      {selectedEvent && (
        <BookingModal
          event={selectedEvent}
          onClose={() => {
            setSelectedEvent(null);
          }}
        />
      )}
    </>
  );
};

export default TourPage;
