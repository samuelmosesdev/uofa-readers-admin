import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase/config";

/**
 * Write an audit entry. Best-effort — never throw to UI callers unless needed.
 *
 * @param {Object} opts
 * @param {string} opts.actorUid
 * @param {string} opts.actorName
 * @param {string} opts.action - e.g. "role.change", "user.suspend", "request.approve"
 * @param {string} [opts.targetUid]
 * @param {string} [opts.targetName]
 * @param {string} [opts.reference]
 * @param {Object} [opts.meta]
 */
export async function logActivity({
  actorUid,
  actorName,
  action,
  targetUid = null,
  targetName = null,
  reference = null,
  meta = {},
  status = "success",
}) {
  try {
    await addDoc(collection(db, "activityLog"), {
      actorUid: actorUid || null,
      actorName: actorName || "System",
      userName: actorName || "System", // legacy field used by dashboard table
      action,
      targetUid,
      targetName,
      reference,
      meta,
      status,
      createdAt: serverTimestamp(),
    });
  } catch (err) {
    console.warn("activityLog write failed:", err?.message || err);
  }
}
