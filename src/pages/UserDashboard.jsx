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
  Play,
} from "lucide-react";
import StudentKpiCard from "../components/StudentKpiCard";
import ContinueCard from "../components/ContinueCard";
import RecommendedCard from "../components/RecommendedCard";
import { useUserDashboardData } from "../hooks/useUserDashboardData";
import { useCbtData } from "../hooks/useCbtData";
import { useAuth } from "../context/AuthContext";

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
    if (!faculty) return recommended.slice(0, 4);
    const matched = recommended.filter((c) => c.faculty === faculty);
    return (matched.length ? matched : recommended).slice(0, 4);
  }, [recommended, profile?.faculty]);

  const firstName = profile?.name?.split(" ")[0] || "Student";

  return (
    <div className="space-y-8">
      <section className="rounded-2xl border border-border-light bg-card-light p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-lg font-semibold text-ink sm:text-xl">
              Welcome back, {firstName}
            </h1>
            <p className="mt-1 text-sm text-ink-muted">
              {profile?.faculty
                ? `${profile.faculty}${profile.level ? ` · ${profile.level}` : ""}`
                : "Complete your profile to get personalised recommendations."}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => navigate("/dashboard/practice")}
              className="flex items-center gap-2 rounded-lg bg-teal px-4 py-2 text-sm font-semibold text-white hover:bg-teal-dark"
            >
              <ClipboardCheck size={15} />
              Practice CBT
            </button>
            <button
              type="button"
              onClick={() => navigate("/dashboard/reading-hub")}
              className="flex items-center gap-2 rounded-lg border border-border-light bg-surface-light px-4 py-2 text-sm font-medium text-ink hover:border-teal/40"
            >
              <Library size={15} />
              Reading Hub
            </button>
          </div>
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold text-ink-muted">Your progress</h2>
        <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
          <StudentKpiCard
            icon={BookMarked}
            value={loading ? "--" : kpis.coursesEnrolled}
            label="Courses Enrolled"
          />
          <StudentKpiCard
            icon={Brain}
            value={loading ? "--" : kpis.questionsPracticed}
            label="Questions Practiced"
          />
          <StudentKpiCard
            icon={Flame}
            value={loading ? "--" : `${kpis.studyStreakDays} days`}
            label="Study Streak"
          />
          <StudentKpiCard icon={Sparkles} value={`Subscription\n${kpis.plan}`} circular />
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold text-ink-muted">Quick actions</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <button
            type="button"
            onClick={() => navigate("/dashboard/practice")}
            className="flex items-center gap-3 rounded-2xl border border-border-light bg-card-light p-4 text-left transition hover:border-teal/40 hover:shadow-sm"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-soft text-teal">
              <Play size={18} />
            </span>
            <div>
              <p className="text-sm font-semibold text-ink">Start a practice set</p>
              <p className="text-xs text-ink-muted">CBT questions by course code</p>
            </div>
          </button>
          <button
            type="button"
            onClick={() => navigate("/dashboard/reading-hub")}
            className="flex items-center gap-3 rounded-2xl border border-border-light bg-card-light p-4 text-left transition hover:border-teal/40 hover:shadow-sm"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-soft text-teal">
              <BookOpen size={18} />
            </span>
            <div>
              <p className="text-sm font-semibold text-ink">Open Reading Hub</p>
              <p className="text-xs text-ink-muted">Materials for your faculty & level</p>
            </div>
          </button>
          <button
            type="button"
            onClick={() => navigate("/dashboard/profile")}
            className="flex items-center gap-3 rounded-2xl border border-border-light bg-card-light p-4 text-left transition hover:border-teal/40 hover:shadow-sm"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-soft text-teal">
              <Sparkles size={18} />
            </span>
            <div>
              <p className="text-sm font-semibold text-ink">View profile</p>
              <p className="text-xs text-ink-muted">
                {profile?.uniqueId ? profile.uniqueId : "Update your details"}
              </p>
            </div>
          </button>
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold text-ink-muted">Continue where you left off</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {loading && (
            <p className="col-span-3 rounded-2xl border border-dashed border-border-light bg-card-light p-6 text-center text-sm text-ink-muted">
              Loading your progress…
            </p>
          )}
          {!loading && enrollments.length === 0 && (
            <div className="col-span-3 rounded-2xl border border-dashed border-border-light bg-card-light p-6 text-center">
              <p className="text-sm font-medium text-ink">No courses in progress yet</p>
              <p className="mt-1 text-sm text-ink-muted">
                Start a practice set or open the Reading Hub to begin.
              </p>
              <button
                type="button"
                onClick={() => navigate("/dashboard/practice")}
                className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-teal hover:underline"
              >
                Go to Practice <ArrowRight size={14} />
              </button>
            </div>
          )}
          {enrollments.map((e) => (
            <ContinueCard
              key={e.id}
              title={e.courseTitle}
              subtitle={e.topicLabel}
              progressPct={e.progressPct}
            />
          ))}
        </div>
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-ink-muted">Practice sets for you</h2>
          <button
            type="button"
            onClick={() => navigate("/dashboard/practice")}
            className="text-xs font-medium text-teal hover:underline"
          >
            See all →
          </button>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {cbtLoading && (
            <p className="col-span-4 rounded-2xl border border-dashed border-border-light bg-card-light p-6 text-center text-sm text-ink-muted">
              Loading practice sets…
            </p>
          )}
          {!cbtLoading && relevantPractice.length === 0 && (
            <div className="col-span-4 rounded-2xl border border-dashed border-border-light bg-card-light p-6 text-center">
              <p className="text-sm font-medium text-ink">No practice sets yet</p>
              <p className="mt-1 text-sm text-ink-muted">
                Once an admin adds questions with course codes, they will appear here.
              </p>
            </div>
          )}
          {relevantPractice.map((set) => (
            <button
              key={set.courseCode}
              type="button"
              onClick={() => navigate("/dashboard/practice")}
              className="flex flex-col rounded-2xl border border-border-light bg-card-light p-4 text-left transition hover:border-teal/40 hover:shadow-sm"
            >
              <span className="inline-block w-fit rounded-md bg-teal-soft px-2 py-0.5 text-[11px] font-bold tracking-wide text-teal">
                {set.courseCode}
              </span>
              <p className="mt-2 truncate text-sm font-semibold text-ink">{set.courseTitle}</p>
              <p className="mt-1 text-xs text-ink-muted">
                {set.questionCount} question{set.questionCount !== 1 ? "s" : ""}
                {set.topics.length > 0 && ` · ${set.topics.length} topics`}
              </p>
            </button>
          ))}
        </div>
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-ink-muted">Recommended for you</h2>
          <span className="text-xs font-medium text-teal">Courses</span>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
          {!loading && displayRecommended.length === 0 && (
            <p className="col-span-4 rounded-2xl border border-dashed border-border-light bg-card-light p-6 text-center text-sm text-ink-muted">
              Recommendations will appear once courses are published in Firestore.
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