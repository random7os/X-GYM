import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../api/api';
import GlassCard from '../components/GlassCard';

export default function ProfilePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const isAdmin = location.pathname.startsWith('/admin');
  const dashboardPath = isAdmin ? '/admin/dashboard' : '/sales/dashboard';
  const [form, setForm] = useState({ current_password: '', new_password: '', new_password_confirmation: '' });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage('');
    setError('');

    if (!form.current_password || !form.new_password || !form.new_password_confirmation) {
      setError('All fields are required.');
      return;
    }
    if (form.new_password !== form.new_password_confirmation) {
      setError('New passwords do not match.');
      return;
    }
    if (form.new_password.length < 6) {
      setError('New password must be at least 6 characters.');
      return;
    }

    try {
      const res = await api.put('/auth/password', form);
      setMessage(res.data.message);
      setForm({ current_password: '', new_password: '', new_password_confirmation: '' });
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.errors?.new_password?.[0] || 'Failed to update password.';
      setError(msg);
    }
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div className="rounded-[32px] border border-white/10 bg-[#111318]/80 p-8 shadow-glow backdrop-blur-xl">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.35em] text-vital-gold/80">My Profile</p>
            <h1 className="mt-3 text-4xl font-black text-white">Change Password</h1>
            <p className="mt-3 text-sm text-white/70">Update your account password. You will stay logged in after the change.</p>
          </div>
          <button
            type="button"
            onClick={() => navigate(dashboardPath)}
            className="rounded-3xl border border-white/10 bg-white/5 px-6 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-white/10"
          >
            Dashboard
          </button>
        </div>
      </div>

      <GlassCard>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="mb-2 block text-sm uppercase tracking-[0.25em] text-white/60">Current Password</label>
            <input
              type="password"
              value={form.current_password}
              onChange={(e) => setForm({ ...form, current_password: e.target.value })}
              className="w-full rounded-3xl border border-white/10 bg-[#111317] px-4 py-3 text-white outline-none transition focus:border-vital-gold/60 focus:ring-2 focus:ring-vital-gold/20"
              placeholder="Enter current password"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm uppercase tracking-[0.25em] text-white/60">New Password</label>
            <input
              type="password"
              value={form.new_password}
              onChange={(e) => setForm({ ...form, new_password: e.target.value })}
              className="w-full rounded-3xl border border-white/10 bg-[#111317] px-4 py-3 text-white outline-none transition focus:border-vital-gold/60 focus:ring-2 focus:ring-vital-gold/20"
              placeholder="Minimum 6 characters"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm uppercase tracking-[0.25em] text-white/60">Confirm New Password</label>
            <input
              type="password"
              value={form.new_password_confirmation}
              onChange={(e) => setForm({ ...form, new_password_confirmation: e.target.value })}
              className="w-full rounded-3xl border border-white/10 bg-[#111317] px-4 py-3 text-white outline-none transition focus:border-vital-gold/60 focus:ring-2 focus:ring-vital-gold/20"
              placeholder="Repeat new password"
            />
          </div>
          {error && <div className="rounded-3xl bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</div>}
          {message && <div className="rounded-3xl bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">{message}</div>}
          <button className="w-full rounded-3xl bg-vital-gold px-6 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-black transition hover:shadow-glow">
            Update Password
          </button>
        </form>
      </GlassCard>
    </div>
  );
}
