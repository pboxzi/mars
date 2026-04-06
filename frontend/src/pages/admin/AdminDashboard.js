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
    <div className="space-y-8" data-testid="admin-dashboard">
      <section className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
        <div className="min-w-0">
          <p className="mb-2 text-[11px] uppercase tracking-[0.28em] text-[#9d172b]">Operations</p>
          <h1 className="text-3xl font-black sm:text-4xl">Dashboard</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-stone-600 sm:text-base">
            Watch live traffic, booking movement, and revenue from one place before you start pushing more paid traffic.
          </p>
        </div>

        <div className="grid max-w-xl grid-cols-2 gap-3 rounded-[28px] border border-stone-200 bg-white p-4 sm:grid-cols-3 sm:p-5">
          <div>
            <p className="text-[11px] uppercase tracking-[0.22em] text-stone-400">Requests</p>
            <p className="mt-2 text-2xl font-black text-[#151515]">{stats.total_requests}</p>
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-[0.22em] text-stone-400">Confirmed</p>
            <p className="mt-2 text-2xl font-black text-[#151515]">{stats.confirmed_count}</p>
          </div>
          <div className="col-span-2 sm:col-span-1">
            <p className="text-[11px] uppercase tracking-[0.22em] text-stone-400">Revenue</p>
            <p className="mt-2 text-2xl font-black text-[#151515]">${stats.total_revenue.toFixed(2)}</p>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
        {statCards.map((stat, index) => (
          <div
            key={index}
            className={`${stat.bg} rounded-[24px] border border-stone-200 p-6 shadow-[0_12px_30px_rgba(48,32,11,0.04)]`}
            data-testid={`stat-${stat.label.toLowerCase().replace(' ', '-')}`}
          >
            <div className="flex items-center justify-between mb-4">
              <stat.icon className={`w-8 h-8 ${stat.color}`} />
            </div>
            <p className="text-stone-500 text-sm mb-1">{stat.label}</p>
            <p className="text-3xl font-bold">{stat.value}</p>
          </div>
        ))}
      </div>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.8fr)_minmax(20rem,0.95fr)]">
        <div className="overflow-hidden rounded-[28px] border border-stone-200 bg-white">
          <div className="flex flex-col gap-2 border-b border-stone-200 p-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-2xl font-black text-[#151515]">Recent Bookings</h2>
              <p className="mt-1 text-sm text-stone-500">The latest guest activity across the tour flow.</p>
            </div>
            <div className="rounded-full bg-stone-100 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">
              Last {Math.min(stats.recent_bookings.length, 10)} records
            </div>
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

        <aside className="rounded-[28px] border border-stone-200 bg-white p-6 shadow-[0_12px_30px_rgba(48,32,11,0.04)]">
          <div className="flex items-start gap-4">
            <div className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#9d172b]/10 text-[#9d172b]">
              <RotateCcw className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-[0.24em] text-[#9d172b]">Launch Tools</p>
              <h2 className="mt-2 text-xl font-black text-[#151515]">Clear Test Data</h2>
              <p className="mt-2 text-sm leading-6 text-stone-600">
                Use this once before live traffic if the current records were only created during internal testing.
              </p>
            </div>
          </div>

          <div className="mt-5 rounded-2xl border border-stone-200 bg-stone-50 p-4">
            <p className="text-sm font-semibold text-[#151515]">This will remove</p>
            <p className="mt-2 text-sm leading-6 text-stone-600">
              test bookings, subscribers, and live visit alerts, then restore ticket availability to full stock.
            </p>
            <p className="mt-3 text-sm font-semibold text-[#151515]">This will keep</p>
            <p className="mt-2 text-sm leading-6 text-stone-600">
              admin access, event setup, payment settings, and support details exactly as they are.
            </p>
          </div>

          <button
            type="button"
            onClick={handleResetLaunchData}
            disabled={isResettingLaunchData}
            className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#151515] px-5 py-3 text-sm font-semibold text-white transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RotateCcw className={`h-4 w-4 ${isResettingLaunchData ? 'animate-spin' : ''}`} />
            {isResettingLaunchData ? 'Clearing Data...' : 'Clear Test Data'}
          </button>

          {resetMessage && (
            <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
              {resetMessage}
            </div>
          )}

          {resetError && (
            <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
              {resetError}
            </div>
          )}

          <p className="mt-4 text-xs leading-5 text-stone-500">
            Keep this as a launch-only control. Once real fan traffic starts, avoid using it unless you intentionally want to wipe activity.
          </p>
        </aside>
      </section>
    </div>
  );
};

export default AdminDashboard;

