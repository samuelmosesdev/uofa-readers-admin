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

export default function AdminDashboard() {
  const { kpis, freeVsPaid, userGrowth, recentActivity, loading } = useDashboardData();
  const [modal, setModal] = useState(null);
  const navigate = useNavigate();

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-text-primary">Dashboard</h1>
        <p className="mt-1 text-sm text-text-secondary">
          Live overview of users, content and subscriptions.
        </p>
      </div>

      <section>
        <div className="stagger-children grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <KpiCard
            label="Total Users"
            value={loading ? "--" : kpis.totalUsers.toLocaleString()}
            highlight
            icon={Users}
          />
          <KpiCard
            label="Active Agents"
            value={loading ? "--" : kpis.activeAgents}
            trend="+12%"
            icon={UserCog}
          />
          <KpiCard
            label="Documents Uploaded"
            value={loading ? "--" : kpis.documentsUploaded.toLocaleString()}
            trend="+8%"
            icon={FileText}
          />
          <KpiCard
            label="Active Subscriptions"
            value={loading ? "--" : kpis.activeSubscriptions.toLocaleString()}
            trend="+5%"
            icon={CreditCard}
          />
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-[2fr_1fr]">
        <GrowthChart data={userGrowth} />
        <FreeVsPaidDonut freePct={freeVsPaid.freePct} paidPct={freeVsPaid.paidPct} />
      </section>

      <section>
        <RecentActivityTable
          activity={recentActivity}
          onAddUser={() => setModal("user")}
          onAddAgent={() => setModal("agent")}
          onCreateCbt={() => navigate("/admin/cbt-builder")}
          onUploadAnnouncement={() => navigate("/admin/announcements")}
        />
      </section>

      <Modal title={modal === "agent" ? "Add Agent" : "Add User"} open={!!modal} onClose={() => setModal(null)}>
        <QuickAddForm target={modal} onDone={() => setModal(null)} />
      </Modal>
    </div>
  );
}
