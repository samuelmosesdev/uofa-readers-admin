import { BookMarked, Brain, Flame, Sparkles } from "lucide-react";
import StudentKpiCard from "../components/StudentKpiCard";
import ContinueCard from "../components/ContinueCard";
import RecommendedCard from "../components/RecommendedCard";
import { useUserDashboardData } from "../hooks/useUserDashboardData";

export default function UserDashboard() {
  const { kpis, enrollments, recommended, loading } = useUserDashboardData();

  return (
    <>
      <section>
        <h2 className="mb-3 text-sm font-semibold text-ink-muted">KPI</h2>
        <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
          <StudentKpiCard icon={BookMarked} value={loading ? "--" : kpis.coursesEnrolled} label="Courses Enrolled" />
          <StudentKpiCard icon={Brain} value={loading ? "--" : kpis.questionsPracticed} label="Questions Practiced" />
          <StudentKpiCard icon={Flame} value={loading ? "--" : `${kpis.studyStreakDays} days`} label="Study Streak" />
          <StudentKpiCard icon={Sparkles} value={`Subscription\n${kpis.plan}`} circular />
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold text-ink-muted">Continue where you left off</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {enrollments.length === 0 && (
            <p className="col-span-3 rounded-2xl border border-dashed border-border-light bg-card-light p-6 text-center text-sm text-ink-muted">
              Enroll in a course to see your progress here.
            </p>
          )}
          {enrollments.map((e) => (
            <ContinueCard key={e.id} title={e.courseTitle} subtitle={e.topicLabel} progressPct={e.progressPct} />
          ))}
        </div>
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-ink-muted">Recommended for you</h2>
          <span className="text-xs font-medium text-teal">Topic ⇢</span>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
          {recommended.length === 0 && (
            <p className="col-span-4 rounded-2xl border border-dashed border-border-light bg-card-light p-6 text-center text-sm text-ink-muted">
              Recommendations will appear once courses are published.
            </p>
          )}
          {recommended.map((c) => (
            <RecommendedCard key={c.id} title={c.title} code={c.code} thumbnailUrl={c.thumbnailUrl} />
          ))}
        </div>
      </section>
    </>
  );
}