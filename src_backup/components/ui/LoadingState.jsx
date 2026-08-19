import Spinner from "./Spinner";

/**
 * Full-area loading placeholder.
 * Use inside pages/sections while data is fetching.
 */
export default function LoadingState({
  message = "Loading…",
  className = "",
  compact = false,
}) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className={`flex flex-col items-center justify-center gap-3 text-text-secondary ${
        compact ? "py-10" : "min-h-[40vh] py-16"
      } ${className}`}
    >
      <Spinner size={compact ? 22 : 28} label={message} />
      <p className="text-sm">{message}</p>
    </div>
  );
}
