import { useState, useMemo, use, useEffect } from "react";
import { MessageSquare, ChevronDown, Search, Filter } from "lucide-react";

import TablePagination from "@/components/TablePagination";
import PriorityDot from "./PriorityDot";
import { StatusBadge } from "./StatusBadge";
import { adminContext } from "@/context/AdminContext";
import { validateReply } from "./issue/ReplyValidation";

const ISSUES = [
  {
    id: "TCK-3021",
    user: "Ravi Sharma",
    subject: "Deposit not reflecting in portfolio",
    message:
      "I deposited ₹20,000 yesterday via UPI but it isn't showing in my active investments yet. Transaction ID: TXN12345; please help.",
    priority: "high",
    status: "open",
    createdAt: "2 hours ago",
  },
  {
    id: "TCK-3018",
    user: "Neha Kapoor",
    subject: "Unable to update KYC documents",
    message:
      "The upload keeps failing at 90% when I try to re-submit my PAN card image. I have a stable connection and tried different browsers.",
    priority: "medium",
    status: "open",
    createdAt: "5 hours ago",
  },
  {
    id: "TCK-3011",
    user: "Arjun Das",
    subject: "Referral bonus missing",
    message:
      "Two of my referrals completed KYC last week but the bonus was never credited to my wallet. Please check referral IDs REF123 and REF124.",
    priority: "medium",
    status: "resolved",
    createdAt: "1 day ago",
  },
  {
    id: "TCK-3002",
    user: "Meera Pillai",
    subject: "Login OTP delayed",
    message:
      "OTP emails are arriving 10+ minutes late, making it hard to log in during trading hours. This started two days ago.",
    priority: "low",
    status: "open",
    createdAt: "2 days ago",
  },
];

