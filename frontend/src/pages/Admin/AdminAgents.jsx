import { useEffect, useMemo, useState } from 'react';
import api from '../../api/api';
import GlassCard from '../../components/GlassCard';

export default function AdminAgents() {
  const [agents, setAgents] = useState([]);
  const [selectedAgentId, setSelectedAgentId] = useState(null);
  const [targetAmount, setTargetAmount] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [newAgent, setNewAgent] = useState({ full_name: '', username: '', password: '', target_amount: '' });

  useEffect(() => {
    async function loadAgents() {
      try {
        const res = await api.get('/admin/agents');
        setAgents(res.data.agents || []);
      } catch {
      }
    }
    loadAgents();
  }, []);

  useEffect(() => {
    if (agents.length && selectedAgentId === null) {
      setSelectedAgentId(agents[0].id);
    }
  }, [agents, selectedAgentId]);

  const selectedAgent = useMemo(
    () => agents.find((agent) => agent.id === Number(selectedAgentId)),
    [agents, selectedAgentId]
  );

  useEffect(() => {
    setTargetAmount(selectedAgent?.target_amount ?? '');
    setError('');
    setMessage('');
  }, [selectedAgent]);

  const agentRows = useMemo(
    () =>
      agents.map((agent) => {
        const targetAmt = agent.target?.target_amount ?? agent.target_amount ?? 0;
        return {
          ...agent,
          target_amount: targetAmt,
          approved_amount: agent.approved_amount ?? 0,
          pending_count: agent.pending_count ?? 0,
        };
      }),
    [agents]
  );

  async function refreshAgents() {
    try {
      const res = await api.get('/admin/agents');
      setAgents(res.data.agents || []);
    } catch {
    }
  }

  async function handleSaveTarget() {
    if (!selectedAgent) {
      setError('Select an agent to update the target.');
      return;
    }
    try {
      await api.post(`/admin/agents/${selectedAgent.id}/target`, { target_amount: targetAmount });
      setMessage('Monthly target updated successfully.');
      setError('');
      await refreshAgents();
    } catch {
      setError('Failed to update target via API.');
    }
  }

  async function handleCreateAgent(event) {
    event.preventDefault();
    if (!newAgent.full_name || !newAgent.username || !newAgent.password) {
      setError('Name, username, and password are required for a new sales agent.');
      return;
    }
    try {
      await api.post('/admin/agents', newAgent);
      setNewAgent({ full_name: '', username: '', password: '', target_amount: '' });
      setMessage('Sales agent created successfully.');
      setError('');
      await refreshAgents();
    } catch {
      setError('Failed to create agent via API.');
    }
  }

  async function handleDeleteAgent(agentId, agentName) {
    if (!window.confirm(`Delete ${agentName}? This will remove all their contracts and target data.`)) return;
    try {
      await api.delete(`/admin/agents/${agentId}`);
      setMessage(`Agent ${agentName} deleted successfully.`);
      setError('');
      await refreshAgents();
      setSelectedAgentId(null);
    } catch {
      setError('Failed to delete agent.');
    }
  }

  const totalApproved = agentRows.reduce((sum, agent) => sum + agent.approved_amount, 0);
  const totalPending = agentRows.reduce((sum, agent) => sum + agent.pending_count, 0);

  return (
    <div className="space-y-8">
      <div className="rounded-[32px] border border-white/10 bg-[#111318]/80 p-8 shadow-glow backdrop-blur-xl">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.35em] text-vital-gold/80">Sales agent management</p>
            <h1 className="mt-3 text-4xl font-black text-white">Add agents and set monthly targets.</h1>
            <p className="mt-3 max-w-2xl text-sm text-white/70">
              Use this page to onboard new sales agents, assign revenue goals, and keep all agent performance visible in one place.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-3xl bg-[#0c0f17] p-6 text-sm text-white/70">
              <p className="uppercase tracking-[0.25em] text-white/40">Agents</p>
              <p className="mt-3 text-3xl font-semibold text-white">{agents.length}</p>
            </div>
            <div className="rounded-3xl bg-[#0c0f17] p-6 text-sm text-white/70">
              <p className="uppercase tracking-[0.25em] text-white/40">Total pending</p>
              <p className="mt-3 text-3xl font-semibold text-white">{totalPending}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-6">
          <GlassCard>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-white">Sales Agent Roster</h2>
                <p className="mt-2 text-sm text-white/70">Review all agents and open monthly revenue targets.</p>
              </div>
              <select
                className="w-full rounded-3xl border border-white/10 bg-[#0c0e13] px-4 py-3 text-white outline-none sm:w-auto"
                value={selectedAgentId ?? ''}
                onChange={(event) => setSelectedAgentId(event.target.value)}
              >
                {agentRows.map((agent) => (
                  <option key={agent.id} value={agent.id}>{agent.full_name}</option>
                ))}
              </select>
            </div>

            <div className="mt-6 space-y-4">
              {agentRows.map((agent) => {
                const progress = agent.target_amount ? Math.min(100, Math.round((agent.approved_amount / Math.max(1, agent.target_amount)) * 100)) : 0;
                return (
                  <div key={agent.id} className="rounded-3xl border border-white/10 bg-[#0d1016] p-5">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="font-semibold text-white">{agent.full_name}</p>
                        <p className="mt-1 text-sm text-white/60">{agent.username} · Target ₦{agent.target_amount.toLocaleString()}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className="text-sm uppercase tracking-[0.25em] text-white/40">Progress</p>
                          <p className="mt-1 text-lg font-semibold text-vital-gold">{progress}%</p>
                        </div>
                        <button
                          onClick={() => handleDeleteAgent(agent.id, agent.full_name)}
                          className="rounded-full bg-red-500/15 px-3 py-1.5 text-xs font-semibold text-red-400 transition hover:bg-red-500/30"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                    <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
                      <div className="h-full rounded-full bg-gradient-to-r from-vital-gold to-[#ffe96d]" style={{ width: `${progress}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </GlassCard>

          <GlassCard>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-3xl bg-[#111318] p-6">
                <p className="text-sm uppercase tracking-[0.35em] text-vital-gold/70">Approved Revenue</p>
                <p className="mt-4 text-3xl font-semibold text-white">₦{totalApproved.toLocaleString()}</p>
                <p className="mt-2 text-sm text-white/60">Revenue confirmed from approved contracts.</p>
              </div>
              <div className="rounded-3xl bg-[#111318] p-6">
                <p className="text-sm uppercase tracking-[0.35em] text-vital-gold/70">Active Targets</p>
                <p className="mt-4 text-3xl font-semibold text-white">{agentRows.filter((agent) => agent.target_amount > 0).length}</p>
                <p className="mt-2 text-sm text-white/60">Agents with goals assigned for the month.</p>
              </div>
              <div className="rounded-3xl bg-[#111318] p-6">
                <p className="text-sm uppercase tracking-[0.35em] text-vital-gold/70">Contracted Agents</p>
                <p className="mt-4 text-3xl font-semibold text-white">{agentRows.length}</p>
                <p className="mt-2 text-sm text-white/60">Total sales reps currently available in the system.</p>
              </div>
            </div>
          </GlassCard>
        </div>

        <div className="space-y-6">
          <GlassCard>
            <h2 className="text-xl font-semibold text-white">Agent Target Details</h2>
            <p className="mt-3 text-sm text-white/70">Select an agent and update the monthly target for tracking and incentive planning.</p>

            <div className="mt-6 space-y-5">
              <div>
                <label className="block text-sm uppercase tracking-[0.25em] text-white/50">Selected agent</label>
                <p className="mt-2 rounded-3xl bg-[#0c0e13] p-4 text-white">{selectedAgent?.full_name ?? 'Choose an agent from the roster'}</p>
              </div>

              <div>
                <label className="block text-sm uppercase tracking-[0.25em] text-white/50">Monthly target</label>
                <input
                  type="number"
                  value={targetAmount}
                  onChange={(event) => setTargetAmount(event.target.value)}
                  className="mt-3 w-full rounded-3xl border border-white/10 bg-[#111318] px-4 py-3 text-white outline-none"
                  placeholder="Enter target amount"
                />
              </div>

              <button
                type="button"
                onClick={handleSaveTarget}
                className="w-full rounded-3xl bg-vital-gold px-6 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-black transition hover:shadow-glow"
              >
                Save target
              </button>
              {message && <p className="text-sm text-emerald-200">{message}</p>}
              {error && <p className="text-sm text-red-300">{error}</p>}
            </div>
          </GlassCard>

          <GlassCard>
            <h2 className="text-xl font-semibold text-white">Add New Sales Agent</h2>
            <p className="mt-2 text-sm text-white/70">Register new agents and assign their first monthly goal directly from the admin portal.</p>
            <form onSubmit={handleCreateAgent} className="mt-6 space-y-4">
              <div>
                <label className="block text-sm uppercase tracking-[0.25em] text-white/50">Agent full name</label>
                <input
                  value={newAgent.full_name}
                  onChange={(event) => setNewAgent({ ...newAgent, full_name: event.target.value })}
                  className="mt-3 w-full rounded-3xl border border-white/10 bg-[#111318] px-4 py-3 text-white outline-none"
                  placeholder="Enter agent name"
                />
              </div>
              <div>
                <label className="block text-sm uppercase tracking-[0.25em] text-white/50">Username</label>
                <input
                  value={newAgent.username}
                  onChange={(event) => setNewAgent({ ...newAgent, username: event.target.value })}
                  className="mt-3 w-full rounded-3xl border border-white/10 bg-[#111318] px-4 py-3 text-white outline-none"
                  placeholder="Enter username"
                />
              </div>
              <div>
                <label className="block text-sm uppercase tracking-[0.25em] text-white/50">Password</label>
                <input
                  type="password"
                  value={newAgent.password}
                  onChange={(event) => setNewAgent({ ...newAgent, password: event.target.value })}
                  className="mt-3 w-full rounded-3xl border border-white/10 bg-[#111318] px-4 py-3 text-white outline-none"
                  placeholder="Enter password"
                />
              </div>
              <div>
                <label className="block text-sm uppercase tracking-[0.25em] text-white/50">Initial monthly target</label>
                <input
                  type="number"
                  value={newAgent.target_amount}
                  onChange={(event) => setNewAgent({ ...newAgent, target_amount: event.target.value })}
                  className="mt-3 w-full rounded-3xl border border-white/10 bg-[#111318] px-4 py-3 text-white outline-none"
                  placeholder="₦0"
                />
              </div>
              <button className="w-full rounded-3xl bg-white/5 px-6 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-white/10">
                Add agent
              </button>
            </form>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
