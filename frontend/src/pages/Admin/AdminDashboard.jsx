import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/api';
import GlassCard from '../../components/GlassCard';

export default function AdminDashboard() {
  const [agents, setAgents] = useState([]);
  const [contracts, setContracts] = useState([]);

  useEffect(() => {
    async function loadData() {
      try {
        const [agentsRes, contractsRes] = await Promise.all([
          api.get('/admin/agents'),
          api.get('/admin/payments/filter'),
        ]);
        setAgents(agentsRes.data.agents || []);
        setContracts(contractsRes.data.results || []);
      } catch {
      }
    }
    loadData();
  }, []);

  const pendingContracts = useMemo(
    () => contracts.filter((c) => c.status === 'pending'),
    [contracts]
  );

  const topAgents = useMemo(() => {
    return agents
      .map((agent) => {
        const approved_amount = agent.approved_amount ?? 0;
        const pending_count = agent.pending_count ?? 0;
        const target_amount = agent.target?.target_amount ?? agent.target_amount ?? 0;
        const progress = target_amount ? Math.min(100, Math.round((approved_amount / Math.max(1, target_amount)) * 100)) : 0;
        return { ...agent, target_amount, approved_amount, pending_count, progress };
      })
      .sort((a, b) => b.approved_amount - a.approved_amount)
      .slice(0, 4);
  }, [agents, contracts]);

  const totalApproved = useMemo(
    () => contracts.filter((c) => c.status === 'approved').reduce((s, c) => s + Number(c.amount), 0),
    [contracts]
  );
  const totalPending = useMemo(() => pendingContracts.length, [contracts]);
  const totalAgents = agents.length;

  return (
    <div className="space-y-8">
      <div className="rounded-[32px] border border-white/10 bg-[#111318]/80 p-8 shadow-glow backdrop-blur-xl">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.35em] text-vital-gold/80">Admin Control Center</p>
            <h1 className="mt-3 text-4xl font-black text-white">Verify contracts, manage targets, and keep sales on track.</h1>
            <p className="mt-3 max-w-2xl text-sm text-white/70">
              Monitor pending approvals, update monthly goals for sales agents, and keep the admin portal aligned with the new design.
            </p>
          </div>
          <Link
            to="/admin/payments"
            className="inline-flex items-center justify-center rounded-3xl bg-vital-gold px-6 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-black transition hover:shadow-glow"
          >
            Open Payments Hub
          </Link>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <GlassCard>
          <p className="text-sm uppercase tracking-[0.35em] text-vital-gold/70">Pending approvals</p>
          <p className="mt-4 text-5xl font-black text-white">{totalPending}</p>
          <p className="mt-3 text-sm text-white/60">Contracts waiting for review and approval.</p>
        </GlassCard>
        <GlassCard>
          <p className="text-sm uppercase tracking-[0.35em] text-vital-gold/70">Total approved revenue</p>
          <p className="mt-4 text-5xl font-black text-white">₦{totalApproved.toLocaleString()}</p>
          <p className="mt-3 text-sm text-white/60">Revenue already captured from approved contracts.</p>
        </GlassCard>
        <GlassCard>
          <p className="text-sm uppercase tracking-[0.35em] text-vital-gold/70">Sales agents</p>
          <p className="mt-4 text-5xl font-black text-white">{totalAgents}</p>
          <p className="mt-3 text-sm text-white/60">Agents available to assign targets and approve contracts.</p>
        </GlassCard>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
        <GlassCard>
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-white">Monthly agent performance</h2>
              <p className="mt-2 text-sm text-white/70">Review your top performers and where each sales agent stands against the goal.</p>
            </div>
            <Link
              to="/admin/agents"
              className="rounded-3xl border border-white/10 bg-white/5 px-5 py-3 text-sm text-white transition hover:bg-white/10"
            >
              Manage Sales Agents
            </Link>
          </div>

          <div className="mt-6 space-y-4">
            {topAgents.map((agent) => (
              <div key={agent.id} className="rounded-3xl border border-white/10 bg-[#0d1016] p-5">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-semibold text-white">{agent.full_name}</p>
                    <p className="mt-1 text-sm text-white/60">Approved ₦{agent.approved_amount.toLocaleString()} · Target ₦{agent.target_amount.toLocaleString()}</p>
                  </div>
                  <p className="text-sm font-semibold text-vital-gold">{agent.progress}%</p>
                </div>
                <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
                  <div className="h-full rounded-full bg-gradient-to-r from-vital-gold to-[#ffe96d]" style={{ width: `${agent.progress}%` }} />
                </div>
              </div>
            ))}
            {topAgents.length === 0 && <p className="text-sm text-white/60">No agent activity yet.</p>}
          </div>
        </GlassCard>

        <GlassCard>
          <h2 className="text-xl font-semibold text-white">Contracts summary</h2>
          <div className="mt-6 space-y-4">
            {contracts.slice(0, 4).map((contract) => (
              <div key={contract.id} className="rounded-3xl border border-white/10 bg-[#0c0e13] p-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-semibold text-white">{contract.contract_code}</p>
                    <p className="mt-1 text-sm text-white/60">{contract.sales_agent.full_name}</p>
                  </div>
                  <span className="rounded-full bg-vital-gold/15 px-3 py-1 text-xs uppercase tracking-[0.2em] text-vital-gold">{contract.status}</span>
                </div>
                <div className="mt-3 flex items-center justify-between text-sm text-white/60">
                  <p>{contract.member.full_name}</p>
                  <div className="text-right">
                    <p>₦{contract.amount.toLocaleString()}</p>
                    {contract.discount_name && <p className="text-[10px] uppercase tracking-[0.15em] text-emerald-400">{contract.discount_name}</p>}
                  </div>
                </div>
              </div>
            ))}
            {contracts.length === 0 && <p className="text-sm text-white/60">No contract records yet.</p>}
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
