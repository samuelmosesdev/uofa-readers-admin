import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { FileText, BookOpen, ClipboardList, Upload, Sparkles } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import AiCourseImportModal from "../components/AiCourseImportModal";
import { isAgent, isAlpha, isAdmin } from "../lib/roles";
import { useCbtData } from "../hooks/useCbtData";
import { useAdminDocuments } from "../hooks/useAdminDocuments";
import StaffFeed from "../components/StaffFeed";
import { Link } from "react-router-dom";

export default function AgentDashboard() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [showAiImport, setShowAiImport] = useState(false);
  const { courses, questions, loading: cbtLoading } = useCbtData();
  const { documents, loading: docsLoading } = useAdminDocuments();

  const firstName = profile?.name?.split(" ")[0] || "Agent";

  const cards = [
    {
      label: "Documents",
      value: docsLoading ? "—" : documents.length,
      icon: FileText,
      to: "/agent/documents",
      hint: "Upload reading materials",
    },
    {
      label: "Courses",
      value: cbtLoading ? "—" : courses.length,
      icon: BookOpen,
      to: "/agent/courses",
      hint: "Manage course list",
    },
    {
      label: "CBT questions",
      value: cbtLoading ? "—" : questions.length,
      icon: ClipboardList,
      to: "/agent/cbt-builder",
      hint: "Add or import questions",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-text-primary">Welcome, {firstName}</h1>
        <p className="text-sm text-text-secondary">
          Upload documents, maintain courses, and build CBT question banks for students.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {cards.map(({ label, value, icon: Icon, to, hint }) => (
          <button
            key={label}
            type="button"
            onClick={() => navigate(to)}
            className="rounded-xl border border-border-subtle bg-bg-panel p-5 text-left transition hover:border-accent/40"
          >
            <div className="mb-3 flex items-center justify-between">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent-soft text-accent">
                <Icon size={18} />
              </span>
              <span className="text-2xl font-bold text-text-primary">{value}</span>
            </div>
            <p className="text-sm font-semibold text-text-primary">{label}</p>
            <p className="mt-0.5 text-xs text-text-muted">{hint}</p>
          </button>
        ))}
      </div>

      <div className="rounded-xl border border-border-subtle bg-bg-panel p-5">
        <h2 className="mb-3 text-sm font-semibold text-text-primary">Quick actions</h2>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => navigate("/agent/documents")}
            className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-bg-app hover:bg-accent-strong"
          >
            <Upload size={15} /> Upload document
          </button>
          <button
            type="button"
            onClick={() => navigate("/agent/courses")}
            className="flex items-center gap-2 rounded-lg border border-border-subtle px-4 py-2 text-sm font-medium text-text-primary hover:bg-bg-panel-alt"
          >
            <BookOpen size={15} /> Add course
          </button>
          <button
            type="button"
            onClick={() => navigate("/agent/cbt-builder")}
            className="flex items-center gap-2 rounded-lg border border-border-subtle px-4 py-2 text-sm font-medium text-text-primary hover:bg-bg-panel-alt"
          >
            <ClipboardList size={15} /> CBT Builder
          </button>
          {(isAgent(profile) || isAlpha(profile) || isAdmin(profile)) && (
            <button
              type="button"
              onClick={() => setShowAiImport(true)}
              className="flex items-center gap-2 rounded-lg border border-border-subtle px-4 py-2 text-sm font-medium text-text-primary hover:bg-bg-panel-alt"
            >
              <Sparkles size={15} /> AI import courses
            </button>
          )}
        </div>
      </div>
      <AiCourseImportModal
        open={showAiImport}
        onClose={() => setShowAiImport(false)}
        mode="direct"
        defaultFaculty={profile?.faculty || ""}
        defaultDepartment={profile?.department || ""}
      />
    
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-text-primary">Latest department feeds</h2>
          <Link to="/agent/feeds" className="text-xs font-medium text-accent hover:underline">
            View all →
          </Link>
        </div>
        <StaffFeed compact maxItems={5} />
      </section>
</div>
  );
}