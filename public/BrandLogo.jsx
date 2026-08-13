/**
 * UniAbuja Readers Hub brand mark.
 * Uses PNG when available; falls back to SVG favicon mark.
 */
export default function BrandLogo({
  size = 36,
  showText = true,
  textClass = "text-text-primary",
  className = "",
  stacked = false,
}) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <img
        src="/logo-mint.png"
        alt="UniAbuja Readers Hub"
        width={size}
        height={size}
        className="object-contain"
        style={{ width: size, height: size }}
        onError={(e) => {
          e.currentTarget.onerror = null;
          e.currentTarget.src = "/favicon.svg";
        }}
      />
      {showText && (
        <span
          className={`${
            stacked ? "block text-[13px] leading-tight" : "text-[15px]"
          } font-semibold ${textClass}`}
        >
          {stacked ? (
            <>
              UniAbuja
              <br />
              Readers Hub
            </>
          ) : (
            "UniAbuja Readers Hub"
          )}
        </span>
      )}
    </div>
  );
}
