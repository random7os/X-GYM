export default function NotificationToast({ title, message, time }) {
  return (
    <div className="max-w-md rounded-[28px] border border-vital-gold/20 bg-[#12121a]/95 p-5 shadow-glow backdrop-blur-xl text-white">
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-vital-gold/15 text-vital-gold">
          <span className="text-xl">⚡</span>
        </div>
        <div>
          <p className="font-semibold text-white">{title}</p>
          <p className="mt-2 text-sm text-white/70">{message}</p>
        </div>
      </div>
      <div className="mt-4 text-xs uppercase tracking-[0.3em] text-white/40 flex justify-between">
        <span>Real-Time Alert</span>
        <span>{time}</span>
      </div>
    </div>
  );
}
