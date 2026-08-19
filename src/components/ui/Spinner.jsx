export default function Spinner({ size = 20, className = "", label = "Loading" }) {
  const px = typeof size === "number" ? `${size}px` : size;
  return (
    <span
      role="status"
      aria-live="polite"
      aria-label={label}
      className={`inline-flex items-center justify-center ${className}`}
    >
      <svg
        width={px}
        height={px}
        viewBox="0 0 24 24"
        fill="none"
        className="animate-spin text-accent"
        aria-hidden="true"
      >
        <circle
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeOpacity="0.25"
          strokeWidth="3"
        />
        <path
          d="M22 12a10 10 0 0 1-10 10"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
        />
      </svg>
      <span className="sr-only">{label}</span>
    </span>
  );
}
