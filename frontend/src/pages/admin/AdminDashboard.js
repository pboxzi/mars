import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { TrendingUp, Clock, CheckCircle, DollarSign, XCircle } from 'lucide-react';
import { getTicketTierLabel } from '../../utils/ticketTiers';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

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
        headers: { Authorization: `Bearer ${token}` }
      });
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  const statCards = [
    { label: 'Pending Requests', value: stats.pending_count, icon: Clock, color: 'text-yellow-500', bg: 'bg-yellow-900/20' },
    { label: 'Approved', value: stats.approved_count, icon: CheckCircle, color: 'text-blue-500', bg: 'bg-blue-900/20' },
    { label: 'Paid', value: stats.paid_count, icon: DollarSign, color: 'text-green-500', bg: 'bg-green-900/20' },
    { label: 'Confirmed', value: stats.confirmed_count, icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-900/20' },
    { label: 'Rejected', value: stats.rejected_count, icon: XCircle, color: 'text-red-500', bg: 'bg-red-900/20' },
    { label: 'Total Revenue', value: `$${stats.total_revenue.toFixed(2)}`, icon: TrendingUp, color: 'text-purple-500', bg: 'bg-purple-900/20' },
  ];

  return (
    <div data-testid="admin-dashboard">
      <h1 className="text-4xl font-bold mb-8">Dashboard</h1>

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
      <div className="bg-white rounded-lg border border-stone-200">
        <div className="p-6 border-b border-stone-200">
          <h2 className="text-2xl font-bold">Recent Booking Requests</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
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
                    No booking requests yet
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

