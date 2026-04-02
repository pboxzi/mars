import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Navigation from '../components/Navigation';
import Footer from '../components/Footer';
import BookingModal from '../components/BookingModal';
import { Play } from 'lucide-react';

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
    <div className="min-h-screen bg-white">
      <a 
        href="#main-content" 
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:bg-black focus:text-white focus:px-4 focus:py-2"
      >
        Skip to main content
      </a>

      <Navigation />

      <main id="main-content" className="pt-20">
        {/* Store and Tour Section - Side by Side */}
        <section className="min-h-screen flex flex-col md:flex-row">
          {/* STORE Section - LEFT */}
          <div className="flex-1 relative bg-gray-50 flex flex-col items-center justify-center p-8 md:p-16">
            <div className="max-w-xl w-full">
              {/* Placeholder for merchandise image */}
              <div className="mb-8">
                <img 
                  src="https://images.unsplash.com/photo-1669801158950-f663cf15298c?w=800&q=80"
                  alt="The Romantic Merchandise"
                  className="w-full h-auto rounded-lg shadow-lg"
                />
              </div>
              <p className="text-center text-2xl font-bold mb-6 tracking-wider">STORE</p>
              <a
                href="https://shop.brunomars.com"
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full bg-black text-white text-center font-bold py-4 px-8 hover:bg-gray-800 transition-colors"
              >
                SHOP THE ROMANTIC
              </a>
            </div>
          </div>

          {/* TOUR Section - RIGHT */}
          <div className="flex-1 relative bg-red-700 flex flex-col items-center justify-center p-8 md:p-16">
            <div className="max-w-xl w-full text-white">
              {/* Tour Poster Content */}
              <div className="border-4 border-white p-8 mb-8">
                <h2 className="text-5xl md:text-6xl font-black text-center mb-4">BRUNO MARS</h2>
                <div className="border-t-2 border-white my-6"></div>
                <h3 className="text-4xl md:text-5xl font-black text-center mb-6">THE ROMANTIC TOUR</h3>
                <p className="text-center text-sm mb-2">ANDERSON .PAAK AS DJ PEE-WEE</p>
                <p className="text-center text-sm mb-2">LEON THOMAS • RAVE • VICTORIA MONET</p>
                <p className="text-center text-xs mt-4">IN SELECT CITIES</p>
                <p className="text-center text-xs font-bold">NORTH AMERICA, EUROPE, UK & MEXICO</p>
              </div>
              <p className="text-center text-2xl font-bold mb-6 tracking-wider">TOUR</p>
              <button
                onClick={handleTicketsClick}
                className="block w-full bg-black text-white text-center font-bold py-4 px-8 hover:bg-gray-900 transition-colors"
              >
                TICKETS
              </button>
            </div>
          </div>
        </section>

        {/* Risk It All Video Section */}
        <section className="relative min-h-screen bg-black flex items-center justify-center">
          <div className="absolute inset-0">
            <img 
              src="https://images.unsplash.com/photo-1660150509350-ff505601d094?w=1920&q=80"
              alt="Risk It All"
              className="w-full h-full object-cover opacity-60"
            />
          </div>
          <div className="relative z-10 text-center text-white px-4">
            <div className="w-20 h-20 mx-auto mb-8 bg-white rounded-full flex items-center justify-center cursor-pointer hover:scale-110 transition-transform">
              <Play className="w-10 h-10 text-black ml-1" />
            </div>
            <h2 className="text-5xl md:text-6xl font-black mb-8 tracking-wide">RISK IT ALL</h2>
            <a
              href="https://www.youtube.com/watch?v=dQw4w9WgXcQ"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block bg-white text-black font-bold py-4 px-12 hover:bg-gray-200 transition-colors"
            >
              WATCH NOW
            </a>
          </div>
        </section>

        {/* Album Header Banner Section */}
        <a
          href="https://shop.brunomars.com"
          target="_blank"
          rel="noopener noreferrer"
          className="block"
        >
          <section className="relative min-h-[70vh] bg-gray-900 overflow-hidden group">
            <img 
              src="https://images.unsplash.com/photo-1561447920-ee278fe828a2?w=1920&q=80"
              alt="Album"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
            />
          </section>
        </a>

        {/* Vinyl Colors Banner with Text Overlay */}
        <section className="relative min-h-screen bg-black overflow-hidden">
          <a
            href="https://shop.brunomars.com"
            target="_blank"
            rel="noopener noreferrer"
            className="block h-full"
          >
            <div className="absolute inset-0">
              <img 
                src="https://images.unsplash.com/photo-1602848597941-0d3d3a2c1241?w=1920&q=80"
                alt="Vinyl"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black bg-opacity-40"></div>
            </div>
            <div className="relative z-10 h-screen flex flex-col items-center justify-center text-white px-4">
              <h2 className="text-4xl md:text-5xl font-black mb-8 tracking-wide text-center">
                EXCLUSIVE VINYL COLORS
              </h2>
              <span className="inline-block bg-white text-black font-bold py-4 px-12 hover:bg-gray-200 transition-colors">
                FIND RETAILERS
              </span>
            </div>
          </a>
        </section>

        {/* I Just Might Video Section */}
        <section className="relative min-h-screen bg-black flex items-center justify-center">
          <div className="absolute inset-0">
            <img 
              src="https://images.pexels.com/photos/6311811/pexels-photo-6311811.jpeg?w=1920&q=80"
              alt="I Just Might"
              className="w-full h-full object-cover opacity-60"
            />
          </div>
          <div className="relative z-10 text-center text-white px-4">
            <div className="w-20 h-20 mx-auto mb-8 bg-white rounded-full flex items-center justify-center cursor-pointer hover:scale-110 transition-transform">
              <Play className="w-10 h-10 text-black ml-1" />
            </div>
            <h2 className="text-5xl md:text-6xl font-black mb-8 tracking-wide">I JUST MIGHT</h2>
            <a
              href="https://www.youtube.com/watch?v=dQw4w9WgXcQ"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block bg-white text-black font-bold py-4 px-12 hover:bg-gray-200 transition-colors"
            >
              WATCH NOW
            </a>
          </div>
        </section>
      </main>

      <Footer />

      {/* Booking Modal */}
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
