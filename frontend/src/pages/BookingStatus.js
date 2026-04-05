import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Search, CheckCircle, Clock, XCircle, DollarSign, Receipt } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import SupportContactCard from '../components/SupportContactCard';
import TurnstileField, { isTurnstileEnabled } from '../components/TurnstileField';
import useSupportSettings from '../hooks/useSupportSettings';
import { trackPaymentUpdateSubmitted } from '../utils/adTracking';
import { getTicketTierLabel } from '../utils/ticketTiers';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const createPaymentUpdateData = (booking = null) => ({
  payment_method: booking?.customer_payment_method || booking?.payment_method || 'cashapp',
  transaction_id: booking?.customer_payment_reference || '',
  payment_amount: booking?.customer_payment_amount || '',
  proof_url: booking?.customer_payment_proof_url || '',
  notes: booking?.customer_payment_notes || '',
  website: ''
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
  const [captchaToken, setCaptchaToken] = useState('');
  const [captchaError, setCaptchaError] = useState('');
  const [captchaResetSignal, setCaptchaResetSignal] = useState(0);
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
    setCaptchaError('');

    if (isTurnstileEnabled && !captchaToken) {
      setCaptchaError('Please complete the security check.');
      return;
    }

    setPaymentUpdateLoading(true);

    try {
      await axios.post(
        `${API}/bookings/${booking.confirmation_number}/payment-update`,
        {
          payment_method: paymentUpdateData.payment_method,
          transaction_id: paymentUpdateData.transaction_id,
          payment_amount: paymentUpdateData.payment_amount ? Number(paymentUpdateData.payment_amount) : null,
          proof_url: paymentUpdateData.proof_url || null,
          notes: paymentUpdateData.notes || null,
          captcha_token: captchaToken || undefined,
          website: paymentUpdateData.website || undefined
        }
      );

      trackPaymentUpdateSubmitted({
        paymentMethod: paymentUpdateData.payment_method,
        value: paymentUpdateData.payment_amount ? Number(paymentUpdateData.payment_amount) : undefined,
        currency: 'USD',
        confirmationNumber: booking.confirmation_number,
      });
      await searchBooking(booking.confirmation_number);
      setPaymentUpdateSuccess('Your payment update was received. Our team will review it and email you again after verification.');
      setCaptchaToken('');
      setCaptchaResetSignal((current) => current + 1);
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
        return <Clock className="h-12 w-12 text-yellow-500" />;
      case 'approved':
        return <CheckCircle className="h-12 w-12 text-blue-500" />;
      case 'paid':
        return <DollarSign className="h-12 w-12 text-green-500" />;
      case 'confirmed':
        return <CheckCircle className="h-12 w-12 text-green-500" />;
      case 'rejected':
        return <XCircle className="h-12 w-12 text-red-500" />;
      default:
        return <Clock className="h-12 w-12 text-gray-500" />;
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
      <div className="mt-8 rounded-[24px] border border-[#b9d5c3] bg-[#f1fbf5] p-6">
        <div className="mb-4 flex items-center gap-3">
          <Receipt className="h-6 w-6 text-emerald-500" />
          <h3 className="text-xl font-bold">Payment Update Received</h3>
        </div>
        <div className="grid grid-cols-1 gap-4 text-sm md:grid-cols-2">
          <div>
            <p className="text-[#6b7d73]">Method</p>
            <p className="font-bold uppercase">{booking.customer_payment_method}</p>
          </div>
          <div>
            <p className="text-[#6b7d73]">Reference</p>
            <p className="font-bold">{booking.customer_payment_reference}</p>
          </div>
          {booking.customer_payment_amount && (
            <div>
              <p className="text-[#6b7d73]">Amount</p>
              <p className="font-bold">${Number(booking.customer_payment_amount).toLocaleString()}</p>
            </div>
          )}
          <div>
            <p className="text-[#6b7d73]">Submitted</p>
            <p className="font-bold">{new Date(booking.customer_payment_submitted_at).toLocaleString()}</p>
          </div>
        </div>
        {booking.customer_payment_proof_url && (
          <div className="mt-4">
            <p className="mb-1 text-[#6b7d73]">Proof Link</p>
            <a
              href={booking.customer_payment_proof_url}
              target="_blank"
              rel="noreferrer"
              className="break-all text-[#9d172b] underline transition-colors hover:opacity-80"
            >
              {booking.customer_payment_proof_url}
            </a>
          </div>
        )}
        {booking.customer_payment_notes && (
          <div className="mt-4">
            <p className="mb-1 text-[#6b7d73]">Notes</p>
            <p className="rounded-[16px] border border-[#d7e9dd] bg-white p-3">{booking.customer_payment_notes}</p>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#f7f2e8] px-4 py-12 text-[#171717]">
      <div className="mx-auto max-w-4xl">
        <button
          onClick={() => navigate('/')}
          className="mb-8 text-sm font-medium text-[#6d6359] transition-colors hover:text-[#171717]"
        >
          &larr; Back to Home
        </button>

        <h1 className="mb-12 text-center text-4xl font-black tracking-[-0.04em] md:text-5xl" data-testid="booking-status-title">
          Check Booking Status
        </h1>

        <form onSubmit={handleSearch} className="mb-12">
          <div className="rounded-[30px] border border-[#dfd2c0] bg-white p-8 shadow-[0_20px_60px_rgba(0,0,0,0.08)]">
            <label className="mb-4 block text-lg font-bold">Confirmation Number</label>
            <div className="flex flex-col gap-4 md:flex-row">
              <input
                type="text"
                value={confirmationNumber}
                onChange={(e) => setConfirmationNumber(e.target.value)}
                placeholder="Enter your confirmation number"
                className="flex-1 rounded-[18px] border border-[#d8cab6] bg-[#fbf6ee] px-4 py-3 text-[#171717] focus:border-[#9d172b] focus:outline-none"
                data-testid="confirmation-number-input"
                required
              />
              <button
                type="submit"
                disabled={loading}
                className="flex items-center justify-center gap-2 rounded-[18px] bg-[#171717] px-8 py-3 font-bold text-white transition-all hover:opacity-90 disabled:opacity-50"
                data-testid="search-button"
              >
                <Search className="h-5 w-5" />
                {loading ? 'Searching...' : 'Search'}
              </button>
            </div>
            {error && (
              <p className="mt-4 text-[#b42318]" data-testid="error-message">
                {error}
              </p>
            )}
          </div>
        </form>

        {booking && event && (
          <div
            className="rounded-[32px] border border-[#dfd2c0] bg-white p-8 text-[#171717] shadow-[0_22px_70px_rgba(0,0,0,0.09)]"
            data-testid="booking-details"
          >
            <div className="mb-8 flex items-center justify-center">{getStatusIcon(booking.status)}</div>

            <h2 className="mb-2 text-center text-3xl font-black tracking-[-0.04em]">{getStatusText(booking.status)}</h2>
            <p className="mb-2 text-center text-[#6c6258]">Confirmation: {booking.confirmation_number}</p>
            <p className="mx-auto mb-8 max-w-2xl text-center text-[#6c6258]">{getStatusMessage(booking)}</p>

            {paymentActionRequested && booking.status === 'approved' && (
              <div className="mb-8 rounded-[22px] border border-[#e6c4c8] bg-[#fff3f2] p-5 text-center">
                <p className="font-semibold">You opened this page from your approval email.</p>
                <p className="mt-2 text-[#6c6258]">Use the payment update section below once you have sent payment.</p>
              </div>
            )}

            <div className="border-t border-[#eadfce] pt-6">
              <h3 className="mb-4 text-2xl font-black tracking-[-0.03em]">Event Details</h3>
              <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <p className="text-[#8b7f72]">Event</p>
                  <p className="font-bold">{event.title}</p>
                </div>
                <div>
                  <p className="text-[#8b7f72]">Venue</p>
                  <p className="font-bold">{event.venue}</p>
                </div>
                <div>
                  <p className="text-[#8b7f72]">Location</p>
                  <p className="font-bold">{event.city}</p>
                </div>
                <div>
                  <p className="text-[#8b7f72]">Date & Time</p>
                  <p className="font-bold">{event.date} | {event.time}</p>
                </div>
              </div>

              <h3 className="mb-4 mt-8 text-2xl font-black tracking-[-0.03em]">Booking Details</h3>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <p className="text-[#8b7f72]">Name</p>
                  <p className="font-bold">{booking.customer_name}</p>
                </div>
                <div>
                  <p className="text-[#8b7f72]">Email</p>
                  <p className="font-bold">{booking.email}</p>
                </div>
                <div>
                  <p className="text-[#8b7f72]">Ticket Type</p>
                  <p className="font-bold">{getTicketTierLabel(booking.ticket_type)}</p>
                </div>
                <div>
                  <p className="text-[#8b7f72]">Quantity</p>
                  <p className="font-bold">{booking.quantity}</p>
                </div>
              </div>

              {booking.status === 'approved' && booking.payment_instructions && (
                <div className="mt-8 rounded-[24px] border border-[#bfd0e3] bg-[#eef5fb] p-6">
                  <h3 className="mb-4 text-xl font-bold">Payment Instructions</h3>
                  <p className="mb-4 whitespace-pre-wrap text-[#4f5c68]">{booking.payment_instructions}</p>
                  {booking.btc_wallet_address && (
                    <div className="mt-4">
                      <p className="text-[#6b7782]">BTC Wallet Address:</p>
                      <p className="mt-2 break-all rounded-[16px] border border-[#d6dfeb] bg-white p-3 font-mono">
                        {booking.btc_wallet_address}
                      </p>
                      {booking.btc_amount && (
                        <p className="mt-2">
                          <span className="text-[#6b7782]">Amount:</span> {booking.btc_amount} BTC
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}

              {renderPaymentUpdateSummary()}

              {booking.status === 'approved' && (
                <div className="mt-8 rounded-[24px] border border-[#dfd2c0] bg-[#fcf8f1] p-6">
                  <h3 className="mb-2 text-2xl font-black tracking-[-0.03em]">
                    {booking.customer_payment_submitted_at ? 'Update Payment Details' : 'Submit Payment Update'}
                  </h3>
                  <p className="mb-6 text-[#6c6258]">
                    After you send payment, fill this in so our team can verify it and move your booking forward.
                  </p>

                  <form onSubmit={handleSubmitPaymentUpdate} className="space-y-4">
                    <div>
                      <label className="mb-2 block font-semibold">Payment Method</label>
                      <select
                        value={paymentUpdateData.payment_method}
                        onChange={(e) => setPaymentUpdateData({ ...paymentUpdateData, payment_method: e.target.value })}
                        className="w-full rounded-[16px] border border-[#d8cab6] bg-white px-4 py-3 text-[#171717] focus:border-[#9d172b] focus:outline-none"
                      >
                        <option value="zelle">Zelle</option>
                        <option value="cashapp">Cash App</option>
                        <option value="applepay">Apple Pay</option>
                        <option value="bank">Bank Transfer</option>
                        <option value="btc">Bitcoin (BTC)</option>
                      </select>
                    </div>

                    <div>
                      <label className="mb-2 block font-semibold">Transaction / Reference ID</label>
                      <input
                        type="text"
                        value={paymentUpdateData.transaction_id}
                        onChange={(e) => setPaymentUpdateData({ ...paymentUpdateData, transaction_id: e.target.value })}
                        className="w-full rounded-[16px] border border-[#d8cab6] bg-white px-4 py-3 text-[#171717] focus:border-[#9d172b] focus:outline-none"
                        placeholder="Enter your transfer, payment, or wallet reference"
                        required
                      />
                    </div>

                    <div>
                      <label className="mb-2 block font-semibold">Amount Sent (Optional)</label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={paymentUpdateData.payment_amount}
                        onChange={(e) => setPaymentUpdateData({ ...paymentUpdateData, payment_amount: e.target.value })}
                        className="w-full rounded-[16px] border border-[#d8cab6] bg-white px-4 py-3 text-[#171717] focus:border-[#9d172b] focus:outline-none"
                        placeholder="5000"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block font-semibold">Proof Link (Optional)</label>
                      <input
                        type="url"
                        value={paymentUpdateData.proof_url}
                        onChange={(e) => setPaymentUpdateData({ ...paymentUpdateData, proof_url: e.target.value })}
                        className="w-full rounded-[16px] border border-[#d8cab6] bg-white px-4 py-3 text-[#171717] focus:border-[#9d172b] focus:outline-none"
                        placeholder="https://..."
                      />
                    </div>

                    <div>
                      <label className="mb-2 block font-semibold">Notes (Optional)</label>
                      <textarea
                        value={paymentUpdateData.notes}
                        onChange={(e) => setPaymentUpdateData({ ...paymentUpdateData, notes: e.target.value })}
                        className="w-full rounded-[16px] border border-[#d8cab6] bg-white px-4 py-3 text-[#171717] focus:border-[#9d172b] focus:outline-none"
                        rows="4"
                        placeholder="Anything we should know about the payment?"
                      />
                    </div>

                    <input
                      type="text"
                      value={paymentUpdateData.website}
                      onChange={(e) => setPaymentUpdateData({ ...paymentUpdateData, website: e.target.value })}
                      tabIndex="-1"
                      autoComplete="off"
                      className="hidden"
                      aria-hidden="true"
                    />

                    <TurnstileField
                      token={captchaToken}
                      onTokenChange={(nextToken) => {
                        setCaptchaToken(nextToken);
                        if (nextToken) {
                          setCaptchaError('');
                        }
                      }}
                      resetSignal={captchaResetSignal}
                      error={captchaError}
                    />

                    {paymentUpdateError && (
                      <div className="rounded-[18px] border border-[#e6c4c8] bg-[#fff3f2] p-4 text-[#b42318]">
                        {paymentUpdateError}
                      </div>
                    )}

                    {paymentUpdateSuccess && (
                      <div className="rounded-[18px] border border-[#b9d5c3] bg-[#f1fbf5] p-4 text-[#126b37]">
                        {paymentUpdateSuccess}
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={paymentUpdateLoading}
                      className="w-full rounded-[18px] bg-[#171717] py-3 font-bold text-white transition-all hover:opacity-90 disabled:opacity-50"
                    >
                      {paymentUpdateLoading
                        ? 'Sending Update...'
                        : booking.customer_payment_submitted_at
                          ? 'Resend Payment Update'
                          : 'Submit Payment Update'}
                    </button>
                  </form>
                </div>
              )}

              {booking.status === 'confirmed' && (
                <div className="mt-8 rounded-[24px] border border-[#b9d5c3] bg-[#f1fbf5] p-6 text-center">
                  <CheckCircle className="mx-auto mb-4 h-16 w-16 text-green-500" />
                  <h3 className="mb-2 text-2xl font-bold">Your Booking is Confirmed!</h3>
                  <p className="text-[#5a6b60]">See you at the show!</p>
                </div>
              )}

              {booking.status === 'rejected' && booking.admin_notes && (
                <div className="mt-8 rounded-[24px] border border-[#e6c4c8] bg-[#fff3f2] p-6">
                  <h3 className="mb-4 text-xl font-bold">Admin Notes</h3>
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
