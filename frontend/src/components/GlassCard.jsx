export default function GlassCard({ className = '', children }) {
  return (
    <div className={`rounded-[32px] border border-white/10 bg-[#0c0d11]/95 shadow-glow backdrop-blur-xl p-8 ${className}`}>
      {children}
    </div>
  );
}
