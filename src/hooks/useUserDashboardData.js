import { useEffect, useMemo, useState } from "react";
import {
  collection,
  onSnapshot,
  query,
  where,
  orderBy,
  limit,
} from "firebase/firestore";
import { db } from "../firebase/config";
import { useAuth } from "../context/AuthContext";

/**
 * Live student dashboard data from Firestore.
 * KPIs are derived from real enrollments + profile counters so figures stay accurate.
 */
export function useUserDashboardData() {
  const { user, profile, loading: authLoading } = useAuth();
  const [enrollments, setEnrollments] = useState([]);
  const [allEnrollments, setAllEnrollments] = useState([]);
  const [recommended, setRecommended] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    // Recent for "continue studying"
    const recentQ = query(
      collection(db, "enrollments"),
      where("userId", "==", user.uid),
      orderBy("lastAccessedAt", "desc"),
      limit(5)
    );
    const unsubRecent = onSnapshot(
      recentQ,
      (snap) => {
        setEnrollments(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setLoading(false);
      },
      () => {
        // Fallback without orderBy if index missing
        const simple = query(collection(db, "enrollments"), where("userId", "==", user.uid));
        return onSnapshot(simple, (snap) => {
          const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
          list.sort((a, b) => {
            const ta = a.lastAccessedAt?.toMillis?.() || 0;
            const tb = b.lastAccessedAt?.toMillis?.() || 0;
            return tb - ta;
          });
          setEnrollments(list.slice(0, 5));
          setAllEnrollments(list);
          setLoading(false);
        });
      }
    );

    // All enrollments for accurate KPI count
    const allQ = query(collection(db, "enrollments"), where("userId", "==", user.uid));
    const unsubAll = onSnapshot(allQ, (snap) => {
      setAllEnrollments(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });

    const recQuery = query(collection(db, "courses"), limit(12));
    const unsubRec = onSnapshot(recQuery, (snap) => {
      setRecommended(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });

    const notifQuery = query(
      collection(db, "notifications"),
      where("userId", "==", user.uid),
      where("readByUser", "==", false)
    );
    const unsubNotif = onSnapshot(notifQuery, (snap) => setUnreadCount(snap.size), () => {});

    return () => {
      unsubRecent();
      unsubAll();
      unsubRec();
      unsubNotif();
    };
  }, [user]);

  const kpis = useMemo(() => {
    const enrolledCount =
      allEnrollments.length || profile?.coursesEnrolledCount || 0;

    const avgProgress =
      allEnrollments.length > 0
        ? Math.round(
            allEnrollments.reduce((s, e) => s + (Number(e.progressPct) || 0), 0) /
              allEnrollments.length
          )
        : 0;

    const questionsFromEnrollments = allEnrollments.reduce(
      (s, e) => s + (Number(e.questionsDone) || 0),
      0
    );

    return {
      coursesEnrolled: enrolledCount,
      questionsPracticed:
        questionsFromEnrollments || profile?.questionsPracticedCount || 0,
      studyStreakDays: profile?.studyStreakDays ?? 0,
      materialsOpened: profile?.materialsOpenedCount ?? 0,
      avgProgress,
      plan: profile?.plan === "annual" || profile?.plan === "paid" || profile?.plan === "pro" ? "Pro" : "Free",
      isPaid: profile?.plan === "annual" || profile?.plan === "paid" || profile?.plan === "pro",
    };
  }, [allEnrollments, profile]);

  return {
    profile,
    kpis,
    enrollments,
    allEnrollments,
    recommended,
    unreadCount,
    loading: authLoading || loading,
  };
}
