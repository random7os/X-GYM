import { useEffect, useMemo, useState } from 'react';
import GlassCard from '../../components/GlassCard';
import api from '../../api/api';

const API_BASE = import.meta.env.VITE_API_BASE_URL?.replace(/\/api$/, '') || 'http://localhost:8000';

function resolveReceiptUrl(url) {
  if (!url) return null;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return API_BASE + url;
}

export default function PaymentsHub() {
  const [contracts, setContracts] = useState([]);
  const [selected, setSelected] = useState(null);
  const [notes, setNotes] = useState('');
  const [feedback, setFeedback] = useState('');

  useEffect(() => {
    async function loadPending() {
      try {
        const res = await api.get('/admin/contracts/pending');
        setContracts(res.data.pending || []);
      } catch {
      }
    }
    loadPending();
  }, []);

  useEffect(() => {
    if (!selected && contracts.length > 0) {
      setSelected(contracts[0]);
    }
  }, [contracts, selected]);

  const pendingCount = useMemo(() => contracts.length, [contracts]);

  const selectContract = (contract) => {
    setSelected(contract);
    setNotes('');
    setFeedback('');
  };

  async function refreshContracts() {
    try {
      const res = await api.get('/admin/contracts/pending');
      const pending = res.data.pending || [];
      setContracts(pending);
      if (!pending.some((item) => item.id === selected?.id)) {
        setSelected(pending[0] ?? null);
      }
    } catch {
    }
  }

  async function handleApprove() {
    if (!selected) return;
    try {
      await api.post(`/admin/contracts/${selected.id}/approve`);
      setFeedback('Contract approved successfully.');
      await refreshContracts();
    } catch {
      setFeedback('Failed to approve via API.');
    }
  }

  async function handleReject() {
    if (!selected) return;
    try {
      await api.post(`/admin/contracts/${selected.id}/reject`, { notes });
      setFeedback('Contract rejected.');
      await refreshContracts();
    } catch {
      setFeedback('Failed to reject via API.');
    }
  }

  return (
    <div className="space-y-8">
      <div className="rounded-[32px] border border-white/10 bg-[#111318]/80 p-8 shadow-glow backdrop-blur-xl">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.35em] text-vital-gold/80">Payments Hub</p>
            <h1 className="mt-3 text-4xl font-black text-white">Financial Approval Desk</h1>
            <p className="mt-3 max-w-2xl text-sm text-white/70">Review pending contracts, verify receipts, and approve or reject with tight financial control.</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-3xl bg-[#0c0f17] p-6 text-sm text-white/70">
              <p className="uppercase tracking-[0.25em] text-white/40">Pending contracts</p>
              <p className="mt-3 text-3xl font-semibold text-white">{pendingCount}</p>
            </div>
            <div className="rounded-3xl bg-[#0c0f17] p-6 text-sm text-white/70">
              <p className="uppercase tracking-[0.25em] text-white/40">Latest review</p>
              <p className="mt-3 text-3xl font-semibold text-white">{selected?.contract_code ?? '—'}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[420px_1fr]">
        <div className="space-y-6">
          <GlassCard>
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-white">Pending queue</h2>
                <p className="mt-2 text-sm text-white/70">Select any contract to verify payment and release funds.</p>
              </div>
              <button
                type="button"
                onClick={refreshContracts}
                className="rounded-3xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white transition hover:bg-white/10"
              >
                Refresh list
              </button>
            </div>

            <div className="mt-5 space-y-3">
              {contracts.length === 0 ? (
                <p className="text-sm text-white/60">No pending contracts. The queue is clear.</p>
              ) : (
                contracts.map((contract) => (
                  <button
                    type="button"
                    key={contract.id}
                    onClick={() => selectContract(contract)}
                    className={`w-full rounded-3xl border px-4 py-4 text-left transition ${
                      selected?.id === contract.id ? 'border-vital-gold bg-vital-gold/10' : 'border-white/10 bg-[#0c0e13]'
                    }`}
                  >
                    <p className="font-semibold text-white">{contract.contract_code}</p>
                      <p className="mt-2 text-sm text-white/60">{contract.member.full_name} · ₦{contract.amount.toLocaleString()}</p>
                      {contract.discount_name && <p className="mt-1 text-[10px] uppercase tracking-[0.15em] text-emerald-400">{contract.discount_name}</p>}
                    </button>
                ))
              )}
            </div>
          </GlassCard>

          <GlassCard>
            <h2 className="text-xl font-semibold text-white">Guidance</h2>
            <p className="mt-4 text-sm text-white/70">Approve contracts only after validating the receipt and confirming the payment details match the submitted client record.</p>
          </GlassCard>
        </div>

        <div className="space-y-6">
          <GlassCard>
            {selected ? (
              <div className="space-y-6">
                <div className="rounded-[28px] border border-white/10 bg-[#0b0d12] p-6">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm uppercase tracking-[0.3em] text-vital-gold/70">Contract details</p>
                      <h3 className="mt-2 text-2xl font-bold text-white">{selected.contract_code}</h3>
                      <p className="mt-2 text-sm text-white/60">{selected.member.full_name} · {selected.payment_method}</p>
                    </div>
                    <span className="rounded-full bg-vital-gold/15 px-3 py-1 text-xs font-semibold text-vital-gold">{selected.status}</span>
                  </div>
                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    <div className="rounded-3xl bg-[#111318] p-4">
                      <p className="text-xs uppercase tracking-[0.25em] text-white/40">Amount</p>
                      <p className="mt-2 text-xl font-semibold text-white">₦{selected.amount.toLocaleString()}</p>
                      {selected.discount_name && <p className="mt-1 text-[10px] uppercase tracking-[0.15em] text-emerald-400">{selected.discount_name}</p>}
                    </div>
                    <div className="rounded-3xl bg-[#111318] p-4">
                      <p className="text-xs uppercase tracking-[0.25em] text-white/40">Agent</p>
                      <p className="mt-2 text-xl font-semibold text-white">{selected.sales_agent.full_name}</p>
                    </div>
                  </div>
                </div>

                <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
                  <div className="rounded-[28px] border border-white/10 bg-[#0c0e13] p-6">
                    <p className="text-sm uppercase tracking-[0.3em] text-vital-gold/70">Receipt preview</p>
                    {selected.payments?.[0]?.receipt_url ? (
                      <img src={resolveReceiptUrl(selected.payments[0].receipt_url)} alt="Receipt" className="mt-4 h-80 w-full rounded-3xl object-cover" />
                    ) : (
                      <div className="mt-4 rounded-3xl border border-dashed border-white/10 p-6 text-center text-sm text-white/60">
                        No receipt image found for this contract.
                      </div>
                    )}
                  </div>
                  <div className="rounded-[28px] border border-white/10 bg-[#0c0e13] p-6">
                    <p className="text-sm uppercase tracking-[0.3em] text-vital-gold/70">ID Verification</p>
                    {selected.id_verification_path ? (
                      <img src={resolveReceiptUrl(selected.id_verification_path)} alt="ID Verification" className="mt-4 h-80 w-full rounded-3xl object-cover" />
                    ) : (
                      <div className="mt-4 rounded-3xl border border-dashed border-white/10 p-6 text-center text-sm text-white/60">
                        No ID verification uploaded for this contract.
                      </div>
                    )}
                  </div>
                </div>

                <div className="rounded-[28px] border border-white/10 bg-[#0c0e13] p-6">
                  <p className="text-sm uppercase tracking-[0.3em] text-vital-gold/70">Verification notes</p>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={8}
                    className="mt-4 h-full w-full rounded-3xl border border-white/10 bg-[#111318] px-4 py-4 text-sm text-white outline-none"
                    placeholder="Enter optional notes for the rejection log"
                  />
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
                  <button
                    type="button"
                    onClick={handleReject}
                    className="rounded-3xl bg-[#ff4561] px-6 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-[#ff6f83]"
                  >
                    Reject contract
                  </button>
                  <button
                    type="button"
                    onClick={handleApprove}
                    className="rounded-3xl bg-vital-gold px-6 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-black transition hover:shadow-glow"
                  >
                    Approve contract
                  </button>
                </div>

                {feedback && <div className="rounded-3xl bg-vital-gold/10 px-4 py-3 text-sm text-vital-gold">{feedback}</div>}
              </div>
            ) : (
              <div className="rounded-[28px] border border-white/10 bg-[#0c0e13] p-8 text-center text-white/70">
                Select a pending contract to inspect details, review receipts, and verify payment authenticity.
              </div>
            )}
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
