import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FileText, Search, ChevronRight } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useStudentDocuments } from "../hooks/useStudentDocuments";
import { FACULTIES } from "../data/facultyData";

const LEVELS = ["100 Level", "200 Level", "300 Level", "400 Level", "500 Level", "Postgraduate", "General"];

export default function StudentDocuments() {
  const { profile } = useAuth();
  const { documents, loading } = useStudentDocuments();
  const navigate = useNavigate();

  const [search, setSearch] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [level, setLevel] = useState(profile?.level || "");
  const [faculty, setFaculty] = useState(profile?.faculty || "");

  const suggestions = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return [];
    return documents.filter((d) => d.title?.toLowerCase().includes(q)).slice(0, 5);
  }, [documents, search]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return documents.filter((d) => {
      const matchesSearch = !q || d.title?.toLowerCase().includes(q);
      const matchesFaculty = !faculty || !d.faculty || d.faculty === faculty;
      const matchesLevel = !level || !d.level || d.level === level;
      return matchesSearch && matchesFaculty && matchesLevel;
    });
  }, [documents, search, faculty, level]);

  const fieldClass =
    "rounded-lg border border-border-light bg-card-light px-3 py-2 text-sm text-ink focus:border-teal focus:outline-none";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-ink">Reading Hub</h1>
        <p className="text-sm text-ink-muted">Materials for your faculty and level — adjust the filters anytime.</p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative w-full sm:max-w-sm">
          <div className="flex items-center gap-2 rounded-lg border border-border-light bg-card-light px-3 py-2">
            <Search size={15} className="text-ink-muted" />
            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
              placeholder="Search documents…"
              className="w-full bg-transparent text-sm text-ink placeholder:text-ink-muted focus:outline-none"
            />
          </div>
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute z-10 mt-1 w-full overflow-hidden rounded-lg border border-border-light bg-card-light shadow-lg">
              {suggestions.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onMouseDown={() => {
                    setSearch(s.title);
                    setShowSuggestions(false);
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-ink hover:bg-surface-light"
                >
                  <FileText size={14} className="text-ink-muted" />
                  <span className="truncate">{s.title}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <select value={faculty} onChange={(e) => setFaculty(e.target.value)} className={fieldClass}>
          <option value="">All faculties</option>
          {FACULTIES.map((f) => (
            <option key={f.name} value={f.name}>
              {f.name}
            </option>
          ))}
        </select>

        <select value={level} onChange={(e) => setLevel(e.target.value)} className={fieldClass}>
          <option value="">All levels</option>
          {LEVELS.map((lvl) => (
            <option key={lvl} value={lvl}>
              {lvl}
            </option>
          ))}
        </select>
      </div>

      <div className="divide-y divide-border-light rounded-xl border border-border-light bg-card-light">
        {loading && <div className="px-4 py-6 text-center text-sm text-ink-muted">Loading…</div>}
        {!loading && filtered.length === 0 && (
          <div className="px-4 py-6 text-center text-sm text-ink-muted">
            No documents match your filters yet.
          </div>
        )}
        {filtered.map((d) => (
          <button
            key={d.id}
            onClick={() => navigate(`/dashboard/reading-hub/${d.id}`)}
            className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left hover:bg-surface-light"
          >
            <div className="flex min-w-0 items-center gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-teal-soft text-teal">
                <FileText size={16} />
              </span>
              <div className="min-w-0">
                <div className="truncate text-sm font-medium text-ink">{d.title}</div>
                <div className="text-xs text-ink-muted">
                  {[d.faculty, d.level].filter(Boolean).join(" • ") || "General"}
                  {d.fileSize ? ` • ${(d.fileSize / 1024 / 1024).toFixed(1)}MB` : ""}
                </div>
              </div>
            </div>
            <ChevronRight size={16} className="shrink-0 text-ink-muted" />
          </button>
        ))}
      </div>
    </div>
  );
}
