import { useState } from "react";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase/config";
import { useAuth } from "../context/AuthContext";
import {
  isAdmin,
  isAlpha,
  ADMIN_ASSIGNABLE,
  ALPHA_ASSIGNABLE,
  ROLE_LABELS,
} from "../lib/roles";
import { logActivity } from "../lib/activityLog";

/**
 * Drop this into AdminUsers row actions.
 *
 * <AssignRoleControl targetUser={u} />
 */
export default function AssignRoleControl({ targetUser }) {
  const { user, profile } = useAuth();
  const [role, setRole] = useState(targetUser.role || "user");
  const [codes, setCodes] = useState(
    (targetUser.courseRepMeta?.courseCodes || []).join(", ")
  );
  const [busy, setBusy] = useState(false);

  if (!isAdmin(profile) && !isAlpha(profile)) return null;
  // Alpha cannot edit admins
  if (isAlpha(profile) && targetUser.role === "admin") return null;

  const options = isAdmin(profile) ? ADMIN_ASSIGNABLE : ALPHA_ASSIGNABLE;

  async function save() {
    if (!options.includes(role)) return;
    setBusy(true);
    try {
      const patch = {
        role,
        assignedBy: user.uid,
        assignedAt: serverTimestamp(),
      };
      if (role === "courseRep") {
        patch.courseRepMeta = {
          courseCodes: codes
            .split(",")
            .map((s) => s.trim().toUpperCase())
            .filter(Boolean),
          faculty: targetUser.faculty || null,
          department: targetUser.department || null,
        };
      } else {
        patch.courseRepMeta = null;
      }

      await updateDoc(doc(db, "users", targetUser.id), patch);
      await logActivity({
        actorUid: user.uid,
        actorName: profile?.name || user.email,
        action: "role.change",
        targetUid: targetUser.id,
        targetName: targetUser.name || targetUser.email,
        meta: { from: targetUser.role, to: role },
      });
      alert(`Role updated to ${ROLE_LABELS[role] || role}`);
    } catch (err) {
      alert(err.message || "Failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-2 flex flex-col gap-1 rounded-lg border border-border-subtle bg-bg-panel-alt p-2">
      <select
        value={role}
        onChange={(e) => setRole(e.target.value)}
        className="rounded border border-border-subtle bg-bg-panel px-2 py-1 text-xs"
      >
        {options.map((r) => (
          <option key={r} value={r}>
            {ROLE_LABELS[r] || r}
          </option>
        ))}
      </select>
      {role === "courseRep" && (
        <input
          value={codes}
          onChange={(e) => setCodes(e.target.value)}
          placeholder="Course codes: CSC101, CSC102"
          className="rounded border border-border-subtle bg-bg-panel px-2 py-1 text-xs"
        />
      )}
      <button
        type="button"
        disabled={busy}
        onClick={save}
        className="rounded bg-accent px-2 py-1 text-xs font-semibold text-bg-app disabled:opacity-60"
      >
        {busy ? "Saving…" : "Save role"}
      </button>
    </div>
  );
}
