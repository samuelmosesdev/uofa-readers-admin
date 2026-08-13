import { useMemo, useState } from "react";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  serverTimestamp,
  updateDoc,
  getDocs,
  query,
  where,
  writeBatch,
} from "firebase/firestore";
import {
  Megaphone,
  Plus,
  Search,
  Pencil,
  Trash2,
  Pin,
  Eye,
  EyeOff,
  X,
} from "lucide-react";
import { db } from "../firebase/config";
import { useAdminAnnouncements } from "../hooks/useAdminAnnouncements";
import { useAuth } from "../context/AuthContext";
import Modal from "../components/Modal";
import { FACULTIES } from "../data/facultyData";
import { fanOutAnnouncementNotifications } from "../lib/notify";

const LEVELS = [
  "100 Level",
  "200 Level",
  "300 Level",
  "400 Level",
  "500 Level",
  "Postgraduate",
  "General",
];

const PRIORITIES = [
  { value: "normal", label: "Normal" },
  { value: "high", label: "High" },
  { value: "urgent", label: "Urgent" },
];

const emptyForm = {
  title: "",
  body: "",
  priority: "normal",
  pinned: false,
  published: true,
  audience: "all", // all | faculty | level
  faculty: "",
  level: "",
  expiresAt: "", // optional ISO date string
};

