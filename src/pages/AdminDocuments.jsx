import { useMemo, useRef, useState } from "react";
import { addDoc, collection, deleteDoc, doc, serverTimestamp } from "firebase/firestore";
import { FileText, Upload, Trash2, Search, ExternalLink } from "lucide-react";
import { db } from "../firebase/config";
import { useAdminDocuments } from "../hooks/useAdminDocuments";
import { uploadDocumentToCloudinary } from "../lib/cloudinaryUpload";
import { FACULTIES } from "../data/facultyData";

const LEVELS = ["100 Level", "200 Level", "300 Level", "400 Level", "500 Level", "Postgraduate", "General"];

export default function AdminDocuments() {
  const { documents, loading } = useAdminDocuments();
  const [search, setSearch] = useState("");
  const [title, setTitle] = useState("");
  const [faculty, setFaculty] = useState("");
  const [level, setLevel] = useState("");
  const [file, setFile] = useState(null);
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return documents;
    return documents.filter((d) =>
      [d.title, d.faculty, d.level].filter(Boolean).some((f) => f.toLowerCase().includes(q))
    );
  }, [documents, search]);

  async function handleUpload(e) {
    e.preventDefault();
    setError("");
    if (!file) return setError("Choose a PDF first.");
    if (file.type !== "application/pdf") return setError("Only PDF files are supported right now.");
    if (file.size > 10 * 1024 * 1024) return setError("Keep files under 10MB for now.");

    setUploading(true);
    setProgress(0);
    try {
      const result = await uploadDocumentToCloudinary(file, setProgress);
      await addDoc(collection(db, "documents"), {
        title: title.trim() || file.name,
        faculty: faculty || null,
        level: level || null,
        fileUrl: result.secure_url,
        fileName: file.name,
        fileSize: file.size,
        uploadedAt: serverTimestamp(),
      });
      setTitle("");
      setFaculty("");
      setLevel("");
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err) {
      setError(err.message || "Upload failed. Please try again.");
    } finally {
      setUploading(false);
      setProgress(0);
    }
  }

  async function handleDelete(docItem) {
    const ok = window.confirm(`Remove "${docItem.title}"? This only removes it from the app listing.`);
    if (!ok) return;
    try {
      await deleteDoc(doc(db, "documents", docItem.id));
    } catch (err) {
      alert(err.message || "Couldn't delete.");
    }
  }

  const fieldClass =
    "rounded-lg border border-border-subtle bg-bg-panel-alt px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none";

  return (
    <div className="space-y-6">
      <h1 className="text-lg font-semibold text-text-primary">Documents</h1>

      <form
        onSubmit={handleUpload}
        className="grid grid-cols-1 gap-3 rounded-xl border border-border-subtle bg-bg-panel p-4 sm:grid-cols-2 lg:grid-cols-5"
      >
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Title (optional — defaults to file name)"
          className={`${fieldClass} lg:col-span-2`}
        />
        <select value={faculty} onChange={(e) => setFaculty(e.target.value)} className={fieldClass}>
          <option value="">Any faculty</option>
          {FACULTIES.map((f) => (
            <option key={f.name} value={f.name}>
              {f.name}
            </option>
          ))}
        </select>
        <select value={level} onChange={(e) => setLevel(e.target.value)} className={fieldClass}>
          <option value="">Any level</option>
          {LEVELS.map((lvl) => (
            <option key={lvl} value={lvl}>
              {lvl}
            </option>
          ))}
        </select>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/pdf"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          className="text-sm text-text-secondary file:mr-3 file:rounded-lg file:border-0 file:bg-bg-elevated file:px-3 file:py-2 file:text-xs file:font-medium file:text-text-primary"
        />

        {error && <p className="text-sm text-status-danger lg:col-span-5">{error}</p>}

        <button
          type="submit"
          disabled={uploading}
          className="flex items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-bg-app hover:bg-accent-strong disabled:opacity-60 lg:col-span-5"
        >
          <Upload size={15} />
          {uploading ? `Uploading… ${progress}%` : "Upload PDF"}
        </button>
      </form>

      <div className="flex items-center gap-2 rounded-lg border border-border-subtle bg-bg-panel px-3 py-2 sm:max-w-xs">
        <Search size={15} className="text-text-muted" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search documents…"
          className="w-full bg-transparent text-sm text-text-primary placeholder:text-text-muted focus:outline-none"
        />
      </div>

      <div className="divide-y divide-border-subtle rounded-xl border border-border-subtle bg-bg-panel">
        {loading && <div className="px-4 py-6 text-center text-sm text-text-muted">Loading…</div>}
        {!loading && filtered.length === 0 && (
          <div className="px-4 py-6 text-center text-sm text-text-muted">No documents yet.</div>
        )}
        {filtered.map((d) => (
          <div key={d.id} className="flex items-center justify-between gap-3 px-4 py-3">
            <div className="flex min-w-0 items-center gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent-soft text-accent">
                <FileText size={16} />
              </span>
              <div className="min-w-0">
                <div className="truncate text-sm font-medium text-text-primary">{d.title}</div>
                <div className="text-xs text-text-muted">
                  {[d.faculty, d.level].filter(Boolean).join(" • ") || "General"}
                  {d.fileSize ? ` • ${(d.fileSize / 1024 / 1024).toFixed(1)}MB` : ""}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <a href={d.fileUrl} target="_blank" rel="noreferrer" className="text-text-secondary hover:text-accent" aria-label="Open">
                <ExternalLink size={16} />
              </a>
              <button onClick={() => handleDelete(d)} className="text-text-secondary hover:text-status-danger" aria-label="Delete">
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}