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
    <div className="min-h-screen bg-black text-white">
      <Navigation />
      
      <main className="pt-24 pb-20 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Tour Header Image */}
          <div className="mb-16 text-center">
            <h1 className="text-6xl font-bold mb-8 tracking-wider">THE ROMANTIC TOUR</h1>
          </div>

          {/* Tour Dates List */}
          <div className="space-y-4">
            {events.length === 0 ? (
              <p className="text-center text-gray-400 text-xl py-12">
                Tour dates coming soon. Check back for updates!
              </p>
            ) : (
              events.map((event) => (
                <div 
                  key={event.id}
                  className="border border-zinc-800 rounded-lg p-6 hover:bg-zinc-900 transition-all group"
                >
                  <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div className="flex-1">
                      <p className="text-gray-400 text-sm mb-2">{event.date}</p>
                      <h3 className="text-xl font-bold mb-1">{event.venue}</h3>
                      <p className="text-gray-400">{event.city}</p>
                    </div>
                    <button 
                      onClick={() => {
                        setSelectedEvent(event);
                        setShowBookingModal(true);
                      }}
                      className="bg-white text-black font-bold py-3 px-10 rounded-full hover:bg-gray-200 hover:scale-105 transition-all whitespace-nowrap"
                    >
                      Tickets
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
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

export default TourPage;
