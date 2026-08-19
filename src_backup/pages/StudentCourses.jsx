import { useEffect, useMemo, useState } from "react";
import { doc, updateDoc } from "firebase/firestore";
import { BookOpen, Check, Crown, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCbtData } from "../hooks/useCbtData";
import { FREE_LIMITS, isPro } from "../lib/subscription";
import { db } from "../firebase/config";
import { FACULTIES, departmentsFor } from "../data/facultyData";

export default function StudentCourses() {
  const { user, profile } = useAuth();
  const { courses, loading } = useCbtData();
  const pro = isPro(profile);
  const [selected, setSelected] = useState(() => profile?.selectedCourseIds || []);
  const [faculty, setFaculty] = useState(profile?.faculty || "");
  const [department, setDepartment] = useState(profile?.department || "");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    if (profile?.selectedCourseIds) setSelected(profile.selectedCourseIds);
  }, [profile?.selectedCourseIds]);

  const departments = useMemo(() => departmentsFor(faculty), [faculty]);

  const catalog = useMemo(() => {
    let list = [...courses];
    if (!pro) {
      // Free: prefer own department
      const dep = profile?.department || department;
      const fac = profile?.faculty || faculty;
      if (fac) list = list.filter((c) => !c.faculty || c.faculty === fac);
      if (dep) list = list.filter((c) => !c.department || c.department === dep);
    } else {
      if (faculty) list = list.filter((c) => c.faculty === faculty);
      if (department) list = list.filter((c) => c.department === department);
    }
    return list.sort((a, b) => String(a.code || "").localeCompare(String(b.code || "")));
  }, [courses, pro, faculty, department, profile?.faculty, profile?.department]);

  const selectedCourses = useMemo(
    () => courses.filter((c) => selected.includes(c.id)),
    [courses, selected]
  );

  const max = pro ? Infinity : FREE_LIMITS.maxCourses;

  function toggle(id) {
    setMsg("");
    setSelected((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= max) {
        setMsg(
          pro
            ? ""
            : `Free plan allows only ${FREE_LIMITS.maxCourses} courses. Upgrade to Pro for unlimited.`
        );
        return prev;
      }
      return [...prev, id];
    });
  }

  async function save() {
    if (!user) return;
    setSaving(true);
    setMsg("");
    try {
      await updateDoc(doc(db, "users", user.uid), {
        selectedCourseIds: selected,
      });
      setMsg("Your course list was saved.");
    } catch (err) {
      setMsg(err.message || "Could not save.");
    } finally {
      setSaving(false);
    }
  }

  const fieldClass =
    "rounded-lg border border-border-light bg-card-light px-3 py-2 text-sm text-ink focus:border-teal focus:outline-none";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-ink">My Courses</h1>
          <p className="text-sm text-ink-muted">
            {pro
              ? "Select any courses you want on your list."
              : `Free plan: up to ${FREE_LIMITS.maxCourses} courses from your department.`}
          </p>
        </div>
        {!pro && (
          <Link
            to="/dashboard/upgrade"
            className="inline-flex items-center gap-1.5 rounded-lg bg-teal px-3 py-2 text-xs font-semibold text-white hover:bg-teal-dark"
          >
            <Crown size={13} /> Go Pro
          </Link>
        )}
      </div>

      {/* Selected summary */}
      <section className="rounded-2xl border border-border-light bg-card-light p-4">
        <h2 className="text-sm font-semibold text-ink">
          Selected ({selectedCourses.length}
          {!pro ? ` / ${FREE_LIMITS.maxCourses}` : ""})
        </h2>
        {selectedCourses.length === 0 ? (
          <p className="mt-2 text-sm text-ink-muted">No courses selected yet. Pick from the list below.</p>
        ) : (
          <ul className="mt-3 flex flex-wrap gap-2">
            {selectedCourses.map((c) => (
              <li
                key={c.id}
                className="inline-flex items-center gap-1.5 rounded-full bg-teal-soft px-3 py-1 text-xs font-medium text-teal"
              >
                <BookOpen size={12} />
                {c.code} — {c.title}
              </li>
            ))}
          </ul>
        )}
        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="mt-4 inline-flex items-center gap-2 rounded-lg bg-teal px-4 py-2.5 text-sm font-semibold text-white hover:bg-teal-dark disabled:opacity-60"
        >
          {saving ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
          Save selection
        </button>
        {msg && <p className="mt-2 text-sm text-ink-muted">{msg}</p>}
      </section>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <select
          value={faculty}
          onChange={(e) => {
            setFaculty(e.target.value);
            setDepartment("");
          }}
          className={fieldClass}
        >
          <option value="">All faculties</option>
          {FACULTIES.map((f) => (
            <option key={f.name} value={f.name}>
              {f.name}
            </option>
          ))}
        </select>
        <select
          value={department}
          onChange={(e) => setDepartment(e.target.value)}
          className={fieldClass}
          disabled={!faculty}
        >
          <option value="">All departments</option>
          {departments.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
      </div>

      {loading && <p className="text-sm text-ink-muted">Loading courses…</p>}

      {!loading && catalog.length === 0 && (
        <div className="rounded-xl border border-border-light bg-card-light px-4 py-10 text-center text-sm text-ink-muted">
          <BookOpen className="mx-auto mb-2 opacity-50" size={28} />
          No courses in the catalogue yet. Admin must add courses first.
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        {catalog.map((c) => {
          const on = selected.includes(c.id);
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => toggle(c.id)}
              className={`rounded-xl border p-4 text-left transition ${
                on
                  ? "border-teal bg-teal-soft/50 ring-1 ring-teal/30"
                  : "border-border-light bg-card-light hover:border-teal/40"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-xs font-bold text-teal">{c.code}</p>
                  <p className="mt-0.5 text-sm font-semibold text-ink">{c.title}</p>
                  <p className="mt-1 text-xs text-ink-muted">
                    {[c.faculty, c.department, c.level].filter(Boolean).join(" · ")}
                  </p>
                </div>
                <span
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
                    on ? "bg-teal text-white" : "border border-border-light text-transparent"
                  }`}
                >
                  <Check size={14} />
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
