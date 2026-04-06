import React from 'react';

const PaymentSettings = () => {
  return (
    <div className="space-y-6" data-testid="payment-settings">
      <div>
        <p className="text-xs uppercase tracking-[0.28em] text-[#9d172b]">Payments</p>
        <h1 className="mt-2 text-3xl font-black text-[#151515] sm:text-4xl">Payments workspace.</h1>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-stone-600">
          The structure is in place. We can add payment methods and support details next.
        </p>
      </div>

      <section className="rounded-[24px] border border-stone-200 bg-white p-5">
        <p className="text-sm font-semibold text-stone-500">Payment methods area</p>
        <div className="mt-4 grid gap-4">
          <div className="h-36 rounded-2xl bg-stone-100" />
          <div className="h-36 rounded-2xl bg-stone-100" />
          <div className="h-36 rounded-2xl bg-stone-100" />
        </div>
      </section>

      <section className="rounded-[24px] border border-stone-200 bg-white p-5">
        <p className="text-sm font-semibold text-stone-500">Support details area</p>
        <div className="mt-4 h-56 rounded-2xl bg-stone-100" />
      </section>
    </div>
  );
};

export default PaymentSettings;
