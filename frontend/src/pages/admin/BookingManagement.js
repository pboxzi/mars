import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { CheckCircle, XCircle, DollarSign, Eye } from 'lucide-react';
import { getTicketTierLabel } from '../../utils/ticketTiers';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;
const defaultPaymentSettings = {
  zelle: { instructions: '', btc_wallet_address: '' },
  cashapp: { instructions: '', btc_wallet_address: '' },
  applepay: { instructions: '', btc_wallet_address: '' },
  bank: { instructions: '', btc_wallet_address: '' },
  btc: { instructions: '', btc_wallet_address: '' }
};

const createApprovalData = (method = 'zelle', paymentSettings = defaultPaymentSettings, adminNotes = '') => ({
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
  const [btcPrice, setBtcPrice] = useState(50000);
  const [paymentSettings, setPaymentSettings] = useState(defaultPaymentSettings);
  const [approvalData, setApprovalData] = useState(() => createApprovalData());

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
      setBtcPrice(response.data.btc_to_usd);
    } catch (error) {
      console.error('Error fetching BTC price:', error);
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
          instructions: setting.instructions || '',
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
    if (booking.status === 'pending') {
      setApprovalData(createApprovalData('zelle', paymentSettings));
    }
  };

  const closeBookingDetails = () => {
    setSelectedBooking(null);
    setApprovalData(createApprovalData('zelle', paymentSettings));
  };

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
      alert('Booking approved successfully!');
    } catch (error) {
      console.error('Error approving booking:', error);
      alert(error.response?.data?.detail || 'Failed to approve booking');
    }
  };

  const handleReject = async (bookingId, notes) => {
    if (!notes) {
      alert('Please provide a reason for rejection');
      return;
    }

    try {
      const token = localStorage.getItem('admin_token');
      await axios.put(
        `${API}/admin/bookings/${bookingId}/reject`,
        { admin_notes: notes },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      await fetchBookings();
      closeBookingDetails();
      alert('Booking rejected');
    } catch (error) {
      console.error('Error rejecting booking:', error);
      alert(error.response?.data?.detail || 'Failed to reject booking');
    }
  };

  const handleMarkPaid = async (bookingId, transactionId) => {
    try {
      const token = localStorage.getItem('admin_token');
      await axios.put(
        `${API}/admin/bookings/${bookingId}/mark-paid`,
        { transaction_id: transactionId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchBookings();
      alert('Booking marked as paid!');
    } catch (error) {
      console.error('Error marking booking as paid:', error);
      alert('Failed to mark booking as paid');
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
      fetchBookings();
      alert('Booking confirmed!');
    } catch (error) {
      console.error('Error confirming booking:', error);
      alert('Failed to confirm booking');
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
    <div data-testid="booking-management">
      <h1 className="text-4xl font-bold mb-8">Booking Management</h1>

      {/* Status Tabs */}
      <div className="flex gap-2 mb-8 overflow-x-auto">
        {statusTabs.map(tab => (
          <button
            key={tab.value}
            onClick={() => setFilterStatus(tab.value)}
            className={`px-6 py-3 rounded-lg font-bold whitespace-nowrap ${
              filterStatus === tab.value
                ? 'bg-red-600 text-white'
                : 'bg-zinc-900 text-gray-400 hover:bg-zinc-800'
            }`}
            data-testid={`tab-${tab.value}`}
          >
            {tab.label} ({tab.count})
          </button>
        ))}
      </div>

      {/* Bookings Table */}
      <div className="bg-zinc-900 rounded-lg border border-zinc-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-zinc-800">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-bold">Confirmation #</th>
                <th className="px-6 py-3 text-left text-sm font-bold">Customer</th>
                <th className="px-6 py-3 text-left text-sm font-bold">Contact</th>
                <th className="px-6 py-3 text-left text-sm font-bold">Ticket Type</th>
                <th className="px-6 py-3 text-left text-sm font-bold">Qty</th>
                <th className="px-6 py-3 text-left text-sm font-bold">Status</th>
                <th className="px-6 py-3 text-left text-sm font-bold">Date</th>
                <th className="px-6 py-3 text-left text-sm font-bold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredBookings.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-6 py-8 text-center text-gray-400">
                    No bookings found
                  </td>
                </tr>
              ) : (
                filteredBookings.map((booking) => (
                  <tr key={booking.id} className="border-t border-zinc-800 hover:bg-zinc-800/50" data-testid={`booking-row-${booking.id}`}>
                    <td className="px-6 py-4 font-mono text-sm">{booking.confirmation_number}</td>
                    <td className="px-6 py-4">{booking.customer_name}</td>
                    <td className="px-6 py-4 text-sm">
                      <div>{booking.email}</div>
                      <div className="text-gray-400">{booking.phone}</div>
                    </td>
                    <td className="px-6 py-4">{getTicketTierLabel(booking.ticket_type)}</td>
                    <td className="px-6 py-4">{booking.quantity}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        booking.status === 'pending' ? 'bg-yellow-900/30 text-yellow-500' :
                        booking.status === 'approved' ? 'bg-blue-900/30 text-blue-500' :
                        booking.status === 'paid' ? 'bg-green-900/30 text-green-500' :
                        booking.status === 'confirmed' ? 'bg-green-900/30 text-green-500' :
                        'bg-red-900/30 text-red-500'
                      }`}>
                        {booking.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-400">
                      {new Date(booking.request_date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => openBookingDetails(booking)}
                          className="p-2 bg-blue-600 hover:bg-blue-700 rounded"
                          data-testid={`view-booking-${booking.id}`}
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {booking.status === 'approved' && (
                          <button
                            onClick={() => {
                              const txid = prompt(
                                'Enter transaction ID (optional):',
                                booking.customer_payment_reference || ''
                              );
                              if (txid !== null) handleMarkPaid(booking.id, txid);
                            }}
                            className="p-2 bg-green-600 hover:bg-green-700 rounded"
                            data-testid={`mark-paid-${booking.id}`}
                          >
                            <DollarSign className="w-4 h-4" />
                          </button>
                        )}
                        {booking.status === 'paid' && (
                          <button
                            onClick={() => handleConfirm(booking.id)}
                            className="p-2 bg-green-600 hover:bg-green-700 rounded"
                            data-testid={`confirm-${booking.id}`}
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Booking Detail Modal */}
      {selectedBooking && (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4" data-testid="booking-detail-modal">
          <div className="bg-zinc-900 rounded-lg p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-6">Booking Details</h2>

            <div className="space-y-4 mb-6">
              <div>
                <p className="text-gray-400 text-sm">Confirmation Number</p>
                <p className="font-bold font-mono">{selectedBooking.confirmation_number}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-gray-400 text-sm">Customer Name</p>
                  <p className="font-bold">{selectedBooking.customer_name}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Status</p>
                  <p className="font-bold capitalize">{selectedBooking.status}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-gray-400 text-sm">Email</p>
                  <p>{selectedBooking.email}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Phone</p>
                  <p>{selectedBooking.phone}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-gray-400 text-sm">Ticket Type</p>
                  <p>{getTicketTierLabel(selectedBooking.ticket_type)}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Quantity</p>
                  <p>{selectedBooking.quantity}</p>
                </div>
              </div>
              {selectedBooking.message && (
                <div>
                  <p className="text-gray-400 text-sm">Message</p>
                  <p className="bg-zinc-800 p-3 rounded">{selectedBooking.message}</p>
                </div>
              )}
              {selectedBooking.customer_payment_submitted_at && (
                <div className="bg-emerald-900/20 border border-emerald-700 rounded-lg p-4">
                  <p className="font-bold mb-3">Customer Payment Update</p>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-400 text-sm">Submitted</p>
                      <p>{new Date(selectedBooking.customer_payment_submitted_at).toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm">Method</p>
                      <p className="uppercase">{selectedBooking.customer_payment_method}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm">Reference</p>
                      <p>{selectedBooking.customer_payment_reference}</p>
                    </div>
                    {selectedBooking.customer_payment_amount && (
                      <div>
                        <p className="text-gray-400 text-sm">Amount</p>
                        <p>${Number(selectedBooking.customer_payment_amount).toLocaleString()}</p>
                      </div>
                    )}
                  </div>
                  {selectedBooking.customer_payment_proof_url && (
                    <div className="mt-3">
                      <p className="text-gray-400 text-sm">Proof Link</p>
                      <a
                        href={selectedBooking.customer_payment_proof_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-red-400 hover:text-red-300 underline break-all"
                      >
                        {selectedBooking.customer_payment_proof_url}
                      </a>
                    </div>
                  )}
                  {selectedBooking.customer_payment_notes && (
                    <div className="mt-3">
                      <p className="text-gray-400 text-sm">Notes</p>
                      <p className="bg-zinc-800 p-3 rounded mt-1">{selectedBooking.customer_payment_notes}</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Pending - Show Approval Form */}
            {selectedBooking.status === 'pending' && (
              <div className="border-t border-zinc-700 pt-6">
                <h3 className="text-xl font-bold mb-4">Approve Booking</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block mb-2">Payment Method</label>
                    <select
                      value={approvalData.payment_method}
                      onChange={(e) => setApprovalData(createApprovalData(
                        e.target.value,
                        paymentSettings,
                        approvalData.admin_notes
                      ))}
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
                    <label className="block mb-2">Payment Instructions</label>
                    <textarea
                      value={approvalData.payment_instructions}
                      onChange={(e) => setApprovalData({...approvalData, payment_instructions: e.target.value})}
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3"
                      rows="4"
                      placeholder="Provide payment instructions to the customer..."
                    ></textarea>
                  </div>

                  {approvalData.payment_method === 'btc' && (
                    <>
                      <div>
                        <label className="block mb-2">BTC Wallet Address</label>
                        <input
                          type="text"
                          value={approvalData.btc_wallet_address}
                          onChange={(e) => setApprovalData({...approvalData, btc_wallet_address: e.target.value})}
                          className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 font-mono"
                          placeholder="bc1q..."
                        />
                      </div>
                      <div>
                        <label className="block mb-2">BTC Amount</label>
                        <input
                          type="number"
                          step="0.00000001"
                          value={approvalData.btc_amount || ''}
                          onChange={(e) => setApprovalData({
                            ...approvalData,
                            btc_amount: e.target.value ? parseFloat(e.target.value) || 0 : 0
                          })}
                          className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3"
                          placeholder="Leave blank to auto-calculate"
                        />
                        <p className="text-sm text-gray-400 mt-1">Current BTC Price: ${btcPrice.toFixed(2)}</p>
                      </div>
                    </>
                  )}

                  <div>
                    <label className="block mb-2">Admin Notes (Optional)</label>
                    <input
                      type="text"
                      value={approvalData.admin_notes}
                      onChange={(e) => setApprovalData({...approvalData, admin_notes: e.target.value})}
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3"
                    />
                  </div>

                  <div className="flex gap-4">
                    <button
                      onClick={() => handleApprove(selectedBooking.id)}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2"
                      data-testid="approve-button"
                    >
                      <CheckCircle className="w-5 h-5" />
                      Approve
                    </button>
                    <button
                      onClick={() => {
                        const notes = prompt('Reason for rejection:');
                        if (notes) handleReject(selectedBooking.id, notes);
                      }}
                      className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2"
                      data-testid="reject-button"
                    >
                      <XCircle className="w-5 h-5" />
                      Reject
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Show Payment Instructions if Approved */}
            {(selectedBooking.status === 'approved' || selectedBooking.status === 'paid' || selectedBooking.status === 'confirmed') && selectedBooking.payment_instructions && (
              <div className="border-t border-zinc-700 pt-6">
                <h3 className="text-xl font-bold mb-4">Payment Instructions Sent</h3>
                <div className="bg-zinc-800 p-4 rounded-lg mb-4">
                  <p className="whitespace-pre-wrap">{selectedBooking.payment_instructions}</p>
                </div>
                {selectedBooking.btc_wallet_address && (
                  <div className="bg-zinc-800 p-4 rounded-lg">
                    <p className="text-sm text-gray-400 mb-2">BTC Wallet:</p>
                    <p className="font-mono text-sm break-all">{selectedBooking.btc_wallet_address}</p>
                    {selectedBooking.btc_amount && (
                      <p className="mt-2">Amount: {selectedBooking.btc_amount} BTC</p>
                    )}
                  </div>
                )}
              </div>
            )}

            <div className="flex gap-4 mt-6">
              <button
                onClick={closeBookingDetails}
                className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white font-bold py-3 rounded-lg"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookingManagement;
