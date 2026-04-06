import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import {
  ArrowRight,
  Calendar,
  CheckCircle,
  CreditCard,
  FileText,
  TrendingUp,
} from 'lucide-react';
import { getTicketTierLabel } from '../../utils/ticketTiers';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const quickLinks = [
  {
    to: '/admin-secret/bookings',
    label: 'Open Bookings',
    description: 'Review new requests and payment updates.',
    icon: FileText,
  },
  {
    to: '/admin-secret/events',
    label: 'Manage Events',
    description: 'Edit dates, venues, and ticket availability.',
    icon: Calendar,
  },
  {
    to: '/admin-secret/payment-settings',
    label: 'Payment Setup',
    description: 'Update live rails and support details.',
    icon: CreditCard,
  },
];

const statStyles = {
  pending: 'bg-amber-50 text-amber-700',
  approved: 'bg-blue-50 text-blue-700',
  paid: 'bg-emerald-50 text-emerald-700',
  confirmed: 'bg-green-50 text-green-700',
  rejected: 'bg-rose-50 text-rose-700',
};

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

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

  if (loading) {
    return <div className="py-12 text-center text-stone-500">Loading dashboard...</div>;
  }

  const metrics = [
    { label: 'Total Requests', value: stats.total_requests, helper: 'All booking files on record' },
    { label: 'Pending Review', value: stats.pending_count, helper: 'Needs action now' },
    { label: 'Revenue', value: `$${stats.total_revenue.toFixed(2)}`, helper: 'Confirmed booking value' },
  ];

  const queue = [
    { label: 'Pending', value: stats.pending_count, tone: statStyles.pending },
    { label: 'Approved', value: stats.approved_count, tone: statStyles.approved },
    { label: 'Paid', value: stats.paid_count, tone: statStyles.paid },
    { label: 'Confirmed', value: stats.confirmed_count, tone: statStyles.confirmed },
    { label: 'Rejected', value: stats.rejected_count, tone: statStyles.rejected },
  ];

  return (
    <div className="space-y-6" data-testid="admin-dashboard">
      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.5fr)_minmax(20rem,0.9fr)]">
        <div className="rounded-[28px] border border-stone-200 bg-white p-5 shadow-[0_12px_30px_rgba(48,32,11,0.05)] sm:p-7">
          <p className="text-[11px] uppercase tracking-[0.24em] text-[#9d172b]">Today</p>
          <h1 className="mt-2 text-2xl font-black text-[#151515] sm:text-3xl">One clean place to run bookings.</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-stone-600">
            Start here, see what needs attention, and jump straight into bookings, events, or payment setup without
            bouncing around the admin.
          </p>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            {metrics.map((item) => (
              <div key={item.label} className="rounded-2xl border border-stone-200 bg-[#fcfaf6] p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-stone-400">{item.label}</p>
                <p className="mt-2 text-2xl font-black text-[#151515]">{item.value}</p>
                <p className="mt-2 text-xs leading-5 text-stone-500">{item.helper}</p>
              </div>
            ))}
          </div>
        </div>

        <aside className="rounded-[28px] border border-stone-200 bg-[#151515] p-5 text-white shadow-[0_12px_30px_rgba(21,21,21,0.12)] sm:p-6">
          <div className="flex items-center gap-3">
            <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-[0.22em] text-white/60">Live Snapshot</p>
              <h2 className="mt-1 text-xl font-black">Queue</h2>
            </div>
          </div>

          <div className="mt-5 space-y-3">
            {queue.map((item) => (
              <div key={item.label} className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                <span className="text-sm font-semibold">{item.label}</span>
                <span className={`rounded-full px-3 py-1 text-sm font-bold ${item.tone}`}>{item.value}</span>
              </div>
            ))}
          </div>
        </aside>
      </section>

      <section className="grid gap-3 sm:grid-cols-3">
        {quickLinks.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            className="group rounded-[24px] border border-stone-200 bg-white p-5 shadow-[0_10px_24px_rgba(48,32,11,0.04)] transition hover:border-stone-300"
          >
            <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-[#151515] text-white">
              <item.icon className="h-5 w-5" />
            </div>
            <h2 className="mt-4 text-lg font-black text-[#151515]">{item.label}</h2>
            <p className="mt-2 text-sm leading-6 text-stone-600">{item.description}</p>
            <span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[#9d172b]">
              Open
              <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
            </span>
          </Link>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.7fr)_minmax(18rem,0.85fr)]">
        <div className="rounded-[28px] border border-stone-200 bg-white shadow-[0_12px_30px_rgba(48,32,11,0.05)]">
          <div className="flex items-center justify-between gap-3 border-b border-stone-200 px-5 py-4 sm:px-6">
            <div>
              <p className="text-[11px] uppercase tracking-[0.22em] text-stone-400">Recent Files</p>
              <h2 className="mt-1 text-xl font-black text-[#151515]">Latest Bookings</h2>
            </div>
            <Link to="/admin-secret/bookings" className="text-sm font-semibold text-[#9d172b]">
              View all
            </Link>
          </div>

          <div className="md:hidden">
            {stats.recent_bookings.length === 0 ? (
              <p className="px-5 py-8 text-sm text-stone-500">No bookings yet.</p>
            ) : (
              <div className="space-y-3 p-4">
                {stats.recent_bookings.map((booking) => (
                  <div key={booking.id} className="rounded-2xl border border-stone-200 bg-[#fcfaf6] p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-mono text-xs text-stone-500">{booking.confirmation_number}</p>
                        <p className="mt-1 text-base font-bold text-[#151515]">{booking.customer_name}</p>
                      </div>
                      <span className={`rounded-full px-3 py-1 text-[11px] font-bold ${statStyles[booking.status] || 'bg-stone-100 text-stone-700'}`}>
                        {booking.status.toUpperCase()}
                      </span>
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-3 text-sm text-stone-600">
                      <div>
                        <p className="text-xs uppercase tracking-[0.15em] text-stone-400">Access</p>
                        <p className="mt-1">{getTicketTierLabel(booking.ticket_type)}</p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-[0.15em] text-stone-400">Qty</p>
                        <p className="mt-1">{booking.quantity}</p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-xs uppercase tracking-[0.15em] text-stone-400">Date</p>
                        <p className="mt-1">{new Date(booking.request_date).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-[720px]">
              <thead className="bg-stone-100">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-bold">Confirmation</th>
                  <th className="px-6 py-3 text-left text-sm font-bold">Customer</th>
                  <th className="px-6 py-3 text-left text-sm font-bold">Access</th>
                  <th className="px-6 py-3 text-left text-sm font-bold">Qty</th>
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
                    <tr key={booking.id} className="border-t border-stone-200">
                      <td className="px-6 py-4 font-mono text-sm">{booking.confirmation_number}</td>
                      <td className="px-6 py-4">{booking.customer_name}</td>
                      <td className="px-6 py-4">{getTicketTierLabel(booking.ticket_type)}</td>
                      <td className="px-6 py-4">{booking.quantity}</td>
                      <td className="px-6 py-4">
                        <span className={`rounded-full px-3 py-1 text-xs font-bold ${statStyles[booking.status] || 'bg-stone-100 text-stone-700'}`}>
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

        <aside className="space-y-4">
          <div className="rounded-[28px] border border-stone-200 bg-white p-5 shadow-[0_12px_30px_rgba(48,32,11,0.05)]">
            <div className="flex items-start gap-3">
              <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-[#151515] text-white">
                <CheckCircle className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-black text-[#151515]">Focus</h2>
                <p className="mt-2 text-sm leading-6 text-stone-600">
                  Clear pending requests first, then follow approved files waiting on payment, then confirm paid files.
                </p>
              </div>
            </div>
          </div>
        </aside>
      </section>
    </div>
  );
};

export default AdminDashboard;
