import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { CheckCircle, DollarSign, Eye, FileText, Trash2, X, XCircle } from 'lucide-react';
import { getTicketTierLabel } from '../../utils/ticketTiers';
import {
  createDefaultPaymentSettings,
  getDefaultLivePaymentMethod,
  getPaymentInstructionsOrTemplate,
  PAYMENT_METHOD_OPTIONS
} from '../../utils/paymentInstructionTemplates';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;
const defaultPaymentSettings = createDefaultPaymentSettings();
const emptyBtcQuote = {
  price: 0,
  source: '',
  timestamp: '',
  isLive: false
};

const statusStyles = {
  pending: 'bg-amber-50 text-amber-700',
  approved: 'bg-blue-50 text-blue-700',
  paid: 'bg-emerald-50 text-emerald-700',
  confirmed: 'bg-green-50 text-green-700',
  rejected: 'bg-rose-50 text-rose-700'
};

const formatDate = (value) => {
  if (!value) {
    return 'Unknown date';
  }
  return new Date(value).toLocaleDateString();
};

const createApprovalData = (
  method = getDefaultLivePaymentMethod(),
  paymentSettings = defaultPaymentSettings,
  adminNotes = ''
) => {
  const selectedMethod = method || getDefaultLivePaymentMethod();

  return {
    payment_method: selectedMethod,
    payment_instructions: paymentSettings[selectedMethod]?.instructions || '',
    btc_wallet_address: selectedMethod === 'btc' ? paymentSettings.btc?.btc_wallet_address || '' : '',
    btc_amount: 0,
    admin_notes: adminNotes
  };
};

