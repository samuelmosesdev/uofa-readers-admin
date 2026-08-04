export default function ContinueCard({ title, subtitle, progressPct = 0 }) {
  return (
    <div className="rounded-2xl border border-border-light bg-card-light p-4">
      <p className="text-sm font-semibold text-ink">{title}</p>
      <p className="mt-1 text-xs text-ink-muted">{subtitle}</p>
      <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-surface-light">
        <div
          className="h-full rounded-full bg-teal transition-all"
          style={{ width: `${Math.min(100, Math.max(0, progressPct))}%` }}
        />
      </div>
    </div>
  );
}
