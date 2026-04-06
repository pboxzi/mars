import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Bitcoin, CreditCard, Landmark, Save, Wallet } from 'lucide-react';
import { emptySupportSettings } from '../../hooks/useSupportSettings';
import {
  createDefaultPaymentSettings,
  getPaymentInstructionsOrTemplate,
  PAYMENT_METHOD_OPTIONS
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

const PaymentSettings = () => {
  const [settings, setSettings] = useState(createDefaultPaymentSettings);
  const [supportSettings, setSupportSettings] = useState(emptySupportSettings);
  const [selectedMethod, setSelectedMethod] = useState('bank');
  const [btcPrice, setBtcPrice] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchSettings();
    fetchSupportSettings();
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
        [setting.payment_method]: {
          instructions: getPaymentInstructionsOrTemplate(setting.payment_method, setting.instructions),
          btc_wallet_address: setting.btc_wallet_address || ''
        }
      }), createDefaultPaymentSettings());

      setSettings(nextSettings);
    } catch (error) {
      console.error('Error fetching payment settings:', error);
    }
  };

  const fetchSupportSettings = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      const response = await axios.get(`${API}/admin/site-settings`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setSupportSettings({
        support_email: response.data.support_email || '',
        support_phone: response.data.support_phone || '',
        support_whatsapp: response.data.support_whatsapp || '',
        support_instagram: response.data.support_instagram || '',
        support_hours: response.data.support_hours || ''
      });
    } catch (error) {
      console.error('Error fetching support settings:', error);
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

  const handleSupportChange = (field, value) => {
    setSupportSettings((prev) => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSaveMethod = async (method) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('admin_token');
      await axios.put(
        `${API}/admin/payment-settings/${method}`,
        settings[method],
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

  const handleSaveSupport = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('admin_token');
      const payload = {
        ...supportSettings,
        support_email: supportSettings.support_email || null
      };
      await axios.put(`${API}/admin/site-settings`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Support details saved');
    } catch (error) {
      console.error('Error saving support settings:', error);
      alert('Failed to save support details');
    } finally {
      setLoading(false);
    }
  };

  const methods = Object.values(PAYMENT_METHOD_OPTIONS);
  const activeMethod = methods.find((item) => item.key === selectedMethod) || methods[0];
  const ActiveIcon = paymentIcons[activeMethod.key] || CreditCard;

  return (
    <div className="space-y-5" data-testid="payment-settings">
      <div>
        <p className="text-xs uppercase tracking-[0.28em] text-[#9d172b]">Payments</p>
        <h1 className="mt-1 text-3xl font-black text-[#151515] sm:text-4xl">Payment Settings</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-stone-600">
          Keep payment instructions and support contact details simple and current.
        </p>
      </div>

      <section className="rounded-[24px] border border-stone-200 bg-white p-4 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-stone-500">Payment Methods</p>
            <h2 className="mt-1 text-2xl font-black text-[#151515]">Customer Instructions</h2>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-3 py-2 text-sm font-semibold text-orange-700">
            <Bitcoin className="h-4 w-4" />
            BTC Ref {btcPrice ? `$${btcPrice.toFixed(2)}` : 'Loading...'}
          </div>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1">
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

        <div className="mt-4">
          <div className="flex items-center gap-3">
            <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-stone-100 text-stone-700">
              <ActiveIcon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-stone-500">Editing</p>
              <h2 className="text-xl font-black text-[#151515]">{activeMethod.label}</h2>
            </div>
          </div>

          <div className="mt-4 space-y-3.5">
            <div>
              <label className="mb-2 block text-sm font-semibold text-[#151515]">Instructions</label>
              <textarea
                value={settings[activeMethod.key]?.instructions || ''}
                onChange={(e) => handleSettingChange(activeMethod.key, 'instructions', e.target.value)}
                className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm"
                rows="5"
              />
            </div>

            {activeMethod.key === 'btc' && (
              <div>
                <label className="mb-2 block text-sm font-semibold text-[#151515]">BTC Wallet Address</label>
                <input
                  type="text"
                  value={settings[activeMethod.key]?.btc_wallet_address || ''}
                  onChange={(e) => handleSettingChange(activeMethod.key, 'btc_wallet_address', e.target.value)}
                  className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm font-mono"
                  placeholder="bc1q..."
                />
              </div>
            )}

            <button
              type="button"
              onClick={() => handleSaveMethod(activeMethod.key)}
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-[#151515] px-5 py-3 text-sm font-semibold text-white disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              Save {activeMethod.label}
            </button>
          </div>
        </div>
      </section>

      <section className="rounded-[24px] border border-stone-200 bg-white p-4 sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-black text-[#151515]">Support Details</h2>
            <p className="mt-1 text-sm leading-6 text-stone-600">
              Used across booking pages and customer emails.
            </p>
          </div>
          <button
            type="button"
            onClick={handleSaveSupport}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-[#151515] px-5 py-3 text-sm font-semibold text-white disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            Save Support
          </button>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-semibold text-[#151515]">Support Email</label>
            <input
              type="email"
              value={supportSettings.support_email}
              onChange={(e) => handleSupportChange('support_email', e.target.value)}
              className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-semibold text-[#151515]">Support Phone</label>
            <input
              type="text"
              value={supportSettings.support_phone}
              onChange={(e) => handleSupportChange('support_phone', e.target.value)}
              className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-semibold text-[#151515]">WhatsApp</label>
            <input
              type="text"
              value={supportSettings.support_whatsapp}
              onChange={(e) => handleSupportChange('support_whatsapp', e.target.value)}
              className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-semibold text-[#151515]">Instagram</label>
            <input
              type="text"
              value={supportSettings.support_instagram}
              onChange={(e) => handleSupportChange('support_instagram', e.target.value)}
              className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm"
            />
          </div>
        </div>

        <div className="mt-3">
          <label className="mb-2 block text-sm font-semibold text-[#151515]">Response Hours</label>
          <input
            type="text"
            value={supportSettings.support_hours}
            onChange={(e) => handleSupportChange('support_hours', e.target.value)}
            className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm"
          />
        </div>
      </section>
    </div>
  );
};

export default PaymentSettings;
