import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/api';
import { useAuth } from '../../hooks/useAuth';
import GlassCard from '../../components/GlassCard';
import NotificationToast from '../../components/NotificationToast';

export default function SalesDashboard() {
  const { user, logout } = useAuth();
  const [dashboard, setDashboard] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [recentContracts, setRecentContracts] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/sales/dashboard').then((response) => setDashboard(response.data));
  }, []);

  useEffect(() => {
    api.get('/sales/contracts').then((response) => {
      setRecentContracts((response.data.contracts || []).slice(0, 3));
    }).catch(() => {});
  }, []);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await api.get('/sales/notifications');
      setNotifications(res.data.notifications || []);
    } catch {
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 15000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_right,_rgba(255,229,61,0.12),_transparent_45%),_linear-gradient(180deg,_#050608,_#090a0f)] px-6 py-8 text-white">
      <div className="flex flex-col gap-6 xl:flex-row xl:items-start">
        <div className="flex-1 space-y-6">
          <div className="flex flex-col gap-4 rounded-[32px] border border-white/10 bg-[#111318]/80 p-8 shadow-glow backdrop-blur-xl">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-[0.35em] text-vital-gold/80">Welcome back</p>
                <h2 className="mt-3 text-4xl font-black text-white">{user?.full_name || 'Sales Agent'}</h2>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => navigate('/sales/profile')}
                  className="rounded-3xl border border-vital-gold/40 bg-vital-gold/5 px-4 py-2 text-sm text-vital-gold transition hover:bg-vital-gold/10"
                >
                  Profile
                </button>
                <button
                  onClick={() => { logout(); navigate('/sales/login'); }}
                  className="rounded-3xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white transition hover:bg-white/10"
                >
                  Logout
                </button>
              </div>
            </div>
            <p className="max-w-2xl text-sm text-white/70">Your premium sales arena is live. Push contracts, upload receipts, and convert gym members into elite clients.</p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            <GlassCard className="space-y-4">
              <p className="text-sm uppercase tracking-[0.3em] text-vital-gold/70">Monthly target</p>
              <p className="text-3xl font-semibold text-white">₦{dashboard?.target?.target_amount ? Number(dashboard.target.target_amount).toLocaleString() : '0'}</p>
            </GlassCard>
            <GlassCard className="space-y-4">
              <p className="text-sm uppercase tracking-[0.3em] text-vital-gold/70">Achieved</p>
              <p className="text-3xl font-semibold text-white">₦{dashboard?.achieved ? Number(dashboard.achieved).toLocaleString() : '0'}</p>
            </GlassCard>
            <GlassCard className="space-y-4">
              <p className="text-sm uppercase tracking-[0.3em] text-vital-gold/70">Remaining</p>
              <p className="text-3xl font-semibold text-white">₦{dashboard?.remaining ? Number(dashboard.remaining).toLocaleString() : '0'}</p>
            </GlassCard>
          </div>
        </div>

        <div className="w-full max-w-xl space-y-6 xl:w-[420px]">
          <GlassCard>
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-[0.3em] text-vital-gold/70">Progress</p>
                <h3 className="mt-2 text-3xl font-bold text-white">{dashboard?.percent_achieved ?? 0}% Achieved</h3>
              </div>
              <div className="h-28 w-28 rounded-full bg-[#0f1116] p-4">
                <svg viewBox="0 0 120 120" className="h-full w-full">
                  <circle cx="60" cy="60" r="52" stroke="#ffffff1a" strokeWidth="14" fill="none" />
                  <circle
                    cx="60"
                    cy="60"
                    r="52"
                    stroke="url(#progress-gradient)"
                    strokeWidth="14"
                    fill="none"
                    strokeDasharray="327"
                    strokeDashoffset={327 - ((dashboard?.percent_achieved ?? 0) / 100) * 327}
                    strokeLinecap="round"
                    className="transition-all duration-700 ease-out"
                  />
                  <defs>
                    <linearGradient id="progress-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#ffe53d" />
                      <stop offset="100%" stopColor="#ffcc00" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>
            </div>
            <div className="mt-6 h-3 overflow-hidden rounded-full bg-white/10">
              <div className="h-full rounded-full bg-gradient-to-r from-vital-gold via-[#ffe96d] to-[#ffd700]" style={{ width: `${dashboard?.percent_achieved ?? 0}%` }} />
            </div>
          </GlassCard>

          <GlassCard>
            <div className="flex flex-col gap-4">
              <p className="text-sm uppercase tracking-[0.3em] text-vital-gold/70">Quick actions</p>
              <div className="flex flex-col gap-3">
                <button
                  onClick={() => navigate('/sales/contracts/new')}
                  className="w-full rounded-3xl bg-vital-gold px-5 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-black transition hover:shadow-glow"
                >
                  New Contract
                </button>
                <button
                  onClick={() => navigate('/sales/contracts/renewal')}
                  className="w-full rounded-3xl border border-vital-gold/40 bg-vital-gold/5 px-5 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-vital-gold transition hover:bg-vital-gold/10"
                >
                  Renewal
                </button>
                <button
                  onClick={() => navigate('/sales/contracts')}
                  className="w-full rounded-3xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-white/10"
                >
                  Contract History
                </button>
              </div>
            </div>
            <div className="mt-6 rounded-3xl border border-white/10 bg-[#0c0d11] p-4">
              <p className="text-xs uppercase tracking-[0.3em] text-white/50">Recent contracts</p>
              <div className="mt-3 space-y-2">
                {recentContracts.length > 0 ? recentContracts.map((c) => (
                  <div key={c.id} className="flex items-center justify-between rounded-2xl bg-[#111318] px-4 py-3">
                    <div>
                      <p className="text-sm font-semibold text-white">{c.contract_code}</p>
                      <p className="text-xs text-white/50">{c.member.full_name} · {c.membership_type}</p>
                    </div>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.15em] ${c.status === 'approved' ? 'bg-emerald-500/15 text-emerald-400' : c.status === 'rejected' ? 'bg-red-500/15 text-red-400' : 'bg-vital-gold/15 text-vital-gold'}`}>
                      {c.status}
                    </span>
                  </div>
                )) : <p className="text-sm text-white/50">No contracts submitted yet.</p>}
              </div>
            </div>
          </GlassCard>

          {notifications.length > 0 && (
            <GlassCard>
              <div className="flex items-center justify-between gap-4">
                <p className="text-sm uppercase tracking-[0.3em] text-vital-gold/70">Notifications</p>
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70 hover:bg-white/10"
                >
                  {showNotifications ? 'Hide' : `Show ${notifications.length}`}
                </button>
              </div>
              {showNotifications && (
                <div className="mt-4 space-y-3 max-h-72 overflow-y-auto">
                  {notifications.slice(-5).reverse().map((n) => (
                    <NotificationToast
                      key={n.id}
                      title={`Contract ${n.contract_code}`}
                      message={n.message}
                      time={new Date(n.reviewed_at).toLocaleDateString()}
                    />
                  ))}
                </div>
              )}
              {!showNotifications && (
                <div className="mt-3 rounded-3xl bg-vital-gold/10 px-4 py-3 text-sm text-vital-gold">
                  You have {notifications.length} contract review update{notifications.length !== 1 ? 's' : ''}.
                </div>
              )}
            </GlassCard>
          )}
        </div>
      </div>
    </div>
  );
}
