import { useMemo, useState } from "react";
import {
  Search,
  BookOpen,
  Check,
  Plus,
  Filter,
  GraduationCap,
} from "lucide-react";
import { useStudentCourses } from "../hooks/useStudentCourses";
import { FACULTIES } from "../data/facultyData";

const LEVELS = ["100 Level", "200 Level", "300 Level", "400 Level", "500 Level", "Postgraduate", "General"];

export default function StudentCourses() {
  const { courses, enrollments, loading, busyId, isEnrolled, toggle, profile } =
    useStudentCourses();
  const [search, setSearch] = useState("");
  const [faculty, setFaculty] = useState(profile?.faculty || "");
  const [level, setLevel] = useState(profile?.level || "");
  const [tab, setTab] = useState("all"); // all | mine

  const filtered = useMemo(() => {
    let list = courses;
    if (tab === "mine") {
      list = list.filter((c) => isEnrolled(c));
    }
    if (faculty) list = list.filter((c) => c.faculty === faculty);
    if (level) list = list.filter((c) => c.level === level);
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter((c) =>
        [c.code, c.title, c.department, c.faculty]
          .filter(Boolean)
          .some((f) => f.toLowerCase().includes(q))
      );
    }
    return list;
  }, [courses, tab, faculty, level, search, enrollments, isEnrolled]);

  const myCount = enrollments.length;

  return (
    <div className="mx-auto max-w-5xl space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-text-primary">Courses</h1>
        <p className="mt-1 text-sm text-text-secondary">
          Select the courses you are taking this semester. They appear on your dashboard and in Practice.
        </p>
      </div>

      {/* Tabs + search */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex rounded-2xl border border-border-subtle bg-bg-panel p-1">
          <button
            type="button"
            onClick={() => setTab("all")}
            className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
              tab === "all"
                ? "bg-accent text-bg-sidebar"
                : "text-text-secondary hover:text-text-primary"
            }`}
          >
            All courses
          </button>
          <button
            type="button"
            onClick={() => setTab("mine")}
            className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
              tab === "mine"
                ? "bg-accent text-bg-sidebar"
                : "text-text-secondary hover:text-text-primary"
            }`}
          >
            My courses ({myCount})
          </button>
        </div>

        <div className="flex items-center gap-2 rounded-2xl border border-border-subtle bg-bg-panel px-3 py-2.5 focus-within:border-accent focus-within:ring-2 focus-within:ring-accent-soft">
          <Search size={16} className="text-text-muted" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search code or title…"
            className="w-full min-w-0 bg-transparent text-sm text-text-primary placeholder:text-text-muted focus:outline-none sm:w-56"
          />
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="flex items-center gap-1.5 text-xs font-medium text-text-muted">
          <Filter size={13} /> Filters
        </span>
        <select
          value={faculty}
          onChange={(e) => setFaculty(e.target.value)}
          className="rounded-xl border border-border-subtle bg-bg-panel px-3 py-2 text-sm text-text-primary focus:border-accent focus:outline-none"
        >
          <option value="">All faculties</option>
          {FACULTIES.map((f) => (
            <option key={f} value={f}>
              {f}
            </option>
          ))}
        </select>
        <select
          value={level}
          onChange={(e) => setLevel(e.target.value)}
          className="rounded-xl border border-border-subtle bg-bg-panel px-3 py-2 text-sm text-text-primary focus:border-accent focus:outline-none"
        >
          <option value="">All levels</option>
          {LEVELS.map((l) => (
            <option key={l} value={l}>
              {l}
            </option>
          ))}
        </select>
        {(faculty || level) && (
          <button
            type="button"
            onClick={() => {
              setFaculty("");
              setLevel("");
            }}
            className="text-xs font-semibold text-accent"
          >
            Clear
          </button>
        )}
      </div>

      {/* Grid */}
      {loading && (
        <p className="py-12 text-center text-sm text-text-muted">Loading courses…</p>
      )}

      {!loading && filtered.length === 0 && (
        <div className="rounded-3xl border border-dashed border-border-subtle bg-bg-panel p-10 text-center">
          <BookOpen className="mx-auto text-text-muted" size={32} />
          <p className="mt-3 text-sm font-semibold text-text-primary">
            {tab === "mine" ? "No courses selected yet" : "No courses match your filters"}
          </p>
          <p className="mt-1 text-sm text-text-secondary">
            {tab === "mine"
              ? "Switch to “All courses” and tap Select on the ones you take."
              : "Try clearing filters, or ask an admin to publish courses."}
          </p>
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((c) => {
          const selected = isEnrolled(c);
          const busy = busyId === c.id;
          return (
            <div
              key={c.id}
              className={`flex flex-col rounded-3xl border p-4 transition ${
                selected
                  ? "border-accent/40 bg-accent-soft shadow-sm shadow-accent/10"
                  : "border-border-subtle bg-bg-panel hover:border-border-strong"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <span className="inline-flex rounded-lg bg-bg-elevated px-2 py-0.5 font-mono text-[11px] font-bold text-accent">
                  {c.code || "—"}
                </span>
                {selected && (
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-accent text-bg-sidebar">
                    <Check size={13} strokeWidth={3} />
                  </span>
                )}
              </div>

              <h3 className="mt-2.5 line-clamp-2 text-sm font-semibold leading-snug text-text-primary">
                {c.title || "Untitled course"}
              </h3>

              <p className="mt-1.5 flex items-center gap-1 text-xs text-text-secondary">
                <GraduationCap size={12} />
                {[c.faculty, c.level].filter(Boolean).join(" · ") || "General"}
              </p>
              {c.department && (
                <p className="mt-0.5 text-xs text-text-muted">{c.department}</p>
              )}
              {c.semester && (
                <p className="mt-0.5 text-xs text-text-muted">{c.semester}</p>
              )}

              <button
                type="button"
                disabled={busy}
                onClick={() => toggle(c)}
                className={`mt-4 inline-flex w-full items-center justify-center gap-1.5 rounded-xl py-2.5 text-sm font-semibold transition disabled:opacity-60 ${
                  selected
                    ? "border border-border-subtle bg-bg-panel text-text-secondary hover:border-status-danger/40 hover:text-status-danger"
                    : "bg-accent text-bg-sidebar shadow-md shadow-accent/20 hover:brightness-110"
                }`}
              >
                {busy ? (
                  "Saving…"
                ) : selected ? (
                  "Remove"
                ) : (
                  <>
                    <Plus size={15} />
                    Select course
                  </>
                )}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
