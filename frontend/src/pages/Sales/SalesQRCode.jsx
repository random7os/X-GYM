import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import QRCode from 'react-qr-code';
import api from '../../api/api';
import GlassCard from '../../components/GlassCard';

export default function SalesQRCode() {
  const { contractId } = useParams();
  const [qrToken, setQrToken] = useState('');
  const [contract, setContract] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get(`/sales/contracts/${contractId}/qr`)
      .then((response) => {
        setQrToken(response.data.qr_code_token);
        setContract(response.data.contract || null);
      })
      .catch(() => setError('Unable to load QR code.'));
  }, [contractId]);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_right,_rgba(255,229,61,0.12),_transparent_45%),_linear-gradient(180deg,_#050608,_#090a0f)] px-6 py-8 text-white">
      <div className="mx-auto max-w-4xl space-y-6">
        <GlassCard>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.35em] text-vital-gold/80">Contract QR</p>
              <h1 className="mt-3 text-4xl font-black text-white">Member Verification Code</h1>
            </div>
            <Link
              to="/sales/dashboard"
              className="rounded-3xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-white/10"
            >
              Back to Dashboard
            </Link>
          </div>
        </GlassCard>

        {error ? (
          <GlassCard className="text-red-300">{error}</GlassCard>
        ) : (
          <GlassCard>
            <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
              <div className="space-y-4">
                <p className="text-sm uppercase tracking-[0.35em] text-vital-gold/70">Scan this QR at check-in</p>
                <div className="rounded-[32px] border border-white/10 bg-[#0c0e13] p-6 text-center">
                  {qrToken ? (
                    <QRCode value={qrToken} size={220} bgColor="#0c0e13" fgColor="#ffe53d" />
                  ) : (
                    <div className="h-[220px] grid place-items-center text-white/50">Generating QR code...</div>
                  )}
                </div>
                <p className="text-sm text-white/70">QR Token: <span className="font-mono text-vital-gold">{qrToken}</span></p>
                <p className="text-sm text-white/60">This QR code is bound to contract #{contractId} and can be verified at the check-in scanner endpoint.</p>
              </div>
              <div className="rounded-[32px] border border-white/10 bg-[#111318] p-6">
                <p className="text-sm uppercase tracking-[0.35em] text-vital-gold/70">Contract Summary</p>
                <div className="mt-6 space-y-3 text-sm text-white/70">
                  <p><span className="text-white">Member:</span> {contract?.member?.full_name || 'N/A'}</p>
                  <p><span className="text-white">Amount:</span> ₦{contract?.amount ? Number(contract.amount).toLocaleString() : 'N/A'}</p>
                  <p><span className="text-white">Payment:</span> {contract?.payment_method || 'N/A'}</p>
                  <p><span className="text-white">Status:</span> {contract?.status || 'N/A'}</p>
                  <p><span className="text-white">Verification:</span> {contract?.financial_status || 'N/A'}</p>
                </div>
              </div>
            </div>
          </GlassCard>
        )}
      </div>
    </div>
  );
}
