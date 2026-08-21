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
} from "lucide-react";
import { db } from "../firebase/config";
import { useAuth } from "../context/AuthContext";

const field =
  "w-full rounded-xl border border-border-light bg-card-light px-3 py-2 text-sm text-ink focus:border-teal focus:outline-none";

export default function StudentDepartment() {
  const { user, profile } = useAuth();
  const department = profile?.department || "";
  const faculty = profile?.faculty || "";

  const [classes, setClasses] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [posts, setPosts] = useState([]);
  const [savedIds, setSavedIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState({});
  const [commentBusy, setCommentBusy] = useState({});
  const [saveBusy, setSaveBusy] = useState({});
  const [expandedComments, setExpandedComments] = useState({});

  useEffect(() => {
    if (!department) {
      setLoading(false);
      return;
    }
    const q = query(
      collection(db, "classEvents"),
      where("department", "==", department)
    );
    const unsub = onSnapshot(
      q,
      (snap) => {
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
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
  }, [department]);

  useEffect(() => {
    if (!department) return;
    const q = query(
      collection(db, "documents"),
      where("department", "==", department),
      where("source", "==", "courseRep")
    );
    const unsub = onSnapshot(
      q,
      (snap) => {
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
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
  }, [department]);

  useEffect(() => {
    if (!department) return;
    const q = query(
      collection(db, "coursePosts"),
      where("department", "==", department)
    );
    const unsub = onSnapshot(
      q,
      (snap) => {
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
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
  }, [department]);

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

  const upcoming = classes.filter((c) => {
    const start = c.startsAt?.toDate?.() || c.startsAt;
    if (!start) return true;
    return new Date(start) >= new Date(Date.now() - 2 * 60 * 60 * 1000);
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-lg font-semibold text-ink flex items-center gap-2">
          <Building2 size={20} className="text-teal" />
          {department}
        </h1>
        <p className="text-sm text-ink-muted">
          {faculty ? `${faculty} · ` : ""}
          Scheduled classes, announcements &amp; materials from your Course Rep
        </p>
      </div>

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
    </div>
  );
}
