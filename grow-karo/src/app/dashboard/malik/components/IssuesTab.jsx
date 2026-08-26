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
const TabButton = ({
  value,
  label,
  activeTab,
  onClick,
  activeClass = "bg-slate-800 text-slate-100 shadow-sm",
  inactiveClass = "text-slate-400 hover:text-slate-200",
}) => {
  return (
    <button
      onClick={() => onClick(value)}
      className={`flex-1 rounded-lg px-4 py-1.5 text-xs font-medium transition-colors sm:flex-none ${
        activeTab === value ? activeClass : inactiveClass
      }`}
    >
      {label}
    </button>
  );
};

export default function IssuesTab({ onReply }) {
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
  // Per-issue thread of replies sent during this session (merged with server replies)
  // const [repliesById, setRepliesById] = useState({});
  const [issuesList, setIssuesList] = useState([]);
  const [replyErrors, setReplyErrors] = useState({});
  const [replyAdding, setReplyAdding] = useState(false);
  const [markingResolved, setMarkingResolved] = useState(false);
  const [loadingIssues, setLoadingIssues] = useState(false);
  const { loadIssues } = use(adminContext);
  const fetchData = useCallback(async () => {
    setLoadingIssues(true);
    const data = await loadIssues(activeTab, currentPage, pageSize);
    // console.log("data fetching...");
    if (data) {
      setIssuesList(data.content ?? []);
      setTotalItems(data.totalElements ?? data.content?.length ?? 0);
    } else {
      setIssuesList([]);
      setTotalItems(0);
    }
    setTimeout(() => setLoadingIssues(false), 2500);
  }, [activeTab, currentPage, loadIssues, pageSize]);

  useEffect(() => {
    let isMounted = true;

    if (!isMounted) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchData();
    // console.log("useeffect called..", activeTab);

    return () => {
      isMounted = false;
    };
  }, [activeTab, currentPage, fetchData, loadIssues, pageSize]);

  // Filter Issues based on Tab, Search, and Priority
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
      const res = await sendReply({
        issueId: id,
        reply: sanitized,
      });
      if (!res) return;
      fetchData();
      // setRepliesById((prev) => ({
      //   ...prev,
      //   [id]: [
      //     ...(prev[id] || []),
      //     {
      //       text: sanitized,
      //       senderType: "admin",
      //       createdAt: new Date().toLocaleString("en-IN", {
      //         hour: "2-digit",
      //         minute: "2-digit",
      //         day: "2-digit",
      //         month: "short",
      //       }),
      //     },
      //   ],
      // }));
    } catch (error) {
      console.log(error);
      setReplyErrors((prev) => ({ ...prev, [id]: "Failed to send reply" }));
    } finally {
      setTimeout(() => {
        setReplyAdding(false);
      }, 1500);
    }

    if (onReply) onReply(id, sanitized); // send the sanitized version, not raw
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
  return (
    <div className="space-y-4">
      {/* Top Header Controls: Tabs, Search & Priority Filter */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Unresolved / Resolved Tabs */}
        <div className="flex rounded-xl bg-slate-900 p-1 border border-slate-800">
          <TabButton
            value="unresolved"
            label="Unresolved"
            activeTab={activeTab}
            onClick={handleTabChange}
          />
          <TabButton
            value="in_progress"
            label="In Progress"
            activeTab={activeTab}
            onClick={handleTabChange}
          />
          <TabButton
            value="resolved"
            label="Resolved"
            activeTab={activeTab}
            onClick={handleTabChange}
          />
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
            <Filter className="h-3.5 w-3.5 shrink-0 text-slate-400" />

            <select
              value={priorityFilter}
              onChange={(e) => handlePriorityChange(e.target.value)}
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

            <ChevronDown className="pointer-events-none absolute right-2.5 h-3.5 w-3.5 text-slate-400" />
          </div>
          {/* Refresh button */}
          {activeTab === "unresolved" && (
            <button
              onClick={fetchData}
              className="rounded-xl border border-slate-800 bg-slate-900/60 px-3 py-1.5 backdrop-blur-md transition-all hover:border-slate-700 focus-within:border-emerald-500/50 focus-within:ring-2 focus-within:ring-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loadingIssues}
            >
              <RefreshCcw
                className={`h-3.5 w-3.5 shrink-0 text-slate-400 ${loadingIssues ? "animate-spin" : ""}`}
              />
            </button>
          )}
        </div>
      </div>

      {/* Issues Accordion List */}
      <div className="space-y-3">
        {filteredIssues.length === 0 ? (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-8 text-center text-xs text-slate-500">
            {loadingIssues ? (
              <p className="flex items-center justify-center gap-2">
                <RefreshCcw className="h-3.5 w-3.5 shrink-0 text-slate-400 animate-spin" />
                Loading issues...
              </p>
            ) : (
              `No ${activeTab} issues found matching your filters.`
            )}
          </div>
        ) : (
          filteredIssues.map((issue) => {
            const expanded = openId === issue.id;
            // Merge replies already on the issue (from server) with any sent locally this session
            const threadForIssue = [
              ...(issue.replies || []),
              // ...(repliesById[issue.id] || []),
            ];

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
                        {issue.createdAt && `· ${issue.createdAt}`}
                        {issue.status === "resolved" &&
                          issue.resolvedAt &&
                          issue.resolvedAt !== "Not Resolved" && (
                            <span className="ml-2">
                              · resolved {issue.resolvedAt}
                            </span>
                          )}
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
                    <PriorityDot priority={issue.priority} />
                    <StatusBadge status={issue.status} />
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

                    {/* Reply thread — shows every reply already sent for this issue */}
                    {threadForIssue.length > 0 && (
                      <div className="mb-4 space-y-2">
                        {threadForIssue.map((reply, idx) => (
                          <div
                            key={reply.replyId ?? idx}
                            className="rounded-xl border border-indigo-500/20 bg-indigo-500/5 px-3 py-2"
                          >
                            <div className="mb-1 flex items-center justify-between">
                              <span className="text-[11px] font-medium text-indigo-400">
                                Our reply
                              </span>
                              <span className="text-[10px] text-slate-500">
                                {reply.createdAt}
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
                      <div className="mt-1 text-xs text-rose-400 pb-2 capitalize">
                        {replyErrors[issue.id]}
                      </div>
                    )}

                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => handleSendReply(issue.id)}
                        className="rounded-lg bg-indigo-500/10 px-3.5 py-2 text-xs font-medium text-indigo-400 ring-1 ring-indigo-500/30 hover:bg-indigo-500/20 transition-colors"
                        disabled={replyAdding}
                      >
                        {replyAdding ? "Adding..." : "Send Reply"}
                      </button>
                      {issue.status !== "resolved" && (
                        <button
                          onClick={() => {
                            onResolve(issue.id);
                          }}
                          className="rounded-lg bg-emerald-500/10 px-3.5 py-2 text-xs font-medium text-emerald-400 ring-1 ring-emerald-500/30 hover:bg-emerald-500/20 transition-colors"
                          disabled={replyAdding || !onResolve}
                        >
                          {markingResolved ? "Marking..." : "Mark Resolved"}
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
        totalItems={totalItems}
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
