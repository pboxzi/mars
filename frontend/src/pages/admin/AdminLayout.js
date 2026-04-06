import React, { useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, Calendar, FileText, LogOut, CreditCard } from 'lucide-react';

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
    <div className="min-h-screen bg-[#f7f3ec] text-[#151515] lg:flex">
      <aside
        className="border-b border-stone-200 bg-[#fcfaf6] shadow-[8px_0_30px_rgba(48,32,11,0.04)] lg:fixed lg:h-full lg:w-72 lg:border-b-0 lg:border-r"
        data-testid="admin-sidebar"
      >
        <div className="p-6 border-b border-stone-200">
          <p className="text-xs tracking-[0.3em] uppercase text-[#9d172b] mb-2">Bruno Mars</p>
          <h1 className="text-2xl font-black text-[#151515]">Admin Panel</h1>
          <p className="text-sm text-stone-500 mt-1">VIP Concierge</p>
        </div>

        <nav className="p-4">
          <div className="grid gap-2 lg:block">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                  isActive(item.path)
                    ? 'bg-[#151515] text-white shadow-sm'
                    : 'text-stone-600 hover:bg-stone-100 hover:text-[#151515]'
                }`}
                data-testid={`nav-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
              >
                <item.icon className="w-5 h-5" />
                <span>{item.label}</span>
              </Link>
            ))}

            <button
              onClick={handleLogout}
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-stone-600 hover:bg-stone-100 hover:text-[#151515] transition-all w-full lg:mt-8"
              data-testid="logout-button"
            >
              <LogOut className="w-5 h-5" />
              <span>Logout</span>
            </button>
          </div>
        </nav>
      </aside>

      <main className="flex-1 lg:ml-72">
        <div className="min-h-screen p-4 sm:p-6 lg:p-8">{children}</div>
      </main>
    </div>
  );
};

export default AdminLayout;
