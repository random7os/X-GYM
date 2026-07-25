import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import GlassCard from '../../components/GlassCard';

export default function SalesLogin() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    try {
      await login({ username, password }, 'sales_agent');
      navigate('/sales/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Check your credentials.');
    }
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_right,_rgba(255,229,61,0.12),_transparent_45%),_linear-gradient(180deg,_#030405,_#09090f)] px-4 py-12 text-white">
      <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-[32px] border border-white/10 bg-[#0c0d11]/95 p-12 shadow-glow backdrop-blur-xl">
          <p className="text-xl font-light uppercase tracking-[0.6em] text-vital-gold">X</p>
          <h1 className="mt-6 text-5xl font-bold text-white tracking-tight">Login to your sales hub</h1>
          <p className="mt-4 max-w-2xl text-base text-white/50 tracking-wide">Enter your credentials to access the contract builder, upload receipts, and track your monthly sales target.</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => navigate('/sales/login')}
              className="rounded-full border border-vital-gold bg-vital-gold/15 px-5 py-2 text-sm font-semibold uppercase tracking-[0.2em] text-vital-gold shadow-sm shadow-vital-gold/10"
            >
              Sales
            </button>
            <button
              type="button"
              onClick={() => navigate('/admin/login')}
              className="rounded-full border border-white/10 bg-white/5 px-5 py-2 text-sm font-semibold uppercase tracking-[0.2em] text-white/70 transition hover:border-vital-gold hover:text-vital-gold"
            >
              Admin
            </button>
          </div>
        </div>

        <GlassCard>
          <div className="space-y-8">
            <div className="space-y-2">
              <p className="text-lg font-light uppercase tracking-[0.6em] text-vital-gold">Sales</p>
              <h2 className="text-4xl font-bold text-white tracking-tight">Agent Access</h2>
            </div>
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div>
                <label className="mb-2 block text-sm uppercase tracking-[0.25em] text-white/60">Username</label>
                <input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full rounded-3xl border border-white/10 bg-[#111317] px-4 py-3 text-white outline-none transition focus:border-vital-gold/60 focus:ring-2 focus:ring-vital-gold/20"
                  placeholder="agent001"
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
        </GlassCard>
      </div>
    </div>
  );
}
