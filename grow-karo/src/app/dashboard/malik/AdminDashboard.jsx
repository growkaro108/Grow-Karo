"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  LayoutDashboard,
  Activity,
  Wallet,
  AlertTriangle,
  Ticket,
  Settings2,
  Contact,
  ScrollText,
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
// import ActivityTab from "./components/ActivityTab";
// import WithdrawalsTab from "./components/WithdrawalsTab";
// import IssuesTab from "./components/IssuesTab";
// import FundraiserCodesTab from "./components/FundraiserCodesTab";
// import Toast from "./components/Toast";
import TabLoader from "../../../loader/TabLoader";
import { fetchMalikDashboardData } from "../../../../services/malikService";
// import Settings from "./components/Settings";
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
  { id: "codes", label: "Remitters", icon: Ticket },
  { id: "issues", label: "User Issues", icon: AlertTriangle },
  { id: "contacts", label: "Contacts", icon: Contact },
  { id: "settings", label: "Settings", icon: Settings2 },
];

export default function AdminPanel() {
  const [activeTab, setActiveTab] = useState("plans");
  const [loading, setLoading] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [toast, setToast] = useState(null);

  const [withdrawals, setWithdrawals] = useState([]);
  const [issues, setIssues] = useState([]);
  const [codes, setCodes] = useState([]);
  const [inflowData, setInflowData] = useState([]);
  const [eventTemplates, setEventTemplates] = useState([]);
  const [names, setNames] = useState([]);
  const [feed, setFeed] = useState([]);
  const feedIdRef = useRef(1);
  const eventTemplatesRef = useRef([]);
  const namesRef = useRef([]);

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
        const eventTemplateData = Array.isArray(data.eventTemplates) ? data.eventTemplates : [];
        const namesData = Array.isArray(data.names) ? data.names : [];

        setWithdrawals(withdrawalData);
        setIssues(issueData);
        setCodes(codeData);
        setInflowData(inflowDataSet);
        setEventTemplates(eventTemplateData);
        setNames(namesData);

        eventTemplatesRef.current = eventTemplateData;
        namesRef.current = namesData;

        const seed = Array.from({ length: 6 }).map(() => makeEvent(eventTemplateData, namesData));
        setFeed(seed);
      })
      .catch((err) => {
        console.error(err);
      })
      .finally(() => {
        if (active) setInitialLoading(false);
      });

    const interval = setInterval(() => {
      setFeed((prev) => [makeEvent(eventTemplatesRef.current, namesRef.current), ...prev].slice(0, 24));
    }, 4200);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  function makeEvent(eventTemplatesList = [], namesList = []) {
    const template =
      eventTemplatesList.length > 0
        ? eventTemplatesList[Math.floor(Math.random() * eventTemplatesList.length)]
        : { type: "signup", text: "created a new account", amountRange: null };
    const amount = template.amountRange
      ? Math.floor(
        Math.random() * (template.amountRange[1] - template.amountRange[0]) +
        template.amountRange[0],
      )
      : null;
    const name =
      namesList.length > 0
        ? namesList[Math.floor(Math.random() * namesList.length)]
        : "User";
    feedIdRef.current += 1;
    return {
      id: feedIdRef.current,
      type: template.type,
      text: template.text,
      amount,
      name,
      time: "just now",
    };
  }

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
                  feed={feed}
                  inflowData={inflowData}
                />
              )}
              {activeTab === "activity" && <ActivityTab feed={feed} />}
              {activeTab === "withdrawals" && (
                <WithdrawalsTab
                  withdrawals={withdrawals}
                  onDecision={handleWithdrawalDecision}
                />
              )}
              {activeTab === "plans" && <PlanTab />}
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
