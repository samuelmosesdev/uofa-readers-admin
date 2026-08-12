import { useState } from "react";
import { useNavigate } from "react-router-dom";
import KpiCard from "../components/KpiCard";
import GrowthChart from "../components/GrowthChart";
import FreeVsPaidDonut from "../components/FreeVsPaidDonut";
import RecentActivityTable from "../components/RecentActivityTable";
import Modal from "../components/Modal";
import QuickAddForm from "../components/QuickAddForm";
import { useDashboardData } from "../hooks/useDashboardData";

export default function AdminDashboard() {
  const { kpis, freeVsPaid, userGrowth, recentActivity, loading } = useDashboardData();
  const [modal, setModal] = useState(null); // 'user' | 'agent' | null
  const navigate = useNavigate();

  return (
    <>
      <section>
        <h2 className="mb-3 text-sm font-semibold text-text-secondary">KPI</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <KpiCard label="Total Users" value={loading ? "--" : kpis.totalUsers.toLocaleString()} highlight />
          <KpiCard label="Active Agents" value={loading ? "--" : kpis.activeAgents} trend="+" />
          <KpiCard
            label="Documents Uploaded"
            value={loading ? "--" : kpis.documentsUploaded.toLocaleString()}
            trend="+"
          />
          <KpiCard
            label="Active Subscriptions"
            value={loading ? "--" : kpis.activeSubscriptions.toLocaleString()}
            trend="+"
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
    </>
  );
}