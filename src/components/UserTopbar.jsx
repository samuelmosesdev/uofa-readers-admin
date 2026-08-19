import { useState, useRef, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Search, Bell, Moon, Sun, Megaphone, X } from "lucide-react";
import UniqueIdBadge from "./UniqueIdBadge";
import { useTheme } from "../context/ThemeContext";
import { useStudentNotifications } from "../hooks/useStudentNotifications";

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function timeAgo(ts) {
  if (!ts) return "";
  const ms = ts.seconds ? ts.seconds * 1000 : new Date(ts).getTime();
  const diff = Date.now() - ms;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export default function UserTopbar({ profile, unreadCount: unreadFromParent, search, onSearchChange }) {
  const { theme, toggleTheme, isDark } = useTheme();
  const navigate = useNavigate();
  const { feed, unreadCount, markAnnouncementRead, markSystemRead, markAllRead } =
    useStudentNotifications();

  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(null); // notification detail modal
  const panelRef = useRef(null);

  const count = unreadCount ?? unreadFromParent ?? 0;
  const firstName = profile?.name?.split(" ")[0] || "there";
  const initials = (profile?.name || "U")
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClick(e) {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  async function handleItemClick(item) {
    if (item._type === "announcement") {
      await markAnnouncementRead(item.id);
    } else {
      await markSystemRead(item.id);
    }
    setSelected(item);
    setOpen(false);
  }

  return (
    <>
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border-light bg-card-light px-4 py-4 sm:px-6">
        <div className="flex items-center gap-3">
          <h1 className="text-base font-semibold text-ink sm:text-lg">
            {getGreeting()}, {firstName}
          </h1>
          <UniqueIdBadge uniqueId={profile?.uniqueId} />
        </div>

        <div className="flex items-center gap-3 sm:gap-4">
          <div className="hidden items-center gap-2 rounded-lg border border-border-light bg-surface-light px-3 py-2 sm:flex">
            <Search size={16} className="text-ink-muted" />
            <input
              value={search}
              onChange={(e) => onSearchChange?.(e.target.value)}
              placeholder="Search"
              className="w-40 bg-transparent text-sm text-ink placeholder:text-ink-muted focus:outline-none"
            />
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              toggleTheme();
            }}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-border-light text-ink-muted transition hover:bg-surface-light hover:text-ink"
            aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
          >
            {theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}
          </button>

          {/* ========== BELL + DROPDOWN ========== */}
          <div className="relative" ref={panelRef}>
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              className="relative flex h-9 w-9 items-center justify-center rounded-lg text-ink-muted transition hover:bg-surface-light hover:text-ink"
              aria-label="Notifications"
              aria-expanded={open}
            >
              <Bell size={19} />
              {count > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-status-danger text-[10px] font-semibold text-white">
                  {count > 9 ? "9+" : count}
                </span>
              )}
            </button>

            {open && (
              <div className="absolute right-0 z-50 mt-2 w-[min(100vw-2rem,22rem)] overflow-hidden rounded-2xl border border-border-light bg-card-light shadow-xl">
                <div className="flex items-center justify-between border-b border-border-light px-4 py-3">
                  <h3 className="text-sm font-semibold text-ink">Notifications</h3>
                  {count > 0 && (
                    <button
                      type="button"
                      onClick={() => markAllRead()}
                      className="text-xs font-medium text-teal hover:underline"
                    >
                      Mark all read
                    </button>
                  )}
                </div>

                <div className="max-h-80 overflow-y-auto">
                  {feed.length === 0 ? (
                    <p className="px-4 py-8 text-center text-sm text-ink-muted">
                      No notifications yet
                    </p>
                  ) : (
                    feed.slice(0, 8).map((item) => (
                      <button
                        key={`${item._type}-${item.id}`}
                        type="button"
                        onClick={() => handleItemClick(item)}
                        className={`flex w-full items-start gap-3 px-4 py-3 text-left transition hover:bg-surface-light ${
                          !item._read ? "bg-teal-soft/20" : ""
                        }`}
                      >
                        <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-teal-soft text-teal">
                          <Megaphone size={14} />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className={`truncate text-sm ${!item._read ? "font-semibold text-ink" : "text-ink"}`}>
                            {item.title || item.message || "Notification"}
                          </p>
                          <p className="mt-0.5 line-clamp-2 text-xs text-ink-muted">
                            {item.body || item.message || ""}
                          </p>
                          <p className="mt-1 text-[11px] text-ink-muted">
                            {timeAgo(item.createdAt)}
                          </p>
                        </div>
                        {!item._read && (
                          <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-teal" />
                        )}
                      </button>
                    ))
                  )}
                </div>

                <div className="border-t border-border-light">
                  <Link
                    to="/dashboard/notifications"
                    onClick={() => setOpen(false)}
                    className="block px-4 py-3 text-center text-sm font-medium text-teal hover:bg-surface-light"
                  >
                    View all notifications
                  </Link>
                </div>
              </div>
            )}
          </div>

          {profile?.avatarUrl ? (
            <img src={profile.avatarUrl} alt={profile.name} className="h-9 w-9 rounded-full object-cover" />
          ) : (
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-teal-soft text-xs font-semibold text-teal">
              {initials}
            </div>
          )}
        </div>
      </header>

      {/* ========== DETAIL MODAL when a notification is tapped ========== */}
      {selected && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 px-4">
          <div className="w-full max-w-md rounded-2xl border border-border-light bg-card-light p-6 shadow-xl">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-soft text-teal">
                  <Megaphone size={18} />
                </span>
                <div>
                  <h3 className="text-base font-semibold text-ink">
                    {selected.title || "Notification"}
                  </h3>
                  <p className="text-xs text-ink-muted">
                    {selected.createdByName || "Admin"} · {timeAgo(selected.createdAt)}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelected(null)}
                className="text-ink-muted hover:text-ink"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>
            <p className="whitespace-pre-wrap text-sm text-ink-muted">
              {selected.body || selected.message || ""}
            </p>
            <button
              type="button"
              onClick={() => {
                setSelected(null);
                navigate("/dashboard/notifications");
              }}
              className="mt-5 w-full rounded-lg bg-teal py-2.5 text-sm font-semibold text-white hover:bg-teal-dark"
            >
              Open notifications
            </button>
          </div>
        </div>
      )}
    </>
  );
}