export default function IssuesTab({ onResolve, onReply }) {
  // Tab State: 'unresolved' (open/pending) vs 'resolved'
  const [activeTab, setActiveTab] = useState("unresolved");

  // Filter & Search States
  const [searchQuery, setSearchQuery] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("all");

  // Pagination States
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  // Expanded Accordion State
  const [openId, setOpenId] = useState(null);
  const [replyText, setReplyText] = useState({});
  // NEW: per-issue thread of replies that have already been sent
  const [repliesById, setRepliesById] = useState({});
  const [issuesList, setIssuesList] = useState([]);
  const [replyErrors, setReplyErrors] = useState({});
  const [replyAdding, setReplyAdding] = useState(false);
  const { loadIssues } = use(adminContext);

  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      const data = await loadIssues(activeTab, currentPage, pageSize);
      if (!isMounted) return;
      if (data) {
        setIssuesList(data.content ?? []);
      } else {
        setIssuesList([]);
      }
    };

    fetchData();

    return () => {
      isMounted = false;
    };
  }, [activeTab, currentPage, loadIssues, pageSize]);

  // 1. Filter Issues based on Tab, Search, and Priority
  const filteredIssues = useMemo(() => {
    return issuesList.filter((issue) => {
      // Tab filter
      const matchesTab =
        activeTab === "resolved"
          ? issue.status === "resolved"
          : issue.status !== "resolved";

      // Priority filter
      const matchesPriority =
        priorityFilter === "all" || issue.priority === priorityFilter;

      // Search filter (ID, User, Subject)
      const query = searchQuery.toLowerCase();
      const matchesSearch =
        issue.id.toLowerCase().includes(query) ||
        issue.user.toLowerCase().includes(query) ||
        issue.subject.toLowerCase().includes(query);

      return matchesTab && matchesPriority && matchesSearch;
    });
  }, [activeTab, issuesList, priorityFilter, searchQuery]);

  // Reset page to 1 whenever filters change
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setCurrentPage(1);
    setOpenId(null);
  };

  const handleSearchChange = (val) => {
    setSearchQuery(val);
    setCurrentPage(1);
  };

  const handlePriorityChange = (val) => {
    setPriorityFilter(val);
    setCurrentPage(1);
  };

  const handleReplyChange = (id, text) => {
    setReplyText((prev) => ({ ...prev, [id]: text }));
  };

  const handleSendReply = (id) => {
    const raw = replyText[id];
    const { valid, error, sanitized } = validateReply(raw || "");

    if (!valid) {
      setReplyErrors((prev) => ({ ...prev, [id]: error }));
      return;
    }

    setReplyErrors((prev) => ({ ...prev, [id]: null }));

    setRepliesById((prev) => ({
      ...prev,
      [id]: [
        ...(prev[id] || []),
        {
          text: sanitized,
          sentAt: new Date().toLocaleString("en-IN", {
            hour: "2-digit",
            minute: "2-digit",
            day: "2-digit",
            month: "short",
          }),
        },
      ],
    }));

    if (onReply) onReply(id, sanitized); // send the sanitized version, not raw
    setReplyText((prev) => ({ ...prev, [id]: "" }));
  };

  return (
    <div className="space-y-4">
      {/* Top Header Controls: Tabs, Search & Priority Filter */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Unresolved / Resolved Tabs */}
        <div className="flex rounded-xl bg-slate-900 p-1 border border-slate-800">
          <button
            onClick={() => handleTabChange("unresolved")}
            className={`flex-1 rounded-lg px-4 py-1.5 text-xs font-medium transition-colors sm:flex-none ${
              activeTab === "unresolved"
                ? "bg-slate-800 text-slate-100 shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Unresolved
          </button>
          <button
            onClick={() => handleTabChange("resolved")}
            className={`flex-1 rounded-lg px-4 py-1.5 text-xs font-medium transition-colors sm:flex-none ${
              activeTab === "resolved"
                ? "bg-slate-800 text-slate-100 shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Resolved
          </button>
        </div>

        {/* Search Input & Priority Filter */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900/60 px-3 py-1.5">
            <Search className="h-3.5 w-3.5 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Search issues..."
              className="w-32 bg-transparent text-xs text-slate-200 placeholder-slate-500 outline-none sm:w-44"
            />
          </div>

          <div className="relative flex items-center rounded-xl border border-slate-800 bg-slate-900/60 px-3 py-1.5 backdrop-blur-md transition-all hover:border-slate-700 focus-within:border-emerald-500/50 focus-within:ring-2 focus-within:ring-emerald-500/20">
            {/* Left Icon */}
            <Filter className="h-3.5 w-3.5 shrink-0 text-slate-400" />

            {/* Select Box */}
            <select
              value={priorityFilter}
              onChange={(e) => handlePriorityChange(e.value || e.target.value)}
              className="w-full appearance-none bg-transparent pl-2 pr-6 text-xs font-medium text-slate-200 outline-none cursor-pointer"
            >
              <option value="all" className="bg-slate-900 text-slate-200">
                All Priorities
              </option>
              <option value="critical" className="bg-red-900 text-slate-200">
                Critical
              </option>
              <option value="high" className="bg-orange-900 text-slate-200">
                High Priority
              </option>
              <option value="medium" className="bg-yellow-900 text-slate-200">
                Medium Priority
              </option>
              <option value="low" className="bg-emerald-700 text-slate-200">
                Low Priority
              </option>
            </select>

            {/* Custom Right Chevron */}
            <ChevronDown className="pointer-events-none absolute right-2.5 h-3.5 w-3.5 text-slate-400" />
          </div>
        </div>
      </div>

      {/* Issues Accordion List */}
      <div className="space-y-3">
        {filteredIssues.length === 0 ? (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-8 text-center text-xs text-slate-500">
            No {activeTab} issues found matching your filters.
          </div>
        ) : (
          filteredIssues.map((issue) => {
            const expanded = openId === issue.id;
            const threadForIssue = repliesById[issue.id] || [];
            return (
              <div
                key={issue.id}
                className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/60"
              >
                <button
                  onClick={() => setOpenId(expanded ? null : issue.id)}
                  className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left hover:bg-slate-800/30 transition-colors"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="hidden shrink-0 rounded-lg bg-slate-800 px-2 py-1 font-mono text-[11px] text-slate-500 sm:inline">
                      {issue.id}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-slate-300 font-body">
                        {issue.title}
                      </p>
                      <p className="truncate text-xs text-slate-500 font-body">
                        {issue.createdAt ? `· ${issue.createdAt}` : ""}
                        {threadForIssue.length > 0 && (
                          <span className="ml-2 text-indigo-400">
                            · {threadForIssue.length} repl
                            {threadForIssue.length === 1 ? "y" : "ies"} sent
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <PriorityDot priority={issue.priority.toLowerCase()} />
                    <StatusBadge status={issue.status.toLowerCase()} />
                    <ChevronDown
                      className={`h-4 w-4 text-slate-500 transition-transform duration-300 ${
                        expanded ? "rotate-180" : ""
                      }`}
                    />
                  </div>
                </button>

                {expanded && (
                  <div className="animate-fade-slide-in border-t border-slate-800 px-5 py-4">
                    <p className="mb-4 text-sm leading-relaxed text-slate-300 font-body">
                      {issue.description}
                    </p>

                    {/* NEW: Reply thread — shows every reply already sent for this issue */}
                    {threadForIssue.length > 0 && (
                      <div className="mb-4 space-y-2">
                        {threadForIssue.map((reply, idx) => (
                          <div
                            key={idx}
                            className="rounded-xl border border-indigo-500/20 bg-indigo-500/5 px-3 py-2"
                          >
                            <div className="mb-1 flex items-center justify-between">
                              <span className="text-[11px] font-medium text-indigo-400">
                                Admin reply
                              </span>
                              <span className="text-[10px] text-slate-500">
                                {reply.sentAt}
                              </span>
                            </div>
                            <p className="text-xs leading-relaxed text-slate-300 font-body">
                              {reply.text}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="mb-4 flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-800/40 px-3 py-2">
                      <MessageSquare className="h-4 w-4 shrink-0 text-slate-500" />
                      <input
                        value={replyText[issue.id] || ""}
                        onChange={(e) =>
                          handleReplyChange(issue.id, e.target.value)
                        }
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleSendReply(issue.id);
                        }}
                        placeholder="Write a reply to the user…"
                        className="w-full bg-transparent text-sm text-slate-200 placeholder-slate-500 outline-none font-body"
                      />
                    </div>
                    {replyErrors[issue.id] && (
                      <div className="mt-1 text-xs text-rose-400">
                        {replyErrors[issue.id]} this is demo
                      </div>
                    )}
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => handleSendReply(issue.id)}
                        className="rounded-lg bg-indigo-500/10 px-3.5 py-2 text-xs font-medium text-indigo-400 ring-1 ring-indigo-500/30 hover:bg-indigo-500/20 transition-colors"
                      >
                        Send Reply
                      </button>
                      {issue.status !== "resolved" && (
                        <button
                          onClick={() => onResolve && onResolve(issue.id)}
                          className="rounded-lg bg-emerald-500/10 px-3.5 py-2 text-xs font-medium text-emerald-400 ring-1 ring-emerald-500/30 hover:bg-emerald-500/20 transition-colors"
                        >
                          Mark Resolved
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Dynamic Pagination Component */}
      <TablePagination
        currentPage={currentPage}
        pageSize={pageSize}
        totalItems={filteredIssues.length}
        onPageChange={setCurrentPage}
        onPageSizeChange={(size) => {
          setPageSize(size);
          setCurrentPage(1);
        }}
        pageSizeOptions={[5, 10, 15, 20]}
        darkMode={true}
      />
    </div>
  );
}
