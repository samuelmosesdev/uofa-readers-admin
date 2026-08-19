import { useMemo, useState } from "react";
import { doc, updateDoc, deleteDoc } from "firebase/firestore";
import { Search, Eye, Pencil, Ban, CheckCircle2, Trash2 } from "lucide-react";
import { db } from "../firebase/config";
import { useAdminUsers } from "../hooks/useAdminUsers";
import Modal from "../components/Modal";
import EditUserModal from "../components/EditUserModal";
import ViewProfileModal from "../components/ViewProfileModal";

export default function AdminUsers() {
  const { users, loading } = useAdminUsers();
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState(null);
  const [viewing, setViewing] = useState(null);
  const [busyId, setBusyId] = useState(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return users;
    return users.filter((u) =>
      [u.name, u.email, u.uniqueId, u.faculty, u.department]
        .filter(Boolean)
        .some((field) => field.toLowerCase().includes(q))
    );
  }, [users, search]);

  async function handleSaveEdit(updates) {
    setBusyId(editing.id);
    try {
      await updateDoc(doc(db, "users", editing.id), updates);
      setEditing(null);
    } catch (err) {
      alert(err.message || "Couldn't save changes.");
    } finally {
      setBusyId(null);
    }
  }

  async function toggleSuspend(user) {
    setBusyId(user.id);
    try {
      await updateDoc(doc(db, "users", user.id), {
        status: user.status === "suspended" ? "active" : "suspended",
      });
    } catch (err) {
      alert(err.message || "Couldn't update status.");
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete(user) {
    const ok = window.confirm(
      `Delete ${user.name || user.email}? This removes their profile and Unique ID. Their login credential isn't deleted (that needs the paid plan) — use Suspend instead if you just want to block access.`
    );
    if (!ok) return;
    setBusyId(user.id);
    try {
      if (user.uniqueId) {
        await deleteDoc(doc(db, "idLookup", user.uniqueId)).catch(() => {});
      }
      await deleteDoc(doc(db, "users", user.id));
    } catch (err) {
      alert(err.message || "Couldn't delete user.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-lg font-semibold text-text-primary">Users</h1>
        <div className="flex w-full max-w-xs items-center gap-2 rounded-lg border border-border-subtle bg-bg-panel px-3 py-2 sm:w-64">
          <Search size={15} className="text-text-muted" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, email, ID…"
            className="w-full bg-transparent text-sm text-text-primary placeholder:text-text-muted focus:outline-none"
          />
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-border-subtle bg-bg-panel">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border-subtle text-xs uppercase tracking-wide text-text-muted">
              <th className="px-4 py-3 font-medium">Student</th>
              <th className="px-4 py-3 font-medium">Faculty / Dept</th>
              <th className="px-4 py-3 font-medium">Level</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-text-muted">
                  Loading…
                </td>
              </tr>
            )}
            {!loading && filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-text-muted">
                  No users found.
                </td>
              </tr>
            )}
            {filtered.map((u) => (
              <tr
                key={u.id}
                onClick={() => setViewing(u)}
                className="cursor-pointer border-b border-border-subtle last:border-0 hover:bg-bg-panel-alt"
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    {u.photoURL ? (
                      <img src={u.photoURL} alt="" className="h-8 w-8 rounded-full object-cover" />
                    ) : (
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent-soft text-xs font-semibold text-accent">
                        {(u.name || u.email || "?")[0].toUpperCase()}
                      </div>
                    )}
                    <div>
                      <div className="font-medium text-text-primary">{u.name || "—"}</div>
                      <div className="text-xs text-text-muted">{u.email}</div>
                      {u.uniqueId && <div className="text-xs text-text-muted">{u.uniqueId}</div>}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-text-secondary">
                  <div>{u.faculty || "—"}</div>
                  <div className="text-xs text-text-muted">{u.department}</div>
                </td>
                <td className="px-4 py-3 text-text-secondary">{u.level || "—"}</td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2 py-1 text-xs font-medium ${
                      u.status === "suspended"
                        ? "bg-status-danger/15 text-status-danger"
                        : "bg-accent-soft text-accent"
                    }`}
                  >
                    {u.status === "suspended" ? "Suspended" : "Active"}
                  </span>
                </td>
                <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center justify-end gap-3">
                    <button
                      onClick={() => setViewing(u)}
                      className="text-text-secondary hover:text-accent"
                      aria-label="View profile"
                    >
                      <Eye size={16} />
                    </button>
                    <button
                      onClick={() => setEditing(u)}
                      disabled={busyId === u.id}
                      className="text-text-secondary hover:text-accent"
                      aria-label="Edit"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      onClick={() => toggleSuspend(u)}
                      disabled={busyId === u.id}
                      className="text-text-secondary hover:text-status-warning"
                      aria-label={u.status === "suspended" ? "Reactivate" : "Suspend"}
                    >
                      {u.status === "suspended" ? <CheckCircle2 size={16} /> : <Ban size={16} />}
                    </button>
                    <button
                      onClick={() => handleDelete(u)}
                      disabled={busyId === u.id}
                      className="text-text-secondary hover:text-status-danger"
                      aria-label="Delete"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal title="Student profile" open={!!viewing} onClose={() => setViewing(null)}>
        {viewing && <ViewProfileModal user={viewing} />}
      </Modal>

      <Modal title="Edit user" open={!!editing} onClose={() => setEditing(null)}>
        {editing && (
          <EditUserModal
            user={editing}
            busy={busyId === editing.id}
            onSave={handleSaveEdit}
            onCancel={() => setEditing(null)}
          />
        )}
      </Modal>
    </div>
  );
}