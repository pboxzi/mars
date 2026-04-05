import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Lock } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const AdminLogin = () => {
  const navigate = useNavigate();
  const [credentials, setCredentials] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await axios.post(`${API}/admin/login`, credentials);
      localStorage.setItem('admin_token', response.data.token);
      localStorage.setItem('admin_email', response.data.email);
      navigate('/admin-secret/dashboard');
    } catch (err) {
      setError(err.response?.data?.detail || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#fff_0%,_#f7f3ec_46%,_#efe4d4_100%)] flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-5 rounded-full border border-[#d8cab6] bg-white flex items-center justify-center shadow-sm">
            <Lock className="w-8 h-8 text-[#9d172b]" />
          </div>
          <p className="text-xs tracking-[0.32em] uppercase text-[#9d172b] mb-3">Admin Access</p>
          <h1 className="text-4xl font-black mb-2 text-[#131313]" data-testid="admin-login-title">Control Room</h1>
          <p className="text-stone-500">Manage bookings, approvals, payments, and support details.</p>
        </div>

        <div className="bg-white rounded-[28px] p-8 border border-stone-200 shadow-[0_20px_60px_rgba(48,32,11,0.08)]">
          <form onSubmit={handleSubmit}>
            <div className="mb-6">
              <label className="block mb-2 text-sm font-bold uppercase tracking-[0.2em] text-[#151515]">Email</label>
              <input
                type="email"
                value={credentials.email}
                onChange={(e) => setCredentials({...credentials, email: e.target.value})}
                className="w-full bg-[#fbf8f2] border border-stone-300 rounded-2xl px-4 py-3 focus:outline-none focus:border-[#9d172b]"
                data-testid="admin-email-input"
                required
              />
            </div>

            <div className="mb-6">
              <label className="block mb-2 text-sm font-bold uppercase tracking-[0.2em] text-[#151515]">Password</label>
              <input
                type="password"
                value={credentials.password}
                onChange={(e) => setCredentials({...credentials, password: e.target.value})}
                className="w-full bg-[#fbf8f2] border border-stone-300 rounded-2xl px-4 py-3 focus:outline-none focus:border-[#9d172b]"
                data-testid="admin-password-input"
                required
              />
            </div>

            {error && (
              <div className="bg-red-900/30 border border-red-700 rounded-lg p-3 mb-6" data-testid="admin-login-error">
                <p className="text-red-500 text-sm">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#121212] hover:bg-[#2a2a2a] text-white font-bold py-3 rounded-2xl transition-all disabled:opacity-50 tracking-[0.18em] uppercase text-sm"
              data-testid="admin-login-button"
            >
              {loading ? 'Logging In...' : 'Enter Admin'}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-stone-300">
            <p className="text-xs text-stone-500 text-center">
              Use your configured admin credentials to continue.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;

