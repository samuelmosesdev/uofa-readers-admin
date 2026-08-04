import { useState } from "react";
import { Menu } from "lucide-react";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import KpiCard from "../components/KpiCard";
import GrowthChart from "../components/GrowthChart";
import FreeVsPaidDonut from "../components/FreeVsPaidDonut";
import RecentActivityTable from "../components/RecentActivityTable";
import Modal from "../components/Modal";
import QuickAddForm from "../components/QuickAddForm";
import { useDashboardData } from "../hooks/useDashboardData";

export default function AdminDashboard() {
  const { kpis, freeVsPaid, userGrowth, recentActivity, loading } = useDashboardData();
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState(null); // 'user' | 'agent' | null
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-bg-app">
      <Sidebar activePath="/admin" onNavigate={() => setMobileNavOpen(false)} />

      {/* Mobile nav overlay */}
      {mobileNavOpen && (
        <div className="fixed inset-0 z-40 flex lg:hidden">
          <div className="w-64 bg-bg-sidebar">
            <Sidebar activePath="/admin" onNavigate={() => setMobileNavOpen(false)} />
          </div>
          <div className="flex-1 bg-black/50" onClick={() => setMobileNavOpen(false)} />
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center gap-3 border-b border-border-subtle bg-bg-app px-4 pt-4 lg:hidden">
          <button onClick={() => setMobileNavOpen(true)} aria-label="Open menu" className="text-text-secondary">
            <Menu size={20} />
          </button>
        </div>
        <Topbar search={search} onSearchChange={setSearch} />

        <main className="flex-1 space-y-6 px-4 py-6 sm:px-6">
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
              onCreateCbt={() => alert("Route to CBT Builder page")}
              onUploadAnnouncement={() => alert("Route to Announcements page")}
            />
          </section>
        </main>
      </div>

      <Modal title={modal === "agent" ? "Add Agent" : "Add User"} open={!!modal} onClose={() => setModal(null)}>
        <QuickAddForm target={modal} onDone={() => setModal(null)} />
      </Modal>
    </div>
  );
}
