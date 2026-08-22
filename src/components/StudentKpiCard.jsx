/**
 * Colorful student KPI card — gradient accents, responsive, lively.
 */
export default function StudentKpiCard({
  icon: Icon,
  value,
  label,
  accent = "teal",
  subtitle,
  circular = false,
}) {
  const themes = {
    teal: {
      gradient: "from-emerald-400 via-teal-500 to-cyan-500",
      soft: "bg-emerald-500/10",
      ring: "ring-emerald-400/30",
      text: "text-emerald-600 dark:text-emerald-300",
      blob: "bg-emerald-400/20",
    },
    orange: {
      gradient: "from-orange-400 via-amber-500 to-yellow-400",
      soft: "bg-orange-500/10",
      ring: "ring-orange-400/30",
      text: "text-orange-600 dark:text-orange-300",
      blob: "bg-orange-400/20",
    },
    violet: {
      gradient: "from-violet-400 via-purple-500 to-fuchsia-500",
      soft: "bg-violet-500/10",
      ring: "ring-violet-400/30",
      text: "text-violet-600 dark:text-violet-300",
      blob: "bg-violet-400/20",
    },
    blue: {
      gradient: "from-sky-400 via-blue-500 to-indigo-500",
      soft: "bg-sky-500/10",
      ring: "ring-sky-400/30",
      text: "text-sky-600 dark:text-sky-300",
      blob: "bg-sky-400/20",
    },
    pink: {
      gradient: "from-pink-400 via-rose-500 to-red-400",
      soft: "bg-pink-500/10",
      ring: "ring-pink-400/30",
      text: "text-pink-600 dark:text-pink-300",
      blob: "bg-pink-400/20",
    },
    flame: {
      gradient: "from-orange-500 via-red-500 to-rose-500",
      soft: "bg-orange-500/10",
      ring: "ring-orange-400/30",
      text: "text-orange-600 dark:text-orange-300",
      blob: "bg-orange-400/25",
    },
  };
  const t = themes[accent] || themes.teal;

  if (circular) {
    return (
      <div className="relative flex min-w-[140px] flex-1 flex-col items-center justify-center overflow-hidden rounded-3xl border border-border-subtle bg-bg-panel p-4 shadow-sm sm:min-w-0 sm:p-5">
        <div className={`pointer-events-none absolute -right-6 -top-6 h-20 w-20 rounded-full ${t.blob} blur-2xl`} />
        <div
          className={`relative flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br ${t.gradient} text-white shadow-lg ring-4 ${t.ring}`}
        >
          {Icon && <Icon size={22} strokeWidth={2.2} />}
        </div>
        <p className="mt-3 text-center text-sm font-bold tracking-tight text-text-primary whitespace-pre-line">
          {value}
        </p>
        {label && (
          <p className="mt-0.5 text-center text-[11px] font-medium text-text-secondary">
            {label}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="relative flex min-w-[140px] flex-1 flex-col overflow-hidden rounded-3xl border border-border-subtle bg-bg-panel p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md active:scale-[0.98] sm:min-w-0 sm:p-5">
      {/* Soft color blob */}
      <div
        className={`pointer-events-none absolute -right-4 -top-4 h-24 w-24 rounded-full ${t.blob} blur-2xl`}
      />
      <div className="relative flex items-start justify-between gap-2">
        <span
          className={`flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br ${t.gradient} text-white shadow-lg`}
        >
          {Icon && <Icon size={20} strokeWidth={2.2} />}
        </span>
      </div>
      <p className="relative mt-4 text-2xl font-extrabold tracking-tight text-text-primary tabular-nums sm:text-3xl">
        {value}
      </p>
      <p className={`relative mt-0.5 text-xs font-semibold uppercase tracking-wide ${t.text}`}>
        {label}
      </p>
      {subtitle && (
        <p className="relative mt-1 text-[11px] text-text-muted">{subtitle}</p>
      )}
    </div>
  );
}
