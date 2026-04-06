import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { CheckCircle2, Clock3, DollarSign, FileText, XCircle } from 'lucide-react';
import { getTicketTierLabel } from '../../utils/ticketTiers';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const statusTone = {
  pending: 'bg-amber-50 text-amber-700',
  approved: 'bg-blue-50 text-blue-700',
  paid: 'bg-emerald-50 text-emerald-700',
  confirmed: 'bg-green-50 text-green-700',
  rejected: 'bg-rose-50 text-rose-700',
};

const dashboardCards = [
  { key: 'pending_count', label: 'Pending', icon: Clock3 },
  { key: 'approved_count', label: 'Approved', icon: FileText },
  { key: 'paid_count', label: 'Paid', icon: DollarSign },
  { key: 'confirmed_count', label: 'Confirmed', icon: CheckCircle2 },
  { key: 'rejected_count', label: 'Rejected', icon: XCircle },
];

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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

    fetchDashboardStats();
  }, []);

  if (loading) {
    return <div className="py-16 text-center text-stone-500">Loading dashboard...</div>;
  }

  if (!stats) {
    return (
      <div className="rounded-[24px] border border-stone-200 bg-white p-6 text-sm text-stone-600">
        Dashboard data is not available right now.
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="admin-dashboard">
      <div>
        <p className="text-xs uppercase tracking-[0.28em] text-[#9d172b]">Dashboard</p>
        <h1 className="mt-2 text-3xl font-black text-[#151515] sm:text-4xl">Overview</h1>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-stone-600">
          A simple view of bookings, status counts, and recent activity.
        </p>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <div className="rounded-[24px] border border-stone-200 bg-white p-5 sm:col-span-2 xl:col-span-1">
          <p className="text-sm font-semibold text-stone-500">Total Requests</p>
          <p className="mt-3 text-4xl font-black text-[#151515]">{stats.total_requests}</p>
          <p className="mt-2 text-sm text-stone-500">All booking files currently on record.</p>
        </div>

        <div className="rounded-[24px] border border-stone-200 bg-white p-5 sm:col-span-2 xl:col-span-1">
          <p className="text-sm font-semibold text-stone-500">Revenue</p>
          <p className="mt-3 text-4xl font-black text-[#151515]">${stats.total_revenue.toFixed(2)}</p>
          <p className="mt-2 text-sm text-stone-500">Total value from confirmed bookings.</p>
        </div>

        <div className="rounded-[24px] border border-stone-200 bg-white p-5 sm:col-span-2 xl:col-span-1">
          <p className="text-sm font-semibold text-stone-500">Active Queue</p>
          <p className="mt-3 text-4xl font-black text-[#151515]">
            {stats.pending_count + stats.approved_count + stats.paid_count}
          </p>
          <p className="mt-2 text-sm text-stone-500">Items still moving through the process.</p>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {dashboardCards.map((item) => {
          const Icon = item.icon;
          const tone = statusTone[item.key.replace('_count', '')] || 'bg-stone-100 text-stone-700';
          return (
            <div key={item.key} className="rounded-[24px] border border-stone-200 bg-white p-5">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-stone-500">{item.label}</p>
                <div className={`inline-flex h-10 w-10 items-center justify-center rounded-2xl ${tone}`}>
                  <Icon className="h-5 w-5" />
                </div>
              </div>
              <p className="mt-4 text-3xl font-black text-[#151515]">{stats[item.key]}</p>
            </div>
          );
        })}
      </section>

      <section className="rounded-[24px] border border-stone-200 bg-white">
        <div className="border-b border-stone-200 px-5 py-4 sm:px-6">
          <h2 className="text-xl font-black text-[#151515]">Recent Bookings</h2>
        </div>

        <div className="md:hidden">
          {stats.recent_bookings.length === 0 ? (
            <div className="px-5 py-8 text-center text-sm text-stone-500">No recent bookings yet.</div>
          ) : (
            <div className="space-y-3 p-4">
              {stats.recent_bookings.map((booking) => (
                <div key={booking.id} className="rounded-[20px] border border-stone-200 bg-stone-50 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-mono text-xs text-stone-500">{booking.confirmation_number}</p>
                      <p className="mt-1 text-base font-bold text-[#151515]">{booking.customer_name}</p>
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
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="hidden overflow-x-auto md:block">
          <table className="w-full min-w-[760px]">
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
                    No recent bookings yet.
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
                      <span className={`rounded-full px-3 py-1 text-xs font-bold ${statusTone[booking.status] || 'bg-stone-100 text-stone-700'}`}>
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
      </section>
    </div>
  );
};

export default AdminDashboard;
