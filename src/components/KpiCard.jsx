import { ArrowUpRight } from "lucide-react";

export default function KpiCard({ label, value, trend, highlight = false }) {
  return (
    <div
      className={`flex flex-col justify-between rounded-2xl p-5 ${
        highlight
          ? "bg-accent text-bg-sidebar"
          : "border border-border-subtle bg-bg-panel text-text-primary"
      }`}
    >
      <span className={`text-sm ${highlight ? "text-bg-sidebar/80" : "text-text-secondary"}`}>
        {label}
      </span>
      <div className="mt-4 flex items-end justify-between">
        <span className="text-3xl font-semibold tracking-tight">{value}</span>
        {trend && (
          <span
            className={`flex items-center gap-1 text-xs font-medium ${
              highlight ? "text-bg-sidebar/80" : "text-accent"
            }`}
          >
            <ArrowUpRight size={14} />
            {trend}
          </span>
        )}
      </div>
    </div>
  );
}
