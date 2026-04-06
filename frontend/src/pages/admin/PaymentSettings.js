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
  const btcQuoteUpdatedLabel = btcQuote.timestamp ? new Date(btcQuote.timestamp).toLocaleString() : '';

  return (
    <div data-testid="payment-settings">
      <h1 className="text-3xl sm:text-4xl font-bold mb-8">Payments</h1>

      {/* BTC Price Display */}
      <div className="bg-gradient-to-r from-orange-900/30 to-yellow-900/30 border border-orange-700 rounded-lg p-6 mb-8">
        <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
          <Bitcoin className="w-12 h-12 text-orange-500" />
          <div>
            <p className="text-stone-500 text-sm">Live BTC reference</p>
            <p className="text-3xl font-bold">{btcQuote.price ? `$${btcQuote.price.toFixed(2)} USD` : 'Loading...'}</p>
            <p className="text-sm text-stone-500 mt-1">
              {btcQuote.source ? `${btcQuote.source}${btcQuote.isLive ? '' : ' (last known quote)'}` : 'Waiting for quote'}
            </p>
            {btcQuoteUpdatedLabel ? (
              <p className="text-xs text-stone-500 mt-1">Updated {btcQuoteUpdatedLabel}</p>
            ) : null}
          </div>
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-lg p-5 mb-8">
        <h2 className="text-lg font-bold text-stone-900 mb-2">High-Volume Mode</h2>
        <p className="text-sm text-stone-600">
          Bank Transfer and Bitcoin should be the first options shown to guests while payment traffic is high. Keep the
          other methods updated only if your team plans to use them again.
        </p>
      </div>

      {/* Payment Methods */}
      <div className="space-y-6">
        {paymentMethods.map((method) => (
          <div key={method.key} className="bg-white rounded-lg p-6 border border-stone-200" data-testid={`payment-method-${method.key}`}>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <method.icon className={`w-8 h-8 ${method.color}`} />
                <h2 className="text-2xl font-bold">{method.name}</h2>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block mb-2 font-bold">Instructions</label>
                <textarea
                  value={settings[method.key]?.instructions || ''}
                  onChange={(e) => handleChange(method.key, 'instructions', e.target.value)}
                  className="w-full bg-stone-100 border border-stone-300 rounded-lg px-4 py-3 focus:outline-none focus:border-red-600"
                  rows="7"
                  placeholder={`Add ${method.name} steps...`}
                  data-testid={`instructions-${method.key}`}
                ></textarea>
                <p className="text-sm text-stone-500 mt-2">
                  These instructions are sent directly to approved guests. Replace the bracketed placeholders with your
                  real settlement details. A high-traffic notice is automatically added to Bank Transfer and Bitcoin
                  approvals.
                </p>
              </div>

              {method.key === 'btc' && (
                <div>
                  <label className="block mb-2 font-bold">BTC Wallet Address</label>
                  <input
                    type="text"
                    value={settings[method.key]?.btc_wallet_address || ''}
                    onChange={(e) => handleChange(method.key, 'btc_wallet_address', e.target.value)}
                    className="w-full bg-stone-100 border border-stone-300 rounded-lg px-4 py-3 focus:outline-none focus:border-red-600 font-mono"
                    placeholder="bc1q..."
                    data-testid="btc-wallet-address"
                  />
                  <p className="text-sm text-stone-500 mt-2">
                    Shared automatically with approved BTC bookings.
                  </p>
                </div>
              )}

              <button
                onClick={() => handleSave(method.key)}
                disabled={loading}
                className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-lg flex items-center justify-center gap-2 disabled:opacity-50"
                data-testid={`save-${method.key}`}
              >
                <Save className="w-5 h-5" />
                Save {method.name}
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-lg p-6 border border-stone-200 mt-8" data-testid="support-settings">
        <h2 className="text-2xl font-bold mb-2">Support</h2>
        <p className="text-sm text-stone-500 mb-6">
          Phone, WhatsApp, Instagram, and response hours appear on customer-facing pages and emails. Support email stays
          internal for outbound or admin use.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block mb-2 font-bold">Support Email (Internal)</label>
            <input
              type="email"
              value={supportSettings.support_email}
              onChange={(e) => handleSupportChange('support_email', e.target.value)}
              className="w-full bg-stone-100 border border-stone-300 rounded-lg px-4 py-3 focus:outline-none focus:border-red-600"
              placeholder="booking@yourdomain.com"
            />
            <p className="text-sm text-stone-500 mt-2">
              Kept for branded outbound mail and admin use. It is not shown to fans on the public side.
            </p>
          </div>

          <div>
            <label className="block mb-2 font-bold">Support Phone</label>
            <input
              type="text"
              value={supportSettings.support_phone}
              onChange={(e) => handleSupportChange('support_phone', e.target.value)}
              className="w-full bg-stone-100 border border-stone-300 rounded-lg px-4 py-3 focus:outline-none focus:border-red-600"
              placeholder="+1 555 123 4567"
            />
          </div>

          <div>
            <label className="block mb-2 font-bold">WhatsApp</label>
            <input
              type="text"
              value={supportSettings.support_whatsapp}
              onChange={(e) => handleSupportChange('support_whatsapp', e.target.value)}
              className="w-full bg-stone-100 border border-stone-300 rounded-lg px-4 py-3 focus:outline-none focus:border-red-600"
              placeholder="+1 555 123 4567 or https://wa.me/..."
            />
          </div>

          <div>
            <label className="block mb-2 font-bold">Instagram</label>
            <input
              type="text"
              value={supportSettings.support_instagram}
              onChange={(e) => handleSupportChange('support_instagram', e.target.value)}
              className="w-full bg-stone-100 border border-stone-300 rounded-lg px-4 py-3 focus:outline-none focus:border-red-600"
              placeholder="@yourhandle"
            />
          </div>
        </div>

        <div className="mt-4">
          <label className="block mb-2 font-bold">Response Hours</label>
          <input
            type="text"
            value={supportSettings.support_hours}
            onChange={(e) => handleSupportChange('support_hours', e.target.value)}
            className="w-full bg-stone-100 border border-stone-300 rounded-lg px-4 py-3 focus:outline-none focus:border-red-600"
            placeholder="Mon-Fri, 9am-6pm"
          />
        </div>

        <button
          onClick={handleSupportSave}
          disabled={loading}
          className="mt-6 w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-lg flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <Save className="w-5 h-5" />
          Save Support
        </button>
      </div>

      <div className="mt-8 bg-blue-900/30 border border-blue-700 rounded-lg p-6">
        <h3 className="text-lg font-bold mb-2">Quick Notes</h3>
        <ul className="list-disc list-inside space-y-2 text-sm text-stone-500">
          <li>Bank Transfer and Bitcoin should be the main customer-facing options while payment traffic is high.</li>
          <li>Keep alternate methods updated only if operations plans to reactivate them.</li>
          <li>Add clear, exact settlement details for each active method.</li>
          <li>Customers see these after approval.</li>
          <li>BTC totals are calculated automatically.</li>
          <li>Only phone, WhatsApp, Instagram, and response hours appear on customer-facing pages and emails.</li>
        </ul>
      </div>
    </div>
  );
};

export default PaymentSettings;

