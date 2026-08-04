import { useEffect, useMemo, useState } from "react";
import {
  collection,
  doc,
  onSnapshot,
  query,
  where,
  orderBy,
  limit,
} from "firebase/firestore";
import { db } from "../firebase/config";
import { useAuth } from "../context/AuthContext";

/**
 * Live student dashboard data -- everything here is driven by Firestore
 * `onSnapshot` listeners scoped to the signed-in user, so it updates the
 * moment progress changes, a course is enrolled, or a subscription is
 * upgraded. No mock data.
 *
 * Firestore collections expected:
 *  - users/{uid}          { name, uniqueId, plan: 'free' | 'annual', avatarUrl,
 *                            coursesEnrolledCount, questionsPracticedCount, studyStreakDays }
 *  - enrollments           { userId, courseTitle, topicLabel, progressPct, lastAccessedAt }
 *  - courses               { title, category, thumbnailUrl, code }  (used for recommendations)
 *  - notifications         { userId, readByUser, createdAt }
 */
export function useUserDashboardData() {
  const { user, profile, loading: authLoading } = useAuth();
  const [enrollments, setEnrollments] = useState([]);
  const [recommended, setRecommended] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const enrollQuery = query(
      collection(db, "enrollments"),
      where("userId", "==", user.uid),
      orderBy("lastAccessedAt", "desc"),
      limit(3)
    );
    const unsubEnroll = onSnapshot(enrollQuery, (snap) => {
      setEnrollments(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });

    const recQuery = query(collection(db, "courses"), limit(4));
    const unsubRec = onSnapshot(recQuery, (snap) => {
      setRecommended(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });

    const notifQuery = query(
      collection(db, "notifications"),
      where("userId", "==", user.uid),
      where("readByUser", "==", false)
    );
    const unsubNotif = onSnapshot(notifQuery, (snap) => setUnreadCount(snap.size));

    return () => {
      unsubEnroll();
      unsubRec();
      unsubNotif();
    };
  }, [user]);

  const kpis = useMemo(
    () => ({
      coursesEnrolled: profile?.coursesEnrolledCount ?? 0,
      questionsPracticed: profile?.questionsPracticedCount ?? 0,
      studyStreakDays: profile?.studyStreakDays ?? 0,
      plan: profile?.plan === "annual" ? "Annual" : "Free",
    }),
    [profile]
  );

  return {
    profile,
    kpis,
    enrollments,
    recommended,
    unreadCount,
    loading: authLoading || loading,
  };
}
