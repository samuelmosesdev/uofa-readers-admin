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

/**
 * Notify Course Rep(s) for a specific department + level when a new student joins.
 * Course Rep is scoped per department AND level (not whole department).
 */
export async function notifyCourseRepOfNewStudent({
  studentUid,
  studentName,
  studentEmail,
  department,
  level,
  faculty,
}) {
  if (!department || !level) return { notified: 0 };

  // Prefer denormalized fields for query; fall back to scanning courseReps
  let reps = [];
  try {
    const q = query(
      collection(db, "users"),
      where("role", "==", "courseRep"),
      where("courseRepDepartment", "==", department),
      where("courseRepLevel", "==", level)
    );
    const snap = await getDocs(q);
    reps = snap.docs;
  } catch (e) {
    // Missing index or fields — scan all courseReps and filter
    console.warn("notifyCourseRepOfNewStudent: indexed query failed, scanning", e);
    const snap = await getDocs(
      query(collection(db, "users"), where("role", "==", "courseRep"))
    );
    reps = snap.docs.filter((d) => {
      const u = d.data();
      const dep =
        u.courseRepDepartment ||
        u.courseRepMeta?.department ||
        u.department ||
        "";
      const lvl =
        u.courseRepLevel || u.courseRepMeta?.level || u.level || "";
      return dep === department && lvl === level;
    });
  }

  if (!reps.length) return { notified: 0 };

  const title = "New student in your class";
  const body = [
    studentName || studentEmail || "A student",
    `joined ${department}`,
    `(${level})`,
    faculty ? `· ${faculty}` : "",
  ]
    .filter(Boolean)
    .join(" ");

  for (const repDoc of reps) {
    await addDoc(collection(db, "notifications"), {
      userId: repDoc.id,
      type: "new_student",
      title,
      body: body.slice(0, 280),
      studentUid: studentUid || null,
      department,
      level,
      faculty: faculty || null,
      readByUser: false,
      readByAdmin: true,
      createdAt: serverTimestamp(),
    });
  }

  return { notified: reps.length };
}
