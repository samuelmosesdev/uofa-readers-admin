import { Search, Bell, MessageSquareMore, LogOut } from "lucide-react";
import { signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useNotifications } from "../hooks/useNotifications";
import { auth } from "../firebase/config";

export default function Topbar({ search, onSearchChange }) {
  const { profile } = useAuth();
  const { unreadCount } = useNotifications();
  const navigate = useNavigate();

  const initials = (profile?.name || "Admin")
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  async function handleLogout() {
    await signOut(auth);
    navigate("/login", { replace: true });
  }

  return (
    <header className="flex items-center justify-between gap-4 border-b border-border-subtle bg-bg-app px-6 py-4">
      <div className="flex w-full max-w-sm items-center gap-2 rounded-lg border border-border-subtle bg-bg-panel px-3 py-2">
        <Search size={16} className="text-text-muted" />
        <input
          value={search}
          onChange={(e) => onSearchChange?.(e.target.value)}
          placeholder="Search"
          className="w-full bg-transparent text-sm text-text-primary placeholder:text-text-muted focus:outline-none"
        />
      </div>

      <div className="flex items-center gap-3 sm:gap-4">
        <button type="button" className="relative text-text-secondary hover:text-text-primary" aria-label="Messages">
          <MessageSquareMore size={19} />
        </button>

        <button type="button" className="relative text-text-secondary hover:text-text-primary" aria-label="Notifications">
          <Bell size={19} />
          {unreadCount > 0 && (
            <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-status-danger text-[10px] font-semibold text-white">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>

        {profile?.avatarUrl ? (
          <button type="button" onClick={() => navigate('/dashboard/profile')} className="p-0">
            <img
              src={profile.avatarUrl}
              alt={profile.name}
              className="h-9 w-9 rounded-full object-cover ring-2 ring-border-subtle"
            />
          </button>
        ) : (
          <button type="button" onClick={() => navigate('/dashboard/profile')} className="flex h-9 w-9 items-center justify-center rounded-full bg-accent-soft text-xs font-semibold text-accent ring-2 ring-border-subtle">
            {initials}
          </button>
        )}

        <button
          type="button"
          onClick={handleLogout}
          className="flex items-center gap-1.5 rounded-lg border border-border-subtle px-2.5 py-1.5 text-xs font-medium text-text-secondary hover:border-status-danger/40 hover:text-status-danger"
          title="Log out"
        >
          <LogOut size={14} />
          <span className="hidden sm:inline">Log out</span>
        </button>
      </div>
    </header>
  );
}
