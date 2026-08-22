import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase/config";

/** e.g. ACA-20260822-A3F9 */
export function makeActivityRef() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `ACA-${y}${m}${day}-${rand}`;
}

/**
 * Write an audit entry with a unique ref number.
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
  const ref = reference || makeActivityRef();
  try {
    const docRef = await addDoc(collection(db, "activityLog"), {
      actorUid: actorUid || null,
      actorName: actorName || "System",
      userName: actorName || "System",
      action,
      targetUid,
      targetName,
      reference: ref,
      meta,
      status,
      createdAt: serverTimestamp(),
    });
    return { id: docRef.id, reference: ref };
  } catch (err) {
    console.warn("activityLog write failed:", err?.message || err);
    return { id: null, reference: ref };
  }
}
