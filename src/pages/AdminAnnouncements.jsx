import { useEffect, useState } from "react";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { Megaphone, Plus, Trash2, Pin } from "lucide-react";
import { db } from "../firebase/config";
import { useAuth } from "../context/AuthContext";

const fieldClass =
  "w-full rounded-lg border border-border-subtle bg-bg-panel px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none";

export default function AdminAnnouncements() {
  const { profile, user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [audience, setAudience] = useState("all");
  const [pinned, setPinned] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

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
        setItems(list);
        setLoading(false);
      },
      () => setLoading(false)
    );
  }, []);

  async function handlePublish(e) {
    e.preventDefault();
    setError("");
    if (!title.trim() || !body.trim()) {
      setError("Title and message are required.");
      return;
    }
    setBusy(true);
    try {
      await addDoc(collection(db, "announcements"), {
        title: title.trim(),
        body: body.trim(),
        audience, // all | students | agents
        pinned: !!pinned,
        createdAt: serverTimestamp(),
        createdBy: user?.uid || null,
        createdByName: profile?.name || "Admin",
        active: true,
      });
      setTitle("");
      setBody("");
      setAudience("all");
      setPinned(false);
      setShowForm(false);
    } catch (err) {
      setError(err.message || "Could not publish.");
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm("Delete this announcement?")) return;
    try {
      await deleteDoc(doc(db, "announcements", id));
    } catch (err) {
      alert(err.message || "Delete failed");
    }
  }

  async function togglePin(item) {
    try {
      await updateDoc(doc(db, "announcements", item.id), { pinned: !item.pinned });
    } catch (err) {
      alert(err.message);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-text-primary">Announcements</h1>
          <p className="text-sm text-text-secondary">
            Post updates that appear in student notifications.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-bg-app hover:bg-accent-strong"
        >
          <Plus size={16} />
          {showForm ? "Cancel" : "New announcement"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handlePublish} className="space-y-3 rounded-xl border border-border-subtle bg-bg-panel p-5">
          <div>
            <label className="mb-1 block text-xs text-text-muted">Title</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} className={fieldClass} placeholder="e.g. Exam week materials live" />
          </div>
          <div>
            <label className="mb-1 block text-xs text-text-muted">Message</label>
            <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={4} className={fieldClass} placeholder="Write the full message…" />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs text-text-muted">Audience</label>
              <select value={audience} onChange={(e) => setAudience(e.target.value)} className={fieldClass}>
                <option value="all">Everyone</option>
                <option value="students">Students only</option>
                <option value="agents">Agents only</option>
              </select>
            </div>
            <label className="flex items-end gap-2 pb-2 text-sm text-text-secondary">
              <input type="checkbox" checked={pinned} onChange={(e) => setPinned(e.target.checked)} />
              Pin to top
            </label>
          </div>
          {error && <p className="text-sm text-status-danger">{error}</p>}
          <button type="submit" disabled={busy} className="rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-bg-app hover:bg-accent-strong disabled:opacity-60">
            {busy ? "Publishing…" : "Publish"}
          </button>
        </form>
      )}

      {loading && <p className="text-sm text-text-muted">Loading…</p>}
      {!loading && items.length === 0 && (
        <div className="rounded-xl border border-border-subtle bg-bg-panel px-4 py-10 text-center text-sm text-text-muted">
          <Megaphone className="mx-auto mb-2 opacity-50" size={28} />
          No announcements yet.
        </div>
      )}

      <div className="space-y-3">
        {items.map((item) => (
          <div key={item.id} className="rounded-xl border border-border-subtle bg-bg-panel p-4">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  {item.pinned && (
                    <span className="rounded bg-accent-soft px-1.5 py-0.5 text-[10px] font-bold text-accent">PINNED</span>
                  )}
                  <span className="text-[10px] uppercase text-text-muted">{item.audience || "all"}</span>
                </div>
                <h3 className="mt-1 text-sm font-semibold text-text-primary">{item.title}</h3>
                <p className="mt-1 whitespace-pre-wrap text-sm text-text-secondary">{item.body}</p>
                <p className="mt-2 text-xs text-text-muted">
                  {item.createdByName || "Admin"}
                  {item.createdAt?.toDate ? ` · ${item.createdAt.toDate().toLocaleString()}` : ""}
                </p>
              </div>
              <div className="flex gap-1">
                <button type="button" onClick={() => togglePin(item)} className="rounded-lg p-2 text-text-secondary hover:text-accent" title="Pin">
                  <Pin size={15} />
                </button>
                <button type="button" onClick={() => handleDelete(item.id)} className="rounded-lg p-2 text-text-secondary hover:text-status-danger" title="Delete">
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
