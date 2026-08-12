import { useMemo, useState } from "react";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { Plus, Trash2, Search, BookOpen, Pencil, X } from "lucide-react";
import { db } from "../firebase/config";
import { useCbtData } from "../hooks/useCbtData";
import { FACULTIES, departmentsFor } from "../data/facultyData";

const LEVELS = ["100 Level", "200 Level", "300 Level", "400 Level", "500 Level", "Postgraduate", "General"];

const fieldClass =
  "w-full rounded-lg border border-border-subtle bg-bg-panel px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none";

const emptyForm = {
  code: "",
  title: "",
  faculty: "",
  department: "",
  level: "",
  semester: "",
};

export default function AdminCourses() {
  const { courses, loading } = useCbtData();
  const [search, setSearch] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);

  const departments = useMemo(() => departmentsFor(form.faculty), [form.faculty]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return courses;
    return courses.filter((c) =>
      [c.code, c.title, c.faculty, c.department, c.level]
        .filter(Boolean)
        .some((f) => f.toLowerCase().includes(q))
    );
  }, [courses, search]);

  function openCreate() {
    setForm(emptyForm);
    setEditingId(null);
    setError("");
    setShowForm(true);
  }

  function openEdit(c) {
    setForm({
      code: c.code || "",
      title: c.title || "",
      faculty: c.faculty || "",
      department: c.department || "",
      level: c.level || "",
      semester: c.semester || "",
    });
    setEditingId(c.id);
    setError("");
    setShowForm(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (!form.code.trim()) return setError("Course code is required (e.g. CSC 201).");
    if (!form.title.trim()) return setError("Course title is required.");
    if (!form.faculty) return setError("Select a faculty.");
    if (!form.department) return setError("Select a department.");
    if (!form.level) return setError("Select a level.");

    const payload = {
      code: form.code.trim().toUpperCase(),
      title: form.title.trim(),
      faculty: form.faculty,
      department: form.department,
      level: form.level,
      semester: form.semester.trim() || null,
    };

    const duplicate = courses.find(
      (c) => c.code?.toUpperCase() === payload.code && c.id !== editingId
    );
    if (duplicate) return setError(`Course code ${payload.code} already exists.`);

    setSaving(true);
    try {
      if (editingId) {
        await updateDoc(doc(db, "courses", editingId), payload);
      } else {
        await addDoc(collection(db, "courses"), {
          ...payload,
          createdAt: serverTimestamp(),
        });
      }
      setForm(emptyForm);
      setEditingId(null);
      setShowForm(false);
    } catch (err) {
      setError(err.message || "Failed to save course.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(c) {
    const ok = window.confirm(
      `Remove course ${c.code} — ${c.title}? Existing questions with this code will still work, but the dropdown will no longer list it.`
    );
    if (!ok) return;
    try {
      await deleteDoc(doc(db, "courses", c.id));
    } catch (err) {
      alert(err.message || "Delete failed.");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-text-primary">Courses</h1>
          <p className="text-sm text-text-secondary">
            Fixed course list per faculty & department. CBT Builder and Excel import use this list only.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-bg-app hover:bg-accent-strong"
        >
          <Plus size={16} />
          Add Course
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-border-subtle bg-bg-panel p-4">
          <div className="text-2xl font-bold text-text-primary">{courses.length}</div>
          <div className="text-xs text-text-muted">Total courses</div>
        </div>
        <div className="rounded-xl border border-border-subtle bg-bg-panel p-4">
          <div className="text-2xl font-bold text-text-primary">
            {new Set(courses.map((c) => c.faculty).filter(Boolean)).size}
          </div>
          <div className="text-xs text-text-muted">Faculties covered</div>
        </div>
        <div className="rounded-xl border border-border-subtle bg-bg-panel p-4">
          <div className="text-2xl font-bold text-accent">
            {new Set(courses.map((c) => c.department).filter(Boolean)).size}
          </div>
          <div className="text-xs text-text-muted">Departments</div>
        </div>
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="space-y-4 rounded-xl border border-border-subtle bg-bg-panel p-5"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-text-primary">
              {editingId ? "Edit course" : "New course"}
            </h2>
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                setEditingId(null);
                setForm(emptyForm);
              }}
              className="text-text-muted hover:text-text-primary"
            >
              <X size={16} />
            </button>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <label className="mb-1 block text-xs text-text-muted">Course code *</label>
              <input
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value })}
                placeholder="e.g. CSC 201"
                className={fieldClass}
                required
              />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs text-text-muted">Course title *</label>
              <input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Introduction to Computing"
                className={fieldClass}
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-text-muted">Faculty *</label>
              <select
                value={form.faculty}
                onChange={(e) =>
                  setForm({ ...form, faculty: e.target.value, department: "" })
                }
                className={fieldClass}
                required
              >
                <option value="">Select faculty</option>
                {FACULTIES.map((f) => (
                  <option key={f.name} value={f.name}>
                    {f.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs text-text-muted">Department *</label>
              <select
                value={form.department}
                onChange={(e) => setForm({ ...form, department: e.target.value })}
                className={fieldClass}
                disabled={!form.faculty}
                required
              >
                <option value="">Select department</option>
                {departments.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs text-text-muted">Level *</label>
              <select
                value={form.level}
                onChange={(e) => setForm({ ...form, level: e.target.value })}
                className={fieldClass}
                required
              >
                <option value="">Select level</option>
                {LEVELS.map((lvl) => (
                  <option key={lvl} value={lvl}>
                    {lvl}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs text-text-muted">Semester (optional)</label>
              <input
                value={form.semester}
                onChange={(e) => setForm({ ...form, semester: e.target.value })}
                placeholder="e.g. Harmattan / Rain"
                className={fieldClass}
              />
            </div>
          </div>

          {error && <p className="text-sm text-status-danger">{error}</p>}

          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-bg-app hover:bg-accent-strong disabled:opacity-60"
          >
            {saving ? "Saving…" : editingId ? "Update Course" : "Save Course"}
          </button>
        </form>
      )}

      <div className="flex items-center gap-2 rounded-lg border border-border-subtle bg-bg-panel px-3 py-2 sm:max-w-xs">
        <Search size={15} className="text-text-muted" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search courses…"
          className="w-full bg-transparent text-sm text-text-primary placeholder:text-text-muted focus:outline-none"
        />
      </div>

      <div className="divide-y divide-border-subtle rounded-xl border border-border-subtle bg-bg-panel">
        {loading && (
          <div className="px-4 py-6 text-center text-sm text-text-muted">Loading…</div>
        )}
        {!loading && filtered.length === 0 && (
          <div className="px-4 py-8 text-center text-sm text-text-muted">
            <BookOpen size={28} className="mx-auto mb-2 opacity-50" />
            No courses yet. Add the official list so CBT questions use fixed codes.
          </div>
        )}
        {filtered.map((c) => (
          <div key={c.id} className="flex items-start justify-between gap-3 px-4 py-3">
            <div className="min-w-0 flex-1">
              <div className="mb-0.5 flex flex-wrap items-center gap-2">
                <span className="rounded bg-accent-soft px-1.5 py-0.5 text-[11px] font-bold text-accent">
                  {c.code}
                </span>
                {c.level && (
                  <span className="text-[11px] text-text-muted">{c.level}</span>
                )}
              </div>
              <p className="text-sm font-medium text-text-primary">{c.title}</p>
              <p className="mt-0.5 text-xs text-text-muted">
                {[c.faculty, c.department].filter(Boolean).join(" · ")}
                {c.semester ? ` · ${c.semester}` : ""}
              </p>
            </div>
            <div className="flex shrink-0 gap-1">
              <button
                type="button"
                onClick={() => openEdit(c)}
                className="rounded-lg p-2 text-text-muted hover:bg-bg-elevated hover:text-text-primary"
                title="Edit"
              >
                <Pencil size={15} />
              </button>
              <button
                type="button"
                onClick={() => handleDelete(c)}
                className="rounded-lg p-2 text-text-muted hover:bg-bg-elevated hover:text-status-danger"
                title="Delete"
              >
                <Trash2 size={15} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}