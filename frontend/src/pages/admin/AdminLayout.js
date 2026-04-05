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
    { path: '/admin-secret/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/admin-secret/events', icon: Calendar, label: 'Events' },
    { path: '/admin-secret/bookings', icon: FileText, label: 'Bookings' },
    { path: '/admin-secret/payment-settings', icon: CreditCard, label: 'Payment Settings' }
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
        className={`fixed inset-y-0 left-0 z-50 w-[15.5rem] max-w-[82vw] bg-[#fcfaf6] border-r border-stone-200 shadow-[8px_0_30px_rgba(48,32,11,0.08)] transition-transform duration-200 lg:z-30 lg:w-72 lg:max-w-none lg:translate-x-0 overflow-y-auto ${
          mobileNavOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        data-testid="admin-sidebar"
      >
        <div className="p-4 sm:p-6 border-b border-stone-200">
          <p className="text-[10px] sm:text-xs tracking-[0.28em] sm:tracking-[0.3em] uppercase text-[#9d172b] mb-2">Bruno Mars</p>
          <h1 className="text-xl sm:text-2xl font-black text-[#151515]">Admin Panel</h1>
          <p className="text-xs sm:text-sm text-stone-500 mt-1">VIP Concierge</p>
          {adminEmail && <p className="text-xs sm:text-sm text-stone-500 mt-3 break-all">{adminEmail}</p>}
        </div>

        <nav className="p-3 sm:p-4">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-3 py-2.5 sm:px-4 sm:py-3 rounded-lg mb-2 transition-all text-sm sm:text-base ${
                isActive(item.path)
                  ? 'bg-[#151515] text-white shadow-sm'
                  : 'text-stone-600 hover:bg-stone-100 hover:text-[#151515]'
              }`}
              data-testid={`nav-${item.label.toLowerCase().replace(' ', '-')}`}
            >
              <item.icon className="w-5 h-5" />
              <span>{item.label}</span>
            </Link>
          ))}

          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 sm:px-4 sm:py-3 rounded-lg mb-2 text-sm sm:text-base text-stone-600 hover:bg-stone-100 hover:text-[#151515] transition-all w-full mt-6 sm:mt-8"
            data-testid="logout-button"
          >
            <LogOut className="w-5 h-5" />
            <span>Logout</span>
          </button>

          <div className="mt-6">
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
