import React, { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Calendar,
  CreditCard,
  FileText,
  LayoutDashboard,
  LogOut,
  UserCircle2,
  X
} from 'lucide-react';
import AdminInstallPrompt from '../../components/AdminInstallPrompt';
import AdminNotificationCenter from '../../components/AdminNotificationCenter';

const navItems = [
  { path: '/admin-secret/dashboard', icon: LayoutDashboard, label: 'Dashboard', mobileLabel: 'Home' },
  { path: '/admin-secret/events', icon: Calendar, label: 'Events', mobileLabel: 'Events' },
  { path: '/admin-secret/bookings', icon: FileText, label: 'Bookings', mobileLabel: 'Bookings' },
  { path: '/admin-secret/payment-settings', icon: CreditCard, label: 'Payment Settings', mobileLabel: 'Pay' }
];

const AdminLayout = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const adminEmail = localStorage.getItem('admin_email');
  const [mobilePanelOpen, setMobilePanelOpen] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    if (!token) {
      navigate('/admin-secret');
    }
  }, [navigate]);

  useEffect(() => {
    setMobilePanelOpen(false);
  }, [location.pathname]);

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
    <div className="min-h-screen bg-[#f7f3ec] text-[#151515]">
      <div className="sticky top-0 z-40 border-b border-stone-200 bg-[#fcfaf6]/95 backdrop-blur lg:hidden">
        <div className="flex items-center justify-between px-4 pb-3 pt-[max(env(safe-area-inset-top),0.9rem)]">
          <div className="min-w-0">
            <p className="mb-1 text-[10px] uppercase tracking-[0.28em] text-[#9d172b]">Bruno Mars</p>
            <div className="flex items-baseline gap-2">
              <h1 className="truncate text-base font-black">Admin</h1>
              <span className="truncate text-xs text-stone-500">{activeItem.mobileLabel}</span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setMobilePanelOpen(true)}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-stone-200 bg-white text-[#151515] shadow-sm"
            aria-label="Open admin menu"
          >
            <UserCircle2 className="h-5 w-5" />
          </button>
        </div>
      </div>

      {mobilePanelOpen && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/35 lg:hidden"
          onClick={() => setMobilePanelOpen(false)}
          aria-label="Close admin menu overlay"
        />
      )}

      <div
        className={`fixed inset-x-0 bottom-0 z-50 rounded-t-[28px] border-t border-stone-200 bg-[#fcfaf6] px-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] pt-4 shadow-[0_-16px_40px_rgba(48,32,11,0.14)] transition-transform duration-200 lg:hidden ${
          mobilePanelOpen ? 'translate-y-0' : 'translate-y-full'
        }`}
        data-testid="admin-mobile-sheet"
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="mb-1 text-[10px] uppercase tracking-[0.24em] text-[#9d172b]">Bruno Mars</p>
            <h2 className="text-lg font-black">Admin</h2>
            {adminEmail && <p className="mt-1 break-all text-xs text-stone-500">{adminEmail}</p>}
          </div>

          <button
            type="button"
            onClick={() => setMobilePanelOpen(false)}
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-stone-200 bg-white text-[#151515]"
            aria-label="Close admin menu"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mb-4 rounded-2xl border border-stone-200 bg-white p-2">
          <div className="grid grid-cols-2 gap-2">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                  isActive(item.path) ? 'bg-[#151515] text-white' : 'bg-stone-50 text-stone-600'
                }`}
              >
                <item.icon className="h-4 w-4 shrink-0" />
                <span>{item.mobileLabel}</span>
              </Link>
            ))}
          </div>
        </div>

        <AdminInstallPrompt compact />

        <button
          onClick={handleLogout}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm font-semibold text-stone-700"
          data-testid="mobile-logout-button"
        >
          <LogOut className="h-4 w-4" />
          Exit Admin
        </button>
      </div>

      <aside className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-30 lg:flex lg:w-72 lg:flex-col lg:overflow-y-auto lg:border-r lg:border-stone-200 lg:bg-[#fcfaf6]">
        <div className="border-b border-stone-200 p-6">
          <p className="mb-1.5 text-xs uppercase tracking-[0.3em] text-[#9d172b]">Bruno Mars</p>
          <h1 className="text-2xl font-black leading-tight text-[#151515]">Admin Panel</h1>
          <p className="mt-1 text-sm text-stone-500">VIP Concierge</p>
          {adminEmail && <p className="mt-3 break-all text-sm text-stone-500">{adminEmail}</p>}
        </div>

        <nav className="p-4">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`mb-2 flex items-center gap-3 rounded-lg px-4 py-3 text-base transition-all ${
                isActive(item.path)
                  ? 'bg-[#151515] text-white shadow-sm'
                  : 'text-stone-600 hover:bg-stone-100 hover:text-[#151515]'
              }`}
              data-testid={`nav-${item.label.toLowerCase().replace(' ', '-')}`}
            >
              <item.icon className="h-5 w-5 shrink-0" />
              <span>{item.label}</span>
            </Link>
          ))}

          <button
            onClick={handleLogout}
            className="mt-8 flex w-full items-center gap-3 rounded-lg px-4 py-3 text-base text-stone-600 transition-all hover:bg-stone-100 hover:text-[#151515]"
            data-testid="logout-button"
          >
            <LogOut className="h-5 w-5 shrink-0" />
            <span>Logout</span>
          </button>

          <div className="mt-6">
            <AdminInstallPrompt compact />
          </div>
        </nav>
      </aside>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-stone-200 bg-[#fcfaf6]/98 px-2 pb-[calc(env(safe-area-inset-bottom)+0.45rem)] pt-2 backdrop-blur lg:hidden">
        <nav className="grid grid-cols-4 gap-1">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center justify-center gap-1 rounded-2xl px-2 py-2 text-[11px] font-medium transition ${
                isActive(item.path) ? 'bg-[#151515] text-white' : 'text-stone-500'
              }`}
              data-testid={`mobile-nav-${item.mobileLabel.toLowerCase()}`}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              <span>{item.mobileLabel}</span>
            </Link>
          ))}
        </nav>
      </div>

      <main className="min-w-0 lg:ml-72">
        <div className="min-h-screen px-4 pb-28 pt-5 sm:px-6 sm:pb-32 sm:pt-6 lg:p-8">
          <div className="mb-5 flex items-center justify-end sm:mb-6">
            <AdminNotificationCenter />
          </div>
          {children}
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
