import React, { useState } from 'react';
import axios from 'axios';
import { Search, CheckCircle, Clock, XCircle, DollarSign } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const BookingStatus = () => {
  const navigate = useNavigate();
  const [confirmationNumber, setConfirmationNumber] = useState('');
  const [booking, setBooking] = useState(null);
  const [event, setEvent] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    setError('');
    setBooking(null);
    setEvent(null);
    setLoading(true);

    try {
      const response = await axios.get(`${API}/bookings/${confirmationNumber.toUpperCase()}`);
      setBooking(response.data.booking);
      setEvent(response.data.event);
    } catch (err) {
      setError('Booking not found. Please check your confirmation number.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-12 h-12 text-yellow-500" />;
      case 'approved':
        return <CheckCircle className="w-12 h-12 text-blue-500" />;
      case 'paid':
        return <DollarSign className="w-12 h-12 text-green-500" />;
      case 'confirmed':
        return <CheckCircle className="w-12 h-12 text-green-500" />;
      case 'rejected':
        return <XCircle className="w-12 h-12 text-red-500" />;
      default:
        return <Clock className="w-12 h-12 text-gray-500" />;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'pending':
        return 'Pending Review';
      case 'approved':
        return 'Approved - Awaiting Payment';
      case 'paid':
        return 'Payment Received';
      case 'confirmed':
        return 'Confirmed';
      case 'rejected':
        return 'Rejected';
      default:
        return status;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-zinc-900 to-black py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <button 
          onClick={() => navigate('/')}
          className="mb-8 text-gray-400 hover:text-white transition-colors"
        >
          ← Back to Home
        </button>

        <h1 className="text-4xl md:text-5xl font-bold text-center mb-12" data-testid="booking-status-title">Check Booking Status</h1>

        <form onSubmit={handleSearch} className="mb-12">
          <div className="bg-zinc-900 rounded-lg p-8">
            <label className="block text-lg mb-4">Confirmation Number</label>
            <div className="flex gap-4">
              <input
                type="text"
                value={confirmationNumber}
                onChange={(e) => setConfirmationNumber(e.target.value)}
                placeholder="Enter your confirmation number"
                className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-red-600"
                data-testid="confirmation-number-input"
                required
              />
              <button
                type="submit"
                disabled={loading}
                className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-8 rounded-lg transition-all flex items-center gap-2 disabled:opacity-50"
                data-testid="search-button"
              >
                <Search className="w-5 h-5" />
                {loading ? 'Searching...' : 'Search'}
              </button>
            </div>
            {error && (
              <p className="text-red-500 mt-4" data-testid="error-message">{error}</p>
            )}
          </div>
        </form>

        {booking && event && (
          <div className="bg-zinc-900 rounded-lg p-8" data-testid="booking-details">
            <div className="flex items-center justify-center mb-8">
              {getStatusIcon(booking.status)}
            </div>
            
            <h2 className="text-3xl font-bold text-center mb-2">{getStatusText(booking.status)}</h2>
            <p className="text-center text-gray-400 mb-8">Confirmation: {booking.confirmation_number}</p>

            <div className="border-t border-zinc-700 pt-6">
              <h3 className="text-2xl font-bold mb-4">Event Details</h3>
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <p className="text-gray-400">Event</p>
                  <p className="font-bold">{event.title}</p>
                </div>
                <div>
                  <p className="text-gray-400">Venue</p>
                  <p className="font-bold">{event.venue}</p>
                </div>
                <div>
                  <p className="text-gray-400">Location</p>
                  <p className="font-bold">{event.city}</p>
                </div>
                <div>
                  <p className="text-gray-400">Date & Time</p>
                  <p className="font-bold">{event.date} • {event.time}</p>
                </div>
              </div>

              <h3 className="text-2xl font-bold mb-4 mt-8">Booking Details</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-gray-400">Name</p>
                  <p className="font-bold">{booking.customer_name}</p>
                </div>
                <div>
                  <p className="text-gray-400">Email</p>
                  <p className="font-bold">{booking.email}</p>
                </div>
                <div>
                  <p className="text-gray-400">Ticket Type</p>
                  <p className="font-bold capitalize">{booking.ticket_type.replace('meetgreet', 'Meet & Greet')}</p>
                </div>
                <div>
                  <p className="text-gray-400">Quantity</p>
                  <p className="font-bold">{booking.quantity}</p>
                </div>
              </div>

              {booking.status === 'approved' && booking.payment_instructions && (
                <div className="mt-8 bg-blue-900/30 border border-blue-700 rounded-lg p-6">
                  <h3 className="text-xl font-bold mb-4">Payment Instructions</h3>
                  <p className="whitespace-pre-wrap mb-4">{booking.payment_instructions}</p>
                  {booking.btc_wallet_address && (
                    <div className="mt-4">
                      <p className="text-gray-400">BTC Wallet Address:</p>
                      <p className="font-mono bg-zinc-800 p-3 rounded mt-2 break-all">{booking.btc_wallet_address}</p>
                      {booking.btc_amount && (
                        <p className="mt-2"><span className="text-gray-400">Amount:</span> {booking.btc_amount} BTC</p>
                      )}
                    </div>
                  )}
                </div>
              )}

              {booking.status === 'confirmed' && (
                <div className="mt-8 bg-green-900/30 border border-green-700 rounded-lg p-6 text-center">
                  <CheckCircle className="w-16 h-16 mx-auto mb-4 text-green-500" />
                  <h3 className="text-2xl font-bold mb-2">Your Booking is Confirmed!</h3>
                  <p className="text-gray-400">See you at the show!</p>
                </div>
              )}

              {booking.status === 'rejected' && booking.admin_notes && (
                <div className="mt-8 bg-red-900/30 border border-red-700 rounded-lg p-6">
                  <h3 className="text-xl font-bold mb-4">Admin Notes</h3>
                  <p>{booking.admin_notes}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BookingStatus;