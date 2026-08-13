import { Search, Bell, Moon, Sun } from "lucide-react";
import UniqueIdBadge from "./UniqueIdBadge";
import { useTheme } from "../context/ThemeContext";

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export default function UserTopbar({ profile, unreadCount, search, onSearchChange }) {
  const { theme, toggleTheme } = useTheme();
  const firstName = profile?.name?.split(" ")[0] || "there";
  const initials = (profile?.name || "U")
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-border-subtle bg-bg-panel/90 px-4 py-3 backdrop-blur-md sm:px-6 transition-colors duration-300">
      {/* Greeting only on desktop — mobile has hero on dashboard */}
      <div className="hidden min-w-0 items-center gap-3 md:flex">
        <h1 className="truncate text-base font-semibold text-text-primary">
          {getGreeting()}, <span className="text-accent">{firstName}</span>
        </h1>
        <UniqueIdBadge uniqueId={profile?.uniqueId} />
      </div>
      <div className="md:hidden" />

      <div className="flex items-center gap-2">
        <div className="hidden items-center gap-2 rounded-2xl border border-border-subtle bg-bg-panel-alt px-3 py-2 focus-within:border-accent focus-within:ring-2 focus-within:ring-accent-soft sm:flex">
          <Search size={15} className="text-text-muted" />
          <input
            value={search}
            onChange={(e) => onSearchChange?.(e.target.value)}
            placeholder="Search…"
            className="w-36 bg-transparent text-sm text-text-primary placeholder:text-text-muted focus:outline-none lg:w-44"
          />
        </div>

        <button
          onClick={toggleTheme}
          className="flex h-9 w-9 items-center justify-center rounded-2xl border border-border-subtle text-text-secondary transition hover:bg-bg-hover hover:text-accent"
          aria-label="Toggle theme"
        >
          {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
        </button>

        <button
          className="relative flex h-9 w-9 items-center justify-center rounded-2xl border border-border-subtle text-text-secondary transition hover:bg-bg-hover hover:text-text-primary"
          aria-label="Notifications"
        >
          <Bell size={16} />
          {unreadCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-status-danger px-1 text-[10px] font-bold text-white">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>

        {profile?.avatarUrl || profile?.photoURL ? (
          <img
            src={profile.avatarUrl || profile.photoURL}
            alt=""
            className="h-9 w-9 rounded-full object-cover ring-2 ring-accent/25"
          />
        ) : (
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-accent to-accent-strong text-xs font-bold text-bg-sidebar shadow-md shadow-accent/20">
            {initials}
          </div>
        )}
      </div>
    </header>
  );
}
