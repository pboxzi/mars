import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { CheckCircle2, DollarSign, Eye, FileText, Trash2, X, XCircle } from 'lucide-react';
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

const statusTone = {
  pending: 'bg-amber-50 text-amber-700',
  approved: 'bg-blue-50 text-blue-700',
  paid: 'bg-emerald-50 text-emerald-700',
  confirmed: 'bg-green-50 text-green-700',
  rejected: 'bg-rose-50 text-rose-700',
};

const createApprovalData = (
  method = getDefaultLivePaymentMethod(),
  paymentSettings = defaultPaymentSettings,
  adminNotes = ''
) => ({
  payment_method: method,
  payment_instructions: paymentSettings[method]?.instructions || '',
  btc_wallet_address: method === 'btc' ? paymentSettings.btc?.btc_wallet_address || '' : '',
  btc_amount: 0,
  admin_notes: adminNotes
});

const BookingManagement = () => {
  const [bookings, setBookings] = useState([]);
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [paymentSettings, setPaymentSettings] = useState(defaultPaymentSettings);
  const [approvalData, setApprovalData] = useState(() => createApprovalData());
  const [btcPrice, setBtcPrice] = useState(0);
  const [deletingBookingId, setDeletingBookingId] = useState('');

  useEffect(() => {
    fetchBookings();
    fetchPaymentSettings();
    fetchBtcPrice();
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

  const fetchBtcPrice = async () => {
    try {
      const response = await axios.get(`${API}/btc-price`);
      setBtcPrice(response.data.btc_to_usd || 0);
    } catch (error) {
      console.error('Error fetching BTC price:', error);
    }
  };

  const openBooking = (booking) => {
    setSelectedBooking(booking);
    setApprovalData(createApprovalData(
      booking.payment_method || getDefaultLivePaymentMethod(),
      paymentSettings,
      booking.admin_notes || ''
    ));
  };

  const closeBooking = () => {
    setSelectedBooking(null);
    setApprovalData(createApprovalData());
  };

  const handleApprove = async (bookingId) => {
    try {
      const token = localStorage.getItem('admin_token');
      await axios.put(`${API}/admin/bookings/${bookingId}/approve`, approvalData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      await fetchBookings();
      closeBooking();
      alert('Booking approved');
    } catch (error) {
      console.error('Error approving booking:', error);
      alert(error.response?.data?.detail || 'Failed to approve booking');
    }
  };

  const handleReject = async (bookingId) => {
    const reason = window.prompt('Reason for rejection?');
    if (!reason) {
      return;
    }

    try {
      const token = localStorage.getItem('admin_token');
      await axios.put(
        `${API}/admin/bookings/${bookingId}/reject`,
        { admin_notes: reason },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      await fetchBookings();
      closeBooking();
      alert('Booking rejected');
    } catch (error) {
      console.error('Error rejecting booking:', error);
      alert(error.response?.data?.detail || 'Failed to reject booking');
    }
  };

  const handleMarkPaid = async (bookingId, currentReference = '') => {
    const reference = window.prompt('Transaction / reference ID', currentReference || '');
    if (reference === null) {
      return;
    }

    try {
      const token = localStorage.getItem('admin_token');
      await axios.put(
        `${API}/admin/bookings/${bookingId}/mark-paid`,
        { transaction_id: reference },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      await fetchBookings();
      closeBooking();
      alert('Booking marked as paid');
    } catch (error) {
      console.error('Error marking booking as paid:', error);
      alert(error.response?.data?.detail || 'Failed to mark booking as paid');
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
      closeBooking();
      alert('Booking confirmed');
    } catch (error) {
      console.error('Error confirming booking:', error);
      alert(error.response?.data?.detail || 'Failed to confirm booking');
    }
  };

  const handleDeleteBooking = async (booking) => {
    const confirmed = window.confirm(
      `Delete booking ${booking.confirmation_number} for ${booking.customer_name}?`
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
        closeBooking();
      }
      alert('Booking deleted');
    } catch (error) {
      console.error('Error deleting booking:', error);
      alert(error.response?.data?.detail || 'Failed to delete booking');
    } finally {
      setDeletingBookingId('');
    }
  };

  const getProgressAction = (booking) => {
    if (booking.status === 'approved') {
      return {
        label: 'Mark Paid',
        icon: DollarSign,
        onClick: () => handleMarkPaid(booking.id, booking.customer_payment_reference || ''),
        tone: 'bg-emerald-600 text-white',
      };
    }

    if (booking.status === 'paid') {
      return {
        label: 'Confirm',
        icon: CheckCircle2,
        onClick: () => handleConfirm(booking.id),
        tone: 'bg-[#151515] text-white',
      };
    }

    return null;
  };

  const filteredBookings = filterStatus === 'all'
    ? bookings
    : bookings.filter((booking) => booking.status === filterStatus);

  const tabs = [
    { value: 'all', label: 'All', count: bookings.length },
    { value: 'pending', label: 'Pending', count: bookings.filter((item) => item.status === 'pending').length },
    { value: 'approved', label: 'Approved', count: bookings.filter((item) => item.status === 'approved').length },
    { value: 'paid', label: 'Paid', count: bookings.filter((item) => item.status === 'paid').length },
    { value: 'confirmed', label: 'Confirmed', count: bookings.filter((item) => item.status === 'confirmed').length },
    { value: 'rejected', label: 'Rejected', count: bookings.filter((item) => item.status === 'rejected').length },
  ];

  const selectedProgressAction = selectedBooking ? getProgressAction(selectedBooking) : null;
  const SelectedProgressIcon = selectedProgressAction ? selectedProgressAction.icon : null;

  return (
    <div className="space-y-5" data-testid="booking-management">
      <div>
        <p className="text-xs uppercase tracking-[0.28em] text-[#9d172b]">Bookings</p>
        <h1 className="mt-1 text-3xl font-black text-[#151515] sm:text-4xl">Booking Queue</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-stone-600">
          Review requests, move them forward, or remove them when needed.
        </p>
      </div>

      <section className="rounded-[24px] border border-stone-200 bg-white p-3 sm:p-4">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {tabs.map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => setFilterStatus(tab.value)}
              className={`shrink-0 rounded-full px-4 py-2.5 text-sm font-semibold transition ${
                filterStatus === tab.value
                  ? 'bg-[#151515] text-white'
                  : 'border border-stone-200 bg-stone-50 text-stone-600'
              }`}
              data-testid={`tab-${tab.value}`}
            >
              {tab.label}
              <span className={`ml-2 inline-flex min-w-6 items-center justify-center rounded-full px-1.5 py-0.5 text-[11px] ${
                filterStatus === tab.value ? 'bg-white/20 text-white' : 'bg-white text-stone-500'
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      </section>

      <section className="md:hidden">
        {filteredBookings.length === 0 ? (
          <div className="rounded-[24px] border border-stone-200 bg-white px-5 py-8 text-center text-sm text-stone-500">
            No bookings in this view.
          </div>
        ) : (
          <div className="space-y-3">
            {filteredBookings.map((booking) => {
              const progressAction = getProgressAction(booking);
              const ProgressIcon = progressAction ? progressAction.icon : null;

              return (
                <div key={booking.id} className="rounded-[22px] border border-stone-200 bg-white p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-mono text-xs text-stone-500">{booking.confirmation_number}</p>
                      <p className="mt-1 text-base font-bold text-[#151515]">{booking.customer_name}</p>
                      <p className="mt-1 break-all text-sm text-stone-500">{booking.email}</p>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-[11px] font-bold ${statusTone[booking.status] || 'bg-stone-100 text-stone-700'}`}>
                      {booking.status.toUpperCase()}
                    </span>
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-3 text-sm text-stone-600">
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.15em] text-stone-400">Access</p>
                      <p className="mt-1">{getTicketTierLabel(booking.ticket_type)}</p>
                    </div>
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.15em] text-stone-400">Quantity</p>
                      <p className="mt-1">{booking.quantity}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-[11px] uppercase tracking-[0.15em] text-stone-400">Date</p>
                      <p className="mt-1">{new Date(booking.request_date).toLocaleDateString()}</p>
                    </div>
                  </div>

                  <div className={`mt-4 grid gap-2 ${progressAction ? 'grid-cols-3' : 'grid-cols-2'}`}>
                    <button
                      type="button"
                      onClick={() => openBooking(booking)}
                      className="inline-flex items-center justify-center gap-2 rounded-full bg-[#151515] px-4 py-2.5 text-sm font-semibold text-white"
                    >
                      <Eye className="h-4 w-4" />
                      Open
                    </button>
                    {progressAction && ProgressIcon && (
                      <button
                        type="button"
                        onClick={progressAction.onClick}
                        className={`inline-flex items-center justify-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold ${progressAction.tone}`}
                      >
                        <ProgressIcon className="h-4 w-4" />
                        {progressAction.label}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleDeleteBooking(booking)}
                      disabled={deletingBookingId === booking.id}
                      className="inline-flex items-center justify-center gap-2 rounded-full border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm font-semibold text-rose-700 disabled:opacity-50"
                    >
                      <Trash2 className="h-4 w-4" />
                      {deletingBookingId === booking.id ? 'Deleting...' : 'Delete'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section className="hidden overflow-hidden rounded-[24px] border border-stone-200 bg-white md:block">
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
                <th className="px-6 py-3 text-left text-sm font-bold">Actions</th>
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
                filteredBookings.map((booking) => {
                  const progressAction = getProgressAction(booking);
                  const ProgressIcon = progressAction ? progressAction.icon : null;

                  return (
                    <tr key={booking.id} className="border-t border-stone-200">
                      <td className="px-6 py-4 font-mono text-sm">{booking.confirmation_number}</td>
                      <td className="px-6 py-4">{booking.customer_name}</td>
                      <td className="px-6 py-4 text-sm">
                        <div>{booking.email}</div>
                        <div className="text-stone-500">{booking.phone}</div>
                      </td>
                      <td className="px-6 py-4">{getTicketTierLabel(booking.ticket_type)}</td>
                      <td className="px-6 py-4">{booking.quantity}</td>
                      <td className="px-6 py-4">
                        <span className={`rounded-full px-3 py-1 text-xs font-bold ${statusTone[booking.status] || 'bg-stone-100 text-stone-700'}`}>
                          {booking.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-stone-500">
                        {new Date(booking.request_date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => openBooking(booking)}
                            className="inline-flex items-center justify-center gap-2 rounded-full bg-[#151515] px-3 py-2 text-xs font-semibold text-white"
                          >
                            <Eye className="h-4 w-4" />
                            Open
                          </button>
                          {progressAction && ProgressIcon && (
                            <button
                              type="button"
                              onClick={progressAction.onClick}
                              className={`inline-flex items-center justify-center gap-2 rounded-full px-3 py-2 text-xs font-semibold ${progressAction.tone}`}
                            >
                              <ProgressIcon className="h-4 w-4" />
                              {progressAction.label}
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleDeleteBooking(booking)}
                            disabled={deletingBookingId === booking.id}
                            className="inline-flex items-center justify-center gap-2 rounded-full border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 disabled:opacity-50"
                          >
                            <Trash2 className="h-4 w-4" />
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      {selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-[28px] bg-white p-5 shadow-[0_20px_60px_rgba(0,0,0,0.18)] sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-[#9d172b]">Booking</p>
                <h2 className="mt-1 text-2xl font-black text-[#151515]">{selectedBooking.customer_name}</h2>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <p className="font-mono text-sm text-stone-500">{selectedBooking.confirmation_number}</p>
                  <span className={`inline-flex rounded-full px-3 py-1 text-[11px] font-bold ${statusTone[selectedBooking.status] || 'bg-stone-100 text-stone-700'}`}>
                    {selectedBooking.status.toUpperCase()}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={closeBooking}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-stone-200 bg-white text-stone-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <div className="rounded-[20px] border border-stone-200 bg-stone-50 p-4">
                <p className="text-sm font-semibold text-stone-500">Guest</p>
                <div className="mt-3 grid gap-3 text-sm text-stone-700">
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.15em] text-stone-400">Email</p>
                    <p className="mt-1 break-all font-medium">{selectedBooking.email}</p>
                  </div>
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.15em] text-stone-400">Phone</p>
                    <p className="mt-1">{selectedBooking.phone || 'Not provided'}</p>
                  </div>
                </div>
              </div>

              <div className="rounded-[20px] border border-stone-200 bg-stone-50 p-4">
                <p className="text-sm font-semibold text-stone-500">Order</p>
                <div className="mt-3 grid gap-3 text-sm text-stone-700">
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.15em] text-stone-400">Access</p>
                    <p className="mt-1">{getTicketTierLabel(selectedBooking.ticket_type)}</p>
                  </div>
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.15em] text-stone-400">Quantity</p>
                    <p className="mt-1">{selectedBooking.quantity}</p>
                  </div>
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.15em] text-stone-400">Requested</p>
                    <p className="mt-1">{new Date(selectedBooking.request_date).toLocaleString()}</p>
                  </div>
                </div>
              </div>
            </div>

            {selectedBooking.message && (
              <div className="mt-3 rounded-[20px] border border-stone-200 bg-white p-4">
                <p className="text-sm font-semibold text-stone-500">Customer Message</p>
                <p className="mt-2 text-sm leading-6 text-stone-700">{selectedBooking.message}</p>
              </div>
            )}

            {selectedBooking.customer_payment_submitted_at && (
              <div className="mt-3 rounded-[20px] border border-emerald-200 bg-emerald-50 p-4">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-emerald-700" />
                  <p className="text-sm font-semibold text-emerald-800">Customer Payment Update</p>
                </div>
                <div className="mt-3 grid gap-3 text-sm text-emerald-900 md:grid-cols-2">
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.15em] text-emerald-700">Submitted</p>
                    <p className="mt-1">{new Date(selectedBooking.customer_payment_submitted_at).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.15em] text-emerald-700">Method</p>
                    <p className="mt-1 uppercase">{selectedBooking.customer_payment_method || 'Not provided'}</p>
                  </div>
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.15em] text-emerald-700">Reference</p>
                    <p className="mt-1">{selectedBooking.customer_payment_reference || 'Not provided'}</p>
                  </div>
                  {selectedBooking.customer_payment_amount && (
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.15em] text-emerald-700">Amount</p>
                      <p className="mt-1">${Number(selectedBooking.customer_payment_amount).toLocaleString()}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {selectedBooking.status === 'pending' && (
              <div className="mt-3 rounded-[20px] border border-stone-200 bg-white p-4">
                <h3 className="text-lg font-black text-[#151515]">Approval</h3>
                <div className="mt-3 space-y-3.5">
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
                    <label className="mb-2 block text-sm font-semibold text-[#151515]">Payment Instructions</label>
                    <textarea
                      value={approvalData.payment_instructions}
                      onChange={(e) => setApprovalData({ ...approvalData, payment_instructions: e.target.value })}
                      className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm"
                      rows="4"
                    />
                  </div>

                  {approvalData.payment_method === 'btc' && (
                    <div className="grid gap-3 md:grid-cols-2">
                      <div>
                        <label className="mb-2 block text-sm font-semibold text-[#151515]">BTC Wallet Address</label>
                        <input
                          type="text"
                          value={approvalData.btc_wallet_address}
                          onChange={(e) => setApprovalData({ ...approvalData, btc_wallet_address: e.target.value })}
                          className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm font-mono"
                          placeholder="bc1q..."
                        />
                      </div>
                      <div>
                        <label className="mb-2 block text-sm font-semibold text-[#151515]">BTC Amount</label>
                        <input
                          type="number"
                          step="0.00000001"
                          value={approvalData.btc_amount || ''}
                          onChange={(e) => setApprovalData({
                            ...approvalData,
                            btc_amount: e.target.value ? parseFloat(e.target.value) || 0 : 0
                          })}
                          className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm"
                        />
                        <p className="mt-2 text-xs text-stone-500">Current BTC price: ${btcPrice.toFixed(2)}</p>
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-[#151515]">Admin Note</label>
                    <input
                      type="text"
                      value={approvalData.admin_notes}
                      onChange={(e) => setApprovalData({ ...approvalData, admin_notes: e.target.value })}
                      className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm"
                      placeholder="Optional note for this approval"
                    />
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <button
                      type="button"
                      onClick={() => handleApprove(selectedBooking.id)}
                      className="inline-flex items-center justify-center gap-2 rounded-full bg-emerald-600 px-5 py-3 text-sm font-semibold text-white"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      Approve
                    </button>
                    <button
                      type="button"
                      onClick={() => handleReject(selectedBooking.id)}
                      className="inline-flex items-center justify-center gap-2 rounded-full bg-rose-600 px-5 py-3 text-sm font-semibold text-white"
                    >
                      <XCircle className="h-4 w-4" />
                      Reject
                    </button>
                  </div>
                </div>
              </div>
            )}

            {selectedProgressAction && SelectedProgressIcon && (
              <div className="mt-3 rounded-[20px] border border-stone-200 bg-white p-4">
                <h3 className="text-lg font-black text-[#151515]">
                  {selectedBooking.status === 'approved' ? 'Payment Control' : 'Final Step'}
                </h3>
                <p className="mt-1 text-sm text-stone-600">
                  {selectedBooking.status === 'approved'
                    ? 'Use this after the payment is verified.'
                    : 'Finish the booking once everything is complete.'}
                </p>
                <button
                  type="button"
                  onClick={selectedProgressAction.onClick}
                  className={`mt-3 inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold ${selectedProgressAction.tone}`}
                >
                  <SelectedProgressIcon className="h-4 w-4" />
                  {selectedProgressAction.label}
                </button>
              </div>
            )}

            {(selectedBooking.status === 'approved' || selectedBooking.status === 'paid' || selectedBooking.status === 'confirmed') && selectedBooking.payment_instructions && (
              <div className="mt-3 rounded-[20px] border border-stone-200 bg-white p-4">
                <p className="text-sm font-semibold text-stone-500">Payment Instructions Sent</p>
                <div className="mt-3 rounded-2xl bg-stone-50 p-4 text-sm leading-6 text-stone-700">
                  <p className="whitespace-pre-wrap">{selectedBooking.payment_instructions}</p>
                </div>
              </div>
            )}

            <div className="mt-5 flex flex-col gap-2.5 sm:flex-row">
              <button
                type="button"
                onClick={closeBooking}
                className="inline-flex flex-1 items-center justify-center rounded-full border border-stone-200 bg-stone-50 px-5 py-3 text-sm font-semibold text-stone-700"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => handleDeleteBooking(selectedBooking)}
                disabled={deletingBookingId === selectedBooking.id}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-full border border-rose-200 bg-rose-50 px-5 py-3 text-sm font-semibold text-rose-700 disabled:opacity-50"
              >
                <Trash2 className="h-4 w-4" />
                {deletingBookingId === selectedBooking.id ? 'Deleting...' : 'Delete Booking'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookingManagement;
