import { useEffect, useMemo, useState } from "react";
import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  where,
} from "firebase/firestore";
import {
  FolderOpen,
  BookOpen,
  ExternalLink,
  Trash2,
  Loader2,
  FileText,
} from "lucide-react";
import { db } from "../firebase/config";
import { useAuth } from "../context/AuthContext";

export default function StudentMaterials() {
  const { user } = useAuth();
  const [saves, setSaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [removing, setRemoving] = useState(null);

  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, "materialSaves"),
      where("userId", "==", user.uid)
    );
    const unsub = onSnapshot(
      q,
      (snap) => {
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        list.sort((a, b) => {
          const ta = a.savedAt?.toDate?.() || a.savedAt || 0;
          const tb = b.savedAt?.toDate?.() || b.savedAt || 0;
          return new Date(tb) - new Date(ta);
        });
        setSaves(list);
        setLoading(false);
      },
      () => setLoading(false)
    );
    return () => unsub();
  }, [user]);

  const byCourse = useMemo(() => {
    const map = new Map();
    for (const s of saves) {
      const code = (s.courseCode || "GENERAL").toUpperCase();
      if (!map.has(code)) {
        map.set(code, {
          courseCode: code,
          courseTitle: s.courseTitle || code,
          items: [],
        });
      }
      map.get(code).items.push(s);
    }
    return Array.from(map.values()).sort((a, b) =>
      a.courseCode.localeCompare(b.courseCode)
    );
  }, [saves]);

  async function removeSave(saveId) {
    if (!window.confirm("Remove this material from your Materials?")) return;
    setRemoving(saveId);
    try {
      await deleteDoc(doc(db, "materialSaves", saveId));
    } catch (e) {
      alert(e.message || "Could not remove.");
    } finally {
      setRemoving(null);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-ink">My Materials</h1>
        <p className="text-sm text-ink-muted">
          Materials you saved from your Department feed, organised by course code.
        </p>
      </div>

      {loading && (
        <div className="flex items-center gap-2 text-sm text-ink-muted">
          <Loader2 size={16} className="animate-spin" /> Loading…
        </div>
      )}

      {!loading && saves.length === 0 && (
        <div className="rounded-2xl border border-border-light bg-card-light px-6 py-14 text-center">
          <FolderOpen className="mx-auto mb-3 text-ink-muted opacity-50" size={36} />
          <p className="text-sm font-medium text-ink">No saved materials yet</p>
          <p className="mt-1 text-xs text-ink-muted">
            Open <strong>Department</strong>, read materials from your Course Rep, and tap{" "}
            <strong>Save to Materials</strong>.
          </p>
        </div>
      )}

      <div className="space-y-6">
        {byCourse.map((group) => (
          <section
            key={group.courseCode}
            className="rounded-2xl border border-border-light bg-card-light overflow-hidden"
          >
            <div className="flex items-center gap-2 border-b border-border-light bg-bg-panel-alt/40 px-4 py-3">
              <BookOpen size={16} className="text-teal" />
              <h2 className="text-sm font-semibold text-ink">
                {group.courseCode}
                {group.courseTitle && group.courseTitle !== group.courseCode && (
                  <span className="ml-2 font-normal text-ink-muted">
                    — {group.courseTitle}
                  </span>
                )}
              </h2>
              <span className="ml-auto text-xs text-ink-muted">
                {group.items.length} item{group.items.length !== 1 ? "s" : ""}
              </span>
            </div>
            <ul className="divide-y divide-border-light">
              {group.items.map((item) => (
                <li
                  key={item.id}
                  className="flex flex-wrap items-center gap-3 px-4 py-3"
                >
                  <FileText size={16} className="shrink-0 text-teal" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-ink truncate">
                      {item.title || "Untitled"}
                    </p>
                    {item.description && (
                      <p className="mt-0.5 text-xs text-ink-muted line-clamp-2">
                        {item.description}
                      </p>
                    )}
                    <p className="mt-0.5 text-[11px] text-ink-muted">
                      Saved{" "}
                      {item.savedAt?.toDate
                        ? item.savedAt.toDate().toLocaleString()
                        : "—"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {item.fileUrl && (
                      <a
                        href={item.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 rounded-lg border border-border-light px-2.5 py-1.5 text-xs font-medium text-ink hover:border-teal hover:text-teal"
                      >
                        <ExternalLink size={12} /> Open
                      </a>
                    )}
                    <button
                      type="button"
                      onClick={() => removeSave(item.id)}
                      disabled={removing === item.id}
                      className="inline-flex items-center gap-1 rounded-lg border border-border-light px-2.5 py-1.5 text-xs text-status-danger hover:bg-status-danger/10 disabled:opacity-50"
                    >
                      {removing === item.id ? (
                        <Loader2 size={12} className="animate-spin" />
                      ) : (
                        <Trash2 size={12} />
                      )}
                      Remove
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
