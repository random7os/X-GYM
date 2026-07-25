import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/api';

const QR_API = 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=';
const PLANS = {
  Standard:       { days: 30,  price: 6000 },
  'Standard Plus': { days: 90,  price: 12000 },
  Premium:        { days: 180, price: 17000 },
  Elite:          { days: 365, price: 22500 },
};
const membershipPlans = Object.keys(PLANS);
const ptPackages = ['No PT Package', '4 Sessions - 1500 EGP', '8 Sessions - 2000 EGP', '12 Sessions - 3000 EGP', '16 Sessions - 3400 EGP', '20 Sessions - 4500 EGP', '24 Sessions - 5200 EGP'];

const ptPackageMap = {
  'No PT Package': null,
  '4 Sessions - 1500 EGP': 4,
  '8 Sessions - 2000 EGP': 8,
  '12 Sessions - 3000 EGP': 12,
  '16 Sessions - 3400 EGP': 16,
  '20 Sessions - 4500 EGP': 20,
  '24 Sessions - 5200 EGP': 24,
};
const ptSessionPrices = { 4: 1500, 8: 2000, 12: 3000, 16: 3400, 20: 4500, 24: 5200 };
const paymentMethods = ['Instapay', 'Vodafone Cash', 'Visa', 'Cash'];

const initialMemberForm = {
  full_name: '', email: '', phone: '', birth_date: '',
  membership_plan: '', start_date: '', end_date: '',
  pt_package: 'No PT Package', payment_method: 'Instapay',
  amount: '', receipt: null, idVerification: null,
};

function calcEndDate(startDate, planDays) {
  if (!startDate || !planDays) return '';
  const d = new Date(startDate);
  d.setDate(d.getDate() + planDays);
  return d.toISOString().split('T')[0];
}

function formatDate(d) {
  return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
}

