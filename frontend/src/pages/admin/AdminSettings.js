import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { LifeBuoy, LogOut, Save } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { emptySupportSettings } from '../../hooks/useSupportSettings';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const AdminSettings = () => {
  const navigate = useNavigate();
  const [supportSettings, setSupportSettings] = useState(emptySupportSettings);
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  useEffect(() => {
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

    fetchSupportSettings();
  }, []);

  const handleSupportChange = (field, value) => {
    setSupportSettings((prev) => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSaveSupport = async () => {
    setSaving(true);
    setStatusMessage('');

    try {
      const token = localStorage.getItem('admin_token');
      const payload = {
        ...supportSettings,
        support_email: supportSettings.support_email || null
      };

      await axios.put(`${API}/admin/site-settings`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setStatusMessage('Support details saved.');
    } catch (error) {
      console.error('Error saving support settings:', error);
      setStatusMessage('Unable to save support details right now.');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_email');
    navigate('/admin-secret');
  };

  return (
    <div className="space-y-5" data-testid="admin-settings">
      <div>
        <p className="text-xs uppercase tracking-[0.28em] text-[#9d172b]">Settings</p>
        <h1 className="mt-1 text-3xl font-black text-[#151515] sm:text-4xl">Support & Session</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-stone-600">
          Keep support contact details here and manage your admin session in one place.
        </p>
      </div>

      <section className="rounded-[24px] border border-stone-200 bg-white p-4 sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-stone-100 text-stone-700">
              <LifeBuoy className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-[#151515]">Support Details</h2>
              <p className="mt-1 text-sm leading-6 text-stone-600">
                These details appear across booking pages and customer emails.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleSaveSupport}
            disabled={saving}
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
              className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm focus:border-[#151515] focus:outline-none"
              placeholder="support@example.com"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-semibold text-[#151515]">Support Phone</label>
            <input
              type="text"
              value={supportSettings.support_phone}
              onChange={(e) => handleSupportChange('support_phone', e.target.value)}
              className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm focus:border-[#151515] focus:outline-none"
              placeholder="+1 000 000 0000"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-semibold text-[#151515]">WhatsApp</label>
            <input
              type="text"
              value={supportSettings.support_whatsapp}
              onChange={(e) => handleSupportChange('support_whatsapp', e.target.value)}
              className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm focus:border-[#151515] focus:outline-none"
              placeholder="+1 000 000 0000"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-semibold text-[#151515]">Instagram</label>
            <input
              type="text"
              value={supportSettings.support_instagram}
              onChange={(e) => handleSupportChange('support_instagram', e.target.value)}
              className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm focus:border-[#151515] focus:outline-none"
              placeholder="@theromantictour"
            />
          </div>
          <div className="md:col-span-2">
            <label className="mb-2 block text-sm font-semibold text-[#151515]">Response Hours</label>
            <input
              type="text"
              value={supportSettings.support_hours}
              onChange={(e) => handleSupportChange('support_hours', e.target.value)}
              className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm focus:border-[#151515] focus:outline-none"
              placeholder="Mon-Fri, 9am-6pm"
            />
          </div>
        </div>

        {statusMessage ? (
          <p className="mt-4 text-sm font-medium text-stone-600">{statusMessage}</p>
        ) : null}
      </section>

      <section className="rounded-[24px] border border-stone-200 bg-white p-4 sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-2xl font-black text-[#151515]">Session</h2>
            <p className="mt-1 text-sm leading-6 text-stone-600">
              Sign out of the admin panel from here when you are done.
            </p>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex items-center justify-center gap-2 rounded-full border border-stone-200 bg-stone-50 px-5 py-3 text-sm font-semibold text-stone-700 transition hover:bg-stone-100"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>
      </section>
    </div>
  );
};

export default AdminSettings;
