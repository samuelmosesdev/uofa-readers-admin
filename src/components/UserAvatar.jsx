import { useState, useRef, useEffect } from "react";

/** Human-readable designation from role + plan */
export function roleBadge(role, plan, subscription) {
  if (role === "alphaAgent") return "Alpha Agent";
  if (role === "agent") return "Agent";
  if (role === "admin") return "Admin";
  if (role === "courseRep") return "Course Rep";
  const pro =
    plan === "annual" ||
    plan === "paid" ||
    plan === "pro" ||
    subscription === "pro" ||
    subscription === "annual" ||
    subscription === "paid";
  if (pro) return "Pro";
  return null;
}

export function displayLabel(profile, fallback = "Student") {
  if (!profile) return fallback;
  return profile.nickname || profile.nickName || profile.name || fallback;
}

export function isProUser(profile) {
  if (!profile) return false;
  return (
    profile.plan === "annual" ||
    profile.plan === "paid" ||
    profile.plan === "pro" ||
    profile.subscription === "pro" ||
    profile.subscription === "annual" ||
    profile.subscription === "paid"
  );
}

export default function UserAvatar({
  profile,
  name,
  nickname,
  photoURL,
  department,
  phone,
  role,
  plan,
  subscription,
  showDepartment,
  showPhone,
  size = 36,
  className = "",
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const displayNick =
    nickname || profile?.nickname || profile?.nickName || null;
  const displayName =
    name || profile?.name || profile?.email || "Student";
  const photo =
    photoURL || profile?.photoURL || profile?.avatarUrl || null;
  const dept =
    department ??
    (profile?.showDepartment !== false ? profile?.department : null);
  const phoneVal =
    phone ?? (profile?.showPhone === true ? profile?.phone : null);
  const roleLabel = role || profile?.role || null;
  const planVal = plan ?? profile?.plan;
  const subVal = subscription ?? profile?.subscription;

  const canShowDept =
    showDepartment !== undefined
      ? showDepartment
      : profile?.showDepartment !== false && !!dept;
  const canShowPhone =
    showPhone !== undefined
      ? showPhone
      : profile?.showPhone === true && !!phoneVal;

  const initials = String(displayNick || displayName)
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  useEffect(() => {
    if (!open) return;
    const close = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, [open]);

  const px = typeof size === "number" ? `${size}px` : size;
  const designation = roleBadge(roleLabel, planVal, subVal);

  const badgeClass =
    designation === "Pro"
      ? "bg-amber-500/15 text-amber-700 border-amber-500/30"
      : designation === "Course Rep"
        ? "bg-orange-500/15 text-orange-700 border-orange-500/30"
        : designation === "Alpha Agent" || designation === "Admin"
          ? "bg-teal-soft text-teal border-teal/30"
          : designation === "Agent"
            ? "bg-sky-500/15 text-sky-700 border-sky-500/30"
            : "bg-teal-soft text-teal border-teal/30";

  return (
    <div ref={ref} className={`relative inline-flex ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="rounded-full overflow-hidden ring-2 ring-border-light focus:outline-none focus:ring-teal/40 shrink-0"
        style={{ width: px, height: px }}
        title={displayNick || displayName}
      >
        {photo ? (
          <img src={photo} alt={displayName} className="h-full w-full object-cover" />
        ) : (
          <span className="flex h-full w-full items-center justify-center bg-teal-soft text-teal text-xs font-bold">
            {initials}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute left-1/2 top-full z-50 mt-2 w-56 -translate-x-1/2 rounded-2xl border border-border-light bg-card-light p-3 shadow-xl animate-stitch-in">
          <div className="flex flex-col items-center text-center">
            <div
              className="overflow-hidden rounded-full ring-2 ring-teal/30"
              style={{ width: 64, height: 64 }}
            >
              {photo ? (
                <img src={photo} alt="" className="h-full w-full object-cover" />
              ) : (
                <span className="flex h-full w-full items-center justify-center bg-teal-soft text-teal text-sm font-bold">
                  {initials}
                </span>
              )}
            </div>
            <p className="mt-2 text-sm font-bold text-ink leading-tight">
              {displayNick || displayName}
            </p>
            {displayNick && (
              <p className="text-[11px] text-ink-muted">{displayName}</p>
            )}
            {designation && (
              <span
                className={`mt-1 rounded-full border px-2 py-0.5 text-[10px] font-bold ${badgeClass}`}
              >
                {designation === "Pro" ? "✦ Pro" : designation}
              </span>
            )}
            {canShowDept && dept && (
              <p className="mt-1.5 text-[11px] text-ink-muted">{dept}</p>
            )}
            {canShowPhone && phoneVal && (
              <p className="mt-0.5 text-[11px] font-medium text-ink">{phoneVal}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/** Inline name + designation chip for comments / posts */
export function NameWithBadge({
  name,
  role,
  plan,
  subscription,
  isAnonymous,
  className = "",
}) {
  const designation = isAnonymous
    ? null
    : roleBadge(role, plan, subscription);
  const badgeClass =
    designation === "Pro"
      ? "bg-amber-500/15 text-amber-700"
      : designation === "Course Rep"
        ? "bg-orange-500/15 text-orange-700"
        : designation === "Alpha Agent" || designation === "Admin"
          ? "bg-teal-soft text-teal"
          : designation === "Agent"
            ? "bg-sky-500/15 text-sky-700"
            : "";

  return (
    <span className={`inline-flex flex-wrap items-center gap-1.5 ${className}`}>
      <span className="font-semibold">{name || "User"}</span>
      {designation && (
        <span
          className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${badgeClass}`}
        >
          {designation === "Pro" ? "✦ Pro" : designation}
        </span>
      )}
    </span>
  );
}
