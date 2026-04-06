import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Bitcoin, CreditCard, Landmark, Save, Wallet } from 'lucide-react';
import {
  buildPaymentInstructionPreview,
  buildPaymentSettingsPayload,
  createDefaultPaymentInstructionFields,
  PAYMENT_METHOD_EDITOR_FIELDS,
  PAYMENT_METHOD_OPTIONS,
  parsePaymentInstructionFields
} from '../../utils/paymentInstructionTemplates';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const paymentIcons = {
  zelle: Wallet,
  cashapp: Wallet,
  applepay: CreditCard,
  bank: Landmark,
  btc: Bitcoin,
};

const createDefaultEditorSettings = () =>
  Object.keys(PAYMENT_METHOD_OPTIONS).reduce((acc, method) => ({
    ...acc,
    [method]: createDefaultPaymentInstructionFields(method)
  }), {});

const PaymentSettings = () => {
  const [settings, setSettings] = useState(createDefaultEditorSettings);
  const [selectedMethod, setSelectedMethod] = useState('bank');
  const [btcPrice, setBtcPrice] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchSettings();
    fetchBtcPrice();
  }, []);

  const fetchSettings = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      const response = await axios.get(`${API}/admin/payment-settings`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const nextSettings = response.data.reduce((acc, setting) => ({
        ...acc,
        [setting.payment_method]: parsePaymentInstructionFields(
          setting.payment_method,
          setting.instructions,
          setting.btc_wallet_address || ''
        )
      }), createDefaultEditorSettings());

      setSettings(nextSettings);
    } catch (error) {
      console.error('Error fetching payment settings:', error);
    }
  };

  const fetchBtcPrice = async () => {
    try {
      const response = await axios.get(`${API}/btc-price`);
      setBtcPrice(response.data.btc_to_usd || 0);
    } catch (error) {
      console.error('Error fetching BTC price:', error);
    }
  };

  const handleSettingChange = (method, field, value) => {
    setSettings((prev) => ({
      ...prev,
      [method]: {
        ...prev[method],
        [field]: value
      }
    }));
  };

  const handleSaveMethod = async (method) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('admin_token');
      await axios.put(
        `${API}/admin/payment-settings/${method}`,
        buildPaymentSettingsPayload(method, settings[method]),
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert('Payment settings saved');
    } catch (error) {
      console.error('Error saving payment settings:', error);
      alert('Failed to save payment settings');
    } finally {
      setLoading(false);
    }
  };

  const methods = Object.values(PAYMENT_METHOD_OPTIONS);
  const activeMethod = methods.find((item) => item.key === selectedMethod) || methods[0];
  const ActiveIcon = paymentIcons[activeMethod.key] || CreditCard;
  const activeFields = PAYMENT_METHOD_EDITOR_FIELDS[activeMethod.key] || [];
  const activePreview = buildPaymentInstructionPreview(activeMethod.key, settings[activeMethod.key]);

  return (
    <div className="space-y-5" data-testid="payment-settings">
      <div>
        <p className="text-xs uppercase tracking-[0.28em] text-[#9d172b]">Payments</p>
        <h1 className="mt-1 text-3xl font-black text-[#151515] sm:text-4xl">Payment Settings</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-stone-600">
          Fill in the exact receiver details once. The fan instructions are built automatically.
        </p>
      </div>

      <section className="rounded-[24px] border border-stone-200 bg-white p-4 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-stone-500">Payment Methods</p>
            <h2 className="mt-1 text-2xl font-black text-[#151515]">Simple Details Editor</h2>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-3 py-2 text-sm font-semibold text-orange-700">
            <Bitcoin className="h-4 w-4" />
            BTC Ref {btcPrice ? `$${btcPrice.toFixed(2)}` : 'Loading...'}
          </div>
        </div>

        <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
          {methods.map((method) => (
            <button
              key={method.key}
              type="button"
              onClick={() => setSelectedMethod(method.key)}
              className={`shrink-0 rounded-full px-4 py-2.5 text-sm font-semibold transition ${
                selectedMethod === method.key
                  ? 'bg-[#151515] text-white'
                  : 'border border-stone-200 bg-stone-50 text-stone-600'
              }`}
            >
              {method.label}
            </button>
          ))}
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1fr),minmax(0,0.95fr)]">
          <div className="rounded-[22px] border border-stone-200 bg-stone-50 p-4">
            <div className="flex items-center gap-3">
              <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-stone-700">
                <ActiveIcon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-stone-500">Editing</p>
                <h2 className="text-xl font-black text-[#151515]">{activeMethod.label}</h2>
              </div>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {activeFields.map((field) => (
                <div key={field.key} className={field.fullWidth ? 'sm:col-span-2' : ''}>
                  <label className="mb-2 block text-sm font-semibold text-[#151515]">{field.label}</label>
                  {field.type === 'textarea' ? (
                    <textarea
                      value={settings[activeMethod.key]?.[field.key] || ''}
                      onChange={(e) => handleSettingChange(activeMethod.key, field.key, e.target.value)}
                      className={`w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm focus:border-[#151515] focus:outline-none ${
                        field.monospace ? 'font-mono' : ''
                      }`}
                      rows="3"
                      placeholder={field.placeholder}
                    />
                  ) : (
                    <input
                      type="text"
                      value={settings[activeMethod.key]?.[field.key] || ''}
                      onChange={(e) => handleSettingChange(activeMethod.key, field.key, e.target.value)}
                      className={`w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm focus:border-[#151515] focus:outline-none ${
                        field.monospace ? 'font-mono' : ''
                      }`}
                      placeholder={field.placeholder}
                    />
                  )}
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={() => handleSaveMethod(activeMethod.key)}
              disabled={loading}
              className="mt-4 inline-flex items-center justify-center gap-2 rounded-full bg-[#151515] px-5 py-3 text-sm font-semibold text-white disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              Save {activeMethod.label}
            </button>
          </div>

          <div className="rounded-[22px] border border-stone-200 bg-white p-4">
            <p className="text-sm font-semibold text-stone-500">Fan Preview</p>
            <p className="mt-1 text-sm text-stone-500">
              This is the simple instruction style your guest will receive.
            </p>
            <div className="mt-4 rounded-[18px] bg-stone-50 p-4 text-sm leading-6 text-stone-700">
              <p className="whitespace-pre-wrap">{activePreview}</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default PaymentSettings;
