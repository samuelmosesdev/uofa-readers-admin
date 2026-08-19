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

/**
 * Live admin dashboard data.
 *
 * Every value here is driven by Firestore `onSnapshot` listeners, so the
 * dashboard re-renders automatically the moment a document is added,
 * edited, or removed in Firestore -- no page refresh, no static numbers.
 *
 * Firestore collections expected:
 *  - users            { name, email, role, plan: 'free' | 'annual', createdAt }
 *  - agents           { name, email, status: 'active' | 'inactive', createdAt }
 *  - documents        { title, uploadedBy, createdAt }
 *  - subscriptions    { userId, status: 'active' | 'expired', plan, startedAt }
 *  - activityLog      { userName, avatarUrl, action, detail, status, createdAt }
 */
export function useDashboardData() {
  const [users, setUsers] = useState([]);
  const [agents, setAgents] = useState([]);
  const [documentsCount, setDocumentsCount] = useState(0);
  const [activeSubscriptions, setActiveSubscriptions] = useState(0);
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubUsers = onSnapshot(collection(db, "users"), (snap) => {
      setUsers(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });

    const unsubAgents = onSnapshot(collection(db, "agents"), (snap) => {
      setAgents(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });

    const unsubDocuments = onSnapshot(collection(db, "documents"), (snap) => {
      setDocumentsCount(snap.size);
    });

    const subsQuery = query(
      collection(db, "subscriptions"),
      where("status", "==", "active")
    );
    const unsubSubs = onSnapshot(subsQuery, (snap) => {
      setActiveSubscriptions(snap.size);
    });

    const activityQuery = query(
      collection(db, "activityLog"),
      orderBy("createdAt", "desc"),
      limit(6)
    );
    const unsubActivity = onSnapshot(activityQuery, (snap) => {
      setRecentActivity(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });

    return () => {
      unsubUsers();
      unsubAgents();
      unsubDocuments();
      unsubSubs();
      unsubActivity();
    };
  }, []);

  const kpis = useMemo(() => {
    const activeAgents = agents.filter((a) => a.status === "active").length;
    return {
      totalUsers: users.length,
      activeAgents,
      documentsUploaded: documentsCount,
      activeSubscriptions,
    };
  }, [users, agents, documentsCount, activeSubscriptions]);

  const freeVsPaid = useMemo(() => {
    const paid = users.filter((u) => u.plan === "annual").length;
    const free = users.length - paid;
    const total = users.length || 1;
    return {
      paid,
      free,
      paidPct: Math.round((paid / total) * 100),
      freePct: Math.round((free / total) * 100),
    };
  }, [users]);

  const userGrowth = useMemo(() => {
    // Group signups by month for the last 12 months into a running total.
    const now = new Date();
    const months = Array.from({ length: 12 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (11 - i), 1);
      return { key: `${d.getFullYear()}-${d.getMonth()}`, label: d.toLocaleString("default", { month: "short" }), count: 0 };
    });
    const indexByKey = Object.fromEntries(months.map((m, i) => [m.key, i]));

    users.forEach((u) => {
      const created = u.createdAt?.toDate ? u.createdAt.toDate() : u.createdAt ? new Date(u.createdAt) : null;
      if (!created) return;
      const key = `${created.getFullYear()}-${created.getMonth()}`;
      if (key in indexByKey) months[indexByKey[key]].count += 1;
    });

    let running = 0;
    return months.map((m) => {
      running += m.count;
      return { label: m.label, users: running };
    });
  }, [users]);

  return { kpis, freeVsPaid, userGrowth, recentActivity, loading };
}
