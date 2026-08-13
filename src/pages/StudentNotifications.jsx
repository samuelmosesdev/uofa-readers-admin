import { useEffect, useMemo, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { Bell, Megaphone } from "lucide-react";
import { db } from "../firebase/config";
import { useAuth } from "../context/AuthContext";

export default function StudentNotifications() {
  const { profile } = useAuth();
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    return onSnapshot(
      collection(db, "announcements"),
      (snap) => {
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        list.sort((a, b) => {
          if (a.pinned && !b.pinned) return -1;
          if (!a.pinned && b.pinned) return 1;
          return (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0);
        });
        setAnnouncements(list);
        setLoading(false);
      },
      () => setLoading(false)
    );
  }, []);

  const visible = useMemo(() => {
    return announcements.filter((a) => {
      if (a.active === false) return false;
      const aud = a.audience || "all";
      if (aud === "all" || aud === "students") return true;
      return false;
    });
  }, [announcements]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-ink">Notifications</h1>
        <p className="text-sm text-ink-muted">
          Announcements and updates from UofA Readers
          {profile?.name ? ` · ${profile.name.split(" ")[0]}` : ""}.
        </p>
      </div>

      {loading && <p className="text-sm text-ink-muted">Loading…</p>}

      {!loading && visible.length === 0 && (
        <div className="rounded-xl border border-border-light bg-card-light px-4 py-12 text-center text-sm text-ink-muted">
          <Bell className="mx-auto mb-2 opacity-50" size={28} />
          No notifications yet. Check back after admin posts an announcement.
        </div>
      )}

      <div className="space-y-3">
        {visible.map((item) => (
          <article
            key={item.id}
            className="rounded-2xl border border-border-light bg-card-light p-4 shadow-sm"
          >
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-soft text-teal">
                <Megaphone size={18} />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  {item.pinned && (
                    <span className="rounded bg-teal/15 px-1.5 py-0.5 text-[10px] font-bold text-teal">
                      PINNED
                    </span>
                  )}
                  <h2 className="text-sm font-semibold text-ink">{item.title}</h2>
                </div>
                <p className="mt-1 whitespace-pre-wrap text-sm text-ink-muted">{item.body}</p>
                <p className="mt-2 text-xs text-ink-muted">
                  {item.createdByName || "Admin"}
                  {item.createdAt?.toDate
                    ? ` · ${item.createdAt.toDate().toLocaleString()}`
                    : ""}
                </p>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
