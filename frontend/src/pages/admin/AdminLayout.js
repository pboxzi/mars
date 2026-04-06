import React, { useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Calendar, CreditCard, FileText, LayoutDashboard, LogOut } from 'lucide-react';
import AdminNotificationCenter from '../../components/AdminNotificationCenter';

const navItems = [
  { path: '/admin-secret/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/admin-secret/bookings', label: 'Bookings', icon: FileText },
  { path: '/admin-secret/events', label: 'Events', icon: Calendar },
  { path: '/admin-secret/payment-settings', label: 'Payments', icon: CreditCard },
];

const AdminLayout = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    if (!token) {
      navigate('/admin-secret');
    }
  }, [navigate]);

  const isActive = (path) => location.pathname === path;

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_email');
    navigate('/admin-secret');
  };

  return (
    <div className="min-h-screen bg-[#f7f3ec] text-[#151515]">
      <aside className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-72 lg:flex-col lg:border-r lg:border-stone-200 lg:bg-[#fcfaf6]">
        <div className="border-b border-stone-200 px-6 py-6">
          <p className="text-xs uppercase tracking-[0.28em] text-[#9d172b]">Admin</p>
          <h1 className="mt-2 text-2xl font-black text-[#151515]">The Romantic Tour</h1>
          <p className="mt-1 text-sm text-stone-500">Clean control panel</p>
        </div>

        <nav className="flex-1 px-4 py-5">
          <div className="space-y-2">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                  isActive(item.path)
                    ? 'bg-[#151515] text-white'
                    : 'bg-transparent text-stone-600 hover:bg-stone-100 hover:text-[#151515]'
                }`}
              >
                <item.icon className="h-4 w-4" />
                <span>{item.label}</span>
              </Link>
            ))}
          </div>
        </nav>

        <div className="border-t border-stone-200 p-4">
          <div className="mb-3">
            <AdminNotificationCenter />
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm font-semibold text-stone-700 transition hover:bg-stone-50"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>
      </aside>

      <div className="lg:ml-72">
        <header className="sticky top-0 z-20 border-b border-stone-200 bg-[#fcfaf6]/95 backdrop-blur lg:hidden">
          <div className="flex items-center justify-between px-4 py-4">
            <div>
              <p className="text-[11px] uppercase tracking-[0.22em] text-[#9d172b]">Admin</p>
              <p className="mt-1 text-lg font-black text-[#151515]">The Romantic Tour</p>
            </div>
            <div className="flex items-center gap-2">
              <AdminNotificationCenter />
              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex items-center justify-center rounded-full border border-stone-200 bg-white px-4 py-2 text-sm font-semibold text-stone-700"
              >
                Logout
              </button>
            </div>
          </div>
        </header>

        <main className="min-h-screen px-4 py-6 pb-24 sm:px-6 lg:px-8 lg:pb-8 lg:pt-8">
          <div className="mx-auto max-w-6xl">{children}</div>
        </main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-stone-200 bg-[#fcfaf6]/95 px-2 py-2 backdrop-blur lg:hidden">
        <div className="grid grid-cols-4 gap-2">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center justify-center gap-1 rounded-2xl px-2 py-3 text-[11px] font-semibold transition ${
                isActive(item.path)
                  ? 'bg-[#151515] text-white'
                  : 'text-stone-600 hover:bg-stone-100'
              }`}
            >
              <item.icon className="h-4 w-4" />
              <span>{item.label}</span>
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
};

export default AdminLayout;
