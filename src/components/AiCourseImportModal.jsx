import { useState } from "react";
import {
  addDoc,
  collection,
  serverTimestamp,
  writeBatch,
  doc,
} from "firebase/firestore";
import { Sparkles, Upload, X, Loader2, Check } from "lucide-react";
import { db } from "../firebase/config";
// NOTE: dynamically imported in `runExtract` to avoid build-time import warnings
import {
  validateCourseRow,
  normalizeCoursePayload,
} from "../lib/courseImport";
import { useAuth } from "../context/AuthContext";

/**
 * mode: "direct" = write to courses (admin/agent)
 * mode: "request" = Course Rep → requests for admin approval
 */
export default function AiCourseImportModal({
  open,
  onClose,
  mode = "direct",
  defaultFaculty = "",
  defaultDepartment = "",
  onDone,
}) {
  const { user, profile } = useAuth();
  const [file, setFile] = useState(null);
  const [rows, setRows] = useState([]);
  const [busy, setBusy] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");

  if (!open) return null;

  async function runExtract() {
    setError("");
    setMsg("");
    if (!file) return setError("Choose an image or PDF first.");
    setBusy(true);
    try {
      const geminiMod = await import("../lib/geminiGenerate");
      // Support both named exports and transpiled default shapes
      const extractFn =
        geminiMod.extractCoursesFromFile ||
        (geminiMod.default && geminiMod.default.extractCoursesFromFile) ||
        (typeof geminiMod.default === "function" ? geminiMod.default : null);
      if (!extractFn) throw new Error("extractCoursesFromFile not found in gemini module");
      let list = await extractFn(file);
      // Course Rep: force their department
      if (mode === "request" && defaultDepartment) {
        list = list.map((r) => ({
          ...r,
          department: r.department || defaultDepartment,
          faculty: r.faculty || defaultFaculty || "",
        }));
      }
      setRows(list);
      if (!list.length) setError("No courses detected. Try a clearer image/PDF.");
    } catch (e) {
      setError(e.message || "Extract failed");
    } finally {
      setBusy(false);
    }
  }

  async function saveDirect() {
    setSaving(true);
    setError("");
    try {
      const valid = [];
      const errs = [];
      rows.forEach((r, i) => {
        const e = validateCourseRow(r);
        if (e.length) errs.push(`Row ${i + 1}: ${e.join(", ")}`);
        else valid.push(normalizeCoursePayload(r));
      });
      if (!valid.length) {
        setError(errs[0] || "No valid rows");
        setSaving(false);
        return;
      }
      const batch = writeBatch(db);
      valid.forEach((payload) => {
        const ref = doc(collection(db, "courses"));
        batch.set(ref, {
          ...payload,
          published: true,
          source: "ai-import",
          createdAt: serverTimestamp(),
        });
      });
      await batch.commit();
      setMsg(`Imported ${valid.length} course(s).`);
      onDone?.();
      setTimeout(onClose, 1200);
    } catch (e) {
      setError(e.message || "Import failed");
    } finally {
      setSaving(false);
    }
  }

  async function saveAsRequest() {
    setSaving(true);
    setError("");
    try {
      await addDoc(collection(db, "requests"), {
        type: "course_bulk",
        status: "pending",
        title: `AI course import (${rows.length} courses) — ${defaultDepartment}`,
        details: "Extracted from image/PDF by Course Rep",
        requesterUid: user.uid,
        requesterName: profile?.name || user.email,
        requesterEmail: user.email,
        requesterRole: "courseRep",
        payload: {
          courses: rows.map((r) =>
            normalizeCoursePayload({
              ...r,
              department: r.department || defaultDepartment,
              faculty: r.faculty || defaultFaculty,
            })
          ),
        },
        createdAt: serverTimestamp(),
      });
      setMsg("Sent to Admin for approval (Course Reps tab).");
      onDone?.();
      setTimeout(onClose, 1200);
    } catch (e) {
      setError(e.message || "Request failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-border-subtle bg-bg-panel p-5 shadow-xl">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-base font-semibold text-text-primary">
            <Sparkles size={18} className="text-accent" /> AI import courses
          </h2>
          <button type="button" onClick={onClose} className="text-text-muted">
            <X size={18} />
          </button>
        </div>
        <p className="mb-3 text-xs text-text-muted">
          Upload a timetable / handbook image or PDF. AI builds the same fields as
          CSV: code, title, faculty, department, level, semester.
        </p>

        <input
          type="file"
          accept="application/pdf,image/*"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          className="mb-3 block w-full text-sm"
        />

        <button
          type="button"
          disabled={busy || !file}
          onClick={runExtract}
          className="mb-4 inline-flex items-center gap-2 rounded-lg bg-accent px-3 py-2 text-sm font-semibold text-bg-app disabled:opacity-60"
        >
          {busy ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
          Extract with AI
        </button>

        {error && <p className="mb-2 text-sm text-status-danger">{error}</p>}
        {msg && <p className="mb-2 text-sm text-accent">{msg}</p>}

        {rows.length > 0 && (
          <>
            <p className="mb-2 text-xs text-text-muted">{rows.length} course(s) detected</p>
            <div className="mb-3 max-h-48 overflow-auto rounded-lg border border-border-subtle text-xs">
              <table className="w-full">
                <thead>
                  <tr className="bg-bg-elevated text-left text-text-muted">
                    <th className="p-2">Code</th>
                    <th className="p-2">Title</th>
                    <th className="p-2">Dept</th>
                    <th className="p-2">Level</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, i) => (
                    <tr key={i} className="border-t border-border-subtle">
                      <td className="p-2 font-medium">{r.code}</td>
                      <td className="p-2">{r.title}</td>
                      <td className="p-2">{r.department}</td>
                      <td className="p-2">{r.level}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button
              type="button"
              disabled={saving}
              onClick={mode === "request" ? saveAsRequest : saveDirect}
              className="inline-flex items-center gap-2 rounded-lg bg-accent px-3 py-2 text-sm font-semibold text-bg-app"
            >
              {saving ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Check size={14} />
              )}
              {mode === "request" ? "Submit for admin approval" : "Import to courses"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
