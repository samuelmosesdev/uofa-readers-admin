export default function StudentKpiCard({ icon: Icon, value, label, accent = "teal" }) {
  const accents = {
    teal: "from-emerald-400 to-teal-500 shadow-emerald-500/20",
    orange: "from-orange-400 to-amber-500 shadow-orange-500/20",
    violet: "from-violet-400 to-purple-500 shadow-violet-500/20",
    blue: "from-sky-400 to-blue-500 shadow-sky-500/20",
  };
  const bg = accents[accent] || accents.teal;

  return (
    <div className="flex min-w-[140px] flex-1 flex-col rounded-3xl border border-border-subtle bg-bg-panel p-4 shadow-sm transition-transform active:scale-[0.98] sm:min-w-0 sm:p-5">
      <span
        className={`flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br ${bg} text-white shadow-lg`}
      >
        <Icon size={18} strokeWidth={2.2} />
      </span>
      <p className="mt-4 text-2xl font-bold tracking-tight text-text-primary tabular-nums">
        {value}
      </p>
      <p className="mt-0.5 text-xs font-medium text-text-secondary">{label}</p>
    </div>
  );
}
