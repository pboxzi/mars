import React, { useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, Calendar, FileText, Settings, LogOut, CreditCard } from 'lucide-react';

const AdminLayout = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    if (!token) {
      navigate('/admin-secret');
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_email');
    navigate('/admin-secret');
  };

  const isActive = (path) => location.pathname === path;

  const navItems = [
    { path: '/admin-secret/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/admin-secret/events', icon: Calendar, label: 'Events' },
    { path: '/admin-secret/bookings', icon: FileText, label: 'Bookings' },
    { path: '/admin-secret/payment-settings', icon: CreditCard, label: 'Payment Settings' },
  ];

  return (
    <div className="min-h-screen bg-black flex">
      {/* Sidebar */}
      <aside className="w-64 bg-zinc-900 border-r border-zinc-800 fixed h-full" data-testid="admin-sidebar">
        <div className="p-6 border-b border-zinc-800">
          <h1 className="text-2xl font-bold text-red-600">ADMIN PANEL</h1>
          <p className="text-sm text-gray-400 mt-1">VIP Concierge</p>
        </div>

        <nav className="p-4">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg mb-2 transition-all ${
                isActive(item.path)
                  ? 'bg-red-600 text-white'
                  : 'text-gray-400 hover:bg-zinc-800 hover:text-white'
              }`}
              data-testid={`nav-${item.label.toLowerCase().replace(' ', '-')}`}
            >
              <item.icon className="w-5 h-5" />
              <span>{item.label}</span>
            </Link>
          ))}

          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 rounded-lg mb-2 text-gray-400 hover:bg-zinc-800 hover:text-white transition-all w-full mt-8"
            data-testid="logout-button"
          >
            <LogOut className="w-5 h-5" />
            <span>Logout</span>
          </button>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-64">
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;