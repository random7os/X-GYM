import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/api';
import GlassCard from '../../components/GlassCard';

export default function SalesContracts() {
  const [contracts, setContracts] = useState([]);

  useEffect(() => {
    api.get('/sales/contracts').then((response) => setContracts(response.data.contracts));
  }, []);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_right,_rgba(255,229,61,0.12),_transparent_45%),_linear-gradient(180deg,_#050608,_#090a0f)] px-6 py-8 text-white">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="rounded-[32px] border border-white/10 bg-[#111318]/80 p-8 shadow-glow backdrop-blur-xl">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.35em] text-vital-gold/80">Sales Contracts</p>
              <h1 className="mt-3 text-4xl font-black text-white">Your Contract Pipeline</h1>
              <p className="mt-3 max-w-2xl text-sm text-white/70">Review every submitted contract, check payment status, and access the QR code for verification.</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                to="/sales/dashboard"
                className="rounded-3xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-white/10"
              >
                Dashboard
              </Link>
              <Link
                to="/sales/profile"
                className="rounded-3xl border border-vital-gold/40 bg-vital-gold/5 px-5 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-vital-gold transition hover:bg-vital-gold/10"
              >
                Profile
              </Link>
              <Link
                to="/sales/contracts/renewal"
                className="rounded-3xl border border-vital-gold/40 bg-vital-gold/5 px-5 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-vital-gold transition hover:bg-vital-gold/10"
              >
                New Renewal
              </Link>
              <Link
                to="/sales/contracts/new"
                className="rounded-3xl bg-vital-gold px-5 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-black transition hover:shadow-glow"
              >
                New contract
              </Link>
            </div>
          </div>
        </div>

        <GlassCard>
          <div className="rounded-[32px] border border-white/10 bg-[#0c0e13] p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.35em] text-vital-gold/80">Contract history</p>
                <p className="mt-2 text-sm text-white/70">All recent submissions are listed here for visibility and follow-up.</p>
              </div>
              <div className="rounded-3xl bg-[#111317] px-4 py-3 text-sm text-white/60">Total contracts: {contracts.length}</div>
            </div>
          </div>
          <div className="mt-5 overflow-hidden rounded-[32px] border border-white/10 bg-[#0c0e13]">
            <table className="min-w-full text-left text-sm text-white/80">
              <thead className="border-b border-white/10 bg-[#111317]">
                <tr>
                  <th className="px-5 py-4">Contract</th>
                  <th className="px-5 py-4">Member</th>
                  <th className="px-5 py-4">Amount</th>
                  <th className="px-5 py-4">Payment</th>
                  <th className="px-5 py-4">Status</th>
                  <th className="px-5 py-4">QR</th>
                </tr>
              </thead>
              <tbody>
                {contracts.length > 0 ? (
                  contracts.map((contract) => (
                    <tr key={contract.id} className="border-b border-white/10 transition hover:bg-white/5">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-white">{contract.contract_code}</span>
                          {contract.renewal_type === 'renewal' && (
                            <span className="rounded-full bg-vital-gold/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.15em] text-vital-gold">Renewal</span>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-4">{contract.member.full_name}</td>
                      <td className="px-5 py-4">₦{Number(contract.amount).toLocaleString()}</td>
                      <td className="px-5 py-4">{contract.payment_method}</td>
                      <td className={`px-5 py-4 font-semibold ${
                        contract.status === 'approved' ? 'text-emerald-400' :
                        contract.status === 'rejected' ? 'text-red-400' :
                        'text-vital-gold'
                      }`}>{contract.status}</td>
                      <td className="px-5 py-4">
                        <Link
                          to={`/sales/contracts/${contract.id}/qr`}
                          className="rounded-full bg-vital-gold/15 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-vital-gold transition hover:bg-vital-gold/20"
                        >
                          QR Code
                        </Link>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="px-5 py-10 text-center text-sm text-white/50">
                      No contracts have been submitted yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
