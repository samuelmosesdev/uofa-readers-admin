import { AlertTriangle, RefreshCw } from "lucide-react";

export default function ErrorState({
  title = "Something went wrong",
  message = "We couldn’t load this data. Please try again.",
  onRetry,
  className = "",
}) {
  return (
    <div
      role="alert"
      className={`flex flex-col items-center justify-center gap-3 rounded-xl border border-status-danger/30 bg-status-danger/5 px-6 py-12 text-center ${className}`}
    >
      <div
        className="flex h-12 w-12 items-center justify-center rounded-2xl bg-status-danger/15 text-status-danger"
        aria-hidden="true"
      >
        <AlertTriangle size={22} strokeWidth={1.75} />
      </div>
      <div className="max-w-sm space-y-1">
        <h3 className="text-sm font-semibold text-text-primary">{title}</h3>
        <p className="text-sm leading-relaxed text-text-secondary">{message}</p>
      </div>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-1 inline-flex items-center gap-2 rounded-lg border border-border-subtle bg-bg-panel px-3.5 py-2 text-sm font-medium text-text-primary transition hover:bg-bg-elevated focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg-app"
        >
          <RefreshCw size={14} aria-hidden="true" />
          Try again
        </button>
      )}
    </div>
  );
}
