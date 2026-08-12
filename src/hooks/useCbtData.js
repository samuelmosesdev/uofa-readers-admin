import { useEffect, useMemo, useState } from "react";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { db } from "../firebase/config";

/**
 * Live CBT data.
 *
 * Firestore collections:
 *  - courses          { title, code, faculty, department, level, semester, description, thumbnailUrl, createdAt }
 *  - cbtQuestions     {
 *                       courseCode, courseTitle, topic, faculty, department, level,
 *                       questionText, options: string[4], correctIndex: 0-3,
 *                       explanation?, difficulty: "easy"|"medium"|"hard", createdAt
 *                     }
 */
export function useCbtData() {
  const [courses, setCourses] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubCourses = onSnapshot(
      query(collection(db, "courses"), orderBy("code")),
      (snap) => {
        setCourses(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      },
      () => {}
    );

    const unsubQuestions = onSnapshot(
      collection(db, "cbtQuestions"),
      (snap) => {
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setQuestions(list);
        setLoading(false);
      },
      () => setLoading(false)
    );

    return () => {
      unsubCourses();
      unsubQuestions();
    };
  }, []);

  /** Unique course codes that actually have questions */
  const practiceSets = useMemo(() => {
    const map = new Map();

    for (const q of questions) {
      const key = q.courseCode || "GENERAL";
      if (!map.has(key)) {
        map.set(key, {
          courseCode: key,
          courseTitle: q.courseTitle || key,
          faculty: q.faculty || "",
          department: q.department || "",
          level: q.level || "",
          topics: new Set(),
          questionCount: 0,
          difficulties: { easy: 0, medium: 0, hard: 0 },
        });
      }
      const entry = map.get(key);
      entry.questionCount += 1;
      if (q.topic) entry.topics.add(q.topic);
      if (q.difficulty && entry.difficulties[q.difficulty] !== undefined) {
        entry.difficulties[q.difficulty] += 1;
      }
    }

    // Enrich with course metadata when available
    for (const c of courses) {
      if (map.has(c.code)) {
        const entry = map.get(c.code);
        entry.courseTitle = c.title || entry.courseTitle;
        entry.faculty = c.faculty || entry.faculty;
        entry.department = c.department || entry.department;
        entry.level = c.level || entry.level;
        entry.semester = c.semester;
        entry.thumbnailUrl = c.thumbnailUrl;
      }
    }

    return Array.from(map.values())
      .map((e) => ({
        ...e,
        topics: Array.from(e.topics).sort(),
      }))
      .sort((a, b) => a.courseCode.localeCompare(b.courseCode));
  }, [courses, questions]);

  return { courses, questions, practiceSets, loading };
}