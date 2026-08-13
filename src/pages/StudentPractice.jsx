import { useMemo, useState, useCallback, useEffect, useRef } from "react";
import {
  ClipboardCheck,
  Search,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  XCircle,
  Flag,
  Clock,
  BookOpen,
  Layers,
  Award,
  AlertTriangle,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useCbtData } from "../hooks/useCbtData";
import { FACULTIES, departmentsFor } from "../data/facultyData";
import { doc, updateDoc, increment, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase/config";

const LEVELS = [
  "100 Level",
  "200 Level",
  "300 Level",
  "400 Level",
  "500 Level",
  "Postgraduate",
  "General",
];
const DIFFICULTIES = ["all", "easy", "medium", "hard"];
const DEFAULT_DURATION_MIN = 45;

const fieldClass =
  "rounded-lg border border-border-light bg-card-light px-3 py-2 text-sm text-ink focus:border-teal focus:outline-none";

function formatTime(sec) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function StudentPractice() {
  const { user, profile } = useAuth();
  const { practiceSets, questions, loading } = useCbtData();

  const [search, setSearch] = useState("");
  const [faculty, setFaculty] = useState(profile?.faculty || "");
  const [department, setDepartment] = useState(profile?.department || "");
  const [level, setLevel] = useState(profile?.level || "");
  const [difficulty, setDifficulty] = useState("all");
  const [questionLimit, setQuestionLimit] = useState(20);
  const [timed, setTimed] = useState(true);

  const [activeSet, setActiveSet] = useState(null);
  const [sessionQuestions, setSessionQuestions] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState({});
  const [flagged, setFlagged] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(null);
  const [startedAt, setStartedAt] = useState(null);
  const autoSubmitRef = useRef(false);

  const departments = useMemo(() => departmentsFor(faculty), [faculty]);

  const filteredSets = useMemo(() => {
    const q = search.trim().toLowerCase();
    return practiceSets.filter((s) => {
      const matchesSearch =
        !q ||
        s.courseCode.toLowerCase().includes(q) ||
        s.courseTitle.toLowerCase().includes(q) ||
        s.topics.some((t) => t.toLowerCase().includes(q));
      const matchesFaculty = !faculty || s.faculty === faculty;
      const matchesDept = !department || s.department === department;
      const matchesLevel = !level || s.level === level;
      return matchesSearch && matchesFaculty && matchesDept && matchesLevel;
    });
  }, [practiceSets, search, faculty, department, level]);

  const startPractice = useCallback(
    (set) => {
      let pool = questions.filter((q) => q.courseCode === set.courseCode);
      if (difficulty !== "all") {
        pool = pool.filter((q) => q.difficulty === difficulty);
      }
      pool = shuffle(pool);
      const limit = Math.min(questionLimit, pool.length);
      if (limit === 0) return;
      pool = pool.slice(0, limit);

      setActiveSet(set);
      setSessionQuestions(pool);
      setCurrentIdx(0);
      setAnswers({});
      setFlagged({});
      setSubmitted(false);
      setStartedAt(Date.now());
      autoSubmitRef.current = false;
      if (timed) {
        const mins = Math.min(
          DEFAULT_DURATION_MIN,
          Math.max(10, Math.ceil(limit * 1.5))
        );
        setSecondsLeft(mins * 60);
      } else {
        setSecondsLeft(null);
      }
    },
    [questions, difficulty, questionLimit, timed]
  );

  const finishPractice = useCallback(async () => {
    if (submitted) return;
    setSubmitted(true);
    setSecondsLeft(null);
    if (user) {
      try {
        await updateDoc(doc(db, "users", user.uid), {
          questionsPracticedCount: increment(sessionQuestions.length),
          lastPracticeAt: serverTimestamp(),
        });
      } catch {
        // non-critical
      }
    }
  }, [submitted, user, sessionQuestions.length]);

  useEffect(() => {
    if (secondsLeft == null || submitted || !activeSet) return;
    if (secondsLeft <= 0) {
      if (!autoSubmitRef.current) {
        autoSubmitRef.current = true;
        finishPractice();
      }
      return;
    }
    const id = setTimeout(() => setSecondsLeft((s) => (s == null ? s : s - 1)), 1000);
    return () => clearTimeout(id);
  }, [secondsLeft, submitted, activeSet, finishPractice]);

  const selectAnswer = (questionId, optionIndex) => {
    if (submitted) return;
    setAnswers((prev) => ({ ...prev, [questionId]: optionIndex }));
  };

  const toggleFlag = (questionId) => {
    if (submitted) return;
    setFlagged((prev) => ({ ...prev, [questionId]: !prev[questionId] }));
  };

  const score = useMemo(() => {
    if (!submitted) return null;
    let correct = 0;
    const byDiff = {
      easy: { c: 0, t: 0 },
      medium: { c: 0, t: 0 },
      hard: { c: 0, t: 0 },
    };
    for (const q of sessionQuestions) {
      const ok = answers[q.id] === q.correctIndex;
      if (ok) correct += 1;
      const d = q.difficulty && byDiff[q.difficulty] ? q.difficulty : "medium";
      byDiff[d].t += 1;
      if (ok) byDiff[d].c += 1;
    }
    const total = sessionQuestions.length;
    const pct = total ? Math.round((correct / total) * 100) : 0;
    const elapsedSec = startedAt
      ? Math.max(0, Math.round((Date.now() - startedAt) / 1000))
      : null;
    return { correct, total, pct, byDiff, elapsedSec };
  }, [submitted, sessionQuestions, answers, startedAt]);

  const exitSession = () => {
    setActiveSet(null);
    setSessionQuestions([]);
    setCurrentIdx(0);
    setAnswers({});
    setFlagged({});
    setSubmitted(false);
    setSecondsLeft(null);
    setStartedAt(null);
  };

  const answeredCount = useMemo(
    () => Object.keys(answers).filter((id) => answers[id] !== undefined).length,
    [answers]
  );

  // ── Active assessment session ────────────────────────────────────────────
  if (activeSet && sessionQuestions.length > 0) {
    if (submitted && score) {
      const pass = score.pct >= 50;
      return (
        <div className="mx-auto max-w-3xl space-y-6">
          <div className="overflow-hidden rounded-2xl border border-border-light bg-card-light shadow-sm">
            <div className={`px-6 py-8 text-center ${pass ? "bg-teal/10" : "bg-red-50"}`}>
              <div
                className={`mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full ${
                  pass ? "bg-teal text-white" : "bg-red-500 text-white"
                }`}
              >
                {pass ? <Award size={28} /> : <AlertTriangle size={28} />}
              </div>
              <h1 className="text-xl font-bold text-ink">Assessment Complete</h1>
              <p className="mt-1 text-sm text-ink-muted">
                {activeSet.courseCode} · {activeSet.courseTitle}
              </p>
              <div className="mt-5 text-4xl font-bold tabular-nums text-ink">{score.pct}%</div>
              <p className="mt-1 text-sm text-ink-muted">
                {score.correct} of {score.total} correct
                {score.elapsedSec != null && <> · Time used {formatTime(score.elapsedSec)}</>}
              </p>
              <p className={`mt-3 text-sm font-semibold ${pass ? "text-teal" : "text-red-600"}`}>
                {pass ? "Performance: Satisfactory" : "Performance: Needs improvement"}
              </p>
            </div>

            <div className="grid grid-cols-3 divide-x divide-border-light border-t border-border-light">
              {["easy", "medium", "hard"].map((d) => (
                <div key={d} className="px-3 py-4 text-center">
                  <div className="text-[11px] font-medium uppercase tracking-wide text-ink-muted">{d}</div>
                  <div className="mt-1 text-sm font-semibold text-ink">
                    {score.byDiff[d].t ? `${score.byDiff[d].c}/${score.byDiff[d].t}` : "—"}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-ink">Question review</h2>
            {sessionQuestions.map((q, i) => {
              const selected = answers[q.id];
              const ok = selected === q.correctIndex;
              return (
                <div
                  key={q.id}
                  className={`rounded-xl border p-4 ${
                    ok ? "border-teal/30 bg-teal-soft/30" : "border-red-200 bg-red-50/50"
                  }`}
                >
                  <div className="mb-2 flex items-center gap-2 text-xs text-ink-muted">
                    <span className="font-semibold text-ink">Q{i + 1}</span>
                    {q.difficulty && <span className="capitalize">· {q.difficulty}</span>}
                    {ok ? (
                      <CheckCircle2 size={14} className="text-teal" />
                    ) : (
                      <XCircle size={14} className="text-red-500" />
                    )}
                  </div>
                  <p className="text-sm font-medium text-ink">{q.questionText}</p>
                  <div className="mt-2 space-y-1 text-sm">
                    {(q.options || []).map((opt, idx) => {
                      const isCorrect = idx === q.correctIndex;
                      const isSelected = selected === idx;
                      return (
                        <div
                          key={idx}
                          className={`flex gap-2 rounded-lg px-2 py-1.5 ${
                            isCorrect
                              ? "bg-teal/10 font-medium text-teal"
                              : isSelected
                                ? "bg-red-100 text-red-700"
                                : "text-ink-muted"
                          }`}
                        >
                          <span className="font-semibold">{String.fromCharCode(65 + idx)}.</span>
                          <span>{opt}</span>
                        </div>
                      );
                    })}
                  </div>
                  {q.explanation && (
                    <p className="mt-3 border-t border-border-light pt-2 text-xs text-ink-muted">
                      <span className="font-semibold text-ink">Explanation: </span>
                      {q.explanation}
                    </p>
                  )}
                </div>
              );
            })}
          </div>

          <button
            type="button"
            onClick={exitSession}
            className="w-full rounded-lg bg-teal px-5 py-3 text-sm font-semibold text-white hover:bg-teal-dark"
          >
            Return to assessment list
          </button>
        </div>
      );
    }

    const q = sessionQuestions[currentIdx];
    const selected = answers[q.id];
    const isFlagged = !!flagged[q.id];
    const timerUrgent = secondsLeft != null && secondsLeft <= 120;

    return (
      <div className="mx-auto flex max-w-5xl flex-col gap-4 lg:flex-row">
        <div className="min-w-0 flex-1 space-y-4">
          <div className="rounded-xl border border-border-light bg-card-light px-4 py-3 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
                  Computer-Based Assessment
                </div>
                <div className="text-sm font-semibold text-ink">
                  {activeSet.courseCode} — {activeSet.courseTitle}
                </div>
                <div className="mt-0.5 text-xs text-ink-muted">
                  {profile?.uniqueId && <>ID: {profile.uniqueId} · </>}
                  {profile?.name || profile?.email || "Candidate"}
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                {secondsLeft != null && (
                  <div
                    className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-bold tabular-nums ${
                      timerUrgent ? "bg-red-100 text-red-700" : "bg-surface-light text-ink"
                    }`}
                  >
                    <Clock size={15} />
                    {formatTime(secondsLeft)}
                  </div>
                )}
                <div className="text-xs text-ink-muted">
                  Answered{" "}
                  <span className="font-semibold text-ink">
                    {answeredCount}/{sessionQuestions.length}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={exitSession}
                  className="text-xs font-medium text-ink-muted hover:text-red-600"
                >
                  Exit
                </button>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-border-light bg-card-light p-5 shadow-sm sm:p-6">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-xs text-ink-muted">
                <span className="rounded-md bg-teal-soft px-2 py-0.5 font-bold text-teal">
                  Question {currentIdx + 1} of {sessionQuestions.length}
                </span>
                {q.topic && <span>· {q.topic}</span>}
                {q.difficulty && <span className="capitalize">· {q.difficulty}</span>}
              </div>
              <button
                type="button"
                onClick={() => toggleFlag(q.id)}
                className={`flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs font-medium ${
                  isFlagged
                    ? "border-amber-400 bg-amber-50 text-amber-700"
                    : "border-border-light text-ink-muted hover:border-amber-300"
                }`}
              >
                <Flag size={13} />
                {isFlagged ? "Flagged" : "Flag for review"}
              </button>
            </div>

            <p className="text-base font-medium leading-relaxed text-ink">{q.questionText}</p>

            <div className="mt-5 space-y-2.5">
              {(q.options || []).map((opt, idx) => {
                const isSelected = selected === idx;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => selectAnswer(q.id, idx)}
                    className={`flex w-full items-start gap-3 rounded-xl border px-4 py-3.5 text-left text-sm transition-colors ${
                      isSelected
                        ? "border-teal bg-teal-soft/60 ring-1 ring-teal/30"
                        : "border-border-light bg-card-light hover:border-teal/40 hover:bg-surface-light"
                    }`}
                  >
                    <span
                      className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                        isSelected
                          ? "bg-teal text-white"
                          : "border border-border-light text-ink-muted"
                      }`}
                    >
                      {String.fromCharCode(65 + idx)}
                    </span>
                    <span className="flex-1 pt-0.5 text-ink">{opt}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              disabled={currentIdx === 0}
              onClick={() => setCurrentIdx((i) => Math.max(0, i - 1))}
              className="flex items-center gap-1 rounded-lg border border-border-light bg-card-light px-4 py-2.5 text-sm font-medium text-ink disabled:opacity-40"
            >
              <ChevronLeft size={16} /> Previous
            </button>

            {currentIdx < sessionQuestions.length - 1 ? (
              <button
                type="button"
                onClick={() =>
                  setCurrentIdx((i) => Math.min(sessionQuestions.length - 1, i + 1))
                }
                className="flex items-center gap-1 rounded-lg bg-teal px-5 py-2.5 text-sm font-semibold text-white hover:bg-teal-dark"
              >
                Next <ChevronRight size={16} />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  const unanswered = sessionQuestions.length - answeredCount;
                  const msg =
                    unanswered > 0
                      ? `You have ${unanswered} unanswered question(s). Submit assessment anyway?`
                      : "Submit this assessment? You cannot change answers after submission.";
                  if (window.confirm(msg)) finishPractice();
                }}
                className="flex items-center gap-2 rounded-lg bg-teal px-5 py-2.5 text-sm font-semibold text-white hover:bg-teal-dark"
              >
                <CheckCircle2 size={16} /> Submit assessment
              </button>
            )}
          </div>
        </div>

        <aside className="w-full shrink-0 lg:w-56">
          <div className="sticky top-4 rounded-xl border border-border-light bg-card-light p-4 shadow-sm">
            <div className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink-muted">
              Question palette
            </div>
            <div className="grid grid-cols-5 gap-1.5 sm:grid-cols-8 lg:grid-cols-5">
              {sessionQuestions.map((qq, i) => {
                const answered = answers[qq.id] !== undefined;
                const fl = flagged[qq.id];
                const isCurrent = i === currentIdx;
                return (
                  <button
                    key={qq.id}
                    type="button"
                    onClick={() => setCurrentIdx(i)}
                    className={`relative flex h-9 items-center justify-center rounded-md text-xs font-semibold transition-colors ${
                      isCurrent
                        ? "bg-teal text-white ring-2 ring-teal/40"
                        : answered
                          ? "bg-teal-soft text-teal"
                          : "bg-surface-light text-ink-muted hover:bg-border-light"
                    }`}
                  >
                    {i + 1}
                    {fl && (
                      <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-amber-500" />
                    )}
                  </button>
                );
              })}
            </div>
            <div className="mt-4 space-y-1.5 border-t border-border-light pt-3 text-[11px] text-ink-muted">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded bg-teal" /> Current
              </div>
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded bg-teal-soft" /> Answered
              </div>
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded border border-border-light bg-surface-light" /> Not
                answered
              </div>
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-amber-500" /> Flagged
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                const unanswered = sessionQuestions.length - answeredCount;
                const msg =
                  unanswered > 0
                    ? `You have ${unanswered} unanswered question(s). Submit assessment anyway?`
                    : "Submit this assessment?";
                if (window.confirm(msg)) finishPractice();
              }}
              className="mt-4 w-full rounded-lg border border-teal bg-teal/10 px-3 py-2 text-xs font-semibold text-teal hover:bg-teal hover:text-white"
            >
              Submit assessment
            </button>
          </div>
        </aside>
      </div>
    );
  }

  // ── Practice set browser ─────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-ink">CBT Practice Assessments</h1>
        <p className="mt-1 text-sm text-ink-muted">
          Select a course set to begin a timed, exam-style practice session. Questions are drawn
          from the official bank.
        </p>
      </div>

      <div className="rounded-2xl border border-border-light bg-card-light p-4 shadow-sm sm:p-5">
        <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-ink-muted">
          <Search size={14} /> Filters & session options
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search course code or title…"
            className={`${fieldClass} xl:col-span-2`}
          />

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

          <select value={level} onChange={(e) => setLevel(e.target.value)} className={fieldClass}>
            <option value="">All levels</option>
            {LEVELS.map((lvl) => (
              <option key={lvl} value={lvl}>
                {lvl}
              </option>
            ))}
          </select>

          <select
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value)}
            className={fieldClass}
          >
            {DIFFICULTIES.map((d) => (
              <option key={d} value={d}>
                {d === "all" ? "All difficulties" : d.charAt(0).toUpperCase() + d.slice(1)}
              </option>
            ))}
          </select>

          <select
            value={questionLimit}
            onChange={(e) => setQuestionLimit(Number(e.target.value))}
            className={fieldClass}
          >
            {[10, 20, 30, 40].map((n) => (
              <option key={n} value={n}>
                {n} questions / session
              </option>
            ))}
          </select>

          <label className="flex items-center gap-2 rounded-lg border border-border-light bg-card-light px-3 py-2 text-sm text-ink">
            <input
              type="checkbox"
              checked={timed}
              onChange={(e) => setTimed(e.target.checked)}
              className="accent-teal"
            />
            Timed session
          </label>
        </div>
      </div>

      {loading && (
        <div className="rounded-2xl border border-dashed border-border-light bg-card-light p-10 text-center text-sm text-ink-muted">
          Loading assessment sets…
        </div>
      )}

      {!loading && filteredSets.length === 0 && (
        <div className="rounded-2xl border border-dashed border-border-light bg-card-light p-10 text-center">
          <ClipboardCheck size={32} className="mx-auto mb-3 text-ink-muted" />
          <p className="text-sm font-medium text-ink">No assessment sets match your filters</p>
          <p className="mt-1 text-sm text-ink-muted">
            Clear filters, or ask an administrator to publish questions for your courses.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {filteredSets.map((set) => (
          <div
            key={set.courseCode}
            className="flex flex-col rounded-2xl border border-border-light bg-card-light p-5 shadow-sm transition hover:border-teal/40 hover:shadow-md"
          >
            <div className="mb-3 flex items-start justify-between gap-2">
              <div>
                <span className="inline-block rounded-md bg-teal-soft px-2 py-0.5 text-xs font-bold tracking-wide text-teal">
                  {set.courseCode}
                </span>
                <h3 className="mt-1.5 text-sm font-semibold leading-snug text-ink">
                  {set.courseTitle}
                </h3>
              </div>
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-teal-soft text-teal">
                <BookOpen size={16} />
              </span>
            </div>

            <div className="mb-4 space-y-0.5 text-xs text-ink-muted">
              {set.faculty && <div>{set.faculty}</div>}
              {set.department && <div>{set.department}</div>}
              {set.level && <div>{set.level}</div>}
              <div className="flex items-center gap-1.5 pt-1.5 font-medium text-ink">
                <Layers size={12} />
                {set.questionCount} question{set.questionCount !== 1 ? "s" : ""} in bank
              </div>
            </div>

            {set.topics.length > 0 && (
              <div className="mb-4 flex flex-wrap gap-1">
                {set.topics.slice(0, 4).map((t) => (
                  <span
                    key={t}
                    className="rounded-full border border-border-light bg-surface-light px-2 py-0.5 text-[11px] text-ink-muted"
                  >
                    {t}
                  </span>
                ))}
                {set.topics.length > 4 && (
                  <span className="rounded-full border border-border-light bg-surface-light px-2 py-0.5 text-[11px] text-ink-muted">
                    +{set.topics.length - 4}
                  </span>
                )}
              </div>
            )}

            <button
              type="button"
              onClick={() => startPractice(set)}
              disabled={set.questionCount === 0}
              className="mt-auto flex w-full items-center justify-center gap-2 rounded-lg bg-teal px-4 py-2.5 text-sm font-semibold text-white hover:bg-teal-dark disabled:opacity-50"
            >
              <ClipboardCheck size={15} />
              Begin assessment
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
