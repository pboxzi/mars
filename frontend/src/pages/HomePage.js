import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Footer from '../components/Footer';
import BookingModal from '../components/BookingModal';
import { Play } from 'lucide-react';
import { Link } from 'react-router-dom';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const HomePage = () => {
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

  const handleRequestTickets = (event) => {
    setSelectedEvent(event);
    setShowBookingModal(true);
  };

  const scrollToTourDates = (e) => {
    e.preventDefault();
    const tourSection = document.getElementById('tour-dates');
    if (tourSection) {
      tourSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-black">
      {/* Skip to main content link */}
      <a 
        href="#main-content" 
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:bg-white focus:text-black focus:px-4 focus:py-2 focus:rounded"
      >
        Skip to main content
      </a>

      {/* Simple top-right navigation */}
      <nav className="fixed top-0 right-0 z-50 p-6">
        <Link 
          to="/booking-status" 
          className="text-white text-sm tracking-wide hover:opacity-70 transition-opacity"
        >
          CHECK BOOKING
        </Link>
      </nav>

      <main id="main-content">
        {/* Store and Tour Blocks - Side by Side */}
        <section className="min-h-screen flex flex-col md:flex-row" data-testid="store-tour-section">
          {/* Store Block - Entire section is clickable */}
          <a 
            href="https://shop.brunomars.com" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex-1 relative overflow-hidden group"
          >
            <div className="absolute inset-0">
              <img 
                src="https://images.unsplash.com/photo-1669801158950-f663cf15298c?w=1920&q=80" 
                alt="Store" 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-black bg-opacity-40 group-hover:bg-opacity-30 transition-all duration-500"></div>
            </div>
            <div className="relative z-10 h-full min-h-screen flex flex-col items-center justify-center px-4">
              <p className="text-xl md:text-2xl mb-6 tracking-widest font-light">Store</p>
              <span className="inline-block bg-white text-black font-bold py-4 px-12 rounded-full hover:bg-gray-200 hover:scale-105 transition-all text-lg">
                SHOP THE ROMANTIC
              </span>
            </div>
          </a>

          {/* Tour Block - Clickable */}
          <button 
            onClick={scrollToTourDates}
            className="flex-1 relative overflow-hidden group"
          >
            <div className="absolute inset-0">
              <img 
                src="https://images.unsplash.com/photo-1568286453307-ec8dd11413bf?w=1920&q=80" 
                alt="Tour" 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-black bg-opacity-40 group-hover:bg-opacity-30 transition-all duration-500"></div>
            </div>
            <div className="relative z-10 h-full min-h-screen flex flex-col items-center justify-center px-4">
              <p className="text-xl md:text-2xl mb-6 tracking-widest font-light">Tour</p>
              <span className="inline-block bg-white text-black font-bold py-4 px-12 rounded-full hover:bg-gray-200 hover:scale-105 transition-all text-lg">
                TICKETS
              </span>
            </div>
          </button>
        </section>

        {/* Risk It All Video - Entire section clickable */}
        <a 
          href="https://www.youtube.com/watch?v=dQw4w9WgXcQ" 
          target="_blank" 
          rel="noopener noreferrer"
          className="block"
        >
          <section className="relative min-h-screen flex items-center justify-center overflow-hidden group" data-testid="video-risk-it-all">
            <div className="absolute inset-0">
              <img 
                src="https://images.unsplash.com/photo-1660150509350-ff505601d094?w=1920&q=80" 
                alt="Risk It All" 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-black bg-opacity-50 group-hover:bg-opacity-40 transition-all duration-500"></div>
            </div>
            <div className="relative z-10 text-center">
              <Play className="w-20 h-20 mx-auto mb-6 text-white group-hover:scale-125 transition-transform duration-300" />
              <h2 className="text-3xl md:text-4xl font-bold mb-6 tracking-wider">RISK IT ALL</h2>
              <span className="inline-block bg-white text-black font-bold py-3 px-10 rounded-full hover:bg-gray-200 hover:scale-105 transition-all">
                WATCH NOW
              </span>
            </div>
          </section>
        </a>

        {/* Album Promotion - Clickable */}
        <a 
          href="https://shop.brunomars.com" 
          target="_blank" 
          rel="noopener noreferrer"
          className="block"
        >
          <section className="relative min-h-[70vh] flex items-center justify-center overflow-hidden group">
            <img 
              src="https://images.unsplash.com/photo-1561447920-ee278fe828a2?w=1920&q=80" 
              alt="Album" 
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
            />
            <div className="absolute inset-0 bg-black bg-opacity-30 group-hover:bg-opacity-20 transition-all duration-500"></div>
          </section>
        </a>

        {/* Vinyl Colors - Entire section clickable */}
        <a 
          href="https://shop.brunomars.com" 
          target="_blank" 
          rel="noopener noreferrer"
          className="block"
        >
          <section className="relative min-h-screen flex items-center justify-center overflow-hidden group" data-testid="vinyl-section">
            <div className="absolute inset-0">
              <img 
                src="https://images.unsplash.com/photo-1602848597941-0d3d3a2c1241?w=1920&q=80" 
                alt="Vinyl" 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-black bg-opacity-40 group-hover:bg-opacity-30 transition-all duration-500"></div>
            </div>
            <div className="relative z-10 text-center px-4">
              <h2 className="text-3xl md:text-4xl font-bold mb-6 tracking-wider">EXCLUSIVE VINYL COLORS</h2>
              <span className="inline-block bg-white text-black font-bold py-3 px-10 rounded-full hover:bg-gray-200 hover:scale-105 transition-all">
                FIND RETAILERS
              </span>
            </div>
          </section>
        </a>

        {/* I Just Might Video - Entire section clickable */}
        <a 
          href="https://www.youtube.com/watch?v=dQw4w9WgXcQ" 
          target="_blank" 
          rel="noopener noreferrer"
          className="block"
        >
          <section className="relative min-h-screen flex items-center justify-center overflow-hidden group" data-testid="video-i-just-might">
            <div className="absolute inset-0">
              <img 
                src="https://images.pexels.com/photos/6311811/pexels-photo-6311811.jpeg?w=1920&q=80" 
                alt="I Just Might" 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-black bg-opacity-50 group-hover:bg-opacity-40 transition-all duration-500"></div>
            </div>
            <div className="relative z-10 text-center">
              <Play className="w-20 h-20 mx-auto mb-6 text-white group-hover:scale-125 transition-transform duration-300" />
              <h2 className="text-3xl md:text-4xl font-bold mb-6 tracking-wider">I JUST MIGHT</h2>
              <span className="inline-block bg-white text-black font-bold py-3 px-10 rounded-full hover:bg-gray-200 hover:scale-105 transition-all">
                WATCH NOW
              </span>
            </div>
          </section>
        </a>

        {/* Tour Dates Section (Custom booking functionality) */}
        <section id="tour-dates" className="py-20 px-4 bg-black" data-testid="tour-dates-section">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-bold text-center mb-16 tracking-wider">TOUR DATES</h2>
            
            {events.length === 0 ? (
              <p className="text-center text-gray-400 text-xl">Check back soon for tour dates!</p>
            ) : (
              <div className="space-y-6">
                {events.map((event) => (
                  <div 
                    key={event.id} 
                    className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 flex flex-col md:flex-row items-center justify-between hover:bg-zinc-800 hover:border-zinc-700 transition-all group"
                    data-testid={`event-row-${event.id}`}
                  >
                    <div className="flex-1 mb-4 md:mb-0">
                      <h3 className="text-2xl font-bold mb-2 group-hover:text-white transition-colors">{event.title}</h3>
                      <p className="text-gray-400 mb-1">{event.date} • {event.time}</p>
                      <p className="text-gray-400">{event.venue} • {event.city}</p>
                    </div>
                    <button 
                      onClick={() => handleRequestTickets(event)}
                      className="bg-white text-black font-bold py-3 px-10 rounded-full hover:bg-gray-200 hover:scale-105 transition-all whitespace-nowrap"
                      data-testid={`request-tickets-button-${event.id}`}
                    >
                      TICKETS
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>

      <Footer />

      {/* Booking Modal */}
      {showBookingModal && (
        <BookingModal 
          event={selectedEvent}
          onClose={() => {
            setShowBookingModal(false);
            setSelectedEvent(null);
          }}
        />
      )}
    </div>
  );
};

export default HomePage;
