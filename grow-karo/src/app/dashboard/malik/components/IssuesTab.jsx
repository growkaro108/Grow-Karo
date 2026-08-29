import { useState, useMemo, use, useEffect, useCallback } from "react";
import {
  MessageSquare,
  ChevronDown,
  Search,
  Filter,
  RefreshCcw,
} from "lucide-react";

import TablePagination from "@/components/TablePagination";
import PriorityDot from "./PriorityDot";
import { StatusBadge } from "./StatusBadge";
import { adminContext } from "@/context/AdminContext";
import { validateReply } from "./issue/ReplyValidation";
import { markResolved, sendReply } from "../../../../../services/malikService";
import { loadUserIssues, userComment } from "../../../../../services/grahakService";
import { userContext } from "@/context/UserContext";

const TabButton = ({
  value,
  label,
  activeTab,
  onClick,
  darkMode,
  activeClass,
  inactiveClass,
}) => {
  const active =
    activeClass ??
    (darkMode
      ? "bg-slate-800 text-slate-100 shadow-sm"
      : "bg-white text-slate-900 shadow-sm");
  const inactive =
    inactiveClass ??
    (darkMode
      ? "text-slate-400 hover:text-slate-200"
      : "text-slate-500 hover:text-slate-700");

  return (
    <button
      onClick={() => onClick(value)}
      className={`flex-1 rounded-lg px-4 py-1.5 text-xs font-medium transition-colors sm:flex-none ${activeTab === value ? active : inactive
        }`}
    >
      {label}
    </button>
  );
};

