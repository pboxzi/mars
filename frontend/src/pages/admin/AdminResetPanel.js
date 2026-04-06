import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const AdminResetPanel = () => {
  const navigate = useNavigate();
  const adminEmail = localStorage.getItem('admin_email');

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

  return (
    <div className="min-h-screen bg-[#f7f3ec] px-4 py-8 text-[#151515] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <div className="rounded-[28px] border border-stone-200 bg-white p-6 shadow-[0_18px_50px_rgba(48,32,11,0.08)] sm:p-8">
          <p className="text-xs uppercase tracking-[0.28em] text-[#9d172b]">Admin Reset</p>
          <h1 className="mt-3 text-3xl font-black text-[#151515] sm:text-4xl">Admin panel cleared.</h1>
          <p className="mt-4 text-sm leading-7 text-stone-600 sm:text-base">
            The old admin interface has been removed so we can rebuild it cleanly, step by step.
          </p>

          {adminEmail && (
            <div className="mt-6 rounded-2xl bg-stone-50 px-4 py-3 text-sm text-stone-600">
              Signed in as <span className="font-semibold text-[#151515]">{adminEmail}</span>
            </div>
          )}

          <div className="mt-8 rounded-2xl border border-dashed border-stone-300 bg-[#fcfaf6] px-5 py-6">
            <p className="text-sm font-semibold text-[#151515]">Current state</p>
            <p className="mt-2 text-sm leading-6 text-stone-600">
              No dashboard, bookings table, events page, or payment settings UI is active right now.
            </p>
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center justify-center rounded-full bg-[#151515] px-5 py-3 text-sm font-semibold text-white transition hover:bg-black"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminResetPanel;
