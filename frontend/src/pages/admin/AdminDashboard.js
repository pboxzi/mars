import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import {
  ArrowRight,
  Calendar,
  CheckCircle,
  Clock,
  CreditCard,
  DollarSign,
  FileText,
  RotateCcw,
  TrendingUp,
  XCircle,
} from 'lucide-react';
import { getTicketTierLabel } from '../../utils/ticketTiers';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const quickActionCards = [
  {
    to: '/admin-secret/bookings',
    title: 'Review Bookings',
    description: 'Handle new requests, payment updates, and confirmations.',
    icon: FileText,
  },
  {
    to: '/admin-secret/events',
    title: 'Manage Events',
    description: 'Edit show dates, venues, tiers, and available inventory.',
    icon: Calendar,
  },
  {
    to: '/admin-secret/payment-settings',
    title: 'Payment & Support',
    description: 'Keep live payment instructions and support contacts current.',
    icon: CreditCard,
  },
];

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
        headers: { Authorization: `Bearer ${token}` },
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
          headers: { Authorization: `Bearer ${token}` },
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
    return <div className="py-12 text-center text-stone-500">Loading dashboard...</div>;
  }

  const statCards = [
    {
      label: 'Pending',
      value: stats.pending_count,
      helper: 'Need review',
      icon: Clock,
      accent: 'text-amber-600',
      surface: 'bg-amber-50',
    },
    {
      label: 'Approved',
      value: stats.approved_count,
      helper: 'Awaiting payment',
      icon: CheckCircle,
      accent: 'text-blue-600',
      surface: 'bg-blue-50',
    },
    {
      label: 'Paid',
      value: stats.paid_count,
      helper: 'Ready to confirm',
      icon: DollarSign,
      accent: 'text-emerald-600',
      surface: 'bg-emerald-50',
    },
    {
      label: 'Confirmed',
      value: stats.confirmed_count,
      helper: 'Completed bookings',
      icon: CheckCircle,
      accent: 'text-green-600',
      surface: 'bg-green-50',
    },
    {
      label: 'Rejected',
      value: stats.rejected_count,
      helper: 'Closed requests',
      icon: XCircle,
      accent: 'text-rose-600',
      surface: 'bg-rose-50',
    },
    {
      label: 'Revenue',
      value: `$${stats.total_revenue.toFixed(2)}`,
      helper: 'Confirmed value',
      icon: TrendingUp,
      accent: 'text-violet-600',
      surface: 'bg-violet-50',
    },
  ];

  const queueCards = [
    {
      label: 'New Requests',
      value: stats.pending_count,
      detail: 'These need approval or rejection.',
    },
    {
      label: 'Awaiting Settlement',
      value: stats.approved_count,
      detail: 'Approved requests still waiting on payment.',
    },
    {
      label: 'Ready To Finalize',
      value: stats.paid_count,
      detail: 'Payments received and ready for final confirmation.',
    },
  ];

  return (
    <div className="space-y-8" data-testid="admin-dashboard">
      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(20rem,0.9fr)]">
        <div className="rounded-[32px] border border-stone-200 bg-white p-6 shadow-[0_18px_40px_rgba(48,32,11,0.06)] sm:p-8">
          <p className="text-[11px] uppercase tracking-[0.28em] text-[#9d172b]">Control Room</p>
          <h1 className="mt-3 text-3xl font-black text-[#151515] sm:text-4xl">Run the tour from one clean workspace.</h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-stone-600 sm:text-base">
            Watch what is coming in, jump straight into the next operational task, and keep bookings moving without
            digging through scattered screens.
          </p>

          <div className="mt-6 grid gap-4 lg:grid-cols-3">
            {quickActionCards.map((action) => (
              <Link
                key={action.to}
                to={action.to}
                className="group rounded-[24px] border border-stone-200 bg-[#fcfaf6] p-4 transition hover:border-stone-300 hover:bg-white"
              >
                <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-[#151515] text-white">
                  <action.icon className="h-5 w-5" />
                </div>
                <h2 className="mt-4 text-lg font-black text-[#151515]">{action.title}</h2>
                <p className="mt-2 text-sm leading-6 text-stone-600">{action.description}</p>
                <span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[#9d172b]">
                  Open
                  <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                </span>
              </Link>
            ))}
          </div>
        </div>

        <aside className="rounded-[32px] border border-stone-200 bg-[#151515] p-6 text-white shadow-[0_18px_40px_rgba(21,21,21,0.16)] sm:p-8">
          <p className="text-[11px] uppercase tracking-[0.24em] text-white/65">At A Glance</p>
          <div className="mt-5 grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-white/55">Requests</p>
              <p className="mt-2 text-3xl font-black">{stats.total_requests}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-white/55">Confirmed</p>
              <p className="mt-2 text-3xl font-black">{stats.confirmed_count}</p>
            </div>
            <div className="col-span-2 rounded-[24px] border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-white/55">Revenue</p>
              <p className="mt-2 text-3xl font-black">${stats.total_revenue.toFixed(2)}</p>
              <p className="mt-2 text-sm text-white/65">Based on confirmed bookings currently on file.</p>
            </div>
          </div>

          <div className="mt-6 space-y-3">
            {queueCards.map((item) => (
              <div key={item.label} className="rounded-[22px] border border-white/10 bg-white/5 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-white">{item.label}</p>
                    <p className="mt-1 text-xs leading-5 text-white/60">{item.detail}</p>
                  </div>
                  <span className="text-2xl font-black text-white">{item.value}</span>
                </div>
              </div>
            ))}
          </div>
        </aside>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {statCards.map((stat) => (
          <div
            key={stat.label}
            className="rounded-[26px] border border-stone-200 bg-white p-5 shadow-[0_12px_30px_rgba(48,32,11,0.04)]"
            data-testid={`stat-${stat.label.toLowerCase().replace(/\s+/g, '-')}`}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-stone-500">{stat.label}</p>
                <p className="mt-3 text-3xl font-black text-[#151515]">{stat.value}</p>
                <p className="mt-2 text-xs uppercase tracking-[0.18em] text-stone-400">{stat.helper}</p>
              </div>
              <div className={`inline-flex h-12 w-12 items-center justify-center rounded-2xl ${stat.surface}`}>
                <stat.icon className={`h-5 w-5 ${stat.accent}`} />
              </div>
            </div>
          </div>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.75fr)_minmax(19rem,0.95fr)]">
        <div className="overflow-hidden rounded-[28px] border border-stone-200 bg-white">
          <div className="flex flex-col gap-3 border-b border-stone-200 p-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[11px] uppercase tracking-[0.22em] text-stone-400">Recent Activity</p>
              <h2 className="mt-2 text-2xl font-black text-[#151515]">Latest Bookings</h2>
              <p className="mt-1 text-sm text-stone-500">The newest guest movement across the current booking flow.</p>
            </div>
            <Link
              to="/admin-secret/bookings"
              className="inline-flex items-center gap-2 rounded-full border border-stone-200 bg-stone-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-stone-600 transition hover:bg-white"
            >
              Open Bookings
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
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
                      No bookings yet.
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
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-bold ${
                            booking.status === 'pending'
                              ? 'bg-amber-100 text-amber-700'
                              : booking.status === 'approved'
                              ? 'bg-blue-100 text-blue-700'
                              : booking.status === 'paid'
                              ? 'bg-emerald-100 text-emerald-700'
                              : booking.status === 'confirmed'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-rose-100 text-rose-700'
                          }`}
                        >
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

        <aside className="space-y-6">
          <div className="rounded-[28px] border border-stone-200 bg-white p-6 shadow-[0_12px_30px_rgba(48,32,11,0.04)]">
            <div className="flex items-start gap-4">
              <div className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#9d172b]/10 text-[#9d172b]">
                <RotateCcw className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-[0.24em] text-[#9d172b]">Launch Tools</p>
                <h2 className="mt-2 text-xl font-black text-[#151515]">Clear Test Data</h2>
                <p className="mt-2 text-sm leading-6 text-stone-600">
                  Use this only if the current records came from internal testing and you want a clean live start.
                </p>
              </div>
            </div>

            <div className="mt-5 rounded-2xl border border-stone-200 bg-stone-50 p-4">
              <p className="text-sm font-semibold text-[#151515]">This will remove</p>
              <p className="mt-2 text-sm leading-6 text-stone-600">
                test bookings, subscribers, and live visit alerts, then restore ticket availability to full stock.
              </p>
              <p className="mt-4 text-sm font-semibold text-[#151515]">This will keep</p>
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
              Once real fan traffic is active, leave this untouched unless you intentionally want to wipe operational
              activity.
            </p>
          </div>

          <div className="rounded-[28px] border border-stone-200 bg-white p-6 shadow-[0_12px_30px_rgba(48,32,11,0.04)]">
            <p className="text-[11px] uppercase tracking-[0.22em] text-stone-400">Daily Focus</p>
            <h2 className="mt-2 text-xl font-black text-[#151515]">What needs attention first</h2>
            <ul className="mt-4 space-y-3 text-sm leading-6 text-stone-600">
              <li>Pending requests should be reviewed quickly so new fans do not go cold.</li>
              <li>Approved bookings need payment follow-up and proof review.</li>
              <li>Paid bookings should be confirmed promptly to keep the guest flow moving.</li>
            </ul>
          </div>
        </aside>
      </section>
    </div>
  );
};

export default AdminDashboard;
