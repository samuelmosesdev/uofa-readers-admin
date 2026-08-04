export default function RecommendedCard({ title, code, thumbnailUrl, onClick }) {
  return (
    <button
      onClick={onClick}
      className="group flex flex-col overflow-hidden rounded-2xl border border-border-light bg-card-light text-left transition-shadow hover:shadow-md"
    >
      <div className="aspect-[4/3] w-full overflow-hidden bg-surface-light">
        {thumbnailUrl ? (
          <img
            src={thumbnailUrl}
            alt={title}
            className="h-full w-full object-cover transition-transform group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs text-ink-muted">No cover</div>
        )}
      </div>
      <div className="p-3">
        <p className="truncate text-sm font-medium text-ink">{title}</p>
        <p className="mt-0.5 font-mono text-xs text-teal">{code}</p>
      </div>
    </button>
  );
}
