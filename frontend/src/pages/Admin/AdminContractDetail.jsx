import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/api';

const API_BASE = import.meta.env.VITE_API_BASE_URL?.replace(/\/api$/, '') || 'http://localhost:8000';

function resolveReceiptUrl(url) {
  if (!url) return null;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return API_BASE + url;
}

export default function AdminContractDetail() {
  const { contractId } = useParams();
  const navigate = useNavigate();
  const [contract, setContract] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get(`/admin/contracts/${contractId}`)
      .then((res) => setContract(res.data))
      .catch(() => setError('Failed to load contract details.'))
      .finally(() => setLoading(false));
  }, [contractId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-white/60">Loading contract...</p>
      </div>
    );
  }

  if (error || !contract) {
    return (
      <div className="space-y-6">
        <div className="rounded-[32px] border border-red-500/30 bg-red-500/10 p-8 text-center">
          <p className="text-red-300">{error || 'Contract not found.'}</p>
          <button onClick={() => navigate('/admin/contracts')} className="mt-4 rounded-3xl border border-white/10 bg-white/5 px-6 py-3 text-sm text-white transition hover:bg-white/10">
            Back to Contracts
          </button>
        </div>
      </div>
    );
  }

  const payment = contract.payments?.[0];
  const member = contract.member;
  const agent = contract.salesAgent;

  return (
    <div className="space-y-8">
      <div className="rounded-[32px] border border-white/10 bg-[#111318]/80 p-8 shadow-glow backdrop-blur-xl">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.35em] text-vital-gold/80">Contract details</p>
            <h1 className="mt-3 text-4xl font-black text-white">{contract.contract_code}</h1>
            <p className="mt-3 text-sm text-white/70">Review full contract information, member details, and payment receipt.</p>
          </div>
          <button
            onClick={() => navigate('/admin/contracts')}
            className="rounded-3xl border border-white/10 bg-white/5 px-6 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-white/10"
          >
            Back to Contracts
          </button>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <div className="space-y-6">
          <div className="rounded-[32px] border border-white/10 bg-[#111318]/80 p-6 shadow-glow">
            <p className="text-sm uppercase tracking-[0.3em] text-vital-gold/70">Member information</p>
            <div className="mt-6 space-y-4">
              <div className="flex justify-between rounded-3xl bg-[#0c0e13] px-5 py-4">
                <span className="text-white/60">Name</span>
                <span className="font-semibold text-white">{member?.full_name || 'N/A'}</span>
              </div>
              <div className="flex justify-between rounded-3xl bg-[#0c0e13] px-5 py-4">
                <span className="text-white/60">Email</span>
                <span className="font-semibold text-white">{member?.email || 'N/A'}</span>
              </div>
              <div className="flex justify-between rounded-3xl bg-[#0c0e13] px-5 py-4">
                <span className="text-white/60">Phone</span>
                <span className="font-semibold text-white">{member?.phone || 'N/A'}</span>
              </div>
              <div className="flex justify-between rounded-3xl bg-[#0c0e13] px-5 py-4">
                <span className="text-white/60">Birth Date</span>
                <span className="font-semibold text-white">{member?.birth_date || 'N/A'}</span>
              </div>
            </div>
          </div>

          <div className="rounded-[32px] border border-white/10 bg-[#111318]/80 p-6 shadow-glow">
            <p className="text-sm uppercase tracking-[0.3em] text-vital-gold/70">Contract details</p>
            <div className="mt-6 space-y-4">
              <div className="flex justify-between rounded-3xl bg-[#0c0e13] px-5 py-4">
                <span className="text-white/60">Plan</span>
                <span className="font-semibold text-white">{contract.membership_type}</span>
              </div>
              <div className="flex justify-between rounded-3xl bg-[#0c0e13] px-5 py-4">
                <span className="text-white/60">Amount</span>
                <span className="font-semibold text-white">₦{Number(contract.amount).toLocaleString()}</span>
              </div>
              <div className="flex justify-between rounded-3xl bg-[#0c0e13] px-5 py-4">
                <span className="text-white/60">Start Date</span>
                <span className="font-semibold text-white">{contract.start_date}</span>
              </div>
              <div className="flex justify-between rounded-3xl bg-[#0c0e13] px-5 py-4">
                <span className="text-white/60">End Date</span>
                <span className="font-semibold text-white">{contract.end_date}</span>
              </div>
              <div className="flex justify-between rounded-3xl bg-[#0c0e13] px-5 py-4">
                <span className="text-white/60">Payment Method</span>
                <span className="font-semibold text-white">{contract.payment_method}</span>
              </div>
              <div className="flex justify-between rounded-3xl bg-[#0c0e13] px-5 py-4">
                <span className="text-white/60">Status</span>
                <span className={`font-semibold uppercase ${contract.status === 'approved' ? 'text-emerald-400' : contract.status === 'rejected' ? 'text-red-400' : 'text-vital-gold'}`}>{contract.status}</span>
              </div>
              <div className="flex justify-between rounded-3xl bg-[#0c0e13] px-5 py-4">
                <span className="text-white/60">Financial Status</span>
                <span className="font-semibold text-white">{contract.financial_status}</span>
              </div>
              {contract.review_message && (
                <div className="rounded-3xl bg-[#0c0e13] px-5 py-4">
                  <span className="text-white/60">Review Message</span>
                  <p className="mt-2 text-white">{contract.review_message}</p>
                </div>
              )}
            </div>
          </div>

          <div className="rounded-[32px] border border-white/10 bg-[#111318]/80 p-6 shadow-glow">
            <p className="text-sm uppercase tracking-[0.3em] text-vital-gold/70">Sales agent</p>
            <div className="mt-6 space-y-4">
              <div className="flex justify-between rounded-3xl bg-[#0c0e13] px-5 py-4">
                <span className="text-white/60">Name</span>
                <span className="font-semibold text-white">{agent?.full_name || 'N/A'}</span>
              </div>
              <div className="flex justify-between rounded-3xl bg-[#0c0e13] px-5 py-4">
                <span className="text-white/60">Email</span>
                <span className="font-semibold text-white">{agent?.email || 'N/A'}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-[32px] border border-white/10 bg-[#111318]/80 p-6 shadow-glow">
            <p className="text-sm uppercase tracking-[0.3em] text-vital-gold/70">Payment receipt</p>
            {payment?.receipt_url ? (
              <div className="mt-6">
                <img
                  src={resolveReceiptUrl(payment.receipt_url)}
                  alt="Payment Receipt"
                  className="w-full rounded-3xl border border-white/10 object-contain"
                  onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                />
                <div className="mt-4 hidden rounded-3xl border border-dashed border-red-500/30 bg-red-500/5 p-10 text-center text-sm text-red-300">
                  Receipt image could not be loaded. The file may have been removed.
                </div>
                <div className="mt-4 rounded-3xl bg-[#0c0e13] p-4 text-sm">
                  <a
                    href={resolveReceiptUrl(payment.receipt_url)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-vital-gold underline hover:text-white"
                  >
                    Open receipt in new tab →
                  </a>
                </div>
              </div>
            ) : (
              <div className="mt-6 rounded-3xl border border-dashed border-white/10 p-10 text-center text-sm text-white/60">
                {contract.payment_method === 'Cash'
                  ? 'Cash payment — no receipt uploaded.'
                  : 'No receipt attached to this contract.'}
              </div>
            )}
          </div>

          {contract.renewal_type === 'renewal' && (
            <div className="rounded-[32px] border border-vital-gold/20 bg-vital-gold/5 p-6 shadow-glow">
              <p className="text-sm uppercase tracking-[0.35em] text-vital-gold/70">Renewal</p>
              <p className="mt-3 text-white">This is a renewal contract.</p>
              {contract.previous_contract_id && (
                <p className="mt-2 text-sm text-white/60">Previous Contract ID: #{contract.previous_contract_id}</p>
              )}
            </div>
          )}

          <div className="rounded-[32px] border border-white/10 bg-[#111318]/80 p-6 shadow-glow">
            <p className="text-sm uppercase tracking-[0.35em] text-vital-gold/70">ID Verification</p>
            {contract.id_verification_path ? (
              <div className="mt-6">
                <img
                  src={resolveReceiptUrl(contract.id_verification_path)}
                  alt="ID Verification"
                  className="w-full rounded-3xl border border-white/10 object-contain"
                  onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                />
                <div className="mt-4 hidden rounded-3xl border border-dashed border-red-500/30 bg-red-500/5 p-10 text-center text-sm text-red-300">
                  ID image could not be loaded. The file may have been removed.
                </div>
                <div className="mt-4 rounded-3xl bg-[#0c0e13] p-4 text-sm">
                  <a
                    href={resolveReceiptUrl(contract.id_verification_path)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-vital-gold underline hover:text-white"
                  >
                    Open ID image in new tab →
                  </a>
                </div>
              </div>
            ) : (
              <div className="mt-6 rounded-3xl border border-dashed border-white/10 p-10 text-center text-sm text-white/60">
                No ID verification uploaded.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