const BookingManagement = () => {
  const [bookings, setBookings] = useState([]);
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [btcQuote, setBtcQuote] = useState(emptyBtcQuote);
  const [selectedTicketPrice, setSelectedTicketPrice] = useState(null);
  const [paymentSettings, setPaymentSettings] = useState(defaultPaymentSettings);
  const [approvalData, setApprovalData] = useState(() => createApprovalData());
  const [rejectReason, setRejectReason] = useState('');
  const [manualTransactionId, setManualTransactionId] = useState('');
  const [deletingBookingId, setDeletingBookingId] = useState('');

  useEffect(() => {
    fetchBookings();
    fetchBtcPrice();
    fetchPaymentSettings();
  }, []);

  const fetchBookings = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      const response = await axios.get(`${API}/admin/bookings`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setBookings(response.data);
    } catch (error) {
      console.error('Error fetching bookings:', error);
    }
  };

  const fetchBtcPrice = async () => {
    try {
      const response = await axios.get(`${API}/btc-price`);
      setBtcQuote({
        price: response.data.btc_to_usd || 0,
        source: response.data.source || '',
        timestamp: response.data.timestamp || '',
        isLive: Boolean(response.data.is_live)
      });
    } catch (error) {
      console.error('Error fetching BTC price:', error);
      setBtcQuote(emptyBtcQuote);
    }
  };

  useEffect(() => {
    let ignore = false;

    const fetchSelectedTicketPrice = async () => {
      if (!selectedBooking) {
        setSelectedTicketPrice(null);
        return;
      }

      try {
        const response = await axios.get(`${API}/events/${selectedBooking.event_id}`);
        const matchedTicket = response.data.tickets?.find((ticket) => ticket.type === selectedBooking.ticket_type);
        if (!ignore) {
          setSelectedTicketPrice(matchedTicket?.price_usd ?? null);
        }
      } catch (error) {
        console.error('Error fetching selected ticket price:', error);
        if (!ignore) {
          setSelectedTicketPrice(null);
        }
      }
    };

    fetchSelectedTicketPrice();

    return () => {
      ignore = true;
    };
  }, [selectedBooking]);

  const fetchPaymentSettings = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      const response = await axios.get(`${API}/admin/payment-settings`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const nextSettings = response.data.reduce((acc, setting) => ({
        ...acc,
        [setting.payment_method]: {
          instructions: getPaymentInstructionsOrTemplate(setting.payment_method, setting.instructions),
          btc_wallet_address: setting.btc_wallet_address || ''
        }
      }), defaultPaymentSettings);

      setPaymentSettings(nextSettings);
    } catch (error) {
      console.error('Error fetching payment settings:', error);
    }
  };

  const openBookingDetails = (booking) => {
    setSelectedBooking(booking);
    setRejectReason('');
    setManualTransactionId(booking.customer_payment_reference || '');
    if (booking.status === 'pending') {
      setApprovalData(createApprovalData(getDefaultLivePaymentMethod(), paymentSettings));
    } else {
      setApprovalData(createApprovalData(booking.payment_method || getDefaultLivePaymentMethod(), paymentSettings));
    }
  };

  const closeBookingDetails = () => {
    setSelectedBooking(null);
    setSelectedTicketPrice(null);
    setRejectReason('');
    setManualTransactionId('');
    setApprovalData(createApprovalData(getDefaultLivePaymentMethod(), paymentSettings));
  };

  const btcQuoteUpdatedLabel = btcQuote.timestamp ? new Date(btcQuote.timestamp).toLocaleString() : '';
  const selectedBookingTotal =
    selectedBooking && selectedTicketPrice
      ? selectedTicketPrice * selectedBooking.quantity
      : null;
  const liveBtcEstimate =
    approvalData.payment_method === 'btc' && selectedBookingTotal && btcQuote.price
      ? selectedBookingTotal / btcQuote.price
      : null;

  const handleApprove = async (bookingId) => {
    try {
      const token = localStorage.getItem('admin_token');
      await axios.put(
        `${API}/admin/bookings/${bookingId}/approve`,
        approvalData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      await fetchBookings();
      closeBookingDetails();
      alert('Approved');
    } catch (error) {
      console.error('Error approving booking:', error);
      alert(error.response?.data?.detail || 'Approve failed');
    }
  };

  const handleReject = async (bookingId) => {
    if (!rejectReason.trim()) {
      alert('Add a reject reason');
      return;
    }

    try {
      const token = localStorage.getItem('admin_token');
      await axios.put(
        `${API}/admin/bookings/${bookingId}/reject`,
        { admin_notes: rejectReason.trim() },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      await fetchBookings();
      closeBookingDetails();
      alert('Rejected');
    } catch (error) {
      console.error('Error rejecting booking:', error);
      alert(error.response?.data?.detail || 'Reject failed');
    }
  };

  const handleMarkPaid = async (bookingId) => {
    try {
      const token = localStorage.getItem('admin_token');
      await axios.put(
        `${API}/admin/bookings/${bookingId}/mark-paid`,
        { transaction_id: manualTransactionId.trim() },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      await fetchBookings();
      closeBookingDetails();
      alert('Marked paid');
    } catch (error) {
      console.error('Error marking booking as paid:', error);
      alert('Mark paid failed');
    }
  };

  const handleConfirm = async (bookingId) => {
    try {
      const token = localStorage.getItem('admin_token');
      await axios.put(
        `${API}/admin/bookings/${bookingId}/confirm`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      await fetchBookings();
      closeBookingDetails();
      alert('Confirmed');
    } catch (error) {
      console.error('Error confirming booking:', error);
      alert('Confirm failed');
    }
  };

  const handleDeleteBooking = async (booking) => {
    const confirmed = window.confirm(
      `Delete booking ${booking.confirmation_number} for ${booking.customer_name}? This action cannot be undone.`
    );

    if (!confirmed) {
      return;
    }

    setDeletingBookingId(booking.id);

    try {
      const token = localStorage.getItem('admin_token');
      await axios.delete(`${API}/admin/bookings/${booking.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      await fetchBookings();
      if (selectedBooking?.id === booking.id) {
        closeBookingDetails();
      }
      alert('Deleted');
    } catch (error) {
      console.error('Error deleting booking:', error);
      alert(error.response?.data?.detail || 'Delete failed');
    } finally {
      setDeletingBookingId('');
    }
  };

  const filteredBookings = filterStatus === 'all' 
    ? bookings 
    : bookings.filter(b => b.status === filterStatus);

  const statusTabs = [
    { value: 'all', label: 'All', count: bookings.length },
    { value: 'pending', label: 'Pending', count: bookings.filter(b => b.status === 'pending').length },
    { value: 'approved', label: 'Approved', count: bookings.filter(b => b.status === 'approved').length },
    { value: 'paid', label: 'Paid', count: bookings.filter(b => b.status === 'paid').length },
    { value: 'confirmed', label: 'Confirmed', count: bookings.filter(b => b.status === 'confirmed').length },
    { value: 'rejected', label: 'Rejected', count: bookings.filter(b => b.status === 'rejected').length },
  ];

  return (
    <div className="space-y-6" data-testid="booking-management">
      <section className="rounded-[28px] border border-stone-200 bg-white p-5 shadow-[0_12px_30px_rgba(48,32,11,0.05)] sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-[0.22em] text-[#9d172b]">Bookings</p>
            <h1 className="mt-2 text-2xl font-black text-[#151515] sm:text-3xl">Keep guest files moving.</h1>
            <p className="mt-2 text-sm leading-6 text-stone-600">
              Open a file to approve, reject, verify payment, or confirm the final booking.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:min-w-[20rem]">
            <div className="rounded-2xl border border-stone-200 bg-[#fcfaf6] p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-stone-400">Visible</p>
              <p className="mt-2 text-2xl font-black text-[#151515]">{filteredBookings.length}</p>
            </div>
            <div className="rounded-2xl border border-stone-200 bg-[#fcfaf6] p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-stone-400">Pending</p>
              <p className="mt-2 text-2xl font-black text-[#151515]">
                {statusTabs.find((tab) => tab.value === 'pending')?.count || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="-mx-5 mt-5 overflow-x-auto px-5 sm:-mx-6 sm:px-6">
          <div className="flex gap-2 pb-1">
            {statusTabs.map((tab) => (
              <button
                key={tab.value}
                type="button"
                onClick={() => setFilterStatus(tab.value)}
                className={`shrink-0 rounded-full px-4 py-2.5 text-sm font-semibold transition ${
                  filterStatus === tab.value ? 'bg-[#151515] text-white' : 'border border-stone-200 bg-white text-stone-600'
                }`}
                data-testid={`tab-${tab.value}`}
              >
                {tab.label} <span className="text-xs opacity-75">{tab.count}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="md:hidden">
        {filteredBookings.length === 0 ? (
          <div className="rounded-[24px] border border-stone-200 bg-white px-5 py-8 text-center text-sm text-stone-500">
            No bookings in this view.
          </div>
        ) : (
          <div className="space-y-3">
            {filteredBookings.map((booking) => (
              <div key={booking.id} className="rounded-[24px] border border-stone-200 bg-white p-4 shadow-[0_10px_24px_rgba(48,32,11,0.04)]">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-mono text-xs text-stone-500">{booking.confirmation_number}</p>
                    <p className="mt-1 text-base font-black text-[#151515]">{booking.customer_name}</p>
                    <p className="mt-1 break-all text-sm text-stone-500">{booking.email}</p>
                  </div>
                  <span className={`shrink-0 rounded-full px-3 py-1 text-[11px] font-bold ${statusStyles[booking.status] || 'bg-stone-100 text-stone-700'}`}>
                    {booking.status.toUpperCase()}
                  </span>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.15em] text-stone-400">Access</p>
                    <p className="mt-1 text-stone-700">{getTicketTierLabel(booking.ticket_type)}</p>
                  </div>
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.15em] text-stone-400">Qty</p>
                    <p className="mt-1 text-stone-700">{booking.quantity}</p>
                  </div>
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.15em] text-stone-400">Phone</p>
                    <p className="mt-1 text-stone-700">{booking.phone || 'Not provided'}</p>
                  </div>
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.15em] text-stone-400">Date</p>
                    <p className="mt-1 text-stone-700">{formatDate(booking.request_date)}</p>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => openBookingDetails(booking)}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#151515] px-4 py-3 text-sm font-semibold text-white"
                    data-testid={`view-booking-${booking.id}`}
                  >
                    <Eye className="h-4 w-4" />
                    Open
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteBooking(booking)}
                    disabled={deletingBookingId === booking.id}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
                    data-testid={`delete-booking-${booking.id}`}
                  >
                    <Trash2 className="h-4 w-4" />
                    {deletingBookingId === booking.id ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="hidden overflow-hidden rounded-[28px] border border-stone-200 bg-white shadow-[0_12px_30px_rgba(48,32,11,0.05)] md:block">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px]">
            <thead className="bg-stone-100">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-bold">Confirmation</th>
                <th className="px-6 py-3 text-left text-sm font-bold">Customer</th>
                <th className="px-6 py-3 text-left text-sm font-bold">Contact</th>
                <th className="px-6 py-3 text-left text-sm font-bold">Access</th>
                <th className="px-6 py-3 text-left text-sm font-bold">Qty</th>
                <th className="px-6 py-3 text-left text-sm font-bold">Status</th>
                <th className="px-6 py-3 text-left text-sm font-bold">Date</th>
                <th className="px-6 py-3 text-left text-sm font-bold">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredBookings.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-6 py-8 text-center text-stone-500">
                    No bookings in this view.
                  </td>
                </tr>
              ) : (
                filteredBookings.map((booking) => (
                  <tr key={booking.id} className="border-t border-stone-200 hover:bg-stone-50" data-testid={`booking-row-${booking.id}`}>
                    <td className="px-6 py-4 font-mono text-sm">{booking.confirmation_number}</td>
                    <td className="px-6 py-4">{booking.customer_name}</td>
                    <td className="px-6 py-4 text-sm">
                      <div>{booking.email}</div>
                      <div className="text-stone-500">{booking.phone}</div>
                    </td>
                    <td className="px-6 py-4">{getTicketTierLabel(booking.ticket_type)}</td>
                    <td className="px-6 py-4">{booking.quantity}</td>
                    <td className="px-6 py-4">
                      <span className={`rounded-full px-3 py-1 text-xs font-bold ${statusStyles[booking.status] || 'bg-stone-100 text-stone-700'}`}>
                        {booking.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-stone-500">{formatDate(booking.request_date)}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => openBookingDetails(booking)}
                          className="inline-flex items-center gap-2 rounded-full bg-[#151515] px-4 py-2 text-sm font-semibold text-white"
                          data-testid={`view-booking-${booking.id}`}
                        >
                          <Eye className="h-4 w-4" />
                          Open
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteBooking(booking)}
                          disabled={deletingBookingId === booking.id}
                          className="inline-flex items-center gap-2 rounded-full border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
                          data-testid={`delete-booking-${booking.id}`}
                        >
                          <Trash2 className="h-4 w-4" />
                          {deletingBookingId === booking.id ? 'Deleting...' : 'Delete'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-end bg-black/45 p-0 backdrop-blur-sm sm:items-center sm:justify-center sm:p-4" data-testid="booking-detail-modal">
          <div className="max-h-[94vh] w-full overflow-y-auto rounded-t-[32px] bg-[#fbf8f2] p-5 shadow-[0_-18px_45px_rgba(48,32,11,0.16)] sm:max-w-4xl sm:rounded-[32px] sm:p-7">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[11px] uppercase tracking-[0.22em] text-[#9d172b]">Booking File</p>
                <h2 className="mt-2 text-2xl font-black text-[#151515]">{selectedBooking.customer_name}</h2>
                <p className="mt-1 font-mono text-sm text-stone-500">{selectedBooking.confirmation_number}</p>
              </div>
              <button
                type="button"
                onClick={closeBookingDetails}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-stone-200 bg-white text-[#151515]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-5 grid gap-4 lg:grid-cols-2">
              <div className="rounded-[24px] border border-stone-200 bg-white p-5">
                <p className="text-[11px] uppercase tracking-[0.18em] text-stone-400">Guest</p>
                <div className="mt-4 space-y-3 text-sm text-stone-700">
                  <div>
                    <p className="text-stone-400">Name</p>
                    <p className="mt-1 font-semibold">{selectedBooking.customer_name}</p>
                  </div>
                  <div>
                    <p className="text-stone-400">Email</p>
                    <p className="mt-1 break-all">{selectedBooking.email}</p>
                  </div>
                  <div>
                    <p className="text-stone-400">Phone</p>
                    <p className="mt-1">{selectedBooking.phone || 'Not provided'}</p>
                  </div>
                  {selectedBooking.message && (
                    <div>
                      <p className="text-stone-400">Message</p>
                      <p className="mt-1 rounded-2xl bg-stone-50 p-3 leading-6">{selectedBooking.message}</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="rounded-[24px] border border-stone-200 bg-white p-5">
                <p className="text-[11px] uppercase tracking-[0.18em] text-stone-400">Booking</p>
                <div className="mt-4 grid grid-cols-2 gap-4 text-sm text-stone-700">
                  <div>
                    <p className="text-stone-400">Status</p>
                    <span className={`mt-1 inline-flex rounded-full px-3 py-1 text-xs font-bold ${statusStyles[selectedBooking.status] || 'bg-stone-100 text-stone-700'}`}>
                      {selectedBooking.status.toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="text-stone-400">Date</p>
                    <p className="mt-1">{formatDate(selectedBooking.request_date)}</p>
                  </div>
                  <div>
                    <p className="text-stone-400">Access</p>
                    <p className="mt-1">{getTicketTierLabel(selectedBooking.ticket_type)}</p>
                  </div>
                  <div>
                    <p className="text-stone-400">Quantity</p>
                    <p className="mt-1">{selectedBooking.quantity}</p>
                  </div>
                  {selectedTicketPrice !== null && (
                    <>
                      <div>
                        <p className="text-stone-400">Price Per Guest</p>
                        <p className="mt-1">${selectedTicketPrice.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-stone-400">Order Total</p>
                        <p className="mt-1 font-semibold">
                          ${Number((selectedTicketPrice || 0) * selectedBooking.quantity).toLocaleString()}
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {selectedBooking.customer_payment_submitted_at && (
              <div className="mt-4 rounded-[24px] border border-emerald-200 bg-emerald-50 p-5">
                <div className="flex items-center gap-3">
                  <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
                    <FileText className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.18em] text-emerald-700">Payment Update</p>
                    <p className="mt-1 text-sm text-emerald-900">Customer payment details submitted from the public page.</p>
                  </div>
                </div>

                <div className="mt-4 grid gap-4 sm:grid-cols-2 text-sm text-emerald-900">
                  <div>
                    <p className="text-emerald-700">Submitted</p>
                    <p className="mt-1">{new Date(selectedBooking.customer_payment_submitted_at).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-emerald-700">Method</p>
                    <p className="mt-1 uppercase">{selectedBooking.customer_payment_method || 'Not provided'}</p>
                  </div>
                  <div>
                    <p className="text-emerald-700">Reference</p>
                    <p className="mt-1">{selectedBooking.customer_payment_reference || 'Not provided'}</p>
                  </div>
                  {selectedBooking.customer_payment_amount && (
                    <div>
                      <p className="text-emerald-700">Amount</p>
                      <p className="mt-1">${Number(selectedBooking.customer_payment_amount).toLocaleString()}</p>
                    </div>
                  )}
                </div>

                {selectedBooking.customer_payment_proof_url && (
                  <div className="mt-4 text-sm">
                    <p className="text-emerald-700">Proof Link</p>
                    <a
                      href={selectedBooking.customer_payment_proof_url}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-1 block break-all font-medium text-emerald-800 underline"
                    >
                      {selectedBooking.customer_payment_proof_url}
                    </a>
                  </div>
                )}

                {selectedBooking.customer_payment_notes && (
                  <div className="mt-4 text-sm">
                    <p className="text-emerald-700">Notes</p>
                    <p className="mt-1 rounded-2xl bg-white/70 p-3 leading-6 text-emerald-900">
                      {selectedBooking.customer_payment_notes}
                    </p>
                  </div>
                )}
              </div>
            )}

            {selectedBooking.status === 'pending' && (
              <div className="mt-4 rounded-[24px] border border-stone-200 bg-white p-5">
                <p className="text-[11px] uppercase tracking-[0.18em] text-[#9d172b]">Approval</p>
                <h3 className="mt-2 text-xl font-black text-[#151515]">Prepare the approval details</h3>

                <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-900">
                  Use Bank Transfer or Bitcoin first while traffic is high. Only switch to other methods if your team is ready to process them.
                </div>

                <div className="mt-4 space-y-4">
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-[#151515]">Payment Method</label>
                    <select
                      value={approvalData.payment_method}
                      onChange={(e) =>
                        setApprovalData(createApprovalData(e.target.value, paymentSettings, approvalData.admin_notes))
                      }
                      className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm"
                    >
                      {Object.values(PAYMENT_METHOD_OPTIONS).map((method) => (
                        <option key={method.key} value={method.key}>
                          {method.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-[#151515]">Instructions</label>
                    <textarea
                      value={approvalData.payment_instructions}
                      onChange={(e) => setApprovalData({ ...approvalData, payment_instructions: e.target.value })}
                      className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm"
                      rows="6"
                    />
                  </div>

                  {approvalData.payment_method === 'btc' && (
                    <>
                      <div>
                        <label className="mb-2 block text-sm font-semibold text-[#151515]">BTC Wallet Address</label>
                        <input
                          type="text"
                          value={approvalData.btc_wallet_address}
                          onChange={(e) => setApprovalData({ ...approvalData, btc_wallet_address: e.target.value })}
                          className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 font-mono text-sm"
                          placeholder="bc1q..."
                        />
                      </div>
                      <div>
                        <label className="mb-2 block text-sm font-semibold text-[#151515]">BTC Amount</label>
                        <input
                          type="number"
                          step="0.00000001"
                          value={approvalData.btc_amount || ''}
                          onChange={(e) =>
                            setApprovalData({
                              ...approvalData,
                              btc_amount: e.target.value ? parseFloat(e.target.value) || 0 : 0
                            })
                          }
                          className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm"
                          placeholder="Leave blank to auto-calculate"
                        />
                        <p className="mt-2 text-sm text-stone-500">
                          Live BTC reference: {btcQuote.price ? `$${btcQuote.price.toFixed(2)} / BTC` : 'Loading...'}
                          {btcQuote.source ? ` from ${btcQuote.source}` : ''}
                        </p>
                        {liveBtcEstimate ? (
                          <p className="mt-1 text-sm text-stone-500">
                            If left blank, this booking will lock at about {liveBtcEstimate.toFixed(8)} BTC.
                          </p>
                        ) : null}
                        {btcQuoteUpdatedLabel ? <p className="mt-1 text-xs text-stone-400">Updated {btcQuoteUpdatedLabel}</p> : null}
                      </div>
                    </>
                  )}

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-[#151515]">Internal Note</label>
                    <input
                      type="text"
                      value={approvalData.admin_notes}
                      onChange={(e) => setApprovalData({ ...approvalData, admin_notes: e.target.value })}
                      className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-[#151515]">Reject Reason</label>
                    <textarea
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm"
                      rows="3"
                      placeholder="Add a clear reason if you need to reject this file."
                    />
                  </div>
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => handleApprove(selectedBooking.id)}
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-emerald-600 px-5 py-3 text-sm font-semibold text-white"
                    data-testid="approve-button"
                  >
                    <CheckCircle className="h-4 w-4" />
                    Approve Booking
                  </button>
                  <button
                    type="button"
                    onClick={() => handleReject(selectedBooking.id)}
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-rose-600 px-5 py-3 text-sm font-semibold text-white"
                    data-testid="reject-button"
                  >
                    <XCircle className="h-4 w-4" />
                    Reject Booking
                  </button>
                </div>
              </div>
            )}

            {(selectedBooking.status === 'approved' || selectedBooking.status === 'paid' || selectedBooking.status === 'confirmed') && selectedBooking.payment_instructions && (
              <div className="mt-4 rounded-[24px] border border-stone-200 bg-white p-5">
                <p className="text-[11px] uppercase tracking-[0.18em] text-stone-400">Sent To Guest</p>
                <h3 className="mt-2 text-xl font-black text-[#151515]">Payment Instructions</h3>
                <div className="mt-4 rounded-2xl bg-stone-50 p-4 text-sm leading-6 text-stone-700">
                  <p className="whitespace-pre-wrap">{selectedBooking.payment_instructions}</p>
                </div>

                {selectedBooking.btc_wallet_address && (
                  <div className="mt-4 rounded-2xl border border-stone-200 bg-[#fcfaf6] p-4">
                    <p className="text-sm font-semibold text-[#151515]">BTC Wallet</p>
                    <p className="mt-2 break-all font-mono text-sm text-stone-700">{selectedBooking.btc_wallet_address}</p>
                    {selectedBooking.btc_amount && <p className="mt-2 text-sm text-stone-600">Amount: {selectedBooking.btc_amount} BTC</p>}
                  </div>
                )}
              </div>
            )}

            {selectedBooking.status === 'approved' && (
              <div className="mt-4 rounded-[24px] border border-stone-200 bg-white p-5">
                <p className="text-[11px] uppercase tracking-[0.18em] text-stone-400">Payment Control</p>
                <h3 className="mt-2 text-xl font-black text-[#151515]">Mark this booking as paid</h3>
                <p className="mt-2 text-sm leading-6 text-stone-600">
                  Add the transaction or transfer reference if you have one, then move the file into the paid stage.
                </p>

                <div className="mt-4">
                  <label className="mb-2 block text-sm font-semibold text-[#151515]">Transaction / Reference ID</label>
                  <input
                    type="text"
                    value={manualTransactionId}
                    onChange={(e) => setManualTransactionId(e.target.value)}
                    className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm"
                    placeholder="Optional but recommended"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => handleMarkPaid(selectedBooking.id)}
                  className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-emerald-600 px-5 py-3 text-sm font-semibold text-white"
                >
                  <DollarSign className="h-4 w-4" />
                  Mark Paid
                </button>
              </div>
            )}

            {selectedBooking.status === 'paid' && (
              <div className="mt-4 rounded-[24px] border border-stone-200 bg-white p-5">
                <p className="text-[11px] uppercase tracking-[0.18em] text-stone-400">Final Step</p>
                <h3 className="mt-2 text-xl font-black text-[#151515]">Confirm the booking</h3>
                <p className="mt-2 text-sm leading-6 text-stone-600">
                  Once everything checks out, send the guest into the confirmed stage.
                </p>

                <button
                  type="button"
                  onClick={() => handleConfirm(selectedBooking.id)}
                  className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#151515] px-5 py-3 text-sm font-semibold text-white"
                >
                  <CheckCircle className="h-4 w-4" />
                  Confirm Booking
                </button>
              </div>
            )}

            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={() => handleDeleteBooking(selectedBooking)}
                disabled={deletingBookingId === selectedBooking.id}
                className="inline-flex items-center justify-center gap-2 rounded-full border border-rose-200 bg-rose-50 px-5 py-3 text-sm font-semibold text-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Trash2 className="h-4 w-4" />
                {deletingBookingId === selectedBooking.id ? 'Deleting Booking...' : 'Delete Booking'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookingManagement;

