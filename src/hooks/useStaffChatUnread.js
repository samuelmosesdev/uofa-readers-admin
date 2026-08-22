import { useEffect, useState } from "react";
import {
  collection,
  doc,
  onSnapshot,
  query,
  orderBy,
  limit,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase/config";
import { useAuth } from "../context/AuthContext";

/**
 * Unread Staff HQ messages for the current staff user.
 * lastReadAt stored on users/{uid}.staffChatLastReadAt
 */
export function useStaffChatUnread() {
  const { user, profile } = useAuth();
  const [unread, setUnread] = useState(0);
  const [latestAt, setLatestAt] = useState(null);

  useEffect(() => {
    if (!user) {
      setUnread(0);
      return;
    }
    const q = query(
      collection(db, "staffChat"),
      orderBy("createdAt", "desc"),
      limit(80)
    );
    const unsub = onSnapshot(
      q,
      (snap) => {
        const lastReadMs = profile?.staffChatLastReadAt?.toMillis
          ? profile.staffChatLastReadAt.toMillis()
          : profile?.staffChatLastReadAt?.seconds
            ? profile.staffChatLastReadAt.seconds * 1000
            : 0;
        let count = 0;
        let maxT = 0;
        snap.docs.forEach((d) => {
          const data = d.data();
          if (data.deleted && data.authorUid !== user.uid) return;
          const t =
            data.createdAt?.toMillis?.() ||
            (data.createdAt?.seconds || 0) * 1000 ||
            (data.clientAt ? new Date(data.clientAt).getTime() : 0);
          if (t > maxT) maxT = t;
          // Don't count own messages as unread
          if (data.authorUid === user.uid) return;
          if (t > lastReadMs) count += 1;
        });
        setUnread(count);
        setLatestAt(maxT || null);
      },
      () => setUnread(0)
    );
    return unsub;
  }, [user?.uid, profile?.staffChatLastReadAt]);

  async function markStaffChatRead() {
    if (!user) return;
    try {
      await setDoc(
        doc(db, "users", user.uid),
        { staffChatLastReadAt: serverTimestamp() },
        { merge: true }
      );
    } catch (e) {
      console.warn("markStaffChatRead", e);
    }
  }

  return { unread, markStaffChatRead, latestAt };
}
