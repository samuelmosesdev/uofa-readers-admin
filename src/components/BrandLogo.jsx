/**
 * Academicall brand mark.
 */
export default function BrandLogo({
  size = 36,
  showText = true,
  textClass = "text-text-primary",
  className = "",
  stacked = false,
}) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <div
        className="relative flex shrink-0 items-center justify-center rounded-xl bg-gradient-mint shadow-sm"
        style={{ width: size, height: size }}
      >
        <img
          src="/logo-mint.png"
          alt="Academicall"
          width={Math.round(size * 0.62)}
          height={Math.round(size * 0.62)}
          className="object-contain"
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.style.display = "none";
            const fallback = e.currentTarget.nextElementSibling;
            if (fallback) fallback.style.display = "flex";
          }}
        />
        <span
          className="hidden h-full w-full items-center justify-center font-display text-white"
          style={{ fontSize: size * 0.42, fontWeight: 700 }}
          aria-hidden
        >
          A
        </span>
      </div>
      {showText && (
        <span
          className={`font-logo tracking-tight ${
            stacked ? "block text-[13px] leading-tight" : "text-[15px]"
          } font-semibold ${textClass}`}
        >
          {stacked ? (
            <>
              Academicall
            </>
          ) : (
            "Academicall"
          )}
        </span>
      )}
    </div>
  );
}
