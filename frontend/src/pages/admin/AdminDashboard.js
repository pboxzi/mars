import React from 'react';

const AdminDashboard = () => {
  return (
    <div className="space-y-6" data-testid="admin-dashboard">
      <div>
        <p className="text-xs uppercase tracking-[0.28em] text-[#9d172b]">Dashboard</p>
        <h1 className="mt-2 text-3xl font-black text-[#151515] sm:text-4xl">Admin shell is ready.</h1>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-stone-600">
          This is the clean starting point for the new admin. No clutter, no duplicate sections.
        </p>
      </div>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-[24px] border border-stone-200 bg-white p-5">
          <p className="text-sm font-semibold text-stone-500">Overview card</p>
          <div className="mt-4 h-24 rounded-2xl bg-stone-100" />
        </div>
        <div className="rounded-[24px] border border-stone-200 bg-white p-5">
          <p className="text-sm font-semibold text-stone-500">Queue card</p>
          <div className="mt-4 h-24 rounded-2xl bg-stone-100" />
        </div>
        <div className="rounded-[24px] border border-stone-200 bg-white p-5">
          <p className="text-sm font-semibold text-stone-500">Revenue card</p>
          <div className="mt-4 h-24 rounded-2xl bg-stone-100" />
        </div>
      </section>

      <section className="rounded-[24px] border border-stone-200 bg-white p-5">
        <p className="text-sm font-semibold text-stone-500">Recent activity</p>
        <div className="mt-4 h-64 rounded-2xl bg-stone-100" />
      </section>
    </div>
  );
};

export default AdminDashboard;
