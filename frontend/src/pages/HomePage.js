import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Navigation from '../components/Navigation';
import Footer from '../components/Footer';
import BookingModal from '../components/BookingModal';

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

  const handleTicketsClick = () => {
    if (events.length > 0) {
      setSelectedEvent(events[0]);
      setShowBookingModal(true);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Skip to main content */}
      <a 
        href="#main-content" 
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:bg-white focus:text-black focus:px-4 focus:py-2"
      >
        Skip to main content
      </a>

      <Navigation />

      <main id="main-content" className="pt-16">
        {/* Store and Tour Section - Side by Side */}
        <section className="flex flex-col md:flex-row min-h-screen">
          {/* Store Section */}
          <div className="flex-1 relative group cursor-pointer">
            <a href="https://brunomars.lnk.to/officialstore" target="_blank" rel="noopener noreferrer" className="block h-full">
              <img 
                src="https://www.brunomars.com/sites/g/files/g2000021861/files/2026-03/Store_Block-img43dfddf.jpg" 
                alt="Store"
                className="w-full h-full min-h-screen object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all duration-500"></div>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="text-center">
                  <p className="text-xl mb-6 tracking-widest">Store</p>
                  <span className="inline-block bg-white text-black font-bold py-4 px-12 rounded-full hover:bg-gray-200 transition-all">
                    SHOP THE ROMANTIC
                  </span>
                </div>
              </div>
            </a>
          </div>

          {/* Tour Section */}
          <div className="flex-1 relative group cursor-pointer">
            <button onClick={handleTicketsClick} className="block w-full h-full">
              <img 
                src="https://www.brunomars.com/sites/g/files/g2000021861/files/2026-03/BrunoTheRomanticTour_Creative10_1080x1440hetvdvre.jpg" 
                alt="Tour"
                className="w-full h-full min-h-screen object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all duration-500"></div>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="text-center">
                  <p className="text-xl mb-6 tracking-widest">Tour</p>
                  <span className="inline-block bg-white text-black font-bold py-4 px-12 rounded-full hover:bg-gray-200 transition-all">
                    TICKETS
                  </span>
                </div>
              </div>
            </button>
          </div>
        </section>

        {/* Risk It All Video Section */}
        <section className="relative min-h-screen group cursor-pointer">
          <a href="https://brunomars.lnk.to/theromantic/youtube" target="_blank" rel="noopener noreferrer" className="block h-full">
            <picture>
              <source media="(max-width: 768px)" srcSet="https://www.brunomars.com/sites/g/files/g2000021861/files/2026-02/home_mobbb.jpg" />
              <img 
                src="https://www.brunomars.com/sites/g/files/g2000021861/files/2026-03/Group%205%402x.jpg" 
                alt="Risk It All"
                className="w-full h-full min-h-screen object-cover group-hover:scale-105 transition-transform duration-700"
              />
            </picture>
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/60"></div>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <img 
                src="https://www.brunomars.com/sites/g/files/g2000021861/files/2025-12/lance_playicon.svg" 
                alt="Play"
                className="w-16 h-16 mb-6 group-hover:scale-125 transition-transform"
              />
              <h2 className="text-4xl font-bold mb-6 tracking-wider">RISK IT ALL</h2>
              <span className="inline-block bg-white text-black font-bold py-3 px-10 rounded-full hover:bg-gray-200 transition-all">
                WATCH NOW
              </span>
            </div>
          </a>
        </section>

        {/* Album Header Section */}
        <section className="relative min-h-[70vh] group cursor-pointer">
          <a href="https://brunomars.lnk.to/theromantic" target="_blank" rel="noopener noreferrer" className="block h-full">
            <picture>
              <source media="(max-width: 768px)" srcSet="https://www.brunomars.com/sites/g/files/g2000021861/files/2026-01/Vinyl.png" />
              <img 
                src="https://www.brunomars.com/sites/g/files/g2000021861/files/2026-01/allstore_desktop_wider_1_0.jpg" 
                alt="The Romantic"
                className="w-full h-full min-h-[70vh] object-cover group-hover:scale-105 transition-transform duration-700"
              />
            </picture>
          </a>
        </section>

        {/* Vinyl Section - overlays on album section */}
        <section className="relative -mt-64 z-10">
          <a href="https://brunomars.lnk.to/theromantic" target="_blank" rel="noopener noreferrer" className="block">
            <div className="text-center py-12">
              <h2 className="text-4xl font-bold mb-6 tracking-wider">EXCLUSIVE VINYL COLORS</h2>
              <span className="inline-block bg-white text-black font-bold py-3 px-10 rounded-full hover:bg-gray-200 transition-all">
                FIND RETAILERS
              </span>
            </div>
          </a>
        </section>

        {/* I Just Might Video Section */}
        <section className="relative min-h-screen group cursor-pointer">
          <a href="http://brunomars.lnk.to/ijustmight/youtube" target="_blank" rel="noopener noreferrer" className="block h-full">
            <picture>
              <source media="(max-width: 768px)" srcSet="https://www.brunomars.com/sites/g/files/g2000021861/files/2026-01/Group%208%402x.jpg" />
              <img 
                src="https://www.brunomars.com/sites/g/files/g2000021861/files/2026-01/Video_Desktop-s3ff.jpg" 
                alt="I Just Might"
                className="w-full h-full min-h-screen object-cover group-hover:scale-105 transition-transform duration-700"
              />
            </picture>
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/60"></div>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <img 
                src="https://www.brunomars.com/sites/g/files/g2000021861/files/2025-12/lance_playicon.svg" 
                alt="Play"
                className="w-16 h-16 mb-6 group-hover:scale-125 transition-transform"
              />
              <h2 className="text-4xl font-bold mb-6 tracking-wider">I JUST MIGHT</h2>
              <span className="inline-block bg-white text-black font-bold py-3 px-10 rounded-full hover:bg-gray-200 transition-all">
                WATCH NOW
              </span>
            </div>
          </a>
        </section>

        {/* Tour Dates - Your Booking System */}
        {events.length > 0 && (
          <section className="py-20 px-4 bg-black">
            <div className="max-w-7xl mx-auto">
              <h2 className="text-5xl font-bold text-center mb-16 tracking-wider">TOUR DATES</h2>
              <div className="space-y-6">
                {events.map((event) => (
                  <div 
                    key={event.id}
                    className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 flex flex-col md:flex-row items-center justify-between hover:bg-zinc-800 transition-all"
                  >
                    <div className="flex-1 mb-4 md:mb-0">
                      <h3 className="text-2xl font-bold mb-2">{event.title}</h3>
                      <p className="text-gray-400">{event.date} • {event.time}</p>
                      <p className="text-gray-400">{event.venue} • {event.city}</p>
                    </div>
                    <button 
                      onClick={() => {
                        setSelectedEvent(event);
                        setShowBookingModal(true);
                      }}
                      className="bg-white text-black font-bold py-3 px-10 rounded-full hover:bg-gray-200 transition-all"
                    >
                      TICKETS
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}
      </main>

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
    </div>
  );
};

export default HomePage;