export default function IssuesTab({ Admin, darkMode = true }) {
  // Tab State: 'unresolved' (open/pending) vs 'resolved'
  const [activeTab, setActiveTab] = useState("unresolved");

  // Filter & Search States
  const [searchQuery, setSearchQuery] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("all");

  // Pagination States
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [totalItems, setTotalItems] = useState(0);

  // Expanded Accordion State
  const [openId, setOpenId] = useState(null);
  const [replyText, setReplyText] = useState({});
  const [issuesList, setIssuesList] = useState([]);
  const [replyErrors, setReplyErrors] = useState({});
  const [replyAdding, setReplyAdding] = useState(false);
  const [markingResolved, setMarkingResolved] = useState(false);
  const [loadingIssues, setLoadingIssues] = useState(false);
  const { authUser } = use(userContext);
  const { loadIssues } = use(adminContext);
  const userId = authUser?.id;
  const fetchData = useCallback(async () => {
    setLoadingIssues(true);
    const data = Admin
      ? await loadIssues(activeTab, currentPage, pageSize)
      : await loadUserIssues(userId, activeTab, currentPage, pageSize);
    if (data) {
      setIssuesList(data.content ?? []);
      setTotalItems(data.totalElements ?? data.content?.length ?? 0);
    } else {
      setIssuesList([]);
      setTotalItems(0);
    }
    setTimeout(() => setLoadingIssues(false), 2500);
  }, [Admin, activeTab, currentPage, loadIssues, pageSize, userId]);

  useEffect(() => {
    let isMounted = true;
    if (!isMounted) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchData();
    return () => {
      isMounted = false;
    };
  }, [activeTab, currentPage, fetchData, loadIssues, pageSize]);

  const filteredIssues = useMemo(() => {
    return issuesList.filter((issue) => {
      const matchesTab =
        activeTab === "resolved"
          ? issue.status === "closed"
          : issue.status !== "resolved";

      const matchesPriority =
        priorityFilter === "all" || issue.priority === priorityFilter;

      const query = searchQuery.toLowerCase();
      const matchesSearch =
        (issue.id || "").toLowerCase().includes(query) ||
        (issue.title || "").toLowerCase().includes(query);

      return matchesTab && matchesPriority && matchesSearch;
    });
  }, [activeTab, issuesList, priorityFilter, searchQuery]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setCurrentPage(1);
    setOpenId(null);
  };

  const showReplyInput = useMemo(() => {
    if (!Admin && activeTab !== "in_progress") return false;
    return activeTab === "resolved" ? false : true;
  }, [Admin, activeTab]);

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

  const handleSendReply = async (id) => {
    const raw = replyText[id];
    const { valid, error, sanitized } = validateReply(raw || "");

    if (!valid) {
      setReplyErrors((prev) => ({ ...prev, [id]: error }));
      return;
    }

    setReplyErrors((prev) => ({ ...prev, [id]: null }));
    try {
      setReplyAdding(true);
      const payload = {
        issueId: id,
        reply: sanitized,
      }
      const res = Admin ? await sendReply(payload) : await userComment(payload);
      if (!res) return;
      fetchData();
    } catch (error) {
      console.log(error);
      setReplyErrors((prev) => ({ ...prev, [id]: "Failed to send reply" }));
    } finally {
      setTimeout(() => {
        setReplyAdding(false);
      }, 1500);
    }

    // if (onReply) onReply(id, sanitized);
    setReplyText((prev) => ({ ...prev, [id]: "" }));
  };

  const onResolve = async (id) => {
    try {
      setMarkingResolved(true);
      const res = await markResolved(id);
      if (!res) return;
      fetchData();
    } catch (error) {
      console.log(error);
    } finally {
      setTimeout(() => {
        setMarkingResolved(false);
      }, 1000);
    }
  };

  // ---- Theme classes ----
  const t = darkMode
    ? {
      tabWrap: "bg-slate-900 border border-slate-800",
      searchWrap: "border border-slate-800 bg-slate-900/60",
      searchIcon: "text-slate-500",
      searchInput: "text-slate-200 placeholder-slate-500",
      filterWrap:
        "border border-slate-800 bg-slate-900/60 hover:border-slate-700 focus-within:border-emerald-500/50 focus-within:ring-2 focus-within:ring-emerald-500/20",
      filterIcon: "text-slate-400",
      filterSelect: "text-slate-200",
      filterOptionBase: "bg-slate-900 text-slate-200",
      filterOptionCritical: "bg-red-900 text-slate-200",
      filterOptionHigh: "bg-orange-900 text-slate-200",
      filterOptionMedium: "bg-yellow-900 text-slate-200",
      filterOptionLow: "bg-emerald-700 text-slate-200",
      chevron: "text-slate-400",
      refreshBtn:
        "border border-slate-800 bg-slate-900/60 hover:border-slate-700 focus-within:border-emerald-500/50 focus-within:ring-2 focus-within:ring-emerald-500/20",
      refreshIcon: "text-slate-400",
      emptyState: "border border-slate-800 bg-slate-900/40 text-slate-500",
      card: "border border-slate-800 bg-slate-900/60",
      cardHeaderHover: "hover:bg-slate-800/30",
      idBadge: "bg-slate-800 text-slate-500",
      title: "text-slate-300",
      subtitle: "text-slate-500",
      repliesLabel: "text-indigo-400",
      cardChevron: "text-slate-500",
      cardBorder: "border-slate-800",
      description: "text-slate-300",
      replyBubble: "border border-indigo-500/20 bg-indigo-500/5",
      replyLabel: "text-indigo-400",
      replyTimestamp: "text-slate-500",
      replyText: "text-slate-300",
      replyInputWrap: "border border-slate-800 bg-slate-800/40",
      replyInputIcon: "text-slate-500",
      replyInput: "text-slate-200 placeholder-slate-500",
      errorText: "text-rose-400",
      sendBtn:
        "bg-indigo-500/10 text-indigo-400 ring-1 ring-indigo-500/30 hover:bg-indigo-500/20",
      resolveBtn:
        "bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/30 hover:bg-emerald-500/20",
    }
    : {
      tabWrap: "bg-slate-100 border border-slate-200",
      searchWrap: "border border-slate-200 bg-white",
      searchIcon: "text-slate-400",
      searchInput: "text-slate-800 placeholder-slate-400",
      filterWrap:
        "border border-slate-200 bg-white hover:border-slate-300 focus-within:border-emerald-500/50 focus-within:ring-2 focus-within:ring-emerald-500/20",
      filterIcon: "text-slate-500",
      filterSelect: "text-slate-700",
      filterOptionBase: "bg-white text-slate-700",
      filterOptionCritical: "bg-red-100 text-red-800",
      filterOptionHigh: "bg-orange-100 text-orange-800",
      filterOptionMedium: "bg-yellow-100 text-yellow-800",
      filterOptionLow: "bg-emerald-100 text-emerald-800",
      chevron: "text-slate-500",
      refreshBtn:
        "border border-slate-200 bg-white hover:border-slate-300 focus-within:border-emerald-500/50 focus-within:ring-2 focus-within:ring-emerald-500/20",
      refreshIcon: "text-slate-500",
      emptyState: "border border-slate-200 bg-slate-50 text-slate-500",
      card: "border border-slate-200 bg-white",
      cardHeaderHover: "hover:bg-slate-50",
      idBadge: "bg-slate-100 text-slate-500",
      title: "text-slate-700",
      subtitle: "text-slate-500",
      repliesLabel: "text-indigo-600",
      cardChevron: "text-slate-400",
      cardBorder: "border-slate-200",
      description: "text-slate-700",
      replyBubble: "border border-indigo-200 bg-indigo-50",
      replyLabel: "text-indigo-600",
      replyTimestamp: "text-slate-400",
      replyText: "text-slate-700",
      replyInputWrap: "border border-slate-200 bg-slate-50",
      replyInputIcon: "text-slate-400",
      replyInput: "text-slate-800 placeholder-slate-400",
      errorText: "text-rose-600",
      sendBtn:
        "bg-indigo-50 text-indigo-600 ring-1 ring-indigo-200 hover:bg-indigo-100",
      resolveBtn:
        "bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200 hover:bg-emerald-100",
    };

  return (
    <div className="space-y-4">
      {/* Top Header Controls: Tabs, Search & Priority Filter */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Unresolved / In Progress / Resolved Tabs */}
        <div className={`flex rounded-xl p-1 ${t.tabWrap}`}>
          <TabButton
            value="unresolved"
            label="Unresolved"
            activeTab={activeTab}
            onClick={handleTabChange}
            darkMode={darkMode}
          />
          <TabButton
            value="in_progress"
            label="In Progress"
            activeTab={activeTab}
            onClick={handleTabChange}
            darkMode={darkMode}
          />
          <TabButton
            value="resolved"
            label="Resolved"
            activeTab={activeTab}
            onClick={handleTabChange}
            darkMode={darkMode}
          />
        </div>

        {/* Search Input & Priority Filter */}
        <div className="flex items-center gap-2">
          <div
            className={`flex items-center gap-2 rounded-xl px-3 py-1.5 ${t.searchWrap}`}
          >
            <Search className={`h-3.5 w-3.5 ${t.searchIcon}`} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Search issues..."
              className={`w-32 bg-transparent text-xs outline-none sm:w-44 ${t.searchInput}`}
            />
          </div>

          <div
            className={`relative flex items-center rounded-xl px-3 py-1.5 backdrop-blur-md transition-all ${t.filterWrap}`}
          >
            <Filter className={`h-3.5 w-3.5 shrink-0 ${t.filterIcon}`} />

            <select
              value={priorityFilter}
              onChange={(e) => handlePriorityChange(e.target.value)}
              className={`w-full appearance-none bg-transparent pl-2 pr-6 text-xs font-medium outline-none cursor-pointer ${t.filterSelect}`}
            >
              <option value="all" className={t.filterOptionBase}>
                All Priorities
              </option>
              <option value="critical" className={t.filterOptionCritical}>
                Critical
              </option>
              <option value="high" className={t.filterOptionHigh}>
                High Priority
              </option>
              <option value="medium" className={t.filterOptionMedium}>
                Medium Priority
              </option>
              <option value="low" className={t.filterOptionLow}>
                Low Priority
              </option>
            </select>

            <ChevronDown
              className={`pointer-events-none absolute right-2.5 h-3.5 w-3.5 ${t.chevron}`}
            />
          </div>
          {/* Refresh button */}
          {activeTab === "unresolved" && (
            <button
              onClick={fetchData}
              className={`rounded-xl px-3 py-1.5 backdrop-blur-md transition-all disabled:opacity-50 disabled:cursor-not-allowed ${t.refreshBtn}`}
              disabled={loadingIssues}
            >
              <RefreshCcw
                className={`h-3.5 w-3.5 shrink-0 ${t.refreshIcon} ${loadingIssues ? "animate-spin" : ""}`}
              />
            </button>
          )}
        </div>
      </div>

      {/* Issues Accordion List */}
      <div className="space-y-3">
        {filteredIssues.length === 0 ? (
          <div
            className={`rounded-2xl p-8 text-center text-xs ${t.emptyState}`}
          >
            {loadingIssues ? (
              <p className="flex items-center justify-center gap-2">
                <RefreshCcw
                  className={`h-3.5 w-3.5 shrink-0 animate-spin ${t.refreshIcon}`}
                />
                Loading issues...
              </p>
            ) : (
              `No ${activeTab} issues found matching your filters.`
            )}
          </div>
        ) : (
          filteredIssues.map((issue) => {
            const expanded = openId === issue.id;
            const threadForIssue = [...(issue.replies || [])];

            return (
              <div
                key={issue.id}
                className={`overflow-hidden rounded-2xl ${t.card}`}
              >
                <button
                  onClick={() => setOpenId(expanded ? null : issue.id)}
                  className={`flex w-full items-center justify-between gap-3 px-5 py-4 text-left transition-colors ${t.cardHeaderHover}`}
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span
                      className={`hidden shrink-0 rounded-lg px-2 py-1 font-mono text-[11px] sm:inline ${t.idBadge}`}
                    >
                      {issue.id}
                    </span>
                    <div className="min-w-0">
                      <p
                        className={`truncate text-sm font-medium font-body ${t.title}`}
                      >
                        {issue.title}
                      </p>
                      <p className={`truncate text-xs font-body ${t.subtitle}`}>
                        {issue.createdAt && `· ${issue.createdAt}`}
                        {issue.status === "resolved" &&
                          issue.resolvedAt &&
                          issue.resolvedAt !== "Not Resolved" && (
                            <span className="ml-2">
                              · resolved {issue.resolvedAt}
                            </span>
                          )}
                        {threadForIssue.length > 0 && (
                          <span className={`ml-2 ${t.repliesLabel}`}>
                            · {threadForIssue.length} repl
                            {threadForIssue.length === 1 ? "y" : "ies"} sent
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <PriorityDot priority={issue.priority} />
                    <StatusBadge status={issue.status} />
                    <ChevronDown
                      className={`h-4 w-4 transition-transform duration-300 ${t.cardChevron} ${expanded ? "rotate-180" : ""
                        }`}
                    />
                  </div>
                </button>

                {expanded && (
                  <div
                    className={`animate-fade-slide-in border-t px-5 py-4 ${t.cardBorder}`}
                  >
                    <p
                      className={`mb-4 text-sm leading-relaxed font-body ${t.description}`}
                    >
                      {issue.description}
                    </p>

                    {threadForIssue.length > 0 && (
                      <div className="mb-4 space-y-2">
                        {threadForIssue.map((reply, idx) => (
                          <div
                            key={reply.replyId ?? idx}
                            className={`rounded-xl px-3 py-2 ${t.replyBubble} ${reply.senderType === 'admin' ? "bg-primary/10" : ""}`}
                          >
                            <div className={`mb-1 flex items-center justify-between ${reply.senderType === 'admin' ? "" : "flex-row-reverse"}`}>
                              <span
                                className={`text-[11px] font-medium ${t.replyLabel}`}
                              >
                                {reply.senderType === 'admin' ? "Admin" : "User"} reply
                              </span>
                              <span
                                className={`text-[10px] ${t.replyTimestamp}`}
                              >
                                {reply.createdAt}
                              </span>
                            </div>
                            <p
                              className={`text-xs leading-relaxed font-body ${t.replyText}`}
                            >
                              {reply.text}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}

                    {showReplyInput && (
                      <>
                        <div
                          className={`mb-4 flex items-center gap-2 rounded-xl px-3 py-2 ${t.replyInputWrap}`}
                        >
                          <MessageSquare
                            className={`h-4 w-4 shrink-0 ${t.replyInputIcon}`}
                          />
                          <input
                            value={replyText[issue.id] || ""}
                            onChange={(e) => handleReplyChange(issue.id, e.target.value)}
                            onKeyDown={(e) => {
                              if (
                                e.key === "Enter" &&
                                !replyAdding &&
                                !markingResolved &&
                                replyText[issue.id]?.trim()
                              ) {
                                handleSendReply(issue.id);
                              }
                            }}
                            placeholder="Write a reply to the user…"
                            className={`w-full bg-transparent text-sm outline-none font-body ${t.replyInput}`}
                            disabled={replyAdding || markingResolved}
                          />
                        </div>

                        {replyErrors[issue.id] && (
                          <div className={`mt-1 text-xs pb-2 capitalize ${t.errorText}`}>
                            {replyErrors[issue.id]}
                          </div>
                        )}

                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={() => handleSendReply(issue.id)}
                            className={`rounded-lg px-3.5 py-2 text-xs font-medium transition-colors ${t.sendBtn}`}
                            disabled={replyAdding || markingResolved || !replyText[issue.id]?.trim()}
                          >
                            {replyAdding ? "Adding..." : "Send Reply"}
                          </button>

                          {issue.status !== "resolved" && (
                            <button
                              onClick={() => onResolve(issue.id)}
                              className={`rounded-lg px-3.5 py-2 text-xs font-medium transition-colors ${t.resolveBtn}`}
                              disabled={replyAdding || markingResolved || !onResolve}
                            >
                              {markingResolved ? "Marking..." : "Mark Resolved"}
                            </button>
                          )}
                        </div>
                      </>
                    )}
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
        totalItems={totalItems}
        onPageChange={setCurrentPage}
        onPageSizeChange={(size) => {
          setPageSize(size);
          setCurrentPage(1);
        }}
        pageSizeOptions={[5, 10, 15, 20]}
        darkMode={darkMode}
      />
    </div>
  );
}
