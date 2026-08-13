import { ArrowUpRight, TrendingUp } from "lucide-react";

export default function KpiCard({ label, value, trend, highlight = false, icon: Icon }) {
  return (
    <div
      className={`group relative flex flex-col justify-between overflow-hidden rounded-2xl p-5 transition-all duration-300 animate-fade-in-up ${
        highlight
          ? "bg-gradient-to-br from-accent via-accent to-accent-strong text-bg-sidebar shadow-lg shadow-accent/25"
          : "card-elevated text-text-primary"
      }`}
    >
      {/* subtle shine */}
      <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100">
        <div className="absolute -left-1/2 top-0 h-full w-1/2 rotate-12 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      </div>

      <div className="flex items-start justify-between">
        <span
          className={`text-sm font-medium ${
            highlight ? "text-bg-sidebar/80" : "text-text-secondary"
          }`}
        >
          {label}
        </span>
        {Icon && (
          <span
            className={`flex h-9 w-9 items-center justify-center rounded-xl ${
              highlight ? "bg-bg-sidebar/15 text-bg-sidebar" : "bg-accent-soft text-accent"
            }`}
          >
            <Icon size={18} strokeWidth={2} />
          </span>
        )}
      </div>

      <div className="mt-4 flex items-end justify-between">
        <span className="text-3xl font-bold tracking-tight tabular-nums">{value}</span>
        {trend && (
          <span
            className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${
              highlight
                ? "bg-bg-sidebar/15 text-bg-sidebar"
                : "bg-accent-soft text-accent"
            }`}
          >
            <TrendingUp size={12} />
            {trend}
          </span>
        )}
      </div>
    </div>
  );
}
