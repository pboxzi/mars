import React, { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Calendar,
  CreditCard,
  FileText,
  LayoutDashboard,
  LogOut,
  Menu,
  ShieldCheck,
  Sparkles,
  X,
} from 'lucide-react';
import AdminInstallPrompt from '../../components/AdminInstallPrompt';
import AdminNotificationCenter from '../../components/AdminNotificationCenter';

const navItems = [
  {
    path: '/admin-secret/dashboard',
    icon: LayoutDashboard,
    label: 'Dashboard',
    mobileLabel: 'Home',
    eyebrow: 'Overview',
    description: 'Track traffic, booking movement, and revenue in one place.',
  },
  {
    path: '/admin-secret/events',
    icon: Calendar,
    label: 'Events',
    mobileLabel: 'Events',
    eyebrow: 'Schedule',
    description: 'Manage tour dates, venues, ticket tiers, and capacity.',
  },
  {
    path: '/admin-secret/bookings',
    icon: FileText,
    label: 'Bookings',
    mobileLabel: 'Bookings',
    eyebrow: 'Requests',
    description: 'Review guest requests, payment updates, and approvals.',
  },
  {
    path: '/admin-secret/payment-settings',
    icon: CreditCard,
    label: 'Payments',
    mobileLabel: 'Payments',
    eyebrow: 'Operations',
    description: 'Control payment instructions, support contacts, and live rails.',
  },
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
    <div className="min-h-screen bg-[#f4efe6] text-[#151515]">
      {mobilePanelOpen && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/35 lg:hidden"
          onClick={() => setMobilePanelOpen(false)}
          aria-label="Close admin drawer overlay"
        />
      )}

      <aside className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-30 lg:flex lg:w-[18.5rem] lg:flex-col lg:border-r lg:border-stone-200 lg:bg-[#fbf8f2]">
        <div className="border-b border-stone-200 px-6 py-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#9d172b]/15 bg-[#9d172b]/6 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#9d172b]">
            <ShieldCheck className="h-3.5 w-3.5" />
            Admin Workspace
          </div>
          <h1 className="mt-4 text-2xl font-black leading-tight text-[#151515]">The Romantic Tour</h1>
          <p className="mt-1 text-sm text-stone-500">Guest operations and booking control</p>
          {adminEmail && <p className="mt-4 break-all text-sm text-stone-500">{adminEmail}</p>}
        </div>

        <div className="flex flex-1 flex-col overflow-y-auto p-4">
          <div className="rounded-[28px] border border-stone-200 bg-white p-3 shadow-[0_12px_30px_rgba(48,32,11,0.05)]">
            <p className="px-3 pb-2 text-[11px] uppercase tracking-[0.22em] text-stone-400">Workspace</p>
            <nav className="space-y-1.5">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-start gap-3 rounded-2xl px-3 py-3 transition ${
                    isActive(item.path)
                      ? 'bg-[#151515] text-white shadow-sm'
                      : 'text-stone-600 hover:bg-stone-100 hover:text-[#151515]'
                  }`}
                  data-testid={`nav-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
                >
                  <item.icon className="mt-0.5 h-5 w-5 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold">{item.label}</p>
                    <p className={`mt-1 text-xs leading-5 ${isActive(item.path) ? 'text-stone-300' : 'text-stone-500'}`}>
                      {item.description}
                    </p>
                  </div>
                </Link>
              ))}
            </nav>
          </div>

          <div className="mt-4 rounded-[28px] border border-stone-200 bg-white p-4">
            <div className="flex items-start gap-3">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-[#f4eadf] text-[#9d172b]">
                <Sparkles className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-semibold text-[#151515]">Run everything from one place</p>
                <p className="mt-1 text-xs leading-5 text-stone-500">
                  Live alerts stay inside the admin bell so you can monitor visits without leaving the workspace.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-auto space-y-4 pt-4">
            <AdminInstallPrompt compact />

            <button
              onClick={handleLogout}
              className="flex w-full items-center justify-center gap-2 rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm font-semibold text-stone-700 transition hover:bg-stone-50"
              data-testid="logout-button"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </div>
        </div>
      </aside>

      <div
        className={`fixed inset-y-0 right-0 z-50 w-[min(88vw,24rem)] border-l border-stone-200 bg-[#fbf8f2] px-5 pb-[calc(env(safe-area-inset-bottom)+1rem)] pt-[max(env(safe-area-inset-top),1rem)] shadow-[-18px_0_50px_rgba(48,32,11,0.15)] transition-transform duration-200 lg:hidden ${
          mobilePanelOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        data-testid="admin-mobile-sheet"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-[0.24em] text-[#9d172b]">Admin Workspace</p>
            <h2 className="mt-2 text-xl font-black text-[#151515]">The Romantic Tour</h2>
            {adminEmail && <p className="mt-2 break-all text-xs leading-5 text-stone-500">{adminEmail}</p>}
          </div>

          <button
            type="button"
            onClick={() => setMobilePanelOpen(false)}
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-stone-200 bg-white text-[#151515]"
            aria-label="Close admin drawer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-5 rounded-[24px] border border-stone-200 bg-white p-4">
          <p className="text-[11px] uppercase tracking-[0.22em] text-stone-400">Current Section</p>
          <p className="mt-2 text-lg font-black text-[#151515]">{activeItem.label}</p>
          <p className="mt-2 text-sm leading-6 text-stone-600">{activeItem.description}</p>
        </div>

        <div className="mt-4 space-y-3">
          <AdminInstallPrompt compact />

          <button
            onClick={handleLogout}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm font-semibold text-stone-700"
            data-testid="mobile-logout-button"
          >
            <LogOut className="h-4 w-4" />
            Exit Admin
          </button>
        </div>
      </div>

      <div className="lg:pl-[18.5rem]">
        <header className="sticky top-0 z-20 border-b border-stone-200 bg-[#fbf8f2]/95 backdrop-blur">
          <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-3 px-4 pb-4 pt-[max(env(safe-area-inset-top),1rem)] sm:px-6 lg:px-8">
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-[0.26em] text-[#9d172b]">{activeItem.eyebrow}</p>
              <div className="mt-2 flex items-center gap-2">
                <h2 className="truncate text-xl font-black text-[#151515] sm:text-2xl">{activeItem.label}</h2>
              </div>
              <p className="mt-1 hidden max-w-2xl text-sm text-stone-500 sm:block">{activeItem.description}</p>
            </div>

            <div className="flex items-center gap-3">
              <AdminNotificationCenter />

              <button
                type="button"
                onClick={() => setMobilePanelOpen(true)}
                className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-stone-200 bg-white text-[#151515] shadow-sm lg:hidden"
                aria-label="Open admin drawer"
              >
                <Menu className="h-5 w-5" />
              </button>
            </div>
          </div>
        </header>

        <main className="px-4 pb-28 pt-6 sm:px-6 sm:pb-32 lg:px-8 lg:pb-10">
          <div className="mx-auto max-w-[1440px]">{children}</div>
        </main>

        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-stone-200 bg-[#fbf8f2]/98 px-2 pb-[calc(env(safe-area-inset-bottom)+0.45rem)] pt-2 backdrop-blur lg:hidden">
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
      </div>
    </div>
  );
};

export default AdminLayout;
