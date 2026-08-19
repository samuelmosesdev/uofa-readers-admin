import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Users, UserCog, FileText, CreditCard } from "lucide-react";
import KpiCard from "../components/KpiCard";
import GrowthChart from "../components/GrowthChart";
import FreeVsPaidDonut from "../components/FreeVsPaidDonut";
import RecentActivityTable from "../components/RecentActivityTable";
import Modal from "../components/Modal";
import QuickAddForm from "../components/QuickAddForm";
import { useDashboardData } from "../hooks/useDashboardData";
import { PageHeader, LoadingState, ErrorState } from "../components/ui";

export default function AdminDashboard() {
  const { kpis, freeVsPaid, userGrowth, recentActivity, loading, error, retry } =
    useDashboardData();
  const [modal, setModal] = useState(null);
  const navigate = useNavigate();

  if (loading) {
    return <LoadingState message="Loading dashboard…" />;
  }

  if (error) {
    return (
      <ErrorState title="Dashboard unavailable" message={error} onRetry={retry} />
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <PageHeader
        title="Dashboard"
        description="Live overview of users, content and subscriptions."
      />

      <section aria-label="Key metrics">
        <div className="stagger-children grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <KpiCard
            label="Total Users"
            value={kpis.totalUsers.toLocaleString()}
            highlight
            icon={Users}
          />
          <KpiCard label="Active Agents" value={kpis.activeAgents} icon={UserCog} />
          <KpiCard
            label="Documents Uploaded"
            value={kpis.documentsUploaded.toLocaleString()}
            icon={FileText}
          />
          <KpiCard
            label="Active Subscriptions"
            value={kpis.activeSubscriptions.toLocaleString()}
            icon={CreditCard}
          />
        </div>
      </section>

      <section
        aria-label="Growth and plan mix"
        className="grid grid-cols-1 gap-4 xl:grid-cols-[2fr_1fr]"
      >
        <GrowthChart data={userGrowth} />
        <FreeVsPaidDonut freePct={freeVsPaid.freePct} paidPct={freeVsPaid.paidPct} />
      </section>

      <section aria-label="Recent activity">
        <RecentActivityTable
          activity={recentActivity}
          onAddUser={() => setModal("user")}
          onAddAgent={() => setModal("agent")}
          onCreateCbt={() => navigate("/admin/cbt-builder")}
          onUploadAnnouncement={() => navigate("/admin/announcements")}
        />
      </section>

      <Modal
        title={modal === "agent" ? "Add Agent" : "Add User"}
        open={!!modal}
        onClose={() => setModal(null)}
      >
        <QuickAddForm target={modal} onDone={() => setModal(null)} />
      </Modal>
    </div>
  );
}
