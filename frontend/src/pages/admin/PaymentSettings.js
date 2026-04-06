import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Save, Bitcoin, Landmark, DollarSign } from 'lucide-react';
import { emptySupportSettings } from '../../hooks/useSupportSettings';
import {
  createDefaultPaymentSettings,
  getPaymentInstructionsOrTemplate,
  PAYMENT_METHOD_OPTIONS
} from '../../utils/paymentInstructionTemplates';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;
const emptyBtcQuote = {
  price: 0,
  source: '',
  timestamp: '',
  isLive: false
};

const PaymentSettings = () => {
  const [settings, setSettings] = useState(createDefaultPaymentSettings);
  const [loading, setLoading] = useState(false);
  const [btcQuote, setBtcQuote] = useState(emptyBtcQuote);
  const [supportSettings, setSupportSettings] = useState(emptySupportSettings);
  const [selectedMethod, setSelectedMethod] = useState('bank');

  useEffect(() => {
    fetchSettings();
    fetchBtcPrice();
    fetchSupportSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      const response = await axios.get(`${API}/admin/payment-settings`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const settingsData = {};
      response.data.forEach(setting => {
        settingsData[setting.payment_method] = {
          instructions: getPaymentInstructionsOrTemplate(setting.payment_method, setting.instructions),
          btc_wallet_address: setting.btc_wallet_address || ''
        };
      });
      
      setSettings(prev => ({...prev, ...settingsData}));
    } catch (error) {
      console.error('Error fetching payment settings:', error);
    }
  };

  const fetchBtcPrice = async () => {
    try {
      const response = await axios.get(`${API}/btc-price`);
      setBtcQuote({
        price: response.data.btc_to_usd || 0,
        source: response.data.source || '',
        timestamp: response.data.timestamp || '',
        isLive: Boolean(response.data.is_live)
      });
    } catch (error) {
      console.error('Error fetching BTC price:', error);
      setBtcQuote(emptyBtcQuote);
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

  const handleSave = async (method) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('admin_token');
      await axios.put(
        `${API}/admin/payment-settings/${method}`,
        settings[method],
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert('Saved');
    } catch (error) {
      console.error('Error saving payment settings:', error);
      alert('Save failed');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (method, field, value) => {
    setSettings({
      ...settings,
      [method]: {
        ...settings[method],
        [field]: value
      }
    });
  };

  const handleSupportChange = (field, value) => {
    setSupportSettings((prev) => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSupportSave = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('admin_token');
      const payload = {
        ...supportSettings,
        support_email: supportSettings.support_email || null
      };
      await axios.put(
        `${API}/admin/site-settings`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert('Support saved');
    } catch (error) {
      console.error('Error saving support settings:', error);
      alert('Support save failed');
    } finally {
      setLoading(false);
    }
  };

  const paymentMethodMeta = {
    zelle: { icon: DollarSign, color: 'text-purple-500' },
    cashapp: { icon: DollarSign, color: 'text-green-500' },
    applepay: { icon: DollarSign, color: 'text-blue-500' },
    bank: { icon: Landmark, color: 'text-yellow-500' },
    btc: { icon: Bitcoin, color: 'text-orange-500' }
  };

  const paymentMethods = Object.values(PAYMENT_METHOD_OPTIONS).map((method) => ({
    ...method,
    ...paymentMethodMeta[method.key]
  }));
  const activeMethod = paymentMethods.find((method) => method.key === selectedMethod) || paymentMethods[0];
  const btcQuoteUpdatedLabel = btcQuote.timestamp ? new Date(btcQuote.timestamp).toLocaleString() : '';

  return (
    <div className="space-y-6" data-testid="payment-settings">
      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.45fr)_minmax(20rem,0.9fr)]">
        <div className="rounded-[28px] border border-stone-200 bg-white p-5 shadow-[0_12px_30px_rgba(48,32,11,0.05)] sm:p-6">
          <p className="text-[11px] uppercase tracking-[0.22em] text-[#9d172b]">Payments</p>
          <h1 className="mt-2 text-2xl font-black text-[#151515] sm:text-3xl">Keep live settlement details clean.</h1>
          <p className="mt-2 text-sm leading-6 text-stone-600">
            Edit one payment method at a time so mobile stays simple and the team can update the active rail quickly.
          </p>

          <div className="-mx-5 mt-5 overflow-x-auto px-5 sm:-mx-6 sm:px-6">
            <div className="flex gap-2 pb-1">
              {paymentMethods.map((method) => (
                <button
                  key={method.key}
                  type="button"
                  onClick={() => setSelectedMethod(method.key)}
                  className={`shrink-0 rounded-full px-4 py-2.5 text-sm font-semibold transition ${
                    selectedMethod === method.key
                      ? 'bg-[#151515] text-white'
                      : 'border border-stone-200 bg-white text-stone-600'
                  }`}
                >
                  {method.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        <aside className="rounded-[28px] border border-stone-200 bg-[#151515] p-5 text-white shadow-[0_12px_30px_rgba(21,21,21,0.12)] sm:p-6">
          <div className="flex items-start gap-3">
            <Bitcoin className="h-10 w-10 text-orange-400" />
            <div>
              <p className="text-[11px] uppercase tracking-[0.22em] text-white/60">BTC Reference</p>
              <p className="mt-2 text-3xl font-black">{btcQuote.price ? `$${btcQuote.price.toFixed(2)}` : 'Loading...'}</p>
              <p className="mt-2 text-sm text-white/65">
                {btcQuote.source ? `${btcQuote.source}${btcQuote.isLive ? '' : ' (last known quote)'}` : 'Waiting for quote'}
              </p>
              {btcQuoteUpdatedLabel ? <p className="mt-1 text-xs text-white/50">Updated {btcQuoteUpdatedLabel}</p> : null}
            </div>
          </div>

          <div className="mt-5 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm leading-6 text-white/75">
            Bank Transfer and Bitcoin should stay first while payment traffic is high. Keep other rails updated only if your team plans to use them.
          </div>
        </aside>
      </section>

      <section className="rounded-[28px] border border-stone-200 bg-white p-5 shadow-[0_12px_30px_rgba(48,32,11,0.05)] sm:p-6" data-testid={`payment-method-${activeMethod.key}`}>
        <div className="flex items-center gap-3">
          <activeMethod.icon className={`h-8 w-8 ${activeMethod.color}`} />
          <div>
            <p className="text-[11px] uppercase tracking-[0.18em] text-stone-400">Active Editor</p>
            <h2 className="mt-1 text-2xl font-black text-[#151515]">{activeMethod.name}</h2>
          </div>
        </div>

        <div className="mt-5 space-y-4">
          <div>
            <label className="block mb-2 text-sm font-semibold text-[#151515]">Instructions</label>
            <textarea
              value={settings[activeMethod.key]?.instructions || ''}
              onChange={(e) => handleChange(activeMethod.key, 'instructions', e.target.value)}
              className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm"
              rows="8"
              placeholder={`Add ${activeMethod.name} steps...`}
              data-testid={`instructions-${activeMethod.key}`}
            ></textarea>
            <p className="mt-2 text-sm leading-6 text-stone-500">
              These instructions are sent directly to approved guests. Replace placeholders with your real settlement details.
            </p>
          </div>

          {activeMethod.key === 'btc' && (
            <div>
              <label className="block mb-2 text-sm font-semibold text-[#151515]">BTC Wallet Address</label>
              <input
                type="text"
                value={settings[activeMethod.key]?.btc_wallet_address || ''}
                onChange={(e) => handleChange(activeMethod.key, 'btc_wallet_address', e.target.value)}
                className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 font-mono text-sm"
                placeholder="bc1q..."
                data-testid="btc-wallet-address"
              />
              <p className="mt-2 text-sm text-stone-500">Shared automatically with approved BTC bookings.</p>
            </div>
          )}

          <button
            onClick={() => handleSave(activeMethod.key)}
            disabled={loading}
            className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#151515] px-5 py-3 text-sm font-semibold text-white disabled:opacity-50 sm:w-auto"
            data-testid={`save-${activeMethod.key}`}
          >
            <Save className="h-4 w-4" />
            Save {activeMethod.name}
          </button>
        </div>
      </section>

      <section className="rounded-[28px] border border-stone-200 bg-white p-5 shadow-[0_12px_30px_rgba(48,32,11,0.05)] sm:p-6" data-testid="support-settings">
        <h2 className="text-2xl font-black text-[#151515]">Support Details</h2>
        <p className="mt-2 text-sm leading-6 text-stone-500">
          Phone, WhatsApp, Instagram, and response hours appear on customer-facing pages and emails. Support email stays internal.
        </p>

        <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="block mb-2 text-sm font-semibold text-[#151515]">Support Email (Internal)</label>
            <input
              type="email"
              value={supportSettings.support_email}
              onChange={(e) => handleSupportChange('support_email', e.target.value)}
              className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3"
              placeholder="booking@yourdomain.com"
            />
          </div>

          <div>
            <label className="block mb-2 text-sm font-semibold text-[#151515]">Support Phone</label>
            <input
              type="text"
              value={supportSettings.support_phone}
              onChange={(e) => handleSupportChange('support_phone', e.target.value)}
              className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3"
              placeholder="+1 555 123 4567"
            />
          </div>

          <div>
            <label className="block mb-2 text-sm font-semibold text-[#151515]">WhatsApp</label>
            <input
              type="text"
              value={supportSettings.support_whatsapp}
              onChange={(e) => handleSupportChange('support_whatsapp', e.target.value)}
              className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3"
              placeholder="+1 555 123 4567 or https://wa.me/..."
            />
          </div>

          <div>
            <label className="block mb-2 text-sm font-semibold text-[#151515]">Instagram</label>
            <input
              type="text"
              value={supportSettings.support_instagram}
              onChange={(e) => handleSupportChange('support_instagram', e.target.value)}
              className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3"
              placeholder="@yourhandle"
            />
          </div>
        </div>

        <div className="mt-4">
          <label className="block mb-2 text-sm font-semibold text-[#151515]">Response Hours</label>
          <input
            type="text"
            value={supportSettings.support_hours}
            onChange={(e) => handleSupportChange('support_hours', e.target.value)}
            className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3"
            placeholder="Mon-Fri, 9am-6pm"
          />
        </div>

        <button
          onClick={handleSupportSave}
          disabled={loading}
          className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#151515] px-5 py-3 text-sm font-semibold text-white disabled:opacity-50 sm:w-auto"
        >
          <Save className="h-4 w-4" />
          Save Support
        </button>
      </section>
    </div>
  );
};

export default PaymentSettings;

