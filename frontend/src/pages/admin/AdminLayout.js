import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, Calendar, FileText, LogOut, CreditCard, Menu, X } from 'lucide-react';
import AdminInstallPrompt from '../../components/AdminInstallPrompt';

const AdminLayout = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const adminEmail = localStorage.getItem('admin_email');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    if (!token) {
      navigate('/admin-secret');
    }
  }, [navigate]);

  useEffect(() => {
    setMobileNavOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_email');
    navigate('/admin-secret');
  };

  const isActive = (path) => location.pathname === path;

  const navItems = [
    { path: '/admin-secret/dashboard', icon: LayoutDashboard, label: 'Dashboard', mobileLabel: 'Dashboard' },
    { path: '/admin-secret/events', icon: Calendar, label: 'Events', mobileLabel: 'Events' },
    { path: '/admin-secret/bookings', icon: FileText, label: 'Bookings', mobileLabel: 'Bookings' },
    { path: '/admin-secret/payment-settings', icon: CreditCard, label: 'Payment Settings', mobileLabel: 'Payments' }
  ];

  return (
    <div className="min-h-screen bg-[#f7f3ec] text-[#151515]">
      <div className="lg:hidden sticky top-0 z-40 border-b border-stone-200 bg-[#fcfaf6]/95 backdrop-blur">
        <div className="flex items-center justify-between px-4 py-4">
          <div className="min-w-0">
            <p className="text-[10px] tracking-[0.28em] uppercase text-[#9d172b] mb-1">Bruno Mars</p>
            <h1 className="text-lg font-black truncate">Admin Panel</h1>
          </div>
          <button
            type="button"
            onClick={() => setMobileNavOpen((prev) => !prev)}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-stone-200 bg-white text-[#151515] shadow-sm"
            aria-label={mobileNavOpen ? 'Close navigation' : 'Open navigation'}
          >
            {mobileNavOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {mobileNavOpen && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/35 lg:hidden"
          onClick={() => setMobileNavOpen(false)}
          aria-label="Close navigation overlay"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-[13.25rem] max-w-[72vw] bg-[#fcfaf6] border-r border-stone-200 shadow-[8px_0_30px_rgba(48,32,11,0.08)] transition-transform duration-200 sm:w-[14.5rem] sm:max-w-[78vw] lg:z-30 lg:w-72 lg:max-w-none lg:translate-x-0 overflow-y-auto ${
          mobileNavOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        data-testid="admin-sidebar"
      >
        <div className="p-3.5 sm:p-6 border-b border-stone-200">
          <p className="text-[9px] sm:text-xs tracking-[0.24em] sm:tracking-[0.3em] uppercase text-[#9d172b] mb-1.5">Bruno Mars</p>
          <h1 className="text-lg sm:text-2xl font-black text-[#151515] leading-tight">Admin Panel</h1>
          <p className="hidden sm:block text-sm text-stone-500 mt-1">VIP Concierge</p>
          {adminEmail && <p className="text-[11px] sm:text-sm text-stone-500 mt-2 sm:mt-3 truncate">{adminEmail}</p>}
        </div>

        <nav className="p-2.5 sm:p-4">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-2.5 px-2.5 py-2.5 sm:px-4 sm:py-3 rounded-lg mb-1.5 sm:mb-2 transition-all text-[13px] sm:text-base ${
                isActive(item.path)
                  ? 'bg-[#151515] text-white shadow-sm'
                  : 'text-stone-600 hover:bg-stone-100 hover:text-[#151515]'
              }`}
              data-testid={`nav-${item.label.toLowerCase().replace(' ', '-')}`}
            >
              <item.icon className="h-[18px] w-[18px] sm:w-5 sm:h-5 shrink-0" />
              <span className="sm:hidden">{item.mobileLabel}</span>
              <span className="hidden sm:inline">{item.label}</span>
            </Link>
          ))}

          <button
            onClick={handleLogout}
            className="flex items-center gap-2.5 px-2.5 py-2.5 sm:px-4 sm:py-3 rounded-lg mb-1.5 sm:mb-2 text-[13px] sm:text-base text-stone-600 hover:bg-stone-100 hover:text-[#151515] transition-all w-full mt-5 sm:mt-8"
            data-testid="logout-button"
          >
            <LogOut className="h-[18px] w-[18px] sm:w-5 sm:h-5 shrink-0" />
            <span className="sm:hidden">Exit</span>
            <span className="hidden sm:inline">Logout</span>
          </button>

          <div className="mt-4 sm:mt-6">
            <AdminInstallPrompt compact />
          </div>
        </nav>
      </aside>

      <main className="min-w-0 lg:ml-72">
        <div className="min-h-screen px-4 py-5 sm:px-6 sm:py-6 lg:p-8">{children}</div>
      </main>
    </div>
  );
};

export default AdminLayout;
