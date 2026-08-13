import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  BookMarked,
  Brain,
  Flame,
  Sparkles,
  ClipboardCheck,
  Library,
  BookOpen,
  ArrowRight,
  ChevronRight,
  CalendarDays,
  Percent,
  Crown,
} from "lucide-react";
import StudentKpiCard from "../components/StudentKpiCard";
import ContinueCard from "../components/ContinueCard";
import RecommendedCard from "../components/RecommendedCard";
import { useUserDashboardData } from "../hooks/useUserDashboardData";
import { useCbtData } from "../hooks/useCbtData";
import { useAuth } from "../context/AuthContext";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export default function UserDashboard() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { kpis, enrollments, recommended, loading } = useUserDashboardData();
  const { practiceSets, loading: cbtLoading } = useCbtData();

  const relevantPractice = useMemo(() => {
    if (!practiceSets.length) return [];
    const faculty = profile?.faculty;
    const level = profile?.level;
    let list = practiceSets;
    if (faculty) {
      const matched = list.filter((s) => s.faculty === faculty);
      if (matched.length) list = matched;
    }
    if (level) {
      const matched = list.filter((s) => s.level === level);
      if (matched.length) list = matched;
    }
    return list.slice(0, 4);
  }, [practiceSets, profile?.faculty, profile?.level]);

  const displayRecommended = useMemo(() => {
    if (!recommended.length) return [];
    const faculty = profile?.faculty;
    if (!faculty) return recommended.slice(0, 6);
    const matched = recommended.filter((c) => c.faculty === faculty);
    return (matched.length ? matched : recommended).slice(0, 6);
  }, [recommended, profile?.faculty]);

  const firstName = profile?.name?.split(" ")[0] || "there";
  const streak = kpis?.studyStreakDays ?? 0;
  // simple visual: mark first N days of week as "done" based on streak
  const todayIndex = (new Date().getDay() + 6) % 7; // Mon=0
  const streakDays = WEEKDAYS.map((_, i) => i <= Math.min(todayIndex, Math.max(0, streak - 1)));

  return (
    <div className="mx-auto max-w-5xl space-y-7 pb-8 animate-fade-in">
      {/* ——— Hero greeting ——— */}
      <section className="relative overflow-hidden rounded-[1.75rem] bg-gradient-to-br from-accent via-accent to-accent-strong p-5 text-bg-sidebar shadow-lg shadow-accent/20 sm:p-7">
        <div className="pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-10 left-1/3 h-32 w-32 rounded-full bg-white/10 blur-2xl" />

        <div className="relative flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-bg-sidebar/80">
              {getGreeting()}, {firstName}
            </p>
            <h1 className="mt-1 text-xl font-bold tracking-tight sm:text-2xl">
              Let&apos;s get a head start.
            </h1>
            <p className="mt-1.5 text-sm text-bg-sidebar/75">
              {profile?.faculty
                ? `${profile.faculty}${profile.level ? ` · ${profile.level}` : ""}`
                : "Complete your profile for personalised picks."}
            </p>
          </div>
          {(profile?.avatarUrl || profile?.photoURL) ? (
            <img
              src={profile.avatarUrl || profile.photoURL}
              alt=""
              className="h-12 w-12 rounded-full object-cover ring-2 ring-white/40"
            />
          ) : (
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-bg-sidebar/20 text-sm font-bold ring-2 ring-white/30">
              {firstName[0]?.toUpperCase()}
            </div>
          )}
        </div>

        {/* Streak strip — Cognify style */}
        <div className="relative mt-6 rounded-2xl bg-white/15 p-3.5 backdrop-blur-sm">
          <div className="flex items-center justify-between gap-1">
            {WEEKDAYS.map((day, i) => (
              <div key={day} className="flex flex-1 flex-col items-center gap-1.5">
                <span
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition ${
                    streakDays[i]
                      ? "bg-white text-accent shadow"
                      : "bg-white/10 text-bg-sidebar/50"
                  }`}
                >
                  {streakDays[i] ? "✓" : day[0]}
                </span>
                <span className="text-[10px] font-medium text-bg-sidebar/70">{day}</span>
              </div>
            ))}
          </div>
          {streak > 0 && (
            <p className="mt-3 flex items-center justify-center gap-1.5 rounded-full bg-bg-sidebar/20 px-3 py-1.5 text-center text-xs font-semibold text-bg-sidebar">
              <Flame size={13} className="text-orange-300" />
              {streak}-day streak — study today to keep it going
            </p>
          )}
        </div>
      </section>

      {/* ——— Stats: horizontal scroll on mobile ——— */}
      <section>
        <div className="-mx-1 flex gap-3 overflow-x-auto px-1 pb-1 scrollbar-none sm:grid sm:grid-cols-2 sm:overflow-visible lg:grid-cols-4">
          <StudentKpiCard
            icon={BookMarked}
            value={loading ? "–" : kpis.coursesEnrolled}
            label="Courses enrolled"
            accent="teal"
          />
          <StudentKpiCard
            icon={Brain}
            value={loading ? "–" : kpis.questionsPracticed}
            label="Questions practiced"
            accent="violet"
          />
          <StudentKpiCard
            icon={Percent}
            value={loading ? "–" : `${kpis.avgProgress ?? 0}%`}
            label="Avg. progress"
            accent="blue"
          />
          <button
            type="button"
            onClick={() => navigate("/dashboard/subscription")}
            className="min-w-[140px] flex-1 text-left sm:min-w-0"
          >
            <StudentKpiCard
              icon={Crown}
              value={kpis.plan || "Free"}
              label="Your plan · upgrade"
              accent="orange"
            />
          </button>
        </div>
      </section>

      {/* ——— Primary CTAs ——— */}
      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => navigate("/dashboard/practice")}
          className="flex items-center gap-4 rounded-3xl border border-border-subtle bg-bg-panel p-4 text-left shadow-sm transition hover:border-accent/40 hover:shadow-md active:scale-[0.99]"
        >
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-400 to-purple-500 text-white shadow-lg shadow-violet-500/25">
            <ClipboardCheck size={22} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-text-primary">Practice CBT</p>
            <p className="text-xs text-text-secondary">Timed quizzes for your courses</p>
          </div>
          <ChevronRight size={18} className="text-text-muted" />
        </button>

        <button
          type="button"
          onClick={() => navigate("/dashboard/reading-hub")}
          className="flex items-center gap-4 rounded-3xl border border-border-subtle bg-bg-panel p-4 text-left shadow-sm transition hover:border-accent/40 hover:shadow-md active:scale-[0.99]"
        >
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 text-white shadow-lg shadow-emerald-500/25">
            <Library size={22} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-text-primary">Reading Hub</p>
            <p className="text-xs text-text-secondary">PDFs & materials for your level</p>
          </div>
          <ChevronRight size={18} className="text-text-muted" />
        </button>
      </section>

      {/* ——— Continue studying ——— */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-bold text-text-primary">Continue studying</h2>
          {enrollments.length > 0 && (
            <button
              type="button"
              onClick={() => navigate("/dashboard/practice")}
              className="text-xs font-semibold text-accent"
            >
              See all
            </button>
          )}
        </div>

        <div className="space-y-3">
          {loading && (
            <div className="rounded-3xl border border-dashed border-border-subtle bg-bg-panel p-8 text-center text-sm text-text-muted">
              Loading your progress…
            </div>
          )}
          {!loading && enrollments.length === 0 && (
            <div className="rounded-3xl border border-dashed border-border-subtle bg-bg-panel p-6 text-center">
              <CalendarDays size={28} className="mx-auto text-text-muted" />
              <p className="mt-3 text-sm font-semibold text-text-primary">Nothing in progress yet</p>
              <p className="mt-1 text-sm text-text-secondary">
                Start a practice set or open a document to begin.
              </p>
              <button
                type="button"
                onClick={() => navigate("/dashboard/courses")}
                className="btn-primary mt-4"
              >
                Select courses <ArrowRight size={14} />
              </button>
            </div>
          )}
          {enrollments.slice(0, 3).map((e) => (
            <ContinueCard
              key={e.id || e.courseId}
              title={e.courseTitle || e.title || "Course"}
              subtitle={e.courseCode || e.subtitle || "Continue where you left off"}
              progressPct={e.progressPct ?? e.progress ?? 0}
              onClick={() => navigate("/dashboard/practice")}
            />
          ))}
        </div>
      </section>

      {/* ——— Practice sets ——— */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-bold text-text-primary">Practice for you</h2>
          <button
            type="button"
            onClick={() => navigate("/dashboard/practice")}
            className="text-xs font-semibold text-accent"
          >
            View all
          </button>
        </div>

        <div className="-mx-1 flex gap-3 overflow-x-auto px-1 pb-1 sm:grid sm:grid-cols-2 sm:overflow-visible lg:grid-cols-4">
          {cbtLoading && (
            <p className="w-full py-6 text-center text-sm text-text-muted sm:col-span-4">
              Loading practice sets…
            </p>
          )}
          {!cbtLoading && relevantPractice.length === 0 && (
            <div className="w-full rounded-3xl border border-dashed border-border-subtle bg-bg-panel p-6 text-center sm:col-span-4">
              <p className="text-sm font-medium text-text-primary">No practice sets yet</p>
              <p className="mt-1 text-sm text-text-secondary">
                Once questions are added for your courses, they show up here.
              </p>
            </div>
          )}
          {relevantPractice.map((set) => (
            <button
              key={set.courseCode}
              type="button"
              onClick={() => navigate("/dashboard/practice")}
              className="flex min-w-[160px] flex-col rounded-3xl border border-border-subtle bg-bg-panel p-4 text-left shadow-sm transition hover:border-accent/30 hover:shadow-md active:scale-[0.98] sm:min-w-0"
            >
              <span className="inline-flex w-fit rounded-lg bg-accent-soft px-2 py-0.5 text-[11px] font-bold tracking-wide text-accent">
                {set.courseCode}
              </span>
              <p className="mt-2.5 line-clamp-2 text-sm font-semibold leading-snug text-text-primary">
                {set.courseTitle}
              </p>
              <p className="mt-1.5 text-xs text-text-secondary">
                {set.questionCount} Qs
                {set.topics?.length > 0 && ` · ${set.topics.length} topics`}
              </p>
            </button>
          ))}
        </div>
      </section>

      {/* ——— Recommended ——— */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-bold text-text-primary">Recommended for you</h2>
          <span className="text-xs font-medium text-text-muted">Courses</span>
        </div>

        <div className="-mx-1 flex gap-3 overflow-x-auto px-1 pb-2 sm:grid sm:grid-cols-3 sm:overflow-visible lg:grid-cols-4">
          {!loading && displayRecommended.length === 0 && (
            <p className="w-full rounded-3xl border border-dashed border-border-subtle bg-bg-panel p-6 text-center text-sm text-text-muted sm:col-span-4">
              Recommendations appear once courses are published.
            </p>
          )}
          {displayRecommended.map((c) => (
            <RecommendedCard
              key={c.id}
              title={c.title}
              code={c.code}
              thumbnailUrl={c.thumbnailUrl}
              onClick={() => navigate("/dashboard/practice")}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
