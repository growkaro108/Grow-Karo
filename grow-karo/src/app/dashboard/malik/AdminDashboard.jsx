"use client";

import React, { useState, useEffect, useMemo, use } from "react";
import {
  LayoutDashboard,
  Activity,
  Wallet,
  Ticket,
  Settings2,
  Contact,
  ScrollText,
  ClipboardCheck,
  User2Icon,
  MessageCircleQuestionMark,
  ShieldQuestionMark,
  BarChart3,
} from "lucide-react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip as ChartJSTooltip,
  ArcElement,
  BarElement,
  Legend,
} from "chart.js";
import Sidebar from "./components/Sidebar";
import Topbar from "./components/Topbar";
import OverviewTab from "./components/OverviewTab";
import TabLoader from "../../../loader/TabLoader";
import dynamic from "next/dynamic";
import { adminContext } from "@/context/AdminContext";
const Reports = dynamic(
  () => import("./components/Report"),
  {
    loading: () => <TabLoader message={"Loading Reports..."} />,
    ssr: false,
  },
);
const UserManagement = dynamic(
  () => import("./components/user-management/UserManagement"),
  {
    loading: () => <TabLoader message={"Loading users..."} />,
    ssr: false,
  },
);
const WithdrawalsTab = dynamic(
  () => import("./components/Withdrawals/WithdrawalsTab"),
  {
    loading: () => <TabLoader message={"Loading withdrawals..."} />,
    ssr: false,
  },
);

const PlanTab = dynamic(() => import("./components/Scheme/PlanTab"), {
  loading: () => <TabLoader message={"Loading plans..."} />,
  ssr: false,
});
const SchemeUpdateHistory = dynamic(() => import("./components/SchemeAuditHistory"), {
  loading: () => <TabLoader message={"Loading scheme Update History..."} />,
  ssr: false,
});
const SchemeApproval = dynamic(
  () => import("./components/SchemeAproval/SchemeApprovals"),
  {
    loading: () => <TabLoader message={"Loading approvals..."} />,
    ssr: false,
  },
);
const IssuesTab = dynamic(() => import("./components/IssuesTab"), {
  loading: () => <TabLoader message={"Loading issues..."} />,
  ssr: false,
});
const Toast = dynamic(() => import("./components/Toast"), {
  loading: () => <TabLoader />,
  ssr: false,
});
const ActivityTab = dynamic(() => import("./components/Activity/main"), {
  loading: () => <TabLoader message={"Loading activity..."} />,
  ssr: false,
});
const AdminRemitterTrackersTab = dynamic(
  () => import("./components/Remitter/AdminRemitterTrackersTab"),
  {
    loading: () => <TabLoader message={"Loading remitters..."} />,
    ssr: false,
  },
);
const ContactsComponent = dynamic(() => import("./components/Contact"), {
  loading: () => <TabLoader message={"Loading contacts..."} />,
  ssr: false,
});
const Settings = dynamic(() => import("./components/Settings"), {
  loading: () => <TabLoader message={"Loading settings..."} />,
  ssr: false,
});
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  ChartJSTooltip,
  ArcElement,
  BarElement,
  Legend,
);

const NAV_ITEMS = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "activity", label: "Activity Log", icon: Activity },
  { id: "withdrawals", label: "Withdrawals", icon: Wallet },
  { id: "plans", label: "Schemes Management", icon: ScrollText },
  { id: "SchemeAuditHistory", label: "Scheme Audit History", icon: ShieldQuestionMark },
  { id: "approvals", label: "Approvals", icon: ClipboardCheck },
  { id: "remitter", label: "Remitter", icon: Ticket },
  { id: "user", label: "User Management", icon: User2Icon },
  { id: "issues", label: "User Issues", icon: MessageCircleQuestionMark },
  { id: "reports", label: "Reports", icon: BarChart3 },
  // { id: "contacts", label: "Contacts⏱️", icon: Contact },
  { id: "settings", label: "Settings", icon: Settings2 },
];

export default function AdminPanel() {
  const [activeTab, setActiveTab] = useState("user");
  const [loading, setLoading] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const { LoadCodes } = use(adminContext);

  const [withdrawals, setWithdrawals] = useState([]);
  const [issues, setIssues] = useState([]);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 2600);
  };

  const handleNavigate = (id) => {
    if (id === activeTab) return;
    setLoading(true);
    setTimeout(() => {
      setActiveTab(id);
      setLoading(false);
    }, 350);
  };

  //load esentaial data for each tab
  useEffect(() => {
    LoadCodes(); //loading all remitters on mount
  }, [LoadCodes]);

  const handleWithdrawalDecision = (id, action) => {
    setWithdrawals((prev) =>
      prev.map((w) => (w.id === id ? { ...w, status: action } : w)),
    );
    showToast(
      `Withdrawal ${id} ${action}.`,
      action === "approved" ? "success" : "error",
    );
  };

  const handleResolveIssue = (id) => {
    setIssues((prev) =>
      prev.map((i) => (i.id === id ? { ...i, status: "resolved" } : i)),
    );
    showToast(`Issue ${id} marked as resolved.`);
  };

  const handleCopyCode = (code) => {
    try {
      navigator.clipboard?.writeText(code);
    } catch (e) {
      // ignore
    }
    showToast(`Copied "${code}" to clipboard.`);
  };

  const counts = useMemo(
    () => ({
      withdrawals: withdrawals.filter((w) => w.status === "pending").length,
      issues: issues.filter((i) => i.status !== "resolved").length,
    }),
    [withdrawals, issues],
  );

  const titles = {
    overview: "Overview",
    activity: "Activity Log",
    plans: "Schemes Management",
    withdrawals: "Withdrawal Requests",
    issues: "User Issues",
    codes: "Remitters",
    reports: "Reports",
    settings: "Admin Settings",
  };

  return (
    <div className="flex h-[87vh] w-full overflow-hidden bg-slate-950 font-body">
      <Sidebar
        active={activeTab}
        onNavigate={handleNavigate}
        counts={counts}
        mobileOpen={mobileNavOpen}
        onCloseMobile={() => setMobileNavOpen(false)}
        navItems={NAV_ITEMS}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar
          title={titles[activeTab]}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onMenuClick={() => setMobileNavOpen(true)}
        />

        <main className="scrollbar-thin flex-1 overflow-y-auto px-4 py-6 sm:px-6">
          {loading ? (
            <TabLoader message="Fetching details..." />
          ) : (
            <div className="animate-fade-slide-in">
              {activeTab === "overview" && <OverviewTab />}
              {activeTab === "activity" && <ActivityTab />}
              {activeTab === "withdrawals" && (
                <WithdrawalsTab
                  withdrawals={withdrawals}
                  onDecision={handleWithdrawalDecision}
                />
              )}
              {activeTab === "plans" && <PlanTab />}
              {activeTab === "SchemeAuditHistory" && <SchemeUpdateHistory />}

              {activeTab === "approvals" && <SchemeApproval />}
              {activeTab === "issues" && (
                <IssuesTab Admin={true} onResolve={handleResolveIssue} />
              )}
              {activeTab === "remitter" && <AdminRemitterTrackersTab />}
              {activeTab === "user" && <UserManagement />}
              {activeTab === "contacts" && <ContactsComponent />}
              {activeTab === "reports" && <Reports />}
              {activeTab === "settings" && <Settings />}
            </div>
          )}
        </main>
      </div>

      <Toast toast={toast} />
    </div>
  );
}
