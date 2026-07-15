import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/api';
import GlassCard from '../../components/GlassCard';
function applyFilters(contracts, filters) {
  return contracts.filter((contract) => {
    const d = new Date(contract.created_at);
    if (filters.from && new Date(filters.from) > d) return false;
    if (filters.to && new Date(filters.to) < d) return false;
    if (filters.agent_id && Number(filters.agent_id) !== (contract.sales_agent?.id ?? contract.salesAgent?.id)) return false;
    if (filters.status && filters.status !== 'all' && filters.status !== contract.status) return false;
    return true;
  });
}

function toCsvRow(cells) {
  return cells.map(c => {
    const s = String(c);
    return s.includes(',') || s.includes('"') || s.includes('\n') ? '"' + s.replace(/"/g, '""') + '"' : s;
  }).join(',');
}

function downloadCsv(rows) {
  const csvHeader = ['Contract ID', 'Member', 'Sales Agent', 'Amount', 'Method', 'Status', 'Date'];
  const csvRows = rows.map((contract) => [
    contract.contract_code,
    contract.member.full_name,
    contract.sales_agent.full_name,
    Number(contract.amount).toLocaleString() + 'EGP',
    contract.payment_method,
    contract.status,
    (d => `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`)(new Date(contract.created_at)),
  ]);
  const csvContent = [csvHeader, ...csvRows].map(toCsvRow).join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'x-contracts.csv';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

async function downloadXlsx(filters) {
  try {
    const params = {};
    if (filters.from) params.from = filters.from;
    if (filters.to) params.to = filters.to;
    if (filters.agent_id) params.agent_id = filters.agent_id;
    if (filters.payment_method) params.payment_method = filters.payment_method;

    const response = await api.get('/admin/exports/financial', {
      params,
      responseType: 'blob',
    });

    const blob = new Blob([response.data], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `x-financial-export-${new Date().toISOString().slice(0, 10)}.xlsx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch {
    console.warn('Backend export unavailable, falling back to CSV');
  }
}

export default function AdminContractsExport() {
  const navigate = useNavigate();
  const [contracts, setContracts] = useState([]);
  const [agents, setAgents] = useState([]);
  const [filters, setFilters] = useState({ from: '', to: '', agent_id: '', status: 'all' });
  const [filtered, setFiltered] = useState([]);

  useEffect(() => {
    async function loadData() {
      try {
        const [contractsRes, agentsRes] = await Promise.all([
          api.get('/admin/payments/filter'),
          api.get('/admin/agents'),
        ]);
        setContracts(contractsRes.data.results || []);
        setAgents((agentsRes.data.agents || []).map((a) => ({ id: a.id, full_name: a.full_name })));
      } catch {
      }
    }
    loadData();
  }, []);

  useEffect(() => {
    setFiltered(applyFilters(contracts, filters));
  }, [filters, contracts]);

  const totalRevenue = useMemo(
    () => filtered.reduce((sum, contract) => sum + contract.amount, 0),
    [filtered]
  );

  return (
    <div className="space-y-8">
      <div className="rounded-[32px] border border-white/10 bg-[#111318]/80 p-8 shadow-glow backdrop-blur-xl">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.35em] text-vital-gold/80">Master database</p>
            <h1 className="mt-3 text-4xl font-black text-white">Contracts & export dashboard</h1>
            <p className="mt-3 max-w-2xl text-sm text-white/70">Filter contract records, track revenue, and export the current view to CSV for reporting.</p>
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => downloadXlsx(filters)}
              className="rounded-3xl border border-vital-gold/40 bg-vital-gold/5 px-5 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-vital-gold transition hover:bg-vital-gold/10"
            >
              Export XLSX
            </button>
            <button
              type="button"
              onClick={() => downloadCsv(filtered)}
              className="rounded-3xl bg-vital-gold px-6 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-black transition hover:shadow-glow"
            >
              Export CSV
            </button>
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[320px_1fr]">
        <GlassCard>
          <h2 className="text-xl font-semibold text-white">Filters</h2>
          <div className="mt-6 space-y-4">
            <label className="block text-sm uppercase tracking-[0.25em] text-white/50">From</label>
            <input
              type="date"
              value={filters.from}
              onChange={(event) => setFilters({ ...filters, from: event.target.value })}
              className="w-full rounded-3xl border border-white/10 bg-[#111318] px-4 py-3 text-white outline-none"
            />
          </div>
          <div className="space-y-4">
            <label className="block text-sm uppercase tracking-[0.25em] text-white/50">To</label>
            <input
              type="date"
              value={filters.to}
              onChange={(event) => setFilters({ ...filters, to: event.target.value })}
              className="w-full rounded-3xl border border-white/10 bg-[#111318] px-4 py-3 text-white outline-none"
            />
          </div>
          <div className="space-y-4">
            <label className="block text-sm uppercase tracking-[0.25em] text-white/50">Agent</label>
            <select
              value={filters.agent_id}
              onChange={(event) => setFilters({ ...filters, agent_id: event.target.value })}
              className="w-full rounded-3xl border border-white/10 bg-[#111318] px-4 py-3 text-white outline-none"
            >
              <option value="">All agents</option>
              {agents.map((agent) => (
                <option key={agent.id} value={agent.id}>{agent.full_name}</option>
              ))}
            </select>
          </div>
          <div className="space-y-4">
            <label className="block text-sm uppercase tracking-[0.25em] text-white/50">Status</label>
            <select
              value={filters.status}
              onChange={(event) => setFilters({ ...filters, status: event.target.value })}
              className="w-full rounded-3xl border border-white/10 bg-[#111318] px-4 py-3 text-white outline-none"
            >
              <option value="all">All statuses</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </GlassCard>

        <div className="space-y-6">
          <GlassCard>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-3xl bg-[#0c0e13] p-6">
                <p className="text-sm uppercase tracking-[0.35em] text-vital-gold/70">Filtered contracts</p>
                <p className="mt-4 text-3xl font-semibold text-white">{filtered.length}</p>
              </div>
              <div className="rounded-3xl bg-[#0c0e13] p-6">
                <p className="text-sm uppercase tracking-[0.35em] text-vital-gold/70">Total revenue</p>
                <p className="mt-4 text-3xl font-semibold text-white">₦{totalRevenue.toLocaleString()}</p>
              </div>
              <div className="rounded-3xl bg-[#0c0e13] p-6">
                <p className="text-sm uppercase tracking-[0.35em] text-vital-gold/70">Last update</p>
                <p className="mt-4 text-3xl font-semibold text-white">{new Date().toLocaleDateString()}</p>
              </div>
            </div>
          </GlassCard>

          <GlassCard>
            <div className="overflow-hidden rounded-[28px] border border-white/10">
              <div className="bg-[#0c0e13] px-6 py-5 text-sm uppercase tracking-[0.3em] text-white/60">Contract records</div>
              <div className="max-h-[560px] overflow-auto bg-[#090a10]">
                <table className="min-w-full border-separate border-spacing-0 text-left text-sm text-white/80">
                  <thead>
                    <tr>
                      <th className="px-6 py-4">Contract</th>
                      <th className="px-6 py-4">Agent</th>
                      <th className="px-6 py-4">Amount</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((contract) => (
                      <tr
                        key={contract.id}
                        onClick={() => navigate(`/admin/contracts/${contract.id}`)}
                        className="cursor-pointer border-t border-white/10 transition hover:bg-white/10"
                      >
                        <td className="px-6 py-4 font-semibold text-white">{contract.contract_code}</td>
                        <td className="px-6 py-4">{contract.sales_agent.full_name}</td>
                        <td className="px-6 py-4">₦{contract.amount.toLocaleString()}</td>
                        <td className={`px-6 py-4 uppercase font-semibold ${
                          contract.status === 'approved' ? 'text-emerald-400' :
                          contract.status === 'rejected' ? 'text-red-400' :
                          'text-vital-gold'
                        }`}>{contract.status}</td>
                        <td className="px-6 py-4">{contract.created_at}</td>
                      </tr>
                    ))}
                    {filtered.length === 0 && (
                      <tr>
                        <td colSpan="5" className="px-6 py-8 text-center text-sm text-white/50">
                          No contracts match the current filters.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
