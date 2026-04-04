import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Search, CheckCircle, Clock, XCircle, DollarSign, Receipt } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import SupportContactCard from '../components/SupportContactCard';
import useSupportSettings from '../hooks/useSupportSettings';
import { getTicketTierLabel } from '../utils/ticketTiers';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const createPaymentUpdateData = (booking = null) => ({
  payment_method: booking?.customer_payment_method || booking?.payment_method || 'cashapp',
  transaction_id: booking?.customer_payment_reference || '',
  payment_amount: booking?.customer_payment_amount || '',
  proof_url: booking?.customer_payment_proof_url || '',
  notes: booking?.customer_payment_notes || ''
});

const BookingStatus = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [confirmationNumber, setConfirmationNumber] = useState('');
  const [booking, setBooking] = useState(null);
  const [event, setEvent] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [paymentUpdateData, setPaymentUpdateData] = useState(createPaymentUpdateData());
  const [paymentUpdateLoading, setPaymentUpdateLoading] = useState(false);
  const [paymentUpdateError, setPaymentUpdateError] = useState('');
  const [paymentUpdateSuccess, setPaymentUpdateSuccess] = useState('');
  const { supportSettings } = useSupportSettings();

  const paymentActionRequested = searchParams.get('action') === 'payment';

  const searchBooking = useCallback(async (value) => {
    if (!value) {
      return;
    }

    setError('');
    setBooking(null);
    setEvent(null);
    setPaymentUpdateError('');
    setPaymentUpdateSuccess('');
    setLoading(true);

    try {
      const normalizedValue = value.toUpperCase();
      const response = await axios.get(`${API}/bookings/${normalizedValue}`);
      setConfirmationNumber(normalizedValue);
      setBooking(response.data.booking);
      setEvent(response.data.event);
    } catch (err) {
      setError('Booking not found. Please check your confirmation number.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const confirmationParam = searchParams.get('confirmation');
    if (confirmationParam) {
      searchBooking(confirmationParam);
    }
  }, [searchBooking, searchParams]);

  useEffect(() => {
    if (booking) {
      setPaymentUpdateData(createPaymentUpdateData(booking));
    }
  }, [booking]);

  const handleSearch = async (e) => {
    e.preventDefault();
    await searchBooking(confirmationNumber);
  };

  const handleSubmitPaymentUpdate = async (e) => {
    e.preventDefault();
    if (!booking) {
      return;
    }

    setPaymentUpdateError('');
    setPaymentUpdateSuccess('');
    setPaymentUpdateLoading(true);

    try {
      await axios.post(
        `${API}/bookings/${booking.confirmation_number}/payment-update`,
        {
          payment_method: paymentUpdateData.payment_method,
          transaction_id: paymentUpdateData.transaction_id,
          payment_amount: paymentUpdateData.payment_amount ? Number(paymentUpdateData.payment_amount) : null,
          proof_url: paymentUpdateData.proof_url || null,
          notes: paymentUpdateData.notes || null
        }
      );

      await searchBooking(booking.confirmation_number);
      setPaymentUpdateSuccess('Your payment update was received. Our team will review it and email you again after verification.');
    } catch (submitError) {
      setPaymentUpdateError(
        submitError.response?.data?.detail || 'We could not save your payment update. Please try again.'
      );
    } finally {
      setPaymentUpdateLoading(false);
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

  const getStatusMessage = (bookingData) => {
    if (!bookingData) {
      return '';
    }

    if (bookingData.status === 'approved' && bookingData.customer_payment_submitted_at) {
      return 'We received your payment update. Our team is verifying it now and will email you again once the booking moves forward.';
    }

    switch (bookingData.status) {
      case 'pending':
        return 'Your request has been received and is waiting for review by our team.';
      case 'approved':
        return 'Your request has been approved. Follow the payment instructions below, then use the payment update form to tell us once payment has been sent.';
      case 'paid':
        return 'Your payment has been recorded. We are preparing the final confirmation.';
      case 'confirmed':
        return 'Your booking is locked in. Keep your confirmation number for any future questions.';
      case 'rejected':
        return 'This request was not confirmed. Review the notes below and contact us if you want help with another option.';
      default:
        return 'Check back here any time for the latest update on your request.';
    }
  };

  const renderPaymentUpdateSummary = () => {
    if (!booking?.customer_payment_submitted_at) {
      return null;
    }

    return (
      <div className="mt-8 bg-emerald-900/20 border border-emerald-700 rounded-lg p-6">
        <div className="flex items-center gap-3 mb-4">
          <Receipt className="w-6 h-6 text-emerald-400" />
          <h3 className="text-xl font-bold">Payment Update Received</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-400">Method</p>
            <p className="font-bold uppercase">{booking.customer_payment_method}</p>
          </div>
          <div>
            <p className="text-gray-400">Reference</p>
            <p className="font-bold">{booking.customer_payment_reference}</p>
          </div>
          {booking.customer_payment_amount && (
            <div>
              <p className="text-gray-400">Amount</p>
              <p className="font-bold">${Number(booking.customer_payment_amount).toLocaleString()}</p>
            </div>
          )}
          <div>
            <p className="text-gray-400">Submitted</p>
            <p className="font-bold">{new Date(booking.customer_payment_submitted_at).toLocaleString()}</p>
          </div>
        </div>
        {booking.customer_payment_proof_url && (
          <div className="mt-4">
            <p className="text-gray-400 mb-1">Proof Link</p>
            <a
              href={booking.customer_payment_proof_url}
              target="_blank"
              rel="noreferrer"
              className="text-red-400 hover:text-red-300 underline break-all"
            >
              {booking.customer_payment_proof_url}
            </a>
          </div>
        )}
        {booking.customer_payment_notes && (
          <div className="mt-4">
            <p className="text-gray-400 mb-1">Notes</p>
            <p className="bg-zinc-800 p-3 rounded">{booking.customer_payment_notes}</p>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-zinc-900 to-black py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <button
          onClick={() => navigate('/')}
          className="mb-8 text-gray-400 hover:text-white transition-colors"
        >
          &larr; Back to Home
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
            <p className="text-center text-gray-400 mb-2">Confirmation: {booking.confirmation_number}</p>
            <p className="text-center text-gray-400 mb-8 max-w-2xl mx-auto">{getStatusMessage(booking)}</p>

            {paymentActionRequested && booking.status === 'approved' && (
              <div className="mb-8 bg-red-900/20 border border-red-700 rounded-lg p-5 text-center">
                <p className="font-semibold">You opened this page from your approval email.</p>
                <p className="text-gray-300 mt-2">Use the payment update section below once you have sent payment.</p>
              </div>
            )}

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
                  <p className="font-bold">{getTicketTierLabel(booking.ticket_type)}</p>
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

              {renderPaymentUpdateSummary()}

              {booking.status === 'approved' && (
                <div className="mt-8 bg-zinc-950 border border-zinc-800 rounded-lg p-6">
                  <h3 className="text-2xl font-bold mb-2">
                    {booking.customer_payment_submitted_at ? 'Update Payment Details' : 'Submit Payment Update'}
                  </h3>
                  <p className="text-gray-400 mb-6">
                    After you send payment, fill this in so our team can verify it and move your booking forward.
                  </p>

                  <form onSubmit={handleSubmitPaymentUpdate} className="space-y-4">
                    <div>
                      <label className="block mb-2 font-semibold">Payment Method</label>
                      <select
                        value={paymentUpdateData.payment_method}
                        onChange={(e) => setPaymentUpdateData({ ...paymentUpdateData, payment_method: e.target.value })}
                        className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3"
                      >
                        <option value="zelle">Zelle</option>
                        <option value="cashapp">Cash App</option>
                        <option value="applepay">Apple Pay</option>
                        <option value="bank">Bank Transfer</option>
                        <option value="btc">Bitcoin (BTC)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block mb-2 font-semibold">Transaction / Reference ID</label>
                      <input
                        type="text"
                        value={paymentUpdateData.transaction_id}
                        onChange={(e) => setPaymentUpdateData({ ...paymentUpdateData, transaction_id: e.target.value })}
                        className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-red-600"
                        placeholder="Enter your transfer, payment, or wallet reference"
                        required
                      />
                    </div>

                    <div>
                      <label className="block mb-2 font-semibold">Amount Sent (Optional)</label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={paymentUpdateData.payment_amount}
                        onChange={(e) => setPaymentUpdateData({ ...paymentUpdateData, payment_amount: e.target.value })}
                        className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-red-600"
                        placeholder="5000"
                      />
                    </div>

                    <div>
                      <label className="block mb-2 font-semibold">Proof Link (Optional)</label>
                      <input
                        type="url"
                        value={paymentUpdateData.proof_url}
                        onChange={(e) => setPaymentUpdateData({ ...paymentUpdateData, proof_url: e.target.value })}
                        className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-red-600"
                        placeholder="https://..."
                      />
                    </div>

                    <div>
                      <label className="block mb-2 font-semibold">Notes (Optional)</label>
                      <textarea
                        value={paymentUpdateData.notes}
                        onChange={(e) => setPaymentUpdateData({ ...paymentUpdateData, notes: e.target.value })}
                        className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-red-600"
                        rows="4"
                        placeholder="Anything we should know about the payment?"
                      />
                    </div>

                    {paymentUpdateError && (
                      <div className="bg-red-900/20 border border-red-700 rounded-lg p-4 text-red-300">
                        {paymentUpdateError}
                      </div>
                    )}

                    {paymentUpdateSuccess && (
                      <div className="bg-green-900/20 border border-green-700 rounded-lg p-4 text-green-300">
                        {paymentUpdateSuccess}
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={paymentUpdateLoading}
                      className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-lg transition-all disabled:opacity-50"
                    >
                      {paymentUpdateLoading ? 'Sending Update...' : booking.customer_payment_submitted_at ? 'Resend Payment Update' : 'Submit Payment Update'}
                    </button>
                  </form>
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

              <SupportContactCard
                supportSettings={supportSettings}
                confirmationNumber={booking.confirmation_number}
                title="Need to speak with us?"
                description="Include this confirmation number in your message so we can look up your request immediately."
                className="mt-8"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BookingStatus;
