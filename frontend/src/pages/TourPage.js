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
        /* Tour Page Official Styling */
        body {
          font-family: "poppins", sans-serif;
          font-style: normal;
        }
        
        .tour-page-wrapper {
          background: #000;
          color: #666666;
          font-family: 'helvetica', 'arial', sans-serif;
          font-size: 12px;
          min-height: 94vh;
          padding-top: 6.41vw;
        }
        
        .tour-title-image {
          margin-top: 1.5vw;
          text-align: center;
          width: 50%;
          margin-left: auto;
          margin-right: auto;
        }
        
        .seated-events-table {
          border-top: none;
          max-width: 41%;
          display: inline-block;
          vertical-align: bottom;
          margin: 0 auto;
          width: 100%;
        }
        
        .seated-event-row {
          border-bottom: 2px solid #ccc;
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 15px 0;
        }
        
        .seated-event-description-cells {
          width: 65%;
          display: flex;
          flex-direction: row;
          justify-content: space-between;
        }
        
        .seated-event-date-cell {
          min-width: 160px;
          text-align: left;
          color: #666666;
        }
        
        .seated-event-venue-cell {
          display: flex;
          flex-direction: column;
          min-width: 191px;
          text-align: left;
        }
        
        .seated-event-venue-name {
          width: auto;
          color: #666666;
        }
        
        .seated-event-venue-location {
          width: auto;
          color: #666666;
        }
        
        .seated-event-link-cells {
          width: 25%;
        }
        
        .seated-event-link-cell a,
        .seated-event-link1,
        .seated-event-link {
          display: block;
          width: 100%;
          padding: 8px 0px;
          text-transform: uppercase;
          text-align: center;
          background: #ed3d3d;
          color: #fff;
          margin: 4px auto;
          text-decoration: none;
          border: none;
          border-radius: 0;
          cursor: pointer;
          font-family: 'helvetica', 'arial', sans-serif;
          font-size: 12px;
        }
        
        .seated-event-link-cell a:hover,
        .seated-event-link1:hover,
        .seated-event-link:hover {
          color: #c08800;
          background: #fff;
          border: none;
          padding: 8px 0px;
          margin: 4px 0;
          border-radius: 0;
        }
        
        @media only screen and (max-width:1024px) and (orientation:portrait) {
          .tour-title-image {
            margin-top: 6.5vw;
            width: 100%;
          }
          
          .seated-events-table {
            max-width: 100%;
            width: 100%;
          }
          
          .seated-event-venue-cell {
            min-width: 31vw;
            align-items: start;
          }
          
          .tour-page-wrapper {
            padding-top: 20vw;
          }
        }
        
        @media only screen and (max-width:1023px) {
          .seated-events-table {
            max-width: 100%;
            width: 100%;
          }
        }
      `}</style>
      
      <Navigation />
      
      <div className="tour-page-wrapper">
        <div style={{ textAlign: 'center', margin: '0 auto' }}>
          {/* Tour Header Image */}
          <div className="tour-title-image">
            <img 
              src="https://www.brunomars.com/sites/g/files/g2000021861/files/2026-03/BrunoTheRomanticTour_Creative10_1080x1440hetvdvre.jpg"
              alt="The Romantic Tour"
              style={{ width: '100%', height: 'auto' }}
            />
          </div>

          {/* Tour Dates List */}
          <div className="seated-events-table" style={{ marginTop: '40px' }}>
            {events.length === 0 ? (
              <p style={{ textAlign: 'center', color: '#666', padding: '40px 0' }}>
                Tour dates coming soon. Check back for updates!
              </p>
            ) : (
              events.map((event) => (
                <div key={event.id} className="seated-event-row">
                  <div className="seated-event-description-cells">
                    <div className="seated-event-date-cell">
                      {event.date}
                    </div>
                    <div className="seated-event-venue-cell">
                      <div className="seated-event-venue-name">{event.venue}</div>
                      <div className="seated-event-venue-location">{event.city}</div>
                    </div>
                  </div>
                  <div className="seated-event-link-cells">
                    <div className="seated-event-link-cell">
                      <a
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          setSelectedEvent(event);
                          setShowBookingModal(true);
                        }}
                        className="seated-event-link"
                      >
                        Tickets
                      </a>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
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
