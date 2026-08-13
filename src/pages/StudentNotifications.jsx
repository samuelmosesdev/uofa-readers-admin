import { useState } from "react";
import {
  Bell,
  Megaphone,
  CheckCheck,
  Pin,
  AlertTriangle,
  Info,
  CheckCircle2,
} from "lucide-react";
import { useStudentNotifications } from "../hooks/useStudentNotifications";

const TABS = [
  { id: "all", label: "All" },
  { id: "announcement", label: "Announcements" },
  { id: "system", label: "System" },
];

function priorityStyles(priority) {
  if (priority === "urgent") return "border-l-status-danger bg-red-50";
  if (priority === "high") return "border-l-status-warning bg-amber-50";
  return "border-l-teal bg-card-light";
}

function formatDate(ts) {
  if (!ts) return "";
  const d = ts.seconds ? new Date(ts.seconds * 1000) : new Date(ts);
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function StudentNotifications() {
  const {
    feed,
    unreadCount,
    loading,
    markAnnouncementRead,
    markSystemRead,
    markAllRead,
  } = useStudentNotifications();
  const [tab, setTab] = useState("all");
  const [busy, setBusy] = useState(false);

  const visible = feed.filter((item) => {
    if (tab === "all") return true;
    return item._type === tab;
  });

  async function handleMarkAll() {
    setBusy(true);
    try {
      await markAllRead();
    } finally {
      setBusy(false);
    }
  }

  async function handleClick(item) {
    if (item._read) return;
    if (item._type === "announcement") {
      await markAnnouncementRead(item.id);
    } else {
      await markSystemRead(item.id);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-lg font-semibold text-ink">Notifications</h1>
          <p className="text-sm text-ink-muted">
            {unreadCount > 0
              ? `${unreadCount} unread`
              : "You're all caught up"}
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAll}
            disabled={busy}
            className="flex items-center gap-2 rounded-lg border border-border-light bg-card-light px-3 py-2 text-sm font-medium text-teal hover:bg-teal-soft disabled:opacity-60"
          >
            <CheckCheck size={16} />
            {busy ? "Marking…" : "Mark all as read"}
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl border border-border-light bg-card-light p-1">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              tab === t.id
                ? "bg-teal text-white"
                : "text-ink-muted hover:text-ink"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Feed */}
      <div className="space-y-3">
        {loading && (
          <div className="rounded-2xl border border-border-light bg-card-light px-4 py-10 text-center text-sm text-ink-muted">
            Loading…
          </div>
        )}

        {!loading && visible.length === 0 && (
          <div className="rounded-2xl border border-dashed border-border-light bg-card-light px-4 py-12 text-center">
            <Bell size={28} className="mx-auto mb-2 text-ink-muted" />
            <p className="text-sm font-medium text-ink">No notifications</p>
            <p className="mt-1 text-xs text-ink-muted">
              Announcements and system alerts will appear here.
            </p>
          </div>
        )}

        {visible.map((item) => {
          const isAnn = item._type === "announcement";
          return (
            <button
              key={`${item._type}-${item.id}`}
              onClick={() => handleClick(item)}
              className={`w-full rounded-2xl border border-border-light border-l-4 p-4 text-left transition-all hover:shadow-sm ${
                item._read
                  ? "bg-surface-light opacity-80"
                  : priorityStyles(item.priority)
              }`}
            >
              <div className="flex items-start gap-3">
                <span
                  className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                    isAnn
                      ? item.priority === "urgent"
                        ? "bg-status-danger/15 text-status-danger"
                        : "bg-teal-soft text-teal"
                      : "bg-blue-50 text-blue-600"
                  }`}
                >
                  {isAnn ? (
                    item.priority === "urgent" ? (
                      <AlertTriangle size={16} />
                    ) : (
                      <Megaphone size={16} />
                    )
                  ) : (
                    <Info size={16} />
                  )}
                </span>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3
                      className={`text-sm font-semibold ${
                        item._read ? "text-ink-muted" : "text-ink"
                      }`}
                    >
                      {item.title || item.message || "Notification"}
                    </h3>
                    {isAnn && item.pinned && (
                      <span className="inline-flex items-center gap-0.5 rounded-full bg-teal-soft px-1.5 py-0.5 text-[10px] font-medium text-teal">
                        <Pin size={10} /> Pinned
                      </span>
                    )}
                    {!item._read && (
                      <span className="h-2 w-2 rounded-full bg-teal" />
                    )}
                  </div>

                  <p
                    className={`mt-1 text-sm leading-relaxed ${
                      item._read ? "text-ink-muted" : "text-ink"
                    }`}
                  >
                    {isAnn ? item.body : item.body || item.message}
                  </p>

                  <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-ink-muted">
                    <span>{formatDate(item.createdAt)}</span>
                    {isAnn && item.authorName && (
                      <span>· {item.authorName}</span>
                    )}
                    {isAnn && item.priority && item.priority !== "normal" && (
                      <span className="capitalize">· {item.priority}</span>
                    )}
                    {item._read && (
                      <span className="inline-flex items-center gap-0.5 text-teal">
                        <CheckCircle2 size={12} /> Read
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}