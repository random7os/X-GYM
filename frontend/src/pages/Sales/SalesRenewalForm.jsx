import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/api';

const QR_API = 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=';

const PLANS = {
  'Standard':       { days: 30,  price: 6000 },
  'Standard Plus': { days: 90,  price: 12000 },
  'Premium':        { days: 180, price: 17000 },
  'Elite':          { days: 365, price: 22500 },
};
const membershipPlans = Object.keys(PLANS);
const ptPackages = ['No PT Package', '4 Sessions - 1500 EGP', '8 Sessions - 2000 EGP', '12 Sessions - 3000 EGP', '16 Sessions - 3400 EGP', '20 Sessions - 4500 EGP', '24 Sessions - 5200 EGP'];
const paymentMethods = ['Instapay', 'Vodafone Cash', 'Visa', 'Cash'];
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

export default function SalesRenewalForm() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [searchPhone, setSearchPhone] = useState('');
  const [members, setMembers] = useState([]);
  const [selectedMember, setSelectedMember] = useState(null);
  const [searchError, setSearchError] = useState('');
  const [searching, setSearching] = useState(false);
  const [form, setForm] = useState({
    membership_plan: '',
    start_date: '',
    end_date: '',
    pt_package: 'No PT Package',
    payment_method: 'Instapay',
    amount: '15000',
    receipt: null,
  });
  const [qrToken, setQrToken] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [contractCode, setContractCode] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [discountCode, setDiscountCode] = useState('');
  const [discountInfo, setDiscountInfo] = useState(null);
  const [discountLoading, setDiscountLoading] = useState(false);
  const [discountError, setDiscountError] = useState('');

  async function handleSearch(q) {
    setSearchPhone(q);
    if (q.length < 2) { setMembers([]); setSearchError(''); return; }
    setSearchError('');
    setSearching(true);
    setSelectedMember(null);
    try {
      const res = await api.get('/sales/members/search', { params: { phone: q } });
      setMembers(res.data.members || []);
      if (!res.data.members?.length) {
        setSearchError('No members found with that phone number.');
      }
    } catch {
      setSearchError('Search failed. Try again.');
    }
    setSearching(false);
  }

  function selectMember(member) {
    setSelectedMember(member);
    const lastContract = member.contracts?.[0];
    setForm({
      membership_plan: lastContract?.membership_type || '',
      start_date: '',
      end_date: '',
      pt_package: 'No PT Package',
      payment_method: lastContract?.payment_method || 'Instapay',
      amount: String(lastContract?.amount || '15000'),
      receipt: null,
    });
    setError('');
    setStep(2);
  }

  function handleInputChange(field, value) {
    setForm((prev) => {
      const next = { ...prev, [field]: value };
      const planName = field === 'membership_plan' ? value : prev.membership_plan;
      const plan = PLANS[planName];
      if (!plan) return next;

      next.amount = String(plan.price);

      const dateSource = field === 'start_date' ? value : prev.start_date;
      if (dateSource) {
        const start = new Date(dateSource);
        if (!isNaN(start.getTime())) {
          const end = new Date(start);
          end.setDate(end.getDate() + plan.days);
          next.end_date = end.toISOString().split('T')[0];
        }
      }

      return next;
    });
  }

  const originalAmount = form.membership_plan ? PLANS[form.membership_plan]?.price : 0;
  const discountedAmount = discountInfo
    ? Math.round(originalAmount - (originalAmount * discountInfo.percentage) / 100)
    : originalAmount;

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

  function goBack() {
    if (step === 2) {
      setSelectedMember(null);
      setStep(1);
    }
  }

  async function handleSubmit() {
    if (!form.payment_method || !form.amount) {
      setError('Choose a payment method and enter the amount.');
      return;
    }
    if (form.payment_method !== 'Cash' && !form.receipt) {
      setError('Upload a receipt for non-cash payments.');
      return;
    }

    setError('');
    setIsSubmitting(true);

    const finalAmount = discountInfo ? discountedAmount : Number(form.amount);
    const formData = new FormData();
    formData.append('member_id', String(selectedMember.id));
    formData.append('member_name', selectedMember.full_name);
    formData.append('member_email', selectedMember.email || '');
    formData.append('member_phone', selectedMember.phone || '');
    formData.append('member_birthdate', selectedMember.birth_date || '');
    formData.append('membership_type', form.membership_plan);
    formData.append('start_date', form.start_date);
    formData.append('end_date', form.end_date);
    formData.append('pt_package_id', ptPackageMap[form.pt_package] ?? '');
    formData.append('payment_method', form.payment_method);
    formData.append('amount', finalAmount);
    formData.append('renewal_type', 'renewal');
    if (selectedMember.contracts?.[0]?.id) {
      formData.append('previous_contract_id', String(selectedMember.contracts[0].id));
    }
    if (form.receipt) {
      formData.append('receipt', form.receipt);
    }
    if (discountInfo) {
      formData.append('discount_code_id', discountInfo.id);
    }

    try {
      const response = await api.post('/sales/contracts', formData);
      const code = response.data.contract?.contract_code || '';
      setContractCode(code);
      const contractId = response.data.contract?.id;
      if (contractId) {
        api.get('/sales/contracts/' + contractId + '/qr').then((qrRes) => {
          setQrToken(qrRes.data.qr_code_token || '');
        }).catch(() => {});
      }
      setSubmitted(true);
      setStep(3);
    } catch (err) {
      if (err.response?.status === 422 && err.response?.data?.errors) {
        const first = Object.values(err.response.data.errors)[0]?.[0];
        setError(first || err.response.data.message);
      } else if (err.response?.status === 401) {
        setError('Session expired. Please log in again.');
      } else {
        setError(err.response?.data?.message || 'Failed to submit renewal.');
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  function resetForm() {
    setStep(1);
    setSearchPhone('');
    setMembers([]);
    setSelectedMember(null);
    setContractCode('');
    setQrToken('');
    setError('');
    setSubmitted(false);
    setDiscountCode('');
    setDiscountInfo(null);
    setDiscountError('');
    setForm({
      membership_plan: '',
      start_date: '',
      end_date: '',
      pt_package: 'No PT Package',
      payment_method: 'Instapay',
      amount: '15000',
      receipt: null,
    });
  }

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
              <button onClick={() => navigate('/sales/dashboard')} className="flex w-full items-center gap-3 rounded-3xl border border-white/10 bg-white/5 px-4 py-4 text-left text-sm font-semibold text-white transition hover:border-vital-gold/60 hover:text-vital-gold">
                <span>📊</span> Dashboard
              </button>
              <button onClick={() => navigate('/sales/contracts')} className="flex w-full items-center gap-3 rounded-3xl border border-white/10 bg-white/5 px-4 py-4 text-left text-sm font-semibold text-white transition hover:border-vital-gold/60 hover:text-vital-gold">
                <span>📋</span> Contracts
              </button>
              <button className="flex w-full items-center gap-3 rounded-3xl border border-vital-gold bg-vital-gold/10 px-4 py-4 text-left text-sm font-semibold text-vital-gold shadow-sm shadow-vital-gold/10">
                <span>🔄</span> Renewal
              </button>
              <button onClick={() => navigate('/sales/profile')} className="flex w-full items-center gap-3 rounded-3xl border border-white/10 bg-white/5 px-4 py-4 text-left text-sm font-semibold text-white transition hover:border-vital-gold/60 hover:text-vital-gold">
                <span>👤</span> Profile
              </button>
            </nav>
          </div>
        </aside>

        <main className="px-6 py-8">
          <div className="mx-auto max-w-[930px] space-y-6">
            <div className="space-y-3">
              <p className="text-sm uppercase tracking-[0.35em] text-[#f4de52]/80">Membership Renewal</p>
              <h1 className="text-5xl font-black text-white">Find existing member and create a renewal contract.</h1>
            </div>

            <div className="rounded-[32px] border border-white/10 bg-[#061d3c]/80 p-6 shadow-glow">
              <div className="grid gap-6 sm:grid-cols-3">
                <StepCircle number="1" title="Search" active={step === 1} completed={step > 1} />
                <StepCircle number="2" title="Contract" active={step === 2} completed={step > 2} />
                <StepCircle number="3" title="Complete" active={step === 3} completed={submitted} />
              </div>
            </div>

            {step === 1 && (
              <div className="rounded-[32px] border border-white/10 bg-[#061d3c]/80 p-8 shadow-glow">
                <p className="text-sm uppercase tracking-[0.35em] text-white/50">Search by phone number</p>
                <input
                  type="text"
                  value={searchPhone}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="mt-4 w-full rounded-[28px] border border-white/10 bg-[#0b1933] px-5 py-4 text-white outline-none transition focus:border-vital-gold/50"
                  placeholder="Enter phone number (e.g. 01...)"
                />
                {searchError && <p className="mt-4 rounded-3xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">{searchError}</p>}

                {members.length > 0 && (
                  <div className="mt-6 space-y-4">
                    <p className="text-sm uppercase tracking-[0.35em] text-white/50">Select a member</p>
                    {members.map((member) => (
                      <button
                        key={member.id}
                        onClick={() => selectMember(member)}
                        className="w-full rounded-3xl border border-white/10 bg-[#0b2346] p-5 text-left transition hover:border-vital-gold/50"
                      >
                        <p className="text-lg font-semibold text-white">{member.full_name}</p>
                        <p className="mt-1 text-sm text-white/60">
                          {member.phone} · {member.email} · {member.membership_level || 'No plan'}
                        </p>
                        {member.contracts?.[0] && (
                          <p className="mt-1 text-sm text-vital-gold">
                            Last contract: {member.contracts[0].contract_code} · {member.contracts[0].membership_type} · {member.contracts[0].status}
                          </p>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {step === 2 && (
              <div className="rounded-[32px] border border-white/10 bg-[#061d3c]/80 p-8 shadow-glow">
                {selectedMember && (
                  <div className="rounded-3xl border border-vital-gold/20 bg-vital-gold/5 px-6 py-4">
                    <p className="text-xs uppercase tracking-[0.35em] text-vital-gold/70">Renewing for</p>
                    <p className="mt-2 text-xl font-bold text-white">{selectedMember.full_name}</p>
                    <p className="mt-1 text-sm text-white/60">{selectedMember.phone} · {selectedMember.email}</p>
                  </div>
                )}

                <div className="mt-8 grid gap-6 lg:grid-cols-2">
                  <div className="space-y-3">
                    <p className="text-xs uppercase tracking-[0.35em] text-white/50">Membership Plan</p>
                    <select
                      value={form.membership_plan}
                      onChange={(e) => handleInputChange('membership_plan', e.target.value)}
                      className="w-full rounded-[28px] border border-white/10 bg-[#0b1933] px-5 py-4 text-white outline-none transition focus:border-vital-gold/50"
                    >
                      <option value="">Select Plan...</option>
                      {membershipPlans.map((name) => (
                        <option key={name} value={name}>{name} — {PLANS[name].days} days • {Number(PLANS[name].price).toLocaleString()} EGP</option>
                      ))}
                    </select>
                    {form.membership_plan && (
                      <p className="text-sm text-vital-gold">
                        {(PLANS[form.membership_plan]?.days ?? 0) + ' days'} · {Number(PLANS[form.membership_plan]?.price ?? 0).toLocaleString()} EGP
                      </p>
                    )}
                  </div>
                  <SelectField label="PT Package" value={form.pt_package} onChange={(v) => handleInputChange('pt_package', v)} options={ptPackages} placeholder="No PT Package" />
                </div>

                <div className="mt-6 grid gap-6 lg:grid-cols-2">
                  <Field label="Start Date" type="date" value={form.start_date} onChange={(v) => handleInputChange('start_date', v)} />
                  <Field label="End Date" type="date" value={form.end_date} onChange={(v) => handleInputChange('end_date', v)} />
                </div>

                <div className="mt-6 rounded-3xl border border-vital-gold/20 bg-vital-gold/5 px-6 py-4">
                  <div className="grid gap-4 sm:grid-cols-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.35em] text-vital-gold/70">Plan</p>
                      <p className="mt-1 text-lg font-bold text-white">{form.membership_plan}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.35em] text-vital-gold/70">Duration</p>
                      <p className="mt-1 text-lg font-bold text-white">{PLANS[form.membership_plan]?.days ?? 0} days</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.35em] text-vital-gold/70">Period</p>
                      <p className="mt-1 text-lg font-bold text-white">{form.start_date} → {form.end_date}</p>
                    </div>
                  </div>
                </div>
                <div className="mt-8">
                  <p className="text-sm uppercase tracking-[0.35em] text-white/50">Payment</p>
                  <div className="mt-4 grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
                    <div className="space-y-4">
                      <p className="text-sm text-white/70">Amount Due</p>
                      {discountInfo ? (
                        <div>
                          <p className="text-lg text-white/60 line-through">{Number(originalAmount).toLocaleString()} EGP</p>
                          <p className="text-5xl font-black text-[#f4de52]">{Number(discountedAmount).toLocaleString()} EGP</p>
                          <p className="mt-1 text-sm text-emerald-400">{discountInfo.percentage}% off · {discountInfo.name}</p>
                        </div>
                      ) : (
                        <p className="text-5xl font-black text-[#f4de52]">{Number(form.amount).toLocaleString()} EGP</p>
                      )}
                      <div className="mt-4 rounded-3xl border border-dashed border-white/10 bg-[#0b2346] p-4">
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
                            Remove discount
                          </button>
                        )}
                      </div>
                      <div className="mt-4 grid gap-3 sm:grid-cols-3">
                        {paymentMethods.map((method) => (
                          <button
                            key={method}
                            onClick={() => handleInputChange('payment_method', method)}
                            className={`rounded-3xl border px-4 py-3 text-sm font-semibold transition ${form.payment_method === method ? 'border-vital-gold bg-vital-gold/10 text-vital-gold' : 'border-white/10 bg-[#071b34] text-white/70 hover:border-white/20 hover:text-white'}`}
                          >
                            {method}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="rounded-3xl border border-white/10 bg-[#0b2346] p-6">
                      <p className="text-sm uppercase tracking-[0.35em] text-white/50">
                        {form.payment_method === 'Cash' ? 'Cash payment' : 'Upload receipt'}
                      </p>
                      {form.payment_method === 'Cash' ? (
                        <div className="mt-6 rounded-[28px] border border-white/10 bg-[#081a31] p-10 text-center">
                          <p className="text-sm text-white/70">Cash payments are marked upon collection.</p>
                        </div>
                      ) : (
                        <div className="mt-6 rounded-[28px] border border-dashed border-white/20 bg-[#081a31] p-10 text-center">
                          <p className="text-sm font-semibold text-white">Upload receipt</p>
                          <p className="mt-2 text-sm text-white/50">PNG, JPG up to 5MB</p>
                          <input
                            type="file"
                            accept="image/png,image/jpeg"
                            onChange={(e) => handleInputChange('receipt', e.target.files?.[0] || null)}
                            className="mt-6 w-full cursor-pointer rounded-3xl border border-white/10 bg-[#0c203f] px-4 py-3 text-sm text-white outline-none"
                          />
                          {form.receipt && <p className="mt-4 text-sm text-white/70">Selected: {form.receipt.name}</p>}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {error && <p className="mt-6 rounded-3xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</p>}

                <div className="mt-8 flex items-center justify-between">
                  <button onClick={goBack} className="rounded-full border border-white/10 bg-white/5 px-6 py-3 text-sm text-white transition hover:bg-white/10">
                    Back
                  </button>
                  <button onClick={handleSubmit} disabled={isSubmitting} className="rounded-full bg-vital-gold px-8 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-black transition hover:shadow-glow disabled:cursor-not-allowed disabled:opacity-70">
                    {isSubmitting ? 'Submitting...' : 'Submit Renewal'}
                  </button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="rounded-[32px] border border-white/10 bg-[#061d3c]/80 p-10 shadow-glow text-center">
                <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-[#0c3d2a] text-4xl text-vital-gold">✓</div>
                <h2 className="text-4xl font-black text-white">Renewal Submitted!</h2>
                <div className="mx-auto mt-4 inline-block rounded-full bg-vital-gold/15 px-6 py-2 text-sm font-semibold uppercase tracking-[0.2em] text-vital-gold">Under Review</div>
                <p className="mt-4 text-sm text-white/70">Renewal contract {contractCode} is pending admin review.</p>
                <div className="mx-auto mt-10 max-w-sm rounded-[32px] border border-white/10 bg-[#0b2346] p-8">
                  {qrToken ? (
                    <img src={QR_API + encodeURIComponent(window.location.origin + '/qr/verify/' + qrToken)} alt="QR" className="mx-auto h-56 w-56 rounded-[28px] bg-white p-2" />
                  ) : (
                    <div className="mx-auto flex h-56 w-56 items-center justify-center rounded-[28px] bg-black/50 text-white/30 text-sm">QR unavailable</div>
                  )}
                  <p className="mt-6 text-sm uppercase tracking-[0.35em] text-white/50">Member QR Code</p>
                  <p className="mt-2 text-white/70">Scan for access control (Activates upon approval)</p>
                </div>
                <div className="mt-10 flex flex-col justify-center gap-3 sm:flex-row">
                  <button onClick={() => navigate('/sales/dashboard')} className="rounded-full border border-white/10 bg-white/5 px-10 py-4 text-sm font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-white/10">
                    Dashboard
                  </button>
                  <button onClick={resetForm} className="rounded-full bg-vital-gold px-10 py-4 text-sm font-semibold uppercase tracking-[0.2em] text-black transition hover:shadow-glow">
                    + Another Renewal
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

function StepCircle({ number, title, active, completed }) {
  return (
    <div className="flex items-center gap-3">
      <div className={`flex h-14 w-14 items-center justify-center rounded-full border ${active || completed ? 'border-vital-gold bg-vital-gold/15 text-vital-gold' : 'border-white/10 bg-[#03111f] text-white/40'}`}>
        {completed ? '✓' : number}
      </div>
      <div>
        <p className={`text-xs uppercase tracking-[0.35em] ${active ? 'text-vital-gold' : 'text-white/50'}`}>{title}</p>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, placeholder, type = 'text' }) {
  return (
    <div className="space-y-3">
      <p className="text-xs uppercase tracking-[0.35em] text-white/50">{label}</p>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        className="w-full rounded-[28px] border border-white/10 bg-[#0b1933] px-5 py-4 text-white outline-none transition focus:border-vital-gold/50" />
    </div>
  );
}

function SelectField({ label, value, onChange, options, placeholder }) {
  return (
    <div className="space-y-3">
      <p className="text-xs uppercase tracking-[0.35em] text-white/50">{label}</p>
      <select value={value} onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-[28px] border border-white/10 bg-[#0b1933] px-5 py-4 text-white outline-none transition focus:border-vital-gold/50">
        <option value="">{placeholder}</option>
        {options.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
      </select>
    </div>
  );
}
