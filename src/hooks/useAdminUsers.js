import { useEffect, useState } from "react";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "../firebase/config";

/**
 * Loads students, course reps, and agents for the Admin Users page.
 * (Previously only role == "user", so Course Reps disappeared after assignment.)
 */
export function useAdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Prefer one query for the roles we care about.
    // Firestore "in" supports up to 30 values.
    const q = query(
      collection(db, "users"),
      where("role", "in", ["user", "courseRep", "agent", "alphaAgent"])
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        list.sort(
          (a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)
        );
        setUsers(list);
        setLoading(false);
        setError(null);
      },
      (err) => {
        // Fallback: if "in" query fails (rules/index), load all and filter client-side
        console.warn("useAdminUsers query failed, falling back:", err?.message);
        const unsubAll = onSnapshot(
          collection(db, "users"),
          (snap) => {
            const list = snap.docs
              .map((d) => ({ id: d.id, ...d.data() }))
              .filter((u) => {
                const r = u.role || "user";
                return (
                  r === "user" ||
                  r === "courseRep" ||
                  r === "agent" ||
                  r === "alphaAgent"
                );
              });
            list.sort(
              (a, b) =>
                (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)
            );
            setUsers(list);
            setLoading(false);
            setError(null);
          },
          (err2) => {
            setError(err2.message || "Failed to load users");
            setLoading(false);
          }
        );
        return unsubAll;
      }
    );

    return () => unsub();
  }, []);

  function retry() {
    setLoading(true);
    setError(null);
  }

  return { users, loading, error, retry };
}