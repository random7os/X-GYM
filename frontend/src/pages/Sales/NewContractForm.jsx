import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/api';
import MultiContractFlow from './MultiContractFlow';

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

export default function NewContractForm() {
  const navigate = useNavigate();
  const [mode, setMode] = useState('single');
  const [step, setStep] = useState(1);
  const [contractCode, setContractCode] = useState('');
  const [form, setForm] = useState({
    full_name: '',
    email: '',
    phone: '',
    birth_date: '',
    membership_plan: '',
    start_date: '',
    end_date: '',
    pt_package: 'No PT Package',
    payment_method: 'Instapay',
    amount: '15000',
    receipt: null,
    idVerification: null,
  });
  const [qrToken, setQrToken] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [discountCode, setDiscountCode] = useState('');
  const [discountInfo, setDiscountInfo] = useState(null);
  const [discountLoading, setDiscountLoading] = useState(false);
  const [discountError, setDiscountError] = useState('');

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
    if (!discountCode.trim()) {
      setDiscountError('Enter a discount code.');
      return;
    }
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

  function nextStep() {
    if (step === 1) {
      if (!form.full_name || !form.email || !form.phone || !form.birth_date || !form.membership_plan || !form.start_date || !form.end_date) {
        setError('Please complete the member details and membership dates before continuing.');
        return;
      }
      setError('');
      setStep(2);
      return;
    }

    if (step === 2) {
      if (!form.payment_method || !form.amount) {
        setError('Please choose a payment method and enter the amount before submitting.');
        return;
      }
      if (form.payment_method !== 'Cash' && !form.receipt) {
        setError('Please upload a receipt for non-cash payments.');
        return;
      }
      if (!form.idVerification) {
        setError('Please upload the member ID verification photo.');
        return;
      }

      setError('');
      setIsSubmitting(true);

      const finalAmount = discountInfo ? discountedAmount : Number(form.amount);
      const formData = new FormData();
      formData.append('member_name', form.full_name);
      formData.append('member_email', form.email);
      formData.append('member_phone', form.phone);
      formData.append('member_birthdate', form.birth_date);
      formData.append('membership_type', form.membership_plan);
      formData.append('start_date', form.start_date);
      formData.append('end_date', form.end_date);
      formData.append('pt_package_id', ptPackageMap[form.pt_package] ?? '');
      formData.append('payment_method', form.payment_method);
      formData.append('amount', finalAmount);
      if (form.receipt) {
        formData.append('receipt', form.receipt);
      }
      if (form.idVerification) {
        formData.append('id_verification', form.idVerification);
      }
      if (discountInfo) {
        formData.append('discount_code_id', discountInfo.id);
      }
      formData.append('contract_type', 'regular');

      api.post('/sales/contracts', formData)
        .then((response) => {
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
        })
        .catch((err) => {
          if (err.response?.status === 422 && err.response?.data?.errors) {
            const first = Object.values(err.response.data.errors)[0]?.[0];
            setError(first || err.response.data.message);
          } else if (err.response?.status === 401) {
            setError('Session expired. Please log in again.');
          } else {
            setError(err.response?.data?.message || 'Failed to submit contract. Please try again.');
          }
        })
        .finally(() => {
          setIsSubmitting(false);
        });
    }
  }

  function prevStep() {
    if (step > 1) {
      setStep(step - 1);
    }
  }

  function resetForm() {
    setSubmitted(false);
    setStep(1);
    setForm({
      full_name: '',
      email: '',
      phone: '',
      birth_date: '',
      membership_plan: '',
      start_date: '',
      end_date: '',
      pt_package: 'No PT Package',
      payment_method: 'Instapay',
      amount: '15000',
      receipt: null,
      idVerification: null,
    });
    setContractCode('');
    setQrToken('');
    setError('');
    setDiscountCode('');
    setDiscountInfo(null);
    setDiscountError('');
  }

  return mode !== 'single' ? (
    <MultiContractFlow type={mode} onBack={() => setMode('single')} />
  ) : (
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
              <button
                type="button"
                onClick={() => navigate('/sales/dashboard')}
                className="flex w-full items-center gap-3 rounded-3xl border border-white/10 bg-white/5 px-4 py-4 text-left text-sm font-semibold text-white transition hover:border-vital-gold/60 hover:text-vital-gold"
              >
                <span>📊</span>
                Dashboard
              </button>
              <button className="flex w-full items-center gap-3 rounded-3xl border border-vital-gold bg-vital-gold/10 px-4 py-4 text-left text-sm font-semibold text-vital-gold shadow-sm shadow-vital-gold/10">
                <span>📝</span>
                New Contract
              </button>
              <button
                type="button"
                onClick={() => navigate('/sales/profile')}
                className="flex w-full items-center gap-3 rounded-3xl border border-white/10 bg-white/5 px-4 py-4 text-left text-sm font-semibold text-white transition hover:border-vital-gold/60 hover:text-vital-gold"
              >
                <span>👤</span>
                Profile
              </button>
            </nav>
          </div>

          <div className="mt-auto rounded-3xl border border-white/10 bg-[#091b3a] p-5 text-sm text-white/70">
            <p className="font-semibold text-white">Sales Agent</p>
            <p className="mt-1">Create contracts and manage payments.</p>
            <button
              type="button"
              onClick={() => navigate('/sales/login')}
              className="mt-5 w-full rounded-3xl border border-white/10 bg-white/5 px-4 py-3 text-left text-sm text-white transition hover:bg-white/10"
            >
              Logout
            </button>
          </div>
        </aside>

        <main className="px-6 py-8">
          <div className="mx-auto max-w-[930px] space-y-6">
            <div className="space-y-3">
              <p className="text-sm uppercase tracking-[0.35em] text-[#f4de52]/80">New Contract</p>
              <h1 className="text-5xl font-black text-white">Create membership and upload payment proof.</h1>
            </div>

            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => setMode('referral')}
                className="flex-1 rounded-[32px] border border-white/10 bg-[#061d3c]/80 p-6 shadow-glow text-left transition hover:border-vital-gold/50"
              >
                <p className="text-2xl font-bold text-white">👥 Referral</p>
                <p className="mt-2 text-xs text-white/60">Create contracts for client + friends with referral plan.</p>
              </button>
              <button
                type="button"
                onClick={() => setMode('family')}
                className="flex-1 rounded-[32px] border border-white/10 bg-[#061d3c]/80 p-6 shadow-glow text-left transition hover:border-vital-gold/50"
              >
                <p className="text-2xl font-bold text-white">👨‍👩‍👧‍👦 Family</p>
                <p className="mt-2 text-xs text-white/60">Create contracts for client + family members.</p>
              </button>
            </div>

            <div className="rounded-[32px] border border-white/10 bg-[#061d3c]/80 p-6 shadow-glow">
              <div className="grid gap-6 sm:grid-cols-3">
                <StepCircle number="1" title="Details" active={step === 1} completed={step > 1} />
                <StepCircle number="2" title="Payment" active={step === 2} completed={step > 2} />
                <StepCircle number="3" title="Complete" active={step === 3} completed={submitted} />
              </div>
            </div>

            {step === 1 && (
              <div className="rounded-[32px] border border-white/10 bg-[#061d3c]/80 p-8 shadow-glow">
                <div className="grid gap-6 lg:grid-cols-2">
                  <Field label="Full Name" value={form.full_name} onChange={(value) => handleInputChange('full_name', value)} placeholder="Client name" />
                  <Field label="Email" type="email" value={form.email} onChange={(value) => handleInputChange('email', value)} placeholder="client@email.com" />
                </div>

                <div className="mt-6 grid gap-6 lg:grid-cols-2">
                  <Field label="Phone Number" value={form.phone} onChange={(value) => handleInputChange('phone', value)} placeholder="01..." />
                  <Field label="Birth Date" type="date" value={form.birth_date} onChange={(value) => handleInputChange('birth_date', value)} placeholder="" />
                </div>

                <div className="mt-6 grid gap-6 lg:grid-cols-2">
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
                  <SelectField
                    label="Add Private Training (PT)"
                    value={form.pt_package}
                    onChange={(value) => handleInputChange('pt_package', value)}
                    options={ptPackages}
                    placeholder="No PT Package"
                  />
                </div>

                <div className="mt-6 grid gap-6 lg:grid-cols-2">
                  <Field label="Start Date" type="date" value={form.start_date} onChange={(value) => handleInputChange('start_date', value)} placeholder="" />
                  <Field label="End Date" type="date" value={form.end_date} onChange={(value) => handleInputChange('end_date', value)} placeholder="" />
                </div>

                {error && <p className="mt-6 rounded-3xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</p>}

                <div className="mt-8 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => navigate('/sales/dashboard')}
                    className="rounded-full border border-white/10 bg-white/5 px-6 py-3 text-sm text-white transition hover:bg-white/10"
                  >
                    Back to Dashboard
                  </button>
                  <button
                    type="button"
                    onClick={nextStep}
                    className="rounded-full bg-vital-gold px-8 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-black transition hover:shadow-glow"
                  >
                    Next: Payment Details
                  </button>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="rounded-[32px] border border-white/10 bg-[#061d3c]/80 p-8 shadow-glow">
                <div className="mb-6 rounded-3xl border border-vital-gold/20 bg-vital-gold/5 px-6 py-4">
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

                <div className="mb-6 rounded-3xl border border-dashed border-white/20 bg-[#081a31] p-6">
                  <p className="text-sm uppercase tracking-[0.35em] text-white/50">ID Verification (Required)</p>
                  <p className="mt-2 text-sm text-white/50">Upload a photo of the member ID card for verification</p>
                  <input
                    type="file"
                    accept="image/png,image/jpeg"
                    onChange={(e) => handleInputChange('idVerification', e.target.files?.[0] || null)}
                    className="mt-4 w-full cursor-pointer rounded-3xl border border-white/10 bg-[#0c203f] px-4 py-3 text-sm text-white outline-none"
                  />
                  {form.idVerification && <p className="mt-2 text-sm text-white/70">Selected: {form.idVerification.name}</p>}
                </div>

                <div className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
                  <div>
                    <p className="text-sm uppercase tracking-[0.35em] text-white/50">Total Amount Due</p>
                    <div className="mt-4 rounded-3xl border border-white/10 bg-[#0b2346] p-6">
                      {discountInfo ? (
                        <div>
                          <p className="text-lg text-white/60 line-through">{Number(originalAmount).toLocaleString()} EGP</p>
                          <p className="mt-1 text-5xl font-black text-[#f4de52]">{Number(discountedAmount).toLocaleString()} EGP</p>
                          <p className="mt-2 text-sm text-emerald-400">{discountInfo.percentage}% off · {discountInfo.name}</p>
                        </div>
                      ) : (
                        <p className="text-5xl font-black text-[#f4de52]">{Number(form.amount).toLocaleString()} EGP</p>
                      )}
                    </div>
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
                    <div className="mt-6 grid gap-3 sm:grid-cols-3">
                      {paymentMethods.map((method) => (
                        <button
                          key={method}
                          type="button"
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
                      {form.payment_method === 'Cash' ? 'Payment method notes' : 'Upload proof of payment (mandatory)'}
                    </p>
                    {form.payment_method === 'Cash' ? (
                      <div className="mt-6 rounded-[28px] border border-white/10 bg-[#081a31] p-10 text-center">
                        <p className="text-sm text-white/70">Cash payments are marked upon collection. No receipt upload required.</p>
                      </div>
                    ) : (
                      <div className="mt-6 rounded-[28px] border border-dashed border-white/20 bg-[#081a31] p-10 text-center">
                        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white/5 text-[#f4de52]">
                          ⬆
                        </div>
                        <p className="text-sm font-semibold text-white">Upload a file</p>
                        <p className="mt-2 text-sm text-white/50">PNG, JPG up to 5MB</p>
                        <input
                          type="file"
                          accept="image/png,image/jpeg"
                          onChange={(e) => handleInputChange('receipt', e.target.files?.[0] || null)}
                          className="mt-6 w-full cursor-pointer rounded-3xl border border-white/10 bg-[#0c203f] px-4 py-3 text-sm text-white outline-none"
                        />
                        {form.receipt && <p className="mt-4 text-sm text-white/70">Selected file: {form.receipt.name}</p>}
                      </div>
                    )}
                  </div>
                </div>

                {error && <p className="mt-6 rounded-3xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</p>}

                <div className="mt-8 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={prevStep}
                    className="rounded-full border border-white/10 bg-white/5 px-6 py-3 text-sm text-white transition hover:bg-white/10"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={nextStep}
                    disabled={isSubmitting}
                    className="rounded-full bg-vital-gold px-8 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-black transition hover:shadow-glow disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {isSubmitting ? 'Submitting...' : 'Submit to Admin'}
                  </button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="rounded-[32px] border border-white/10 bg-[#061d3c]/80 p-10 shadow-glow text-center">
                <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-[#0c3d2a] text-4xl text-vital-gold">
                  ✓
                </div>
                <h2 className="text-4xl font-black text-white">Contract Submitted!</h2>
                <div className="mx-auto mt-4 inline-block rounded-full bg-vital-gold/15 px-6 py-2 text-sm font-semibold uppercase tracking-[0.2em] text-vital-gold">
                  Under Review
                </div>
                <p className="mt-4 text-sm text-white/70">Contract {contractCode || 'submitted'} is pending admin review and financial verification. You will be notified once it is approved or rejected.</p>
                <div className="mx-auto mt-10 max-w-sm rounded-[32px] border border-white/10 bg-[#0b2346] p-8">
                  {qrToken ? (
                    <img
                      src={QR_API + encodeURIComponent(window.location.origin + '/qr/verify/' + qrToken)}
                      alt="Member QR Code"
                      className="mx-auto h-56 w-56 rounded-[28px] bg-white p-2"
                    />
                  ) : (
                    <div className="mx-auto flex h-56 w-56 items-center justify-center rounded-[28px] bg-black/50 text-white/30 text-sm">
                      QR unavailable
                    </div>
                  )}
                  <p className="mt-6 text-sm uppercase tracking-[0.35em] text-white/50">Member QR Code</p>
                  <p className="mt-2 text-white/70">Scan for access control (Activates upon approval)</p>
                </div>
                <div className="mt-10 flex flex-col justify-center gap-3 sm:flex-row">
                  <button
                    type="button"
                    onClick={() => navigate('/sales/dashboard')}
                    className="rounded-full border border-white/10 bg-white/5 px-10 py-4 text-sm font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-white/10"
                  >
                    Return to Dashboard
                  </button>
                  <button
                    type="button"
                    onClick={resetForm}
                    className="rounded-full bg-vital-gold px-10 py-4 text-sm font-semibold uppercase tracking-[0.2em] text-black transition hover:shadow-glow"
                  >
                    + Create Another Contract
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
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-[28px] border border-white/10 bg-[#0b1933] px-5 py-4 text-white outline-none transition focus:border-vital-gold/50"
      />
    </div>
  );
}

function SelectField({ label, value, onChange, options, placeholder }) {
  return (
    <div className="space-y-3">
      <p className="text-xs uppercase tracking-[0.35em] text-white/50">{label}</p>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-[28px] border border-white/10 bg-[#0b1933] px-5 py-4 text-white outline-none transition focus:border-vital-gold/50"
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option} value={option}>{option}</option>
        ))}
      </select>
    </div>
  );
}
