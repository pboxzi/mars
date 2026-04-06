import React from 'react';

const BookingManagement = () => {
  return (
    <div className="space-y-6" data-testid="booking-management">
      <div>
        <p className="text-xs uppercase tracking-[0.28em] text-[#9d172b]">Bookings</p>
        <h1 className="mt-2 text-3xl font-black text-[#151515] sm:text-4xl">Bookings workspace.</h1>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-stone-600">
          This page is ready for the next step. We can add the booking table and actions after you approve the shell.
        </p>
      </div>

      <section className="rounded-[24px] border border-stone-200 bg-white p-5">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {['All', 'Pending', 'Approved', 'Paid', 'Confirmed'].map((tab) => (
            <div key={tab} className="rounded-full border border-stone-200 bg-stone-50 px-4 py-2 text-sm font-semibold text-stone-600">
              {tab}
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-[24px] border border-stone-200 bg-white p-5">
        <p className="text-sm font-semibold text-stone-500">Booking table area</p>
        <div className="mt-4 h-80 rounded-2xl bg-stone-100" />
      </section>
    </div>
  );
};

export default BookingManagement;
