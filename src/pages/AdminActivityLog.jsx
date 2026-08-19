import { useEffect, useMemo, useState } from "react";
import {
  collection,
  limit,
  onSnapshot,
  orderBy,
  query,
} from "firebase/firestore";
import { ScrollText, Search } from "lucide-react";
import { db } from "../firebase/config";
import { useAuth } from "../context/AuthContext";
import { isAdmin, isAlpha } from "../lib/roles";

export default function AdminActivityLog() {
  const { profile } = useAuth();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const allowed = isAdmin(profile) || isAlpha(profile);

  useEffect(() => {
    if (!allowed) return;
    const q = query(
      collection(db, "activityLog"),
      orderBy("createdAt", "desc"),
      limit(200)
    );
    const unsub = onSnapshot(
      q,
      (snap) => {
        setLogs(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setLoading(false);
      },
      () => setLoading(false)
    );
    return unsub;
  }, [allowed]);

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    if (!s) return logs;
    return logs.filter((l) =>
      [l.action, l.actorName, l.userName, l.targetName, l.reference]
        .filter(Boolean)
        .some((x) => String(x).toLowerCase().includes(s))
    );
  }, [logs, search]);

  if (!allowed) {
    return (
      <p className="text-sm text-text-muted">
        Only Admin and Alpha Agents can view the activity log.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-text-primary">Activity log</h1>
        <p className="text-sm text-text-secondary">
          Role changes, suspensions, approvals, deletes and PRO changes.
        </p>
      </div>

      <div className="flex items-center gap-2 rounded-lg border border-border-subtle bg-bg-panel px-3 py-2 sm:max-w-sm">
        <Search size={15} className="text-text-muted" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search actions, names…"
          className="w-full bg-transparent text-sm focus:outline-none"
        />
      </div>

      {loading && <p className="text-sm text-text-muted">Loading…</p>}

      {!loading && filtered.length === 0 && (
        <div className="rounded-xl border border-dashed border-border-subtle p-10 text-center text-sm text-text-muted">
          <ScrollText size={28} className="mx-auto mb-2 opacity-50" />
          No activity yet.
        </div>
      )}

      <div className="divide-y divide-border-subtle overflow-hidden rounded-xl border border-border-subtle bg-bg-panel">
        {filtered.map((l) => (
          <div key={l.id} className="px-4 py-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded bg-bg-elevated px-1.5 py-0.5 text-[11px] font-mono text-text-secondary">
                {l.action}
              </span>
              <span className="text-xs text-text-muted">
                {l.createdAt?.toDate
                  ? l.createdAt.toDate().toLocaleString()
                  : "—"}
              </span>
            </div>
            <p className="mt-1 text-sm text-text-primary">
              <strong>{l.actorName || l.userName || "System"}</strong>
              {l.targetName ? <> → {l.targetName}</> : null}
            </p>
            {l.reference && (
              <p className="text-xs text-text-muted">Ref: {l.reference}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
