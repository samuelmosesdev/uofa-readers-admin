import { Search, Bell, MessageSquareMore } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useNotifications } from "../hooks/useNotifications";

export default function Topbar({ search, onSearchChange }) {
  const { profile } = useAuth();
  const { unreadCount } = useNotifications();

  const initials = (profile?.name || "Admin")
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between gap-4 border-b border-border-subtle bg-bg-app/90 px-6 py-3.5 backdrop-blur-md">
      <div className="flex w-full max-w-md items-center gap-2 rounded-xl border border-border-subtle bg-bg-panel px-3.5 py-2.5 transition-all focus-within:border-accent focus-within:ring-2 focus-within:ring-accent-soft">
        <Search size={16} className="shrink-0 text-text-muted" />
        <input
          value={search}
          onChange={(e) => onSearchChange?.(e.target.value)}
          placeholder="Search users, documents, courses…"
          className="w-full bg-transparent text-sm text-text-primary placeholder:text-text-muted focus:outline-none"
        />
      </div>

      <div className="flex items-center gap-2">
        <button
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-border-subtle text-text-secondary transition-all hover:bg-bg-hover hover:text-text-primary"
          aria-label="Messages"
        >
          <MessageSquareMore size={17} />
        </button>

        <button
          className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-border-subtle text-text-secondary transition-all hover:bg-bg-hover hover:text-text-primary"
          aria-label="Notifications"
        >
          <Bell size={17} />
          {unreadCount > 0 && (
            <span className="absolute -right-1 -top-1 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-status-danger px-1 text-[10px] font-bold text-white shadow">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>

        {profile?.avatarUrl || profile?.photoURL ? (
          <img
            src={profile.avatarUrl || profile.photoURL}
            alt={profile.name}
            className="h-9 w-9 rounded-full object-cover ring-2 ring-accent/30"
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
