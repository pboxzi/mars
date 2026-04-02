import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Navigation from '../components/Navigation';
import Footer from '../components/Footer';
import BookingModal from '../components/BookingModal';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const TourPage = () => {
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showBookingModal, setShowBookingModal] = useState(false);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const response = await axios.get(`${API}/events`);
      setEvents(response.data);
    } catch (error) {
      console.error('Error fetching events:', error);
    }
  };

  return (
    <>
      <style>{`
        body {
          font-family: "poppins", sans-serif;
          font-style: normal;
          background: #fff;
        }
        
        .tour-page-container {
          background: #fff;
          min-height: 100vh;
          padding-top: 100px;
          padding-bottom: 60px;
        }
        
        .tour-title {
          text-align: center;
          font-family: 'Poppins', sans-serif;
          font-weight: 300;
          font-size: 4.5rem;
          letter-spacing: 0.1em;
          color: #d32f2f;
          margin: 60px auto 80px;
          text-transform: uppercase;
          line-height: 1.2;
        }
        
        .tour-dates-container {
          max-width: 900px;
          margin: 0 auto;
          padding: 0 20px;
        }
        
        .tour-event-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 25px 0;
          border-bottom: 1px solid #e0e0e0;
        }
        
        .tour-event-row:last-child {
          border-bottom: none;
        }
        
        .tour-event-info {
          display: flex;
          gap: 60px;
          flex: 1;
        }
        
        .tour-event-date {
          font-family: 'Poppins', sans-serif;
          font-weight: 400;
          font-size: 0.95rem;
          color: #000;
          text-transform: uppercase;
          min-width: 120px;
        }
        
        .tour-event-venue {
          flex: 1;
        }
        
        .tour-venue-name {
          font-family: 'Poppins', sans-serif;
          font-weight: 600;
          font-size: 0.95rem;
          color: #000;
          text-transform: uppercase;
          margin-bottom: 4px;
        }
        
        .tour-venue-location {
          font-family: 'Poppins', sans-serif;
          font-weight: 400;
          font-size: 0.95rem;
          color: #000;
          text-transform: uppercase;
        }
        
        .tour-ticket-button {
          background: #000;
          color: #fff;
          border: none;
          padding: 12px 40px;
          font-family: 'Poppins', sans-serif;
          font-weight: 600;
          font-size: 0.85rem;
          text-transform: uppercase;
          cursor: pointer;
          transition: all 0.2s ease;
          text-decoration: none;
          display: inline-block;
        }
        
        .tour-ticket-button:hover {
          background: #333;
        }
        
        @media only screen and (max-width: 768px) {
          .tour-title {
            font-size: 2.5rem;
            margin: 40px auto 50px;
          }
          
          .tour-event-row {
            flex-direction: column;
            align-items: flex-start;
            gap: 20px;
            padding: 20px 0;
          }
          
          .tour-event-info {
            flex-direction: column;
            gap: 10px;
            width: 100%;
          }
          
          .tour-ticket-button {
            width: 100%;
            text-align: center;
          }
        }
      `}</style>
      
      <Navigation />
      
      <div className="tour-page-container">
        {/* Tour Title */}
        <h1 className="tour-title">The Romantic Tour</h1>

        {/* Tour Dates List */}
        <div className="tour-dates-container">
          {events.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#666', padding: '40px 0', fontFamily: 'Poppins, sans-serif' }}>
              Tour dates coming soon. Check back for updates!
            </p>
          ) : (
            events.map((event) => (
              <div key={event.id} className="tour-event-row">
                <div className="tour-event-info">
                  <div className="tour-event-date">
                    {event.date}
                  </div>
                  <div className="tour-event-venue">
                    <div className="tour-venue-name">{event.venue}</div>
                    <div className="tour-venue-location">{event.city}</div>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setSelectedEvent(event);
                    setShowBookingModal(true);
                  }}
                  className="tour-ticket-button"
                >
                  Tickets
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      <Footer />

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

export default TourPage;
