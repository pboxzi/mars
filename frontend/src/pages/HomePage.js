import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Navbar from '../components/Navbar';
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

  const handleRequestTickets = (event) => {
    setSelectedEvent(event);
    setShowBookingModal(true);
  };

  return (
    <div className="min-h-screen bg-black">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden" data-testid="hero-section">
        <div className="absolute inset-0">
          <img 
            src="https://images.unsplash.com/photo-1568286453307-ec8dd11413bf?w=1920&q=80" 
            alt="Hero" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black bg-opacity-50"></div>
        </div>
        <div className="relative z-10 text-center px-4">
          <h1 className="text-6xl md:text-8xl font-bold mb-6" data-testid="hero-title">BRUNO MARS</h1>
          <p className="text-2xl md:text-4xl mb-8">THE ROMANTIC TOUR 2026</p>
          <a 
            href="#tour" 
            className="inline-block bg-red-600 hover:bg-red-700 text-white font-bold py-4 px-12 rounded-full text-xl transition-all"
            data-testid="hero-cta-button"
          >
            GET TICKETS
          </a>
        </div>
      </section>

      {/* Video Section - Risk It All */}
      <section className="relative h-[80vh] flex items-center justify-center overflow-hidden" data-testid="video-section-1">
        <div className="absolute inset-0">
          <img 
            src="https://images.unsplash.com/photo-1660150509350-ff505601d094?w=1920&q=80" 
            alt="Risk It All" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black bg-opacity-60"></div>
        </div>
        <div className="relative z-10 text-center">
          <Play className="w-24 h-24 mx-auto mb-6 text-white cursor-pointer hover:scale-110 transition-transform" />
          <h2 className="text-4xl md:text-5xl font-bold mb-4">RISK IT ALL</h2>
          <button className="bg-white text-black font-bold py-3 px-10 rounded-full hover:bg-gray-200 transition-all">
            WATCH NOW
          </button>
        </div>
      </section>

      {/* Store Section */}
      <section className="relative h-[60vh] flex items-center justify-center overflow-hidden" data-testid="store-section">
        <div className="absolute inset-0">
          <img 
            src="https://images.unsplash.com/photo-1669801158950-f663cf15298c?w=1920&q=80" 
            alt="Store" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black"></div>
        </div>
        <div className="relative z-10 text-center">
          <h2 className="text-5xl font-bold mb-6">THE ROMANTIC</h2>
          <p className="text-xl mb-6">New Album Available Now</p>
          <button className="bg-red-600 hover:bg-red-700 text-white font-bold py-4 px-12 rounded-full text-lg transition-all">
            SHOP THE ROMANTIC
          </button>
        </div>
      </section>

      {/* Tour Section */}
      <section id="tour" className="py-20 px-4" data-testid="tour-section">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-5xl md:text-6xl font-bold text-center mb-16">TOUR DATES</h2>
          
          {events.length === 0 ? (
            <p className="text-center text-gray-400 text-xl">No events available at the moment. Check back soon!</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {events.map((event) => (
                <div 
                  key={event.id} 
                  className="bg-zinc-900 rounded-lg overflow-hidden hover:transform hover:scale-105 transition-all"
                  data-testid={`event-card-${event.id}`}
                >
                  <img 
                    src={event.image_url} 
                    alt={event.title} 
                    className="w-full h-64 object-cover"
                  />
                  <div className="p-6">
                    <h3 className="text-2xl font-bold mb-2">{event.title}</h3>
                    <p className="text-gray-400 mb-1">{event.venue}</p>
                    <p className="text-gray-400 mb-1">{event.city}</p>
                    <p className="text-gray-400 mb-4">{event.date} • {event.time}</p>
                    <button 
                      onClick={() => handleRequestTickets(event)}
                      className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-full transition-all"
                      data-testid={`request-tickets-button-${event.id}`}
                    >
                      REQUEST TICKETS
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Vinyl Section */}
      <section className="relative h-[60vh] flex items-center justify-center overflow-hidden" data-testid="vinyl-section">
        <div className="absolute inset-0">
          <img 
            src="https://images.unsplash.com/photo-1602848597941-0d3d3a2c1241?w=1920&q=80" 
            alt="Vinyl" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black bg-opacity-60"></div>
        </div>
        <div className="relative z-10 text-center">
          <h2 className="text-5xl font-bold mb-6">EXCLUSIVE VINYL COLORS</h2>
          <button className="bg-white text-black font-bold py-4 px-12 rounded-full hover:bg-gray-200 transition-all">
            FIND RETAILERS
          </button>
        </div>
      </section>

      {/* Video Section 2 - I Just Might */}
      <section className="relative h-[80vh] flex items-center justify-center overflow-hidden" data-testid="video-section-2">
        <div className="absolute inset-0">
          <img 
            src="https://images.pexels.com/photos/6311811/pexels-photo-6311811.jpeg?w=1920&q=80" 
            alt="I Just Might" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black bg-opacity-60"></div>
        </div>
        <div className="relative z-10 text-center">
          <Play className="w-24 h-24 mx-auto mb-6 text-white cursor-pointer hover:scale-110 transition-transform" />
          <h2 className="text-4xl md:text-5xl font-bold mb-4">I JUST MIGHT</h2>
          <button className="bg-white text-black font-bold py-3 px-10 rounded-full hover:bg-gray-200 transition-all">
            WATCH NOW
          </button>
        </div>
      </section>

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