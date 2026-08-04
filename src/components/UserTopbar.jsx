import { Search, Bell } from "lucide-react";
import UniqueIdBadge from "./UniqueIdBadge";

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export default function UserTopbar({ profile, unreadCount, search, onSearchChange }) {
  const firstName = profile?.name?.split(" ")[0] || "there";
  const initials = (profile?.name || "U")
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border-light bg-card-light px-4 py-4 sm:px-6">
      <div className="flex items-center gap-3">
        <h1 className="text-base font-semibold text-ink sm:text-lg">
          {getGreeting()}, {firstName}
        </h1>
        <UniqueIdBadge uniqueId={profile?.uniqueId} />
      </div>

      <div className="flex items-center gap-4">
        <div className="hidden items-center gap-2 rounded-lg border border-border-light bg-surface-light px-3 py-2 sm:flex">
          <Search size={16} className="text-ink-muted" />
          <input
            value={search}
            onChange={(e) => onSearchChange?.(e.target.value)}
            placeholder="Search"
            className="w-40 bg-transparent text-sm text-ink placeholder:text-ink-muted focus:outline-none"
          />
        </div>

        <button className="relative text-ink-muted hover:text-ink" aria-label="Notifications">
          <Bell size={19} />
          {unreadCount > 0 && (
            <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-status-danger text-[10px] font-semibold text-white">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>

        {profile?.avatarUrl ? (
          <img src={profile.avatarUrl} alt={profile.name} className="h-9 w-9 rounded-full object-cover" />
        ) : (
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-teal-soft text-xs font-semibold text-teal">
            {initials}
          </div>
        )}
      </div>
    </header>
  );
}