export default function AdminAnnouncements() {
  const { announcements, loading } = useAdminAnnouncements();
  const { profile, user } = useAuth();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all"); // all | published | draft | pinned
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const filtered = useMemo(() => {
    let list = announcements;

    if (filter === "published") list = list.filter((a) => a.published);
    if (filter === "draft") list = list.filter((a) => !a.published);
    if (filter === "pinned") list = list.filter((a) => a.pinned);

    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter((a) =>
        [a.title, a.body, a.faculty, a.level]
          .filter(Boolean)
          .some((f) => f.toLowerCase().includes(q))
      );
    }
    return list;
  }, [announcements, search, filter]);

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setError("");
    setModalOpen(true);
  }

  function openEdit(item) {
    setEditing(item);
    setForm({
      title: item.title || "",
      body: item.body || "",
      priority: item.priority || "normal",
      pinned: !!item.pinned,
      published: item.published !== false,
      audience: item.audience || "all",
      faculty: item.faculty || "",
      level: item.level || "",
      expiresAt: item.expiresAt
        ? new Date(item.expiresAt.seconds ? item.expiresAt.seconds * 1000 : item.expiresAt)
            .toISOString()
            .slice(0, 16)
        : "",
    });
    setError("");
    setModalOpen(true);
  }

  function updateField(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (!form.title.trim()) return setError("Title is required.");
    if (!form.body.trim()) return setError("Body is required.");

    setBusy(true);
    try {
      const payload = {
        title: form.title.trim(),
        body: form.body.trim(),
        priority: form.priority,
        pinned: form.pinned,
        published: form.published,
        audience: form.audience,
        faculty: form.audience === "faculty" ? form.faculty || null : null,
        level: form.audience === "level" ? form.level || null : null,
        expiresAt: form.expiresAt ? new Date(form.expiresAt) : null,
        updatedAt: serverTimestamp(),
        authorName: profile?.name || user?.email || "Admin",
        authorId: user?.uid || null,
      };

      if (editing) {
        await updateDoc(doc(db, "announcements", editing.id), payload);

        // If newly published, fan-out notifications
        if (payload.published && !editing.published) {
          await fanOutAnnouncementNotifications({
            announcementId: editing.id,
            title: payload.title,
            body: payload.body,
            priority: payload.priority,
            audience: payload.audience,
            faculty: payload.faculty,
            level: payload.level,
          });
        }
      } else {
        const ref = await addDoc(collection(db, "announcements"), {
          ...payload,
          createdAt: serverTimestamp(),
          viewCount: 0,
        });

        if (payload.published) {
          await fanOutAnnouncementNotifications({
            announcementId: ref.id,
            title: payload.title,
            body: payload.body,
            priority: payload.priority,
            audience: payload.audience,
            faculty: payload.faculty,
            level: payload.level,
          });
        }
      }
      setModalOpen(false);
      setEditing(null);
      setForm(emptyForm);
    } catch (err) {
      setError(err.message || "Could not save announcement.");
    } finally {
      setBusy(false);
    }
  }

  async function togglePublish(item) {
    try {
      const nextPublished = !item.published;
      await updateDoc(doc(db, "announcements", item.id), {
        published: nextPublished,
        updatedAt: serverTimestamp(),
      });

      // Fan out here too — this is the other place `published` can flip,
      // and it was previously skipping notifications entirely.
      if (nextPublished && !item.published) {
        await fanOutAnnouncementNotifications({
          announcementId: item.id,
          title: item.title,
          body: item.body,
          priority: item.priority,
          audience: item.audience,
          faculty: item.faculty,
          level: item.level,
        });
      }
    } catch (err) {
      alert(err.message || "Update failed.");
    }
  }

  async function togglePin(item) {
    try {
      await updateDoc(doc(db, "announcements", item.id), {
        pinned: !item.pinned,
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      alert(err.message || "Update failed.");
    }
  }

  async function handleDelete(item) {
    const ok = window.confirm(`Delete "${item.title}"? This cannot be undone.`);
    if (!ok) return;
    try {
      await deleteDoc(doc(db, "announcements", item.id));
    } catch (err) {
      alert(err.message || "Delete failed.");
    }
  }

  function priorityBadge(priority) {
    if (priority === "urgent")
      return "bg-status-danger/15 text-status-danger";
    if (priority === "high")
      return "bg-status-warning/15 text-status-warning";
    return "bg-bg-elevated text-text-secondary";
  }

  const fieldClass =
    "w-full rounded-lg border border-border-subtle bg-bg-panel-alt px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-lg font-semibold text-text-primary">Announcements</h1>
          <p className="text-sm text-text-muted">
            Broadcast messages to students. Pinned items appear at the top.
          </p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-bg-app hover:bg-accent-strong"
        >
          <Plus size={16} />
          New announcement
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {[
            { id: "all", label: "All" },
            { id: "published", label: "Published" },
            { id: "draft", label: "Drafts" },
            { id: "pinned", label: "Pinned" },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`rounded-lg px-3 py-1.5 text-sm transition-colors ${
                filter === f.id
                  ? "bg-bg-elevated text-text-primary font-medium"
                  : "text-text-secondary hover:bg-bg-panel-alt hover:text-text-primary"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="flex w-full max-w-xs items-center gap-2 rounded-lg border border-border-subtle bg-bg-panel px-3 py-2">
          <Search size={15} className="text-text-muted" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search announcements…"
            className="w-full bg-transparent text-sm text-text-primary placeholder:text-text-muted focus:outline-none"
          />
        </div>
      </div>

      {/* List */}
      <div className="divide-y divide-border-subtle rounded-xl border border-border-subtle bg-bg-panel">
        {loading && (
          <div className="px-4 py-8 text-center text-sm text-text-muted">Loading…</div>
        )}
        {!loading && filtered.length === 0 && (
          <div className="px-4 py-10 text-center">
            <Megaphone size={28} className="mx-auto mb-2 text-text-muted" />
            <p className="text-sm text-text-muted">No announcements yet.</p>
            <button
              onClick={openCreate}
              className="mt-3 text-sm font-medium text-accent hover:underline"
            >
              Create the first one
            </button>
          </div>
        )}

        {filtered.map((a) => (
          <div
            key={a.id}
            className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-start sm:justify-between"
          >
            <div className="min-w-0 flex-1 space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                {a.pinned && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-accent-soft px-2 py-0.5 text-[11px] font-medium text-accent">
                    <Pin size={11} /> Pinned
                  </span>
                )}
                <span
                  className={`rounded-full px-2 py-0.5 text-[11px] font-medium capitalize ${priorityBadge(
                    a.priority
                  )}`}
                >
                  {a.priority || "normal"}
                </span>
                {!a.published && (
                  <span className="rounded-full bg-bg-elevated px-2 py-0.5 text-[11px] font-medium text-text-muted">
                    Draft
                  </span>
                )}
              </div>

              <h3 className="text-sm font-semibold text-text-primary">{a.title}</h3>
              <p className="line-clamp-2 text-sm text-text-secondary">{a.body}</p>

              <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-text-muted">
                <span>
                  {a.createdAt?.seconds
                    ? new Date(a.createdAt.seconds * 1000).toLocaleString()
                    : "—"}
                </span>
                {a.authorName && <span>by {a.authorName}</span>}
                {a.audience === "faculty" && a.faculty && (
                  <span>Faculty: {a.faculty}</span>
                )}
                {a.audience === "level" && a.level && <span>Level: {a.level}</span>}
                {a.audience === "all" && <span>All students</span>}
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <button
                onClick={() => togglePin(a)}
                className={`rounded-lg p-2 ${
                  a.pinned
                    ? "text-accent hover:bg-accent-soft"
                    : "text-text-secondary hover:bg-bg-panel-alt hover:text-text-primary"
                }`}
                title={a.pinned ? "Unpin" : "Pin"}
              >
                <Pin size={16} />
              </button>
              <button
                onClick={() => togglePublish(a)}
                className="rounded-lg p-2 text-text-secondary hover:bg-bg-panel-alt hover:text-text-primary"
                title={a.published ? "Unpublish" : "Publish"}
              >
                {a.published ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
              <button
                onClick={() => openEdit(a)}
                className="rounded-lg p-2 text-text-secondary hover:bg-bg-panel-alt hover:text-accent"
                title="Edit"
              >
                <Pencil size={16} />
              </button>
              <button
                onClick={() => handleDelete(a)}
                className="rounded-lg p-2 text-text-secondary hover:bg-bg-panel-alt hover:text-status-danger"
                title="Delete"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Create / Edit Modal */}
      <Modal
        title={editing ? "Edit announcement" : "New announcement"}
        open={modalOpen}
        onClose={() => !busy && setModalOpen(false)}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-text-primary">
              Title
            </label>
            <input
              value={form.title}
              onChange={(e) => updateField("title", e.target.value)}
              placeholder="e.g. Mid-semester break schedule"
              className={fieldClass}
              autoFocus
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-text-primary">
              Body
            </label>
            <textarea
              value={form.body}
              onChange={(e) => updateField("body", e.target.value)}
              placeholder="Write the full message…"
              rows={5}
              className={fieldClass}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-text-primary">
                Priority
              </label>
              <select
                value={form.priority}
                onChange={(e) => updateField("priority", e.target.value)}
                className={fieldClass}
              >
                {PRIORITIES.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-text-primary">
                Audience
              </label>
              <select
                value={form.audience}
                onChange={(e) => updateField("audience", e.target.value)}
                className={fieldClass}
              >
                <option value="all">All students</option>
                <option value="faculty">Specific faculty</option>
                <option value="level">Specific level</option>
              </select>
            </div>
          </div>

          {form.audience === "faculty" && (
            <div>
              <label className="mb-1.5 block text-sm font-medium text-text-primary">
                Faculty
              </label>
              <select
                value={form.faculty}
                onChange={(e) => updateField("faculty", e.target.value)}
                className={fieldClass}
              >
                <option value="">Select faculty…</option>
                {FACULTIES.map((f) => (
                  <option key={f.name} value={f.name}>
                    {f.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {form.audience === "level" && (
            <div>
              <label className="mb-1.5 block text-sm font-medium text-text-primary">
                Level
              </label>
              <select
                value={form.level}
                onChange={(e) => updateField("level", e.target.value)}
                className={fieldClass}
              >
                <option value="">Select level…</option>
                {LEVELS.map((lvl) => (
                  <option key={lvl} value={lvl}>
                    {lvl}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="mb-1.5 block text-sm font-medium text-text-primary">
              Expires at (optional)
            </label>
            <input
              type="datetime-local"
              value={form.expiresAt}
              onChange={(e) => updateField("expiresAt", e.target.value)}
              className={fieldClass}
            />
          </div>

          <div className="flex flex-wrap gap-6 pt-1">
            <label className="flex items-center gap-2 text-sm text-text-primary">
              <input
                type="checkbox"
                checked={form.pinned}
                onChange={(e) => updateField("pinned", e.target.checked)}
                className="h-4 w-4 rounded border-border-subtle accent-[var(--color-accent)]"
              />
              Pin to top
            </label>
            <label className="flex items-center gap-2 text-sm text-text-primary">
              <input
                type="checkbox"
                checked={form.published}
                onChange={(e) => updateField("published", e.target.checked)}
                className="h-4 w-4 rounded border-border-subtle accent-[var(--color-accent)]"
              />
              Publish immediately
            </label>
          </div>

          {error && <p className="text-sm text-status-danger">{error}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              disabled={busy}
              className="rounded-lg border border-border-subtle px-4 py-2 text-sm text-text-secondary hover:text-text-primary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={busy}
              className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-bg-app hover:bg-accent-strong disabled:opacity-60"
            >
              {busy ? "Saving…" : editing ? "Update" : "Create"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}