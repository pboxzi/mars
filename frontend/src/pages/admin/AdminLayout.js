import React, { useEffect, useMemo } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Calendar,
  CreditCard,
  FileText,
  LayoutDashboard,
  LogOut,
  ShieldCheck,
} from 'lucide-react';
import AdminNotificationCenter from '../../components/AdminNotificationCenter';

const navItems = [
  {
    path: '/admin-secret/dashboard',
    icon: LayoutDashboard,
    label: 'Dashboard',
    eyebrow: 'Overview',
    description: 'Track requests, revenue, and what needs action next.',
  },
  {
    path: '/admin-secret/bookings',
    icon: FileText,
    label: 'Bookings',
    eyebrow: 'Requests',
    description: 'Review guest files, approve bookings, and confirm payments.',
  },
  {
    path: '/admin-secret/events',
    icon: Calendar,
    label: 'Events',
    eyebrow: 'Schedule',
    description: 'Manage dates, venues, ticket tiers, and availability.',
  },
  {
    path: '/admin-secret/payment-settings',
    icon: CreditCard,
    label: 'Payments',
    eyebrow: 'Operations',
    description: 'Keep payment instructions and support details current.',
  },
];

const AdminLayout = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const adminEmail = localStorage.getItem('admin_email');

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    if (!token) {
      navigate('/admin-secret');
    }
  }, [navigate]);

  const activeItem = useMemo(
    () => navItems.find((item) => item.path === location.pathname) || navItems[0],
    [location.pathname]
  );

  const isActive = (path) => location.pathname === path;

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_email');
    navigate('/admin-secret');
  };

  return (
    <div className="min-h-screen bg-[#f5efe6] text-[#151515]">
      <div className="lg:grid lg:min-h-screen lg:grid-cols-[17rem_minmax(0,1fr)]">
        <aside className="hidden border-r border-stone-200 bg-[#fbf8f2] lg:flex lg:flex-col">
          <div className="border-b border-stone-200 px-6 py-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#9d172b]/15 bg-[#9d172b]/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#9d172b]">
              <ShieldCheck className="h-3.5 w-3.5" />
              Admin Panel
            </div>
            <h1 className="mt-4 text-2xl font-black text-[#151515]">The Romantic Tour</h1>
            <p className="mt-1 text-sm text-stone-500">Phone-friendly guest operations</p>
            {adminEmail && <p className="mt-4 break-all text-sm text-stone-500">{adminEmail}</p>}
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
                      : 'bg-white text-stone-600 hover:bg-stone-100 hover:text-[#151515]'
                  }`}
                  data-testid={`nav-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
                >
                  <item.icon className="h-4.5 w-4.5 shrink-0" />
                  <span>{item.label}</span>
                </Link>
              ))}
            </div>
          </nav>

          <div className="border-t border-stone-200 p-4">
            <button
              onClick={handleLogout}
              className="flex w-full items-center justify-center gap-2 rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm font-semibold text-stone-700 transition hover:bg-stone-50"
              data-testid="logout-button"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </div>
        </aside>

        <div className="min-w-0">
          <header className="sticky top-0 z-20 border-b border-stone-200 bg-[#fbf8f2]/95 backdrop-blur">
            <div className="mx-auto max-w-[1380px] px-4 pb-4 pt-[max(env(safe-area-inset-top),1rem)] sm:px-6 lg:px-8">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-[10px] uppercase tracking-[0.26em] text-[#9d172b]">{activeItem.eyebrow}</p>
                  <h2 className="mt-2 truncate text-2xl font-black text-[#151515] sm:text-3xl">{activeItem.label}</h2>
                  <p className="mt-1 max-w-2xl text-sm leading-6 text-stone-500">{activeItem.description}</p>
                </div>

                <div className="flex shrink-0 items-center gap-3">
                  <AdminNotificationCenter />
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="hidden h-11 items-center gap-2 rounded-full border border-stone-200 bg-white px-4 text-sm font-semibold text-stone-700 shadow-sm transition hover:bg-stone-50 sm:inline-flex lg:hidden"
                  >
                    <LogOut className="h-4 w-4" />
                    Logout
                  </button>
                </div>
              </div>

              <div className="-mx-4 mt-4 overflow-x-auto px-4 sm:-mx-6 sm:px-6 lg:hidden">
                <nav className="flex gap-2 pb-1">
                  {navItems.map((item) => (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`flex shrink-0 items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold transition ${
                        isActive(item.path)
                          ? 'bg-[#151515] text-white'
                          : 'border border-stone-200 bg-white text-stone-600'
                      }`}
                      data-testid={`mobile-nav-${item.label.toLowerCase()}`}
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.label}</span>
                    </Link>
                  ))}
                </nav>
              </div>
            </div>
          </header>

          <main className="px-4 py-6 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-[1380px]">{children}</div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;
