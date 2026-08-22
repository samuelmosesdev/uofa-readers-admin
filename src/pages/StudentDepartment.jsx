import { useEffect, useState } from "react";
import {
  addDoc,
  collection,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import {
  Building2,
  Calendar,
  CalendarPlus,
  BookOpen,
  Pin,
  MessageCircle,
  Send,
  Loader2,
  ExternalLink,
  BookmarkPlus,
  BookmarkCheck,
  Megaphone,
  Clock,
  MapPin,
  Lock,
} from "lucide-react";
import { db } from "../firebase/config";
import { useAuth } from "../context/AuthContext";
import ScheduleClassModal from "../components/ScheduleClassModal";
import CreateAnnouncementModal from "../components/CreateAnnouncementModal";

const field =
  "w-full rounded-xl border border-border-light bg-card-light px-3 py-2 text-sm text-ink focus:border-teal focus:outline-none";

function matchesStudentLevel(itemLevel, studentLevel) {
  // Strict: only same level. Legacy docs with no level are hidden (not shared across levels).
  if (!studentLevel) return false;
  if (!itemLevel) return false;
  return String(itemLevel).trim() === String(studentLevel).trim();
}

export default function StudentDepartment() {
  const { user, profile } = useAuth();
  const department = profile?.department || "";
  const faculty = profile?.faculty || "";
  const level = profile?.level || "";

  const [classes, setClasses] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [posts, setPosts] = useState([]);
  const [savedIds, setSavedIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState({});
  const [commentBusy, setCommentBusy] = useState({});
  const [classCommentText, setClassCommentText] = useState({});
  const [classCommentBusy, setClassCommentBusy] = useState({});
  const [expandedClassComments, setExpandedClassComments] = useState({});
  const [saveBusy, setSaveBusy] = useState({});
  const [expandedComments, setExpandedComments] = useState({});
  const [hasCourseRep, setHasCourseRep] = useState(null); // null = loading
  const [showSchedule, setShowSchedule] = useState(false);
  const [showAnnounce, setShowAnnounce] = useState(false);
  const [toast, setToast] = useState("");

  // The signed-in Course Rep sees quick-action buttons on this page.
  const isRepHere =
    profile?.role === "courseRep" &&
    String(profile?.courseRepMeta?.department || profile?.courseRepDepartment || department) ===
      String(department);

  // Is there a Course Rep for THIS department + level?
  // Rule-safe lookup: query users in OUR department only. Every candidate doc
  // satisfies the same-department read rule in firestore.rules, so the query
  // can never fail with permission-denied (a role-only query does, as soon as
  // any Course Rep exists in another department). Role + level are checked
  // client-side, which also finds legacy reps missing the denormalized
  // courseRepDepartment / courseRepLevel fields. Live via onSnapshot so the
  // page unlocks the moment Admin assigns a rep — no refresh needed.
  useEffect(() => {
    if (!department || !level) {
      setHasCourseRep(false);
      return;
    }
    const q = query(
      collection(db, "users"),
      where("department", "==", department)
    );
    const unsub = onSnapshot(
      q,
      (snap) => {
        const found = snap.docs.some((d) => {
          const u = d.data();
          if (u.role !== "courseRep") return false;
          const lvl =
            u.courseRepLevel || u.courseRepMeta?.level || u.level || "";
          return String(lvl).trim() === String(level).trim();
        });
        setHasCourseRep(found);
      },
      () => setHasCourseRep(false)
    );
    return () => unsub();
  }, [department, level]);

  useEffect(() => {
    if (!department || !level) {
      setLoading(false);
      setClasses([]);
      return;
    }
    const q = query(
      collection(db, "classEvents"),
      where("department", "==", department)
    );
    const unsub = onSnapshot(
      q,
      (snap) => {
        const list = snap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .filter((c) => matchesStudentLevel(c.level, level));
        list.sort((a, b) => {
          const ta = a.startsAt?.toDate?.() || a.startsAt || 0;
          const tb = b.startsAt?.toDate?.() || b.startsAt || 0;
          return new Date(ta) - new Date(tb);
        });
        setClasses(list);
      },
      () => setClasses([])
    );
    return () => unsub();
  }, [department, level]);

  useEffect(() => {
    if (!department || !level) return;
    const q = query(
      collection(db, "documents"),
      where("department", "==", department),
      where("source", "==", "courseRep")
    );
    const unsub = onSnapshot(
      q,
      (snap) => {
        const list = snap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .filter((m) => matchesStudentLevel(m.level, level));
        list.sort((a, b) => {
          const ta = a.createdAt?.toDate?.() || a.createdAt || 0;
          const tb = b.createdAt?.toDate?.() || b.createdAt || 0;
          return new Date(tb) - new Date(ta);
        });
        setMaterials(list);
        setLoading(false);
      },
      () => {
        setMaterials([]);
        setLoading(false);
      }
    );
    return () => unsub();
  }, [department, level]);

  useEffect(() => {
    if (!department || !level) return;
    const q = query(
      collection(db, "coursePosts"),
      where("department", "==", department)
    );
    const unsub = onSnapshot(
      q,
      (snap) => {
        const list = snap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .filter((p) => matchesStudentLevel(p.level, level));
        list.sort((a, b) => {
          if (a.pinned && !b.pinned) return -1;
          if (!a.pinned && b.pinned) return 1;
          const ta = a.createdAt?.toDate?.() || a.createdAt || 0;
          const tb = b.createdAt?.toDate?.() || b.createdAt || 0;
          return new Date(tb) - new Date(ta);
        });
        setPosts(list);
      },
      () => setPosts([])
    );
    return () => unsub();
  }, [department, level]);

  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, "materialSaves"),
      where("userId", "==", user.uid)
    );
    const unsub = onSnapshot(q, (snap) => {
      const ids = new Set();
      snap.docs.forEach((d) => {
        const mid = d.data().materialId;
        if (mid) ids.add(mid);
      });
      setSavedIds(ids);
    });
    return () => unsub();
  }, [user]);

  async function saveMaterial(mat) {
    if (!user || savedIds.has(mat.id)) return;
    setSaveBusy((p) => ({ ...p, [mat.id]: true }));
    try {
      await addDoc(collection(db, "materialSaves"), {
        userId: user.uid,
        materialId: mat.id,
        title: mat.title || "Untitled",
        description: mat.description || null,
        fileUrl: mat.fileUrl || mat.url || null,
        courseCode: (mat.courseCode || "GENERAL").toUpperCase(),
        courseTitle: mat.courseTitle || null,
        department: mat.department || department,
        faculty: mat.faculty || faculty,
        savedAt: serverTimestamp(),
        source: "courseRep",
      });
    } catch (e) {
      alert(e.message || "Could not save material.");
    } finally {
      setSaveBusy((p) => ({ ...p, [mat.id]: false }));
    }
  }

  async function addComment(postId) {
    const text = (commentText[postId] || "").trim();
    if (!text || !user) return;
    setCommentBusy((p) => ({ ...p, [postId]: true }));
    try {
      const post = posts.find((p) => p.id === postId);
      const comments = Array.isArray(post?.comments) ? [...post.comments] : [];
      comments.push({
        id: `${Date.now()}_${user.uid}`,
        text,
        authorUid: user.uid,
        authorName: profile?.name || user.email || "Student",
        createdAt: new Date().toISOString(),
      });
      await updateDoc(doc(db, "coursePosts", postId), { comments });
      setCommentText((p) => ({ ...p, [postId]: "" }));
      setExpandedComments((p) => ({ ...p, [postId]: true }));
    } catch (e) {
      alert(e.message || "Could not post comment.");
    } finally {
      setCommentBusy((p) => ({ ...p, [postId]: false }));
    }
  }

  async function addClassComment(classId) {
    const text = (classCommentText[classId] || "").trim();
    if (!text || !user) return;
    setClassCommentBusy((p) => ({ ...p, [classId]: true }));
    try {
      const ev = classes.find((c) => c.id === classId);
      const comments = Array.isArray(ev?.comments) ? [...ev.comments] : [];
      comments.push({
        id: `${Date.now()}_${user.uid}`,
        text,
        authorUid: user.uid,
        authorName: profile?.name || user.email || "Student",
        createdAt: new Date().toISOString(),
      });
      await updateDoc(doc(db, "classEvents", classId), { comments });
      setClassCommentText((p) => ({ ...p, [classId]: "" }));
      setExpandedClassComments((p) => ({ ...p, [classId]: true }));
    } catch (e) {
      alert(e.message || "Could not post comment.");
    } finally {
      setClassCommentBusy((p) => ({ ...p, [classId]: false }));
    }
  }

  if (!department) {
    return (
      <div className="rounded-2xl border border-border-light bg-card-light p-8 text-center">
        <Building2 className="mx-auto mb-3 text-ink-muted opacity-50" size={36} />
        <p className="text-sm font-medium text-ink">No department on your profile</p>
        <p className="mt-1 text-xs text-ink-muted">
          Complete your profile with faculty &amp; department to see class schedules and
          course-rep materials.
        </p>
      </div>
    );
  }


  if (!level) {
    return (
      <div className="rounded-2xl border border-border-light bg-card-light p-8 text-center">
        <Lock className="mx-auto mb-3 text-ink-muted opacity-50" size={36} />
        <p className="text-sm font-medium text-ink">Level not set on your profile</p>
        <p className="mt-1 text-xs text-ink-muted">
          Complete your profile with your level so we can show the correct Course Rep group.
        </p>
      </div>
    );
  }

  if (hasCourseRep === false) {
    return (
      <div className="mx-auto max-w-md rounded-2xl border border-border-light bg-card-light p-8 text-center shadow-sm">
        <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-bg-panel-alt text-ink-muted">
          <Lock size={28} />
        </span>
        <p className="font-display text-base font-semibold text-ink">No Course Rep yet</p>
        <p className="mt-2 text-sm text-ink-muted leading-relaxed">
          There is no Course Rep assigned for{" "}
          <strong className="text-ink">{department}</strong>
          {level ? (
            <>
              {" "}
              · <strong className="text-ink">{level}</strong>
            </>
          ) : null}
          .
        </p>
        <p className="mt-3 text-xs text-ink-muted">
          Schedules, announcements, and materials stay locked until Admin assigns a Course Rep
          for your department and level.
        </p>
      </div>
    );
  }

  if (hasCourseRep === null || loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-16 text-sm text-ink-muted">
        <Loader2 className="animate-spin" size={16} /> Loading your class group…
      </div>
    );
  }

  const upcoming = classes.filter((c) => {
    const start = c.startsAt?.toDate?.() || c.startsAt;
    if (!start) return true;
    return new Date(start) >= new Date(Date.now() - 2 * 60 * 60 * 1000);
  });

  function flash(msg) {
    setToast(msg);
    setTimeout(() => setToast(""), 4000);
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-ink flex items-center gap-2">
            <Building2 size={20} className="text-teal" />
            {department}
          </h1>
          <p className="text-sm text-ink-muted">
            {faculty ? `${faculty} · ` : ""}
            {level ? `${level} · ` : ""}
            Only your department & level — not other levels
          </p>
        </div>

        {/* Quick actions — visible only to the Course Rep of THIS department */}
        {isRepHere && (
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setShowSchedule(true)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-teal px-3 py-2 text-xs font-semibold text-white hover:bg-teal-dark"
            >
              <CalendarPlus size={14} /> Schedule class
            </button>
            <button
              type="button"
              onClick={() => setShowAnnounce(true)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-teal/40 bg-teal-soft px-3 py-2 text-xs font-semibold text-teal hover:border-teal"
            >
              <Megaphone size={14} /> Make announcement
            </button>
          </div>
        )}
      </div>

      {toast && (
        <p className="rounded-xl bg-teal-soft px-4 py-2 text-sm text-teal">{toast}</p>
      )}

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-ink flex items-center gap-2">
          <Calendar size={16} className="text-teal" />
          Scheduled classes
        </h2>
        {loading && (
          <p className="text-sm text-ink-muted flex items-center gap-2">
            <Loader2 size={14} className="animate-spin" /> Loading…
          </p>
        )}
        {!loading && upcoming.length === 0 && (
          <div className="rounded-xl border border-border-light bg-card-light px-4 py-8 text-center text-sm text-ink-muted">
            No upcoming classes scheduled for your department.
          </div>
        )}
        <div className="grid gap-3 sm:grid-cols-2">
          {upcoming.map((ev) => {
            const start = ev.startsAt?.toDate?.() || ev.startsAt;
            const end = ev.endsAt?.toDate?.() || ev.endsAt;
            const comments = Array.isArray(ev.comments) ? ev.comments : [];
            const open = expandedClassComments[ev.id];
            return (
              <div
                key={ev.id}
                className="rounded-xl border border-border-light bg-card-light p-4"
              >
                <p className="text-sm font-semibold text-ink">{ev.title}</p>
                {ev.courseCode && (
                  <p className="text-xs font-medium text-teal mt-0.5">{ev.courseCode}</p>
                )}
                <div className="mt-2 space-y-1 text-xs text-ink-muted">
                  {start && (
                    <p className="flex items-center gap-1.5">
                      <Clock size={12} />{" "}
                      {new Date(start).toLocaleString()}
                      {end ? ` – ${new Date(end).toLocaleTimeString()}` : ""}
                    </p>
                  )}
                  {ev.venue && (
                    <p className="flex items-center gap-1.5">
                      <MapPin size={12} /> {ev.venue}
                    </p>
                  )}
                  {ev.notes && <p className="mt-1 text-ink-muted">{ev.notes}</p>}
                </div>

                {/* Class comments */}
                <div className="mt-3 border-t border-border-light pt-2.5">
                  <button
                    type="button"
                    onClick={() =>
                      setExpandedClassComments((p) => ({
                        ...p,
                        [ev.id]: !p[ev.id],
                      }))
                    }
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-teal hover:underline"
                  >
                    <MessageCircle size={13} />
                    {comments.length} comment{comments.length !== 1 ? "s" : ""}
                  </button>

                  {open && (
                    <div className="mt-2.5 space-y-2">
                      {comments.length === 0 && (
                        <p className="text-xs text-ink-muted">No comments yet. Be first!</p>
                      )}
                      {comments.map((c) => (
                        <div
                          key={c.id}
                          className="rounded-lg bg-bg-panel-alt/50 px-3 py-2"
                        >
                          <p className="text-xs font-semibold text-ink">
                            {c.authorName || "Student"}
                          </p>
                          <p className="mt-0.5 text-xs text-ink-muted whitespace-pre-wrap">
                            {c.text}
                          </p>
                          {c.createdAt && (
                            <p className="mt-1 text-[10px] text-ink-muted">
                              {new Date(c.createdAt).toLocaleString()}
                            </p>
                          )}
                        </div>
                      ))}
                      <div className="flex gap-2 pt-1">
                        <input
                          className={field}
                          placeholder="Write a comment…"
                          value={classCommentText[ev.id] || ""}
                          onChange={(e) =>
                            setClassCommentText((p) => ({
                              ...p,
                              [ev.id]: e.target.value,
                            }))
                          }
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                              e.preventDefault();
                              addClassComment(ev.id);
                            }
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => addClassComment(ev.id)}
                          disabled={classCommentBusy[ev.id]}
                          className="inline-flex shrink-0 items-center gap-1 rounded-xl bg-teal px-3 py-2 text-xs font-semibold text-white hover:bg-teal-dark disabled:opacity-60"
                        >
                          {classCommentBusy[ev.id] ? (
                            <Loader2 size={14} className="animate-spin" />
                          ) : (
                            <Send size={14} />
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-ink flex items-center gap-2">
          <Megaphone size={16} className="text-teal" />
          Announcements
        </h2>
        {posts.length === 0 && (
          <div className="rounded-xl border border-border-light bg-card-light px-4 py-8 text-center text-sm text-ink-muted">
            No announcements yet from your Course Rep.
          </div>
        )}
        <div className="space-y-4">
          {posts.map((post) => {
            const comments = Array.isArray(post.comments) ? post.comments : [];
            const open = expandedComments[post.id];
            return (
              <article
                key={post.id}
                className={`rounded-2xl border bg-card-light p-4 ${
                  post.pinned
                    ? "border-teal ring-1 ring-teal/20"
                    : "border-border-light"
                }`}
              >
                <div className="flex items-start gap-2">
                  {post.pinned && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-teal-soft px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-teal">
                      <Pin size={10} /> Pinned
                    </span>
                  )}
                  {post.courseCode && (
                    <span className="text-xs font-bold text-teal">{post.courseCode}</span>
                  )}
                </div>
                <h3 className="mt-1.5 text-sm font-semibold text-ink">{post.title}</h3>
                <p className="mt-1 text-sm text-ink-muted whitespace-pre-wrap">
                  {post.body}
                </p>
                <p className="mt-2 text-[11px] text-ink-muted">
                  {post.authorName || "Course Rep"} ·{" "}
                  {post.createdAt?.toDate
                    ? post.createdAt.toDate().toLocaleString()
                    : ""}
                </p>

                <div className="mt-4 border-t border-border-light pt-3">
                  <button
                    type="button"
                    onClick={() =>
                      setExpandedComments((p) => ({
                        ...p,
                        [post.id]: !p[post.id],
                      }))
                    }
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-teal hover:underline"
                  >
                    <MessageCircle size={13} />
                    {comments.length} comment{comments.length !== 1 ? "s" : ""}
                  </button>

                  {open && (
                    <div className="mt-3 space-y-2">
                      {comments.length === 0 && (
                        <p className="text-xs text-ink-muted">No comments yet. Be first!</p>
                      )}
                      {comments.map((c) => (
                        <div
                          key={c.id}
                          className="rounded-lg bg-bg-panel-alt/50 px-3 py-2"
                        >
                          <p className="text-xs font-semibold text-ink">
                            {c.authorName || "Student"}
                          </p>
                          <p className="mt-0.5 text-xs text-ink-muted whitespace-pre-wrap">
                            {c.text}
                          </p>
                          {c.createdAt && (
                            <p className="mt-1 text-[10px] text-ink-muted">
                              {new Date(c.createdAt).toLocaleString()}
                            </p>
                          )}
                        </div>
                      ))}
                      <div className="flex gap-2 pt-1">
                        <input
                          className={field}
                          placeholder="Write a comment…"
                          value={commentText[post.id] || ""}
                          onChange={(e) =>
                            setCommentText((p) => ({
                              ...p,
                              [post.id]: e.target.value,
                            }))
                          }
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                              e.preventDefault();
                              addComment(post.id);
                            }
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => addComment(post.id)}
                          disabled={commentBusy[post.id]}
                          className="inline-flex shrink-0 items-center gap-1 rounded-xl bg-teal px-3 py-2 text-xs font-semibold text-white hover:bg-teal-dark disabled:opacity-60"
                        >
                          {commentBusy[post.id] ? (
                            <Loader2 size={14} className="animate-spin" />
                          ) : (
                            <Send size={14} />
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-ink flex items-center gap-2">
          <BookOpen size={16} className="text-teal" />
          Course materials
        </h2>
        {materials.length === 0 && (
          <div className="rounded-xl border border-border-light bg-card-light px-4 py-8 text-center text-sm text-ink-muted">
            No materials uploaded by your Course Rep yet.
          </div>
        )}
        <div className="grid gap-3 sm:grid-cols-2">
          {materials.map((mat) => {
            const saved = savedIds.has(mat.id);
            return (
              <div
                key={mat.id}
                className="rounded-xl border border-border-light bg-card-light p-4 flex flex-col"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-xs font-bold text-teal">
                      {mat.courseCode || "—"}
                    </p>
                    <p className="mt-0.5 text-sm font-semibold text-ink">
                      {mat.title}
                    </p>
                  </div>
                </div>
                {mat.description && (
                  <p className="mt-2 text-xs text-ink-muted line-clamp-3">
                    {mat.description}
                  </p>
                )}
                <div className="mt-auto pt-3 flex flex-wrap gap-2">
                  {(mat.fileUrl || mat.url) && (
                    <a
                      href={mat.fileUrl || mat.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 rounded-lg border border-border-light px-2.5 py-1.5 text-xs font-medium text-ink hover:border-teal hover:text-teal"
                    >
                      <ExternalLink size={12} /> Read
                    </a>
                  )}
                  <button
                    type="button"
                    onClick={() => saveMaterial(mat)}
                    disabled={saved || saveBusy[mat.id]}
                    className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium ${
                      saved
                        ? "bg-teal-soft text-teal"
                        : "border border-border-light text-ink hover:border-teal hover:text-teal"
                    } disabled:opacity-70`}
                  >
                    {saveBusy[mat.id] ? (
                      <Loader2 size={12} className="animate-spin" />
                    ) : saved ? (
                      <BookmarkCheck size={12} />
                    ) : (
                      <BookmarkPlus size={12} />
                    )}
                    {saved ? "Saved" : "Save to Materials"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Quick composers (Course Rep only) */}
      <ScheduleClassModal
        open={showSchedule}
        onClose={(created) => {
          setShowSchedule(false);
          if (created) flash("Class scheduled — students can see it now.");
        }}
        department={department}
        level={level}
        faculty={faculty}
        user={user}
        authorName={profile?.name || user?.email}
      />
      <CreateAnnouncementModal
        open={showAnnounce}
        onClose={(created) => {
          setShowAnnounce(false);
          if (created) flash("Announcement posted.");
        }}
        department={department}
        level={level}
        faculty={faculty}
        user={user}
        authorName={profile?.name || user?.email}
      />
    </div>
  );
}
