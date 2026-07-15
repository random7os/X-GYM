import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

export default function AdminLogin() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    try {
      await login({ username, password }, 'admin');
      navigate('/admin/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Check your credentials.');
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-xl rounded-[32px] border border-white/10 bg-[#0c0d11]/90 p-10 shadow-glow backdrop-blur-xl">
        <div className="mb-8 space-y-3 text-center">
          <p className="text-sm uppercase tracking-[0.4em] text-vital-gold">X</p>
          <h1 className="text-4xl font-black text-white">Admin Portal</h1>
        </div>

        <div className="mb-6 flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/sales/login')}
            className="rounded-full border border-white/10 bg-white/5 px-5 py-2 text-sm font-semibold uppercase tracking-[0.2em] text-white/70 transition hover:border-vital-gold hover:text-vital-gold"
          >
            Sales
          </button>
          <button
            type="button"
            onClick={() => navigate('/admin/login')}
            className="rounded-full border border-vital-gold bg-vital-gold/15 px-5 py-2 text-sm font-semibold uppercase tracking-[0.2em] text-vital-gold shadow-sm shadow-vital-gold/10"
          >
            Admin
          </button>
        </div>

        <form className="space-y-6" onSubmit={handleSubmit}>
          <div>
            <label className="mb-2 block text-sm uppercase tracking-[0.25em] text-white/60">Username</label>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full rounded-3xl border border-white/10 bg-[#111317] px-4 py-3 text-white outline-none transition focus:border-vital-gold/60 focus:ring-2 focus:ring-vital-gold/20"
              placeholder="admin"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm uppercase tracking-[0.25em] text-white/60">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-3xl border border-white/10 bg-[#111317] px-4 py-3 text-white outline-none transition focus:border-vital-gold/60 focus:ring-2 focus:ring-vital-gold/20"
              placeholder="••••••••"
            />
          </div>
          {error && <div className="rounded-3xl bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</div>}
          <button className="w-full rounded-3xl bg-gradient-to-r from-vital-gold to-[#ffdc5f] px-6 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-black transition hover:shadow-glow">
            Sign In
          </button>
        </form>
      </div>
    </div>
  );
}
