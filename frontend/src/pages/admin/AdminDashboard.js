import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { TrendingUp, Clock, CheckCircle, DollarSign, XCircle, RotateCcw } from 'lucide-react';
import { getTicketTierLabel } from '../../utils/ticketTiers';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isResettingLaunchData, setIsResettingLaunchData] = useState(false);
  const [resetMessage, setResetMessage] = useState('');
  const [resetError, setResetError] = useState('');

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      const response = await axios.get(`${API}/admin/dashboard`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleResetLaunchData = async () => {
    const confirmed = window.confirm(
      'This will clear all test bookings, subscribers, and live visit alerts, and reset ticket availability. Your admin login, event setup, payment settings, and support details will stay intact. Continue?'
    );

    if (!confirmed) {
      return;
    }

    setIsResettingLaunchData(true);
    setResetMessage('');
    setResetError('');

    try {
      const token = localStorage.getItem('admin_token');
      const response = await axios.post(
        `${API}/admin/cleanup-launch-data`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      const summary = response.data;
      setResetMessage(
        `Launch data cleared. Removed ${summary.deleted_bookings} bookings, ${summary.deleted_subscriptions} subscribers, ${summary.deleted_public_visits} visit alerts, and reset ${summary.reset_ticket_types} ticket inventories.`
      );
      await fetchDashboardStats();
    } catch (error) {
      console.error('Error clearing launch data:', error);
      setResetError(error.response?.data?.detail || 'Unable to clear launch data right now.');
    } finally {
      setIsResettingLaunchData(false);
    }
  };

  if (loading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  const statCards = [
    { label: 'Pending', value: stats.pending_count, icon: Clock, color: 'text-yellow-500', bg: 'bg-yellow-900/20' },
    { label: 'Approved', value: stats.approved_count, icon: CheckCircle, color: 'text-blue-500', bg: 'bg-blue-900/20' },
    { label: 'Paid', value: stats.paid_count, icon: DollarSign, color: 'text-green-500', bg: 'bg-green-900/20' },
    { label: 'Confirmed', value: stats.confirmed_count, icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-900/20' },
    { label: 'Rejected', value: stats.rejected_count, icon: XCircle, color: 'text-red-500', bg: 'bg-red-900/20' },
    { label: 'Revenue', value: `$${stats.total_revenue.toFixed(2)}`, icon: TrendingUp, color: 'text-purple-500', bg: 'bg-purple-900/20' },
  ];

  return (
    <div data-testid="admin-dashboard">
      <h1 className="mb-6 text-3xl font-bold sm:mb-8 sm:text-4xl">Dashboard</h1>

      <div className="mb-8 rounded-[24px] border border-stone-200 bg-white p-5 sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-[11px] uppercase tracking-[0.24em] text-[#9d172b]">Launch Reset</p>
            <h2 className="mt-2 text-xl font-black text-[#151515]">Clear test data before live traffic</h2>
            <p className="mt-2 text-sm leading-6 text-stone-600">
              Use this once before launch if the current admin records are only from testing. It clears bookings, subscribers, and live visit alerts, then restores ticket availability. It does not remove your admin access, events, payment settings, or support details.
            </p>
          </div>

          <button
            type="button"
            onClick={handleResetLaunchData}
            disabled={isResettingLaunchData}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-[#151515] px-5 py-3 text-sm font-semibold text-white transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RotateCcw className={`h-4 w-4 ${isResettingLaunchData ? 'animate-spin' : ''}`} />
            {isResettingLaunchData ? 'Clearing Data...' : 'Clear Test Data'}
          </button>
        </div>

        {resetMessage && <p className="mt-4 text-sm font-medium text-emerald-700">{resetMessage}</p>}
        {resetError && <p className="mt-4 text-sm font-medium text-red-600">{resetError}</p>}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
        {statCards.map((stat, index) => (
          <div key={index} className={`${stat.bg} border border-stone-200 rounded-lg p-6`} data-testid={`stat-${stat.label.toLowerCase().replace(' ', '-')}`}>
            <div className="flex items-center justify-between mb-4">
              <stat.icon className={`w-8 h-8 ${stat.color}`} />
            </div>
            <p className="text-stone-500 text-sm mb-1">{stat.label}</p>
            <p className="text-3xl font-bold">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Recent Bookings */}
      <div className="bg-white rounded-lg border border-stone-200 overflow-hidden">
        <div className="p-6 border-b border-stone-200">
          <h2 className="text-2xl font-bold">Recent Bookings</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px]">
            <thead className="bg-stone-100">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-bold">Confirmation #</th>
                <th className="px-6 py-3 text-left text-sm font-bold">Customer</th>
                <th className="px-6 py-3 text-left text-sm font-bold">Ticket Type</th>
                <th className="px-6 py-3 text-left text-sm font-bold">Quantity</th>
                <th className="px-6 py-3 text-left text-sm font-bold">Status</th>
                <th className="px-6 py-3 text-left text-sm font-bold">Date</th>
              </tr>
            </thead>
            <tbody>
              {stats.recent_bookings.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-stone-500">
                    No bookings yet
                  </td>
                </tr>
              ) : (
                stats.recent_bookings.map((booking) => (
                  <tr key={booking.id} className="border-t border-stone-200 hover:bg-stone-100/50">
                    <td className="px-6 py-4 font-mono text-sm">{booking.confirmation_number}</td>
                    <td className="px-6 py-4">{booking.customer_name}</td>
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
                    <td className="px-6 py-4 text-sm text-stone-500">
                      {new Date(booking.request_date).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;

