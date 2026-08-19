import { useMemo, useState } from "react";
import { doc, updateDoc, deleteDoc } from "firebase/firestore";
import {
  Search,
  Eye,
  Pencil,
  Ban,
  CheckCircle2,
  Trash2,
  Users,
} from "lucide-react";
import { db } from "../firebase/config";
import { useAdminUsers } from "../hooks/useAdminUsers";
import EditUserModal from "../components/EditUserModal";
import ViewProfileModal from "../components/ViewProfileModal";
import {
  PageHeader,
  LoadingState,
  EmptyState,
  ErrorState,
} from "../components/ui";

export default function AdminUsers() {
  const { users, loading, error, retry } = useAdminUsers();
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState(null);
  const [viewing, setViewing] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [actionError, setActionError] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return users;
    return users.filter((u) =>
      [u.name, u.email, u.uniqueId, u.faculty, u.department]
        .filter(Boolean)
        .some((field) => String(field).toLowerCase().includes(q))
    );
  }, [users, search]);

  async function handleSaveEdit(updates) {
    setBusyId(editing.id);
    setActionError("");
    try {
      await updateDoc(doc(db, "users", editing.id), updates);
      setEditing(null);
    } catch (err) {
      setActionError(err.message || "Couldn't save changes.");
    } finally {
      setBusyId(null);
    }
  }

  async function toggleSuspend(user) {
    setBusyId(user.id);
    setActionError("");
    try {
      await updateDoc(doc(db, "users", user.id), {
        status: user.status === "suspended" ? "active" : "suspended",
      });
    } catch (err) {
      setActionError(err.message || "Couldn't update status.");
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete(user) {
    const ok = window.confirm(
      `Delete ${user.name || user.email}? This removes their profile and Unique ID. Prefer Suspend if you only want to block access.`
    );
    if (!ok) return;
    setBusyId(user.id);
    setActionError("");
    try {
      if (user.uniqueId) {
        await deleteDoc(doc(db, "idLookup", user.uniqueId)).catch(() => {});
      }
      await deleteDoc(doc(db, "users", user.id));
    } catch (err) {
      setActionError(err.message || "Couldn't delete user.");
    } finally {
      setBusyId(null);
    }
  }

  if (loading) return <LoadingState message="Loading users…" />;
  if (error) {
    return <ErrorState title="Couldn't load users" message={error} onRetry={retry} />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Users"
        description="Search, view, edit, suspend or remove student accounts."
        actions={
          <div className="flex w-full max-w-xs items-center gap-2 rounded-lg border border-border-subtle bg-bg-panel px-3 py-2 sm:w-64">
            <Search size={15} className="shrink-0 text-text-muted" aria-hidden="true" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, email, ID…"
              aria-label="Search users"
              className="w-full bg-transparent text-sm text-text-primary placeholder:text-text-muted focus:outline-none"
            />
          </div>
        }
      />

      {actionError && (
        <div
          role="alert"
          className="rounded-lg border border-status-danger/30 bg-status-danger/10 px-3 py-2 text-sm text-status-danger"
        >
          {actionError}
        </div>
      )}

      {filtered.length === 0 ? (
        <EmptyState
          icon={Users}
          title={search ? "No matching users" : "No students yet"}
          description={
            search
              ? "Try a different name, email, or Unique ID."
              : "When students sign up, they will appear here."
          }
        />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border-subtle bg-bg-panel">
          <table className="w-full text-left text-sm">
            <caption className="sr-only">Student accounts</caption>
            <thead>
              <tr className="border-b border-border-subtle text-xs uppercase tracking-wide text-text-muted">
                <th scope="col" className="px-4 py-3 font-medium">Student</th>
                <th scope="col" className="px-4 py-3 font-medium">Faculty / Dept</th>
                <th scope="col" className="px-4 py-3 font-medium">Level</th>
                <th scope="col" className="px-4 py-3 font-medium">Plan</th>
                <th scope="col" className="px-4 py-3 font-medium">Status</th>
                <th scope="col" className="px-4 py-3 font-medium">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((user) => {
                const busy = busyId === user.id;
                const suspended = user.status === "suspended";
                return (
                  <tr key={user.id} className="border-b border-border-subtle last:border-0">
                    <td className="px-4 py-3">
                      <div className="font-medium text-text-primary">{user.name || "—"}</div>
                      <div className="text-xs text-text-muted">
                        {user.email}
                        {user.uniqueId ? ` · ${user.uniqueId}` : ""}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-text-secondary">
                      {[user.faculty, user.department].filter(Boolean).join(" / ") || "—"}
                    </td>
                    <td className="px-4 py-3 text-text-secondary">{user.level || "—"}</td>
                    <td className="px-4 py-3 text-text-secondary">
                      {user.plan || user.subscription || "free"}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                          suspended
                            ? "bg-status-danger/15 text-status-danger"
                            : "bg-accent-soft text-accent"
                        }`}
                      >
                        {suspended ? "Suspended" : "Active"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => setViewing(user)}
                          className="rounded-lg p-2 text-text-muted transition hover:bg-bg-elevated hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:opacity-50"
                          aria-label={`View ${user.name || user.email}`}
                        >
                          <Eye size={15} aria-hidden="true" />
                        </button>
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => setEditing(user)}
                          className="rounded-lg p-2 text-text-muted transition hover:bg-bg-elevated hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:opacity-50"
                          aria-label={`Edit ${user.name || user.email}`}
                        >
                          <Pencil size={15} aria-hidden="true" />
                        </button>
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => toggleSuspend(user)}
                          className="rounded-lg p-2 text-text-muted transition hover:bg-bg-elevated hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:opacity-50"
                          aria-label={
                            suspended
                              ? `Reactivate ${user.name || user.email}`
                              : `Suspend ${user.name || user.email}`
                          }
                        >
                          {suspended ? (
                            <CheckCircle2 size={15} aria-hidden="true" />
                          ) : (
                            <Ban size={15} aria-hidden="true" />
                          )}
                        </button>
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => handleDelete(user)}
                          className="rounded-lg p-2 text-text-muted transition hover:bg-status-danger/10 hover:text-status-danger focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-status-danger disabled:opacity-50"
                          aria-label={`Delete ${user.name || user.email}`}
                        >
                          <Trash2 size={15} aria-hidden="true" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {editing && (
        <EditUserModal
          user={editing}
          open={!!editing}
          busy={busyId === editing.id}
          onClose={() => setEditing(null)}
          onSave={handleSaveEdit}
        />
      )}

      {viewing && (
        <ViewProfileModal
          user={viewing}
          open={!!viewing}
          onClose={() => setViewing(null)}
        />
      )}
    </div>
  );
}
