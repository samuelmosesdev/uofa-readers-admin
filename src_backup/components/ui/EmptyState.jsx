/**
 * Consistent empty list / no-data UI.
 *
 * @param {object} props
 * @param {import("lucide-react").LucideIcon} [props.icon]
 * @param {string} props.title
 * @param {string} [props.description]
 * @param {React.ReactNode} [props.action]  // e.g. a button
 */
export default function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className = "",
}) {
  return (
    <div
      role="status"
      className={`flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border-subtle bg-bg-panel/50 px-6 py-14 text-center ${className}`}
    >
      {Icon && (
        <div
          className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent-soft text-accent"
          aria-hidden="true"
        >
          <Icon size={22} strokeWidth={1.75} />
        </div>
      )}
      <div className="max-w-sm space-y-1">
        <h3 className="text-sm font-semibold text-text-primary">{title}</h3>
        {description && (
          <p className="text-sm leading-relaxed text-text-secondary">{description}</p>
        )}
      </div>
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
