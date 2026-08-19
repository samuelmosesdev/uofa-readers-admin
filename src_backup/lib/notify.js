import {
  addDoc,
  collection,
  doc,
  getDocs,
  query,
  serverTimestamp,
  where,
  writeBatch,
} from "firebase/firestore";
import { db } from "../firebase/config";

export async function fanOutAnnouncementNotifications({
  announcementId,
  title,
  body,
  priority,
  audience,
  faculty,
  level,
}) {
  // Pull matching students
  let usersQuery = query(collection(db, "users"), where("role", "==", "user"));
  const snap = await getDocs(usersQuery);

  const targets = snap.docs.filter((d) => {
    const u = d.data();
    if (audience === "faculty") return u.faculty === faculty;
    if (audience === "level") return u.level === level;
    return true; // all
  });

  // Firestore batches max 500
  const chunks = [];
  for (let i = 0; i < targets.length; i += 450) {
    chunks.push(targets.slice(i, i + 450));
  }

  for (const chunk of chunks) {
    const batch = writeBatch(db);
    chunk.forEach((userDoc) => {
      const notifRef = doc(collection(db, "notifications"));
      batch.set(notifRef, {
        userId: userDoc.id,
        type: "announcement",
        announcementId,
        title,
        body: body?.slice(0, 200) || "",
        priority: priority || "normal",
        readByUser: false,
        readByAdmin: true, // admin already knows — they created it
        createdAt: serverTimestamp(),
      });
    });
    await batch.commit();
  }

  // Also create one admin-facing activity notification (optional)
  await addDoc(collection(db, "notifications"), {
    type: "announcement_published",
    title: `Announcement published: ${title}`,
    body: `Sent to ${targets.length} student(s)`,
    readByAdmin: false,
    readByUser: true,
    createdAt: serverTimestamp(),
  });
}