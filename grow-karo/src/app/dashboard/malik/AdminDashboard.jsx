"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  LayoutDashboard,
  Activity,
  Wallet,
  AlertTriangle,
  Ticket,
  Settings2,
  Contact,
  ScrollText,
  ClipboardCheck,
} from "lucide-react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip as ChartJSTooltip,
} from "chart.js";
import Sidebar from "./components/Sidebar";
import Topbar from "./components/Topbar";
import OverviewTab from "./components/OverviewTab";
import TabLoader from "../../../loader/TabLoader";
import { fetchMalikDashboardData } from "../../../../services/malikService";
import dynamic from "next/dynamic";
import AdminRemitterTrackersTab from "./components/Remitter";
import ContactsComponent from "./components/Contact";

const WithdrawalsTab = dynamic(() => import("./components/WithdrawalsTab"), {
  loading: () => <TabLoader />,
  ssr: false,
});
const FundraiserCodesTab = dynamic(
  () => import("./components/Remitter"),
  {
    loading: () => <TabLoader />,
    ssr: false,
  },
);
const PlanTab = dynamic(() => import("./components/PlanTab"), {
  loading: () => <TabLoader />,
  ssr: false
})
const SchemeApproval = dynamic(() => import("./components/SchemeApprovals"), {
  loading: () => <TabLoader />,
  ssr: false
})
const IssuesTab = dynamic(() => import("./components/IssuesTab"), {
  loading: () => <TabLoader />,
  ssr: false,
});
const Toast = dynamic(() => import("./components/Toast"), {
  loading: () => <TabLoader />,
  ssr: false,
});
const ActivityTab = dynamic(() => import("./components/ActivityTab"), {
  loading: () => <TabLoader />,
  ssr: false,
});
const Settings = dynamic(() => import("./components/Settings"), {
  loading: () => <TabLoader />,
  ssr: false,
});
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  ChartJSTooltip,
);

const NAV_ITEMS = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "activity", label: "Activity Log", icon: Activity },
  { id: "withdrawals", label: "Withdrawals", icon: Wallet },
  { id: "plans", label: "Plans", icon: ScrollText },
  { id: "approvals", label: "Approvals", icon: ClipboardCheck },
  { id: "codes", label: "Remitters", icon: Ticket },
  { id: "issues", label: "User Issues", icon: AlertTriangle },
  { id: "contacts", label: "Contacts", icon: Contact },
  { id: "settings", label: "Settings", icon: Settings2 },
];

export default function AdminPanel() {
  const [activeTab, setActiveTab] = useState("approvals");
  const [loading, setLoading] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [toast, setToast] = useState(null);

  const [withdrawals, setWithdrawals] = useState([]);
  const [issues, setIssues] = useState([]);
  const [codes, setCodes] = useState([]);
  const [inflowData, setInflowData] = useState([]);

  useEffect(() => {
    let active = true;

    setInitialLoading(true);
    fetchMalikDashboardData()
      .then((data) => {
        if (!active) return;
        const withdrawalData = Array.isArray(data.withdrawals) ? data.withdrawals : [];
        const issueData = Array.isArray(data.issues) ? data.issues : [];
        const codeData = Array.isArray(data.codes) ? data.codes : [];
        const inflowDataSet = Array.isArray(data.inflowData) ? data.inflowData : [];

        setWithdrawals(withdrawalData);
        setIssues(issueData);
        setCodes(codeData);
        setInflowData(inflowDataSet);
      })
      .catch((err) => {
        console.error(err);
      })
      .finally(() => {
        if (active) setInitialLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

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

  const handleGenerateCode = () => {
    const code = "FR-" + (100 + codes.length + Math.floor(Math.random() * 90));
    const word = "NEW" + Math.floor(1000 + Math.random() * 8999);
    setCodes((prev) => [
      {
        id: code,
        code: word,
        owner: "Unassigned",
        raised: 0,
        goal: 100000,
        referrals: 0,
        status: "active",
      },
      ...prev,
    ]);
    showToast(`Fundraiser code ${word} generated.`);
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
    withdrawals: "Withdrawal Requests",
    issues: "User Issues",
    codes: "Remitters",
    settings: "Admin Settings",
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-slate-950 font-body">
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
          onMenuClick={() => setMobileNavOpen(true)}
        />

        <main className="scrollbar-thin flex-1 overflow-y-auto px-4 py-6 sm:px-6">
          {loading ? (
            <TabLoader />
          ) : (
            <div className="animate-fade-slide-in">
              {activeTab === "overview" && (
                <OverviewTab
                  withdrawals={withdrawals}
                  issues={issues}
                  inflowData={inflowData}
                />
              )}
              {activeTab === "activity" && <ActivityTab />}
              {activeTab === "withdrawals" && (
                <WithdrawalsTab
                  withdrawals={withdrawals}
                  onDecision={handleWithdrawalDecision}
                />
              )}
              {activeTab === "plans" && <PlanTab />}
              {activeTab === "approvals" && <SchemeApproval />}
              {activeTab === "issues" && (
                <IssuesTab issues={issues} onResolve={handleResolveIssue} />
              )}
              {activeTab === "codes" && (
                <AdminRemitterTrackersTab
                  codes={codes}
                  onGenerate={handleGenerateCode}
                  onCopy={handleCopyCode}
                />
              )}
              {activeTab === "contacts" && <ContactsComponent />}
              {activeTab === "settings" && <Settings />}
            </div>
          )}
        </main>
      </div>

      <Toast toast={toast} />
    </div>
  );
}