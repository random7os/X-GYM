import { useEffect, useState } from 'react';
import api from '../../api/api';
import GlassCard from '../../components/GlassCard';

export default function AdminDiscountCodes() {
  const [codes, setCodes] = useState([]);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [percentage, setPercentage] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    loadCodes();
  }, []);

  async function loadCodes() {
    try {
      const res = await api.get('/admin/discount-codes');
      setCodes(res.data.discount_codes || []);
    } catch {
    }
  }

  function resetForm() {
    setName('');
    setCode('');
    setPercentage('');
    setEditingId(null);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setMessage('');
    setError('');

    if (!name.trim() || !code.trim() || !percentage) {
      setError('All fields are required.');
      return;
    }

    try {
      if (editingId) {
        await api.put(`/admin/discount-codes/${editingId}`, { name, code, percentage });
        setMessage('Discount code updated successfully.');
      } else {
        await api.post('/admin/discount-codes', { name, code, percentage });
        setMessage('Discount code created successfully.');
      }
      resetForm();
      loadCodes();
    } catch (err) {
      const msg = err.response?.data?.errors
        ? Object.values(err.response.data.errors)[0][0]
        : err.response?.data?.message || 'Operation failed.';
      setError(msg);
    }
  }

  function startEdit(codeItem) {
    setEditingId(codeItem.id);
    setName(codeItem.name);
    setCode(codeItem.code);
    setPercentage(codeItem.percentage);
    setMessage('');
    setError('');
  }

  async function handleToggle(codeItem) {
    try {
      await api.post(`/admin/discount-codes/${codeItem.id}/toggle`);
      loadCodes();
    } catch {
      setError('Failed to toggle discount code.');
    }
  }

  return (
    <div className="space-y-8">
      <div className="rounded-[32px] border border-white/10 bg-[#111318]/80 p-8 shadow-glow backdrop-blur-xl">
        <p className="text-sm uppercase tracking-[0.35em] text-vital-gold/80">Discount Codes</p>
        <h1 className="mt-3 text-4xl font-black text-white">Manage discount codes that sales agents can apply to contracts.</h1>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <GlassCard>
          <h2 className="text-xl font-semibold text-white">{editingId ? 'Edit Discount Code' : 'Create Discount Code'}</h2>

          <form onSubmit={handleSubmit} className="mt-6 space-y-6">
            <div className="space-y-3">
              <p className="text-xs uppercase tracking-[0.35em] text-white/50">Discount Name</p>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Summer Sale" className="w-full rounded-[28px] border border-white/10 bg-[#0b1933] px-5 py-4 text-white outline-none focus:border-vital-gold/50" />
            </div>
            <div className="space-y-3">
              <p className="text-xs uppercase tracking-[0.35em] text-white/50">Discount Code</p>
              <input type="text" value={code} onChange={(e) => setCode(e.target.value)} placeholder="e.g. SUMMER20" className="w-full rounded-[28px] border border-white/10 bg-[#0b1933] px-5 py-4 text-white outline-none focus:border-vital-gold/50" />
            </div>
            <div className="space-y-3">
              <p className="text-xs uppercase tracking-[0.35em] text-white/50">Discount Percentage (%)</p>
              <input type="number" min="0.01" max="100" step="0.01" value={percentage} onChange={(e) => setPercentage(e.target.value)} placeholder="e.g. 15" className="w-full rounded-[28px] border border-white/10 bg-[#0b1933] px-5 py-4 text-white outline-none focus:border-vital-gold/50" />
            </div>

            {error && <p className="rounded-3xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</p>}
            {message && <p className="rounded-3xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">{message}</p>}

            <div className="flex gap-3">
              <button type="submit" className="rounded-full bg-vital-gold px-8 py-4 text-sm font-semibold uppercase tracking-[0.2em] text-black transition hover:shadow-glow">
                {editingId ? 'Update Code' : 'Create Code'}
              </button>
              {editingId && (
                <button type="button" onClick={resetForm} className="rounded-full border border-white/10 bg-white/5 px-6 py-3 text-sm text-white hover:bg-white/10">
                  Cancel
                </button>
              )}
            </div>
          </form>
        </GlassCard>

        <GlassCard>
          <h2 className="text-xl font-semibold text-white">All Codes</h2>
          <div className="mt-6 space-y-4 max-h-[560px] overflow-y-auto">
            {codes.length === 0 && <p className="text-sm text-white/60">No discount codes created yet.</p>}
            {codes.map((c) => (
              <div key={c.id} className={`rounded-3xl border p-5 ${c.is_active ? 'border-white/10 bg-[#0c0e13]' : 'border-red-500/20 bg-red-500/5'}`}>
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-white truncate">{c.name}</p>
                    <p className="mt-1 text-sm text-vital-gold font-mono">{c.code}</p>
                    <p className="mt-1 text-sm text-white/60">{c.percentage}% discount</p>
                  </div>
                  <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.15em] ${c.is_active ? 'bg-emerald-500/15 text-emerald-400' : 'bg-red-500/15 text-red-400'}`}>
                    {c.is_active ? 'Active' : 'Disabled'}
                  </span>
                </div>
                <div className="mt-4 flex gap-2">
                  <button onClick={() => startEdit(c)} className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs text-white hover:bg-white/10">
                    Edit
                  </button>
                  <button onClick={() => handleToggle(c)} className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.15em] ${c.is_active ? 'border border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20' : 'border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'}`}>
                    {c.is_active ? 'Disable' : 'Enable'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