export default function MultiContractFlow({ type, onBack }) {
  const navigate = useNavigate();
  const isReferral = type === 'referral';

  const [step, setStep] = useState('action');
  const [action, setAction] = useState(null);
  const [members, setMembers] = useState([{ ...initialMemberForm }]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedExisting, setSelectedExisting] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [results, setResults] = useState([]);
  const [discountCode, setDiscountCode] = useState('');
  const [discountInfo, setDiscountInfo] = useState(null);
  const [discountLoading, setDiscountLoading] = useState(false);
  const [discountError, setDiscountError] = useState('');

  function updateMember(index, field, value) {
    setMembers(prev => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      const plan = PLANS[next[index].membership_plan];
      if (field === 'membership_plan' && plan) {
        next[index].amount = String(plan.price);
        next[index].end_date = calcEndDate(next[index].start_date, plan.days);
      }
      if ((field === 'start_date' || field === 'membership_plan') && plan) {
        next[index].end_date = calcEndDate(next[index].start_date || next[index].start_date, plan.days);
      }
      return next;
    });
  }

  function addMember() {
    setMembers(prev => [...prev, { ...initialMemberForm }]);
  }

  function removeMember(index) {
    if (members.length > 1) {
      setMembers(prev => prev.filter((_, i) => i !== index));
    }
  }

  async function handleSearch(q) {
    setSearchQuery(q);
    if (q.length < 2) { setSearchResults([]); return; }
    try {
      const res = await api.get('/sales/members/search', { params: { phone: q } });
      setSearchResults(res.data.members || []);
    } catch { setSearchResults([]); }
  }

  function toggleExisting(member) {
    setSelectedExisting(prev =>
      prev.some(m => m.id === member.id)
        ? prev.filter(m => m.id !== member.id)
        : [...prev, member]
    );
  }

  function validateAddMembers() {
    for (let i = 0; i < members.length; i++) {
      const m = members[i];
      if (!m.full_name || !m.email || !m.phone) return `Member ${i + 1}: Please complete all required fields.`;
      if (!m.idVerification) return `Member ${i + 1}: ID verification photo is required.`;
    }
    return '';
  }

  function validatePlans() {
    const allMembers = action === 'search' ? selectedExisting : members;
    for (let i = 0; i < allMembers.length; i++) {
      const m = allMembers[i];
      if (!m.membership_plan || !m.start_date) return `Member ${i + 1}: Please select a plan and start date.`;
    }
    return '';
  }

  function validatePayments() {
    const allMembers = action === 'search' ? selectedExisting : members;
    for (let i = 0; i < allMembers.length; i++) {
      const m = allMembers[i];
      if (!m.payment_method) return `Member ${i + 1}: Please select a payment method.`;
      if (m.payment_method !== 'Cash' && !m.receipt) return `Member ${i + 1}: Please upload a receipt for non-cash payments.`;
    }
    return '';
  }

  async function applyDiscountCode() {
    if (!discountCode.trim()) { setDiscountError('Enter a discount code.'); return; }
    setDiscountLoading(true);
    setDiscountError('');
    setDiscountInfo(null);
    try {
      const res = await api.get('/sales/discount-codes/validate', { params: { code: discountCode.trim() } });
      setDiscountInfo(res.data.discount_code);
      setDiscountError('');
    } catch {
      setDiscountError('Invalid or inactive discount code.');
      setDiscountInfo(null);
    }
    setDiscountLoading(false);
  }

  function discountedAmount(original) {
    if (!discountInfo) return original;
    return Math.round(original - (original * discountInfo.percentage) / 100);
  }

  async function submitAll() {
    setIsSubmitting(true);
    setError('');
    const allMembers = action === 'search' ? selectedExisting : members;
    const created = [];
    let groupCode = null;

    for (let i = 0; i < allMembers.length; i++) {
      const m = allMembers[i];
      const fd = new FormData();
      if (m.id) {
        fd.append('member_id', m.id);
        fd.append('member_name', m.full_name);
        fd.append('member_email', m.email);
        fd.append('member_phone', m.phone);
      } else {
        fd.append('member_name', m.full_name);
        fd.append('member_email', m.email);
        fd.append('member_phone', m.phone);
        fd.append('member_birthdate', m.birth_date || '');
      }
      fd.append('membership_type', m.membership_plan);
      fd.append('start_date', m.start_date);
      fd.append('end_date', m.end_date || '');
      const finalAmt = discountInfo ? discountedAmount(Number(m.amount)) : Number(m.amount);
      fd.append('pt_package_id', ptPackageMap[m.pt_package] ?? '');
      fd.append('payment_method', m.payment_method);
      fd.append('amount', finalAmt);
      if (m.receipt) fd.append('receipt', m.receipt);
      if (m.idVerification) fd.append('id_verification', m.idVerification);
      if (discountInfo) fd.append('discount_code_id', discountInfo.id);
      fd.append('contract_type', isReferral ? 'referral' : 'family');

      if (groupCode) {
        fd.append('contract_code', groupCode);
      }

      try {
        const res = await api.post('/sales/contracts', fd);
        const c = res.data.contract;
        if (!groupCode) {
          groupCode = c.contract_code;
        }
        let qrToken = '';
        try {
          const qrRes = await api.get(`/sales/contracts/${c.id}/qr`);
          qrToken = qrRes.data.qr_code_token || '';
        } catch {}
        created.push({ ...c, qr_token: qrToken, member_name: m.full_name });
      } catch (err) {
        const msg = err.response?.data?.errors
          ? Object.values(err.response.data.errors)[0]?.[0]
          : err.response?.data?.message || `Failed to create contract for ${m.full_name}`;
        setError(msg);
        setIsSubmitting(false);
        return;
      }
    }

    setResults(created);
    setStep('complete');
    setIsSubmitting(false);
  }

  const sidebarLabel = isReferral ? 'Referral' : 'Family';

  return (
    <div className="min-h-screen bg-[#021027] text-white">
      <div className="grid min-h-screen grid-cols-1 xl:grid-cols-[260px_1fr]">
        <aside className="border-r border-white/10 bg-[#061333] px-6 py-8">
          <div className="mb-12 flex flex-col gap-7">
            <div className="flex items-center gap-3 rounded-3xl border border-white/10 bg-[#091b3a] px-4 py-5 shadow-glow">
              <div className="flex h-12 w-12 items-center justify-center rounded-3xl bg-vital-gold text-black font-black">X</div>
              <div>
                <p className="text-sm uppercase tracking-[0.35em] text-[#f4de52]/80">X</p>
                <p className="text-base font-semibold text-white">Sales Portal</p>
              </div>
            </div>
            <nav className="space-y-3">
              <button type="button" onClick={() => navigate('/sales/dashboard')} className="flex w-full items-center gap-3 rounded-3xl border border-white/10 bg-white/5 px-4 py-4 text-left text-sm font-semibold text-white transition hover:border-vital-gold/60 hover:text-vital-gold">
                <span>📊</span> Dashboard
              </button>
              <button type="button" onClick={onBack} className="flex w-full items-center gap-3 rounded-3xl border border-white/10 bg-white/5 px-4 py-4 text-left text-sm text-white transition hover:border-vital-gold/60 hover:text-vital-gold">
                <span>←</span> Back to New Contract
              </button>
              <button type="button" onClick={() => navigate('/sales/profile')} className="flex w-full items-center gap-3 rounded-3xl border border-white/10 bg-white/5 px-4 py-4 text-left text-sm font-semibold text-white transition hover:border-vital-gold/60 hover:text-vital-gold">
                <span>👤</span> Profile
              </button>
            </nav>
          </div>
          <div className="mt-auto rounded-3xl border border-white/10 bg-[#091b3a] p-5 text-sm text-white/70">
            <p className="mt-1">{sidebarLabel} — Multi-contract flow</p>
          </div>
        </aside>

        <main className="px-6 py-8">
          <div className="mx-auto max-w-[930px] space-y-6">

            {/* HEADER */}
            <div className="space-y-3">
              <p className="text-sm uppercase tracking-[0.35em] text-[#f4de52]/80">{sidebarLabel}</p>
              <h1 className="text-5xl font-black text-white">
                {step === 'action' && (isReferral ? 'Refer a Friend' : 'Family Plan')}
                {step === 'search' && 'Search Existing Member'}
                {step === 'add' && 'Add New Member'}
                {step === 'plans' && 'Choose Subscription Plans'}
                {step === 'payment' && 'Payment & Submit'}
                {step === 'complete' && 'Contracts Created!'}
              </h1>
            </div>

            {/* STEP INDICATOR */}
            {step !== 'action' && step !== 'complete' && (
              <div className="rounded-[32px] border border-white/10 bg-[#061d3c]/80 p-4 shadow-glow">
                <div className="flex items-center justify-center gap-4 text-xs uppercase tracking-[0.2em] text-white/40">
                  <span className={step === 'search' || step === 'add' ? 'text-vital-gold' : ''}>
                    {action === 'search' ? '1. Select' : '1. Add'}
                  </span>
                  <span className="text-white/20">→</span>
                  <span className={step === 'plans' ? 'text-vital-gold' : ''}>2. Plans</span>
                  <span className="text-white/20">→</span>
                  <span className={step === 'payment' ? 'text-vital-gold' : ''}>3. Payment</span>
                  <span className="text-white/20">→</span>
                  <span className={step === 'complete' ? 'text-vital-gold' : ''}>4. Complete</span>
                </div>
              </div>
            )}

            {/* ACTION SELECTION */}
            {step === 'action' && (
              <div className="grid gap-6 lg:grid-cols-2">
                <button
                  type="button"
                  onClick={() => { setAction('search'); setStep('search'); setError(''); }}
                  className="rounded-[32px] border border-white/10 bg-[#061d3c]/80 p-10 shadow-glow text-left transition hover:border-vital-gold/50"
                >
                  <p className="text-2xl font-bold text-white">🔍 Search existing member</p>
                  <p className="mt-2 text-sm text-white/60">
                    {isReferral
                      ? 'Search for an existing member who is already a friend of the client.'
                      : 'Search for an existing family member by phone, name, or ID.'}
                  </p>
                </button>
                <button
                  type="button"
                  onClick={() => { setAction('add'); setStep('add'); setError(''); }}
                  className="rounded-[32px] border border-white/10 bg-[#061d3c]/80 p-10 shadow-glow text-left transition hover:border-vital-gold/50"
                >
                  <p className="text-2xl font-bold text-white">➕ {isReferral ? 'Join with friend' : 'Add family member'}</p>
                  <p className="mt-2 text-sm text-white/60">
                    Add a new {isReferral ? 'friend' : 'family member'} with ID verification and create subscriptions for both.
                  </p>
                </button>
              </div>
            )}

            {/* SEARCH EXISTING */}
            {step === 'search' && (
              <div className="rounded-[32px] border border-white/10 bg-[#061d3c]/80 p-8 shadow-glow space-y-6">
                <input
                  value={searchQuery}
                  onChange={e => handleSearch(e.target.value)}
                  placeholder="Search by phone number..."
                  className="w-full rounded-[28px] border border-white/10 bg-[#0b1933] px-5 py-4 text-white outline-none transition focus:border-vital-gold/50"
                />
                {searchResults.length > 0 && (
                  <div className="space-y-3">
                    <p className="text-sm uppercase tracking-[0.35em] text-white/50">Results</p>
                    {searchResults.map(m => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => toggleExisting(m)}
                        className={`flex w-full items-center justify-between rounded-3xl border px-5 py-4 text-left transition ${
                          selectedExisting.some(s => s.id === m.id)
                            ? 'border-vital-gold bg-vital-gold/10'
                            : 'border-white/10 bg-[#0b1933]'
                        }`}
                      >
                        <div>
                          <p className="font-semibold text-white">{m.full_name}</p>
                          <p className="text-sm text-white/60">{m.phone} · {m.email}</p>
                        </div>
                        <span className="text-xs uppercase tracking-[0.2em] text-vital-gold">
                          {selectedExisting.some(s => s.id === m.id) ? 'Selected' : 'Select'}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
                {selectedExisting.length > 0 && (
                  <div className="rounded-3xl bg-vital-gold/5 border border-vital-gold/20 p-4">
                    <p className="text-sm text-vital-gold">{selectedExisting.length} member(s) selected</p>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <button type="button" onClick={() => setStep('action')} className="rounded-full border border-white/10 bg-white/5 px-6 py-3 text-sm text-white transition hover:bg-white/10">Back</button>
                  <button
                    type="button"
                    onClick={() => { if (selectedExisting.length === 0) { setError('Please select at least one member.'); return; } setError(''); setStep('plans'); }}
                    className="rounded-full bg-vital-gold px-8 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-black transition hover:shadow-glow"
                  >
                    Next: Choose Plans ({selectedExisting.length})
                  </button>
                </div>
                {error && <p className="text-sm text-red-300">{error}</p>}
              </div>
            )}

            {/* ADD NEW MEMBER(S) */}
            {step === 'add' && (
              <div className="rounded-[32px] border border-white/10 bg-[#061d3c]/80 p-8 shadow-glow space-y-6">
                {members.map((m, i) => (
                  <div key={i} className="rounded-3xl border border-white/10 bg-[#0b1933] p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <p className="text-sm uppercase tracking-[0.35em] text-vital-gold/70">Member {i + 1}</p>
                      {members.length > 1 && (
                        <button type="button" onClick={() => removeMember(i)} className="text-xs text-red-400 hover:text-red-300">Remove</button>
                      )}
                    </div>
                    <div className="grid gap-4 lg:grid-cols-2">
                      <input placeholder="Full Name" value={m.full_name} onChange={e => updateMember(i, 'full_name', e.target.value)} className="w-full rounded-[28px] border border-white/10 bg-[#0c203f] px-5 py-3 text-white outline-none focus:border-vital-gold/50" />
                      <input placeholder="Email" type="email" value={m.email} onChange={e => updateMember(i, 'email', e.target.value)} className="w-full rounded-[28px] border border-white/10 bg-[#0c203f] px-5 py-3 text-white outline-none focus:border-vital-gold/50" />
                    </div>
                    <div className="grid gap-4 lg:grid-cols-2">
                      <input placeholder="Phone" value={m.phone} onChange={e => updateMember(i, 'phone', e.target.value)} className="w-full rounded-[28px] border border-white/10 bg-[#0c203f] px-5 py-3 text-white outline-none focus:border-vital-gold/50" />
                      <input placeholder="Birth Date" type="date" value={m.birth_date} onChange={e => updateMember(i, 'birth_date', e.target.value)} className="w-full rounded-[28px] border border-white/10 bg-[#0c203f] px-5 py-3 text-white outline-none focus:border-vital-gold/50" />
                    </div>
                    <div className="rounded-3xl border border-dashed border-white/20 bg-[#081a31] p-4">
                      <p className="text-xs uppercase tracking-[0.35em] text-white/50">ID Verification (Required)</p>
                      <input type="file" accept="image/png,image/jpeg" onChange={e => updateMember(i, 'idVerification', e.target.files?.[0] || null)} className="mt-2 w-full cursor-pointer rounded-3xl border border-white/10 bg-[#0c203f] px-4 py-2 text-sm text-white outline-none" />
                      {m.idVerification && <p className="mt-1 text-xs text-white/70">Selected: {m.idVerification.name}</p>}
                    </div>
                  </div>
                ))}
                <button type="button" onClick={addMember} className="w-full rounded-3xl border border-dashed border-white/20 bg-white/5 px-4 py-4 text-sm font-semibold text-white/70 transition hover:border-vital-gold/50 hover:text-vital-gold">
                  + Add another {isReferral ? 'friend' : 'family member'}
                </button>
                <div className="flex items-center justify-between">
                  <button type="button" onClick={() => setStep('action')} className="rounded-full border border-white/10 bg-white/5 px-6 py-3 text-sm text-white transition hover:bg-white/10">Back</button>
                  <button
                    type="button"
                    onClick={() => { const err = validateAddMembers(); if (err) { setError(err); return; } setError(''); setStep('plans'); }}
                    className="rounded-full bg-vital-gold px-8 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-black transition hover:shadow-glow"
                  >
                    Next: Choose Plans ({members.length})
                  </button>
                </div>
                {error && <p className="text-sm text-red-300">{error}</p>}
              </div>
            )}

            {/* PLAN SELECTION */}
            {step === 'plans' && (
              <div className="rounded-[32px] border border-white/10 bg-[#061d3c]/80 p-8 shadow-glow space-y-6">
                <p className="text-sm uppercase tracking-[0.35em] text-white/50">Choose a subscription plan and start date for each member</p>
                {(action === 'search' ? selectedExisting : members).map((m, i) => (
                  <div key={i} className="rounded-3xl border border-white/10 bg-[#0b1933] p-6 space-y-4">
                    <p className="text-sm font-semibold text-vital-gold">{m.full_name || `Member ${i + 1}`}</p>
                    <div className="grid gap-4 lg:grid-cols-2">
                      <div className="space-y-2">
                        <p className="text-xs uppercase tracking-[0.35em] text-white/50">Plan</p>
                        <select value={m.membership_plan} onChange={e => updateMember(i, 'membership_plan', e.target.value)} className="w-full rounded-[28px] border border-white/10 bg-[#0c203f] px-5 py-3 text-white outline-none focus:border-vital-gold/50">
                          <option value="">Select Plan...</option>
                          {membershipPlans.map(name => (
                            <option key={name} value={name}>{name} — {PLANS[name].days}d • {Number(PLANS[name].price).toLocaleString()} EGP</option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-2">
                        <p className="text-xs uppercase tracking-[0.35em] text-white/50">Start Date</p>
                        <input type="date" value={m.start_date} onChange={e => updateMember(i, 'start_date', e.target.value)} className="w-full rounded-[28px] border border-white/10 bg-[#0c203f] px-5 py-3 text-white outline-none focus:border-vital-gold/50" />
                      </div>
                    </div>
                    <div className="grid gap-4 lg:grid-cols-2">
                      <div className="space-y-2">
                        <p className="text-xs uppercase tracking-[0.35em] text-white/50">PT Package</p>
                        <select value={m.pt_package} onChange={e => updateMember(i, 'pt_package', e.target.value)} className="w-full rounded-[28px] border border-white/10 bg-[#0c203f] px-5 py-3 text-white outline-none focus:border-vital-gold/50">
                          {ptPackages.map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                      </div>
                      <div className="rounded-3xl bg-[#0c203f] px-5 py-3">
                        <p className="text-xs text-white/50">Amount</p>
                        <p className="text-xl font-bold text-vital-gold">{m.amount ? Number(m.amount).toLocaleString() + ' EGP' : '—'}</p>
                      </div>
                    </div>
                  </div>
                ))}
                <div className="flex items-center justify-between">
                  <button type="button" onClick={() => setStep(action === 'search' ? 'search' : 'add')} className="rounded-full border border-white/10 bg-white/5 px-6 py-3 text-sm text-white transition hover:bg-white/10">Back</button>
                  <button
                    type="button"
                    onClick={() => { const err = validatePlans(); if (err) { setError(err); return; } setError(''); setStep('payment'); }}
                    className="rounded-full bg-vital-gold px-8 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-black transition hover:shadow-glow"
                  >
                    Next: Payment
                  </button>
                </div>
                {error && <p className="text-sm text-red-300">{error}</p>}
              </div>
            )}

            {/* PAYMENT */}
            {step === 'payment' && (
              <div className="rounded-[32px] border border-white/10 bg-[#061d3c]/80 p-8 shadow-glow space-y-6">
                <p className="text-sm uppercase tracking-[0.35em] text-white/50">Choose payment method and upload receipt for each member</p>
                {(action === 'search' ? selectedExisting : members).map((m, i) => {
                  const showDiscAmt = discountInfo ? discountedAmount(Number(m.amount)) : null;
                  return (
                    <div key={i} className="rounded-3xl border border-white/10 bg-[#0b1933] p-6 space-y-4">
                      <div className="flex items-center justify-between">
                        <p className="font-semibold text-white">{m.full_name || `Member ${i + 1}`}</p>
                        <div className="text-right">
                          {showDiscAmt ? (
                            <>
                              <p className="text-sm text-white/40 line-through">{Number(m.amount).toLocaleString()} EGP</p>
                              <p className="text-lg font-bold text-vital-gold">{showDiscAmt.toLocaleString()} EGP</p>
                            </>
                          ) : (
                            <p className="text-lg font-bold text-vital-gold">{m.amount ? Number(m.amount).toLocaleString() + ' EGP' : ''}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-3">
                        {paymentMethods.map(method => (
                          <button
                            key={method}
                            type="button"
                            onClick={() => updateMember(i, 'payment_method', method)}
                            className={`rounded-3xl border px-4 py-2 text-sm font-semibold transition ${m.payment_method === method ? 'border-vital-gold bg-vital-gold/10 text-vital-gold' : 'border-white/10 bg-[#071b34] text-white/70 hover:border-white/20'}`}
                          >
                            {method}
                          </button>
                        ))}
                      </div>
                      {m.payment_method !== 'Cash' && (
                        <div className="rounded-3xl border border-dashed border-white/20 bg-[#081a31] p-4">
                          <p className="text-xs uppercase tracking-[0.35em] text-white/50">Upload Receipt</p>
                          <input type="file" accept="image/png,image/jpeg" onChange={e => updateMember(i, 'receipt', e.target.files?.[0] || null)} className="mt-2 w-full cursor-pointer rounded-3xl border border-white/10 bg-[#0c203f] px-4 py-2 text-sm text-white outline-none" />
                          {m.receipt && <p className="mt-1 text-xs text-white/70">Selected: {m.receipt.name}</p>}
                        </div>
                      )}
                      {m.payment_method === 'Cash' && (
                        <p className="text-xs text-white/50">Cash payment — no receipt needed.</p>
                      )}
                    </div>
                  );
                })}
                <div className="rounded-3xl border border-dashed border-white/10 bg-[#0b2346] p-4">
                  <p className="text-xs uppercase tracking-[0.35em] text-white/50">Discount Code</p>
                  <div className="mt-2 flex gap-2">
                    <input type="text" value={discountCode} onChange={(e) => setDiscountCode(e.target.value)} placeholder="Enter code" className="flex-1 rounded-full border border-white/10 bg-[#0b1933] px-4 py-3 text-sm text-white outline-none focus:border-vital-gold/50" />
                    <button type="button" onClick={applyDiscountCode} disabled={discountLoading} className="shrink-0 rounded-full bg-vital-gold px-5 py-3 text-sm font-semibold text-black transition hover:shadow-glow disabled:opacity-70">
                      {discountLoading ? '...' : discountInfo ? 'Applied' : 'Apply'}
                    </button>
                  </div>
                  {discountError && <p className="mt-2 text-sm text-red-400">{discountError}</p>}
                  {discountInfo && (
                    <button type="button" onClick={() => { setDiscountInfo(null); setDiscountCode(''); setDiscountError(''); }} className="mt-2 text-xs text-vital-gold underline">
                      Remove discount ({discountInfo.percentage}% off)
                    </button>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <button type="button" onClick={() => setStep('plans')} className="rounded-full border border-white/10 bg-white/5 px-6 py-3 text-sm text-white transition hover:bg-white/10">Back</button>
                  <button
                    type="button"
                    onClick={() => { const err = validatePayments(); if (err) { setError(err); return; } setError(''); submitAll(); }}
                    disabled={isSubmitting}
                    className="rounded-full bg-vital-gold px-8 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-black transition hover:shadow-glow disabled:opacity-70"
                  >
                    {isSubmitting ? 'Submitting...' : `Submit ${(action === 'search' ? selectedExisting : members).length} Contracts`}
                  </button>
                </div>
                {error && <p className="text-sm text-red-300">{error}</p>}
              </div>
            )}

            {/* COMPLETE */}
            {step === 'complete' && (
              <div className="rounded-[32px] border border-white/10 bg-[#061d3c]/80 p-10 shadow-glow">
                <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-[#0c3d2a] text-4xl text-vital-gold">✓</div>
                <h2 className="text-4xl font-black text-center text-white">Contracts Submitted!</h2>
                <p className="mt-4 text-center text-sm text-white/70">All contracts are pending admin review and financial verification.</p>

                <div className="mt-10 grid gap-6 lg:grid-cols-2">
                  {results.map((c, i) => (
                    <div key={c.id} className="rounded-3xl border border-white/10 bg-[#0b2346] p-6 text-center">
                      {c.qr_token ? (
                        <img src={QR_API + encodeURIComponent(window.location.origin + '/qr/verify/' + c.qr_token)} alt="QR" className="mx-auto h-44 w-44 rounded-[28px] bg-white p-2" />
                      ) : (
                        <div className="mx-auto flex h-44 w-44 items-center justify-center rounded-[28px] bg-black/50 text-white/30 text-sm">QR unavailable</div>
                      )}
                      <p className="mt-4 text-xl font-bold text-vital-gold">{c.contract_code}</p>
                      <p className="mt-1 text-base text-white">{c.member_name}</p>
                      <p className="mt-1 text-sm text-white/60">{c.membership_type} · {Number(c.amount).toLocaleString()} EGP</p>
                    </div>
                  ))}
                </div>

                <div className="mt-10 flex flex-col justify-center gap-3 sm:flex-row">
                  <button type="button" onClick={onBack} className="rounded-full border border-white/10 bg-white/5 px-10 py-4 text-sm font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-white/10">
                    Back to New Contract
                  </button>
                  <button type="button" onClick={() => navigate('/sales/dashboard')} className="rounded-full bg-vital-gold px-10 py-4 text-sm font-semibold uppercase tracking-[0.2em] text-black transition hover:shadow-glow">
                    Go to Dashboard
                  </button>
                </div>
              </div>
            )}

          </div>
        </main>
      </div>
    </div>
  );
}
