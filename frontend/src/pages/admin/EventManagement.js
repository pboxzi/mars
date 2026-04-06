import React from 'react';

const EventManagement = () => {
  return (
    <div className="space-y-6" data-testid="event-management">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.28em] text-[#9d172b]">Events</p>
          <h1 className="mt-2 text-3xl font-black text-[#151515] sm:text-4xl">Events workspace.</h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-stone-600">
            Clean structure first. We can add the event form and event cards next.
          </p>
        </div>

        <button
          type="button"
          className="inline-flex items-center justify-center rounded-full bg-[#151515] px-5 py-3 text-sm font-semibold text-white"
        >
          Add Event
        </button>
      </div>

      <section className="rounded-[24px] border border-stone-200 bg-white p-5">
        <p className="text-sm font-semibold text-stone-500">Event form area</p>
        <div className="mt-4 h-72 rounded-2xl bg-stone-100" />
      </section>

      <section className="rounded-[24px] border border-stone-200 bg-white p-5">
        <p className="text-sm font-semibold text-stone-500">Event list area</p>
        <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <div className="h-48 rounded-2xl bg-stone-100" />
          <div className="h-48 rounded-2xl bg-stone-100" />
          <div className="h-48 rounded-2xl bg-stone-100" />
        </div>
      </section>
    </div>
  );
};

export default EventManagement;
