import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { X, CheckCircle } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const BookingModal = ({ event, onClose }) => {
  const [tickets, setTickets] = useState([]);
  const [formData, setFormData] = useState({
    ticket_type: 'general',
    customer_name: '',
    email: '',
    phone: '',
    quantity: 1,
    message: ''
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [confirmationNumber, setConfirmationNumber] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (event) {
      fetchTickets();
    }
  }, [event]);

  const fetchTickets = async () => {
    try {
      const response = await axios.get(`${API}/events/${event.id}`);
      setTickets(response.data.tickets);
    } catch (error) {
      console.error('Error fetching tickets:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await axios.post(`${API}/bookings`, {
        ...formData,
        event_id: event.id
      });
      setConfirmationNumber(response.data.confirmation_number);
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to submit booking request');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const getTicketPrice = (type) => {
    const ticket = tickets.find(t => t.type === type);
    return ticket ? ticket.price_usd : 0;
  };

  const getTicketAvailability = (type) => {
    const ticket = tickets.find(t => t.type === type);
    return ticket ? ticket.available_quantity : 0;
  };

  if (success) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4" onClick={onClose}>
        <div className="bg-zinc-900 rounded-lg p-8 max-w-md w-full" onClick={(e) => e.stopPropagation()} data-testid="booking-success-modal">
          <div className="text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-3xl font-bold mb-4">Request Submitted!</h2>
            <p className="text-gray-400 mb-4">Your booking request has been received. Our team will review it shortly.</p>
            <div className="bg-zinc-800 rounded-lg p-4 mb-6">
              <p className="text-sm text-gray-400 mb-2">Your Confirmation Number</p>
              <p className="text-2xl font-bold text-red-600" data-testid="confirmation-number">{confirmationNumber}</p>
            </div>
            <p className="text-sm text-gray-400 mb-6">Save this number to check your booking status</p>
            <button
              onClick={onClose}
              className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-8 rounded-lg w-full transition-all"
              data-testid="close-success-button"
            >
              CLOSE
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4 overflow-y-auto" onClick={onClose}>
      <div className="bg-zinc-900 rounded-lg p-8 max-w-2xl w-full my-8" onClick={(e) => e.stopPropagation()} data-testid="booking-modal">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold">Request Tickets</h2>
          <button onClick={onClose} className="hover:text-red-600 transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="mb-6 pb-6 border-b border-zinc-700">
          <h3 className="text-xl font-bold mb-2">{event.title}</h3>
          <p className="text-gray-400">{event.venue} • {event.city}</p>
          <p className="text-gray-400">{event.date} • {event.time}</p>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Ticket Type Selection */}
          <div className="mb-6">
            <label className="block text-lg font-bold mb-4">Select Ticket Type</label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div 
                className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                  formData.ticket_type === 'general' ? 'border-red-600 bg-red-900/20' : 'border-zinc-700 hover:border-zinc-500'
                }`}
                onClick={() => setFormData({...formData, ticket_type: 'general'})}
                data-testid="ticket-type-general"
              >
                <input
                  type="radio"
                  name="ticket_type"
                  value="general"
                  checked={formData.ticket_type === 'general'}
                  onChange={handleChange}
                  className="mb-2"
                />
                <h4 className="font-bold mb-1">General Admission</h4>
                <p className="text-2xl font-bold text-red-600">${getTicketPrice('general')}</p>
                <p className="text-sm text-gray-400">{getTicketAvailability('general')} available</p>
              </div>

              <div 
                className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                  formData.ticket_type === 'vip' ? 'border-red-600 bg-red-900/20' : 'border-zinc-700 hover:border-zinc-500'
                }`}
                onClick={() => setFormData({...formData, ticket_type: 'vip'})}
                data-testid="ticket-type-vip"
              >
                <input
                  type="radio"
                  name="ticket_type"
                  value="vip"
                  checked={formData.ticket_type === 'vip'}
                  onChange={handleChange}
                  className="mb-2"
                />
                <h4 className="font-bold mb-1">VIP Access</h4>
                <p className="text-2xl font-bold text-red-600">${getTicketPrice('vip')}</p>
                <p className="text-sm text-gray-400">{getTicketAvailability('vip')} available</p>
              </div>

              <div 
                className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                  formData.ticket_type === 'meetgreet' ? 'border-red-600 bg-red-900/20' : 'border-zinc-700 hover:border-zinc-500'
                }`}
                onClick={() => setFormData({...formData, ticket_type: 'meetgreet'})}
                data-testid="ticket-type-meetgreet"
              >
                <input
                  type="radio"
                  name="ticket_type"
                  value="meetgreet"
                  checked={formData.ticket_type === 'meetgreet'}
                  onChange={handleChange}
                  className="mb-2"
                />
                <h4 className="font-bold mb-1">Meet & Greet</h4>
                <p className="text-2xl font-bold text-red-600">${getTicketPrice('meetgreet')}</p>
                <p className="text-sm text-gray-400">{getTicketAvailability('meetgreet')} available</p>
              </div>

              <div 
                className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                  formData.ticket_type === 'backstage' ? 'border-red-600 bg-red-900/20' : 'border-zinc-700 hover:border-zinc-500'
                }`}
                onClick={() => setFormData({...formData, ticket_type: 'backstage'})}
                data-testid="ticket-type-backstage"
              >
                <input
                  type="radio"
                  name="ticket_type"
                  value="backstage"
                  checked={formData.ticket_type === 'backstage'}
                  onChange={handleChange}
                  className="mb-2"
                />
                <h4 className="font-bold mb-1">Backstage Pass</h4>
                <p className="text-2xl font-bold text-red-600">${getTicketPrice('backstage')}</p>
                <p className="text-sm text-gray-400">{getTicketAvailability('backstage')} available</p>
              </div>
            </div>
          </div>

          {/* Customer Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block mb-2">Full Name *</label>
              <input
                type="text"
                name="customer_name"
                value={formData.customer_name}
                onChange={handleChange}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 focus:outline-none focus:border-red-600"
                data-testid="customer-name-input"
                required
              />
            </div>
            <div>
              <label className="block mb-2">Email *</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 focus:outline-none focus:border-red-600"
                data-testid="email-input"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block mb-2">Phone *</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 focus:outline-none focus:border-red-600"
                data-testid="phone-input"
                required
              />
            </div>
            <div>
              <label className="block mb-2">Quantity *</label>
              <input
                type="number"
                name="quantity"
                min="1"
                max="10"
                value={formData.quantity}
                onChange={handleChange}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 focus:outline-none focus:border-red-600"
                data-testid="quantity-input"
                required
              />
            </div>
          </div>

          <div className="mb-6">
            <label className="block mb-2">Additional Message (Optional)</label>
            <textarea
              name="message"
              value={formData.message}
              onChange={handleChange}
              rows="3"
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 focus:outline-none focus:border-red-600"
              data-testid="message-input"
            ></textarea>
          </div>

          {error && (
            <div className="bg-red-900/30 border border-red-700 rounded-lg p-4 mb-4" data-testid="error-message">
              <p className="text-red-500">{error}</p>
            </div>
          )}

          <div className="bg-blue-900/30 border border-blue-700 rounded-lg p-4 mb-6">
            <p className="text-sm text-gray-400">
              <strong>Note:</strong> This is a booking request. Our team will review and contact you with payment instructions if approved.
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-4 rounded-lg transition-all disabled:opacity-50"
            data-testid="submit-booking-button"
          >
            {loading ? 'SUBMITTING...' : 'SUBMIT REQUEST'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default BookingModal;