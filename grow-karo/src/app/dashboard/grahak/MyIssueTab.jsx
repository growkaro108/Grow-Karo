import { useState, useMemo, use, useEffect } from "react";
import { MessageSquare, ChevronDown, Search, PlusCircle } from "lucide-react";

import TablePagination from "@/components/TablePagination";
import { userContext } from "@/context/UserContext";
import { StatusBadge } from "../malik/components/StatusBadge";
import PriorityDot from "../malik/components/PriorityDot";
import { validateReply } from "../malik/components/issue/ReplyValidation";
// import { sendReply } from "../../../../../services/malikService";

const dummyData = {
  data: {
    page: 0,
    size: 20,
    totalPages: 1,
    totalElements: 1,
    content: [
      {
        id: "IG-2026-0649",
        title: "Withdrawal not working",
        status: "open",
        createdAt: "2026-06-19 16:43:29",
        resolvedAt: "Not Resolved",
        priority: "HIGH",
        description:
          "Withdrawal is not working. It is showing an error message.",
        replies: [
          {
            replyId: 289,
            text: "I am also facing the same issue. Please resolve it.",
            createdAt: "2026-06-19 16:43:29",
            senderType: "user",
          },
          {
            replyId: 290,
            text: "We are looking into it. Please wait.",
            createdAt: "2026-06-19 16:43:29",
            senderType: "admin",
          },
        ],
      },
    ],
    last: true,
    first: true,
    sort: {
      empty: false,
      unsorted: false,
      sorted: true,
    },
    numberOfElements: 1,
    pageable: {
      offset: 0,
      sort: {
        empty: false,
        unsorted: false,
        sorted: true,
      },
      pageNumber: 0,
      paged: true,
      unpaged: false,
    },
  },
};

export default function MyIssuesTab({ onRaiseNew }) {
  // Tab State: 'open' vs 'resolved'
  const [activeTab, setActiveTab] = useState("open");

  const [searchQuery, setSearchQuery] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [totalItems, setTotalItems] = useState(0);

  const [openId, setOpenId] = useState(null);
  const [replyText, setReplyText] = useState({});
  // Replies sent this session, merged with server replies for display
  const [repliesById, setRepliesById] = useState({});
  const [issuesList, setIssuesList] = useState([]);
  const [replyErrors, setReplyErrors] = useState({});
  const [replyAdding, setReplyAdding] = useState(false);

  //   const { loadMyIssues } = use(userContext);

  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      //   const data = await loadMyIssues(activeTab, currentPage, pageSize);
      const data = dummyData.data;
      if (!isMounted) return;
      if (data) {
        setIssuesList(data.content ?? []);
        setTotalItems(data.totalElements ?? data.content?.length ?? 0);
      } else {
        setIssuesList([]);
        setTotalItems(0);
      }
    };

    fetchData();

    return () => {
      isMounted = false;
    };
  }, [activeTab, currentPage, pageSize]);

  const filteredIssues = useMemo(() => {
    return issuesList.filter((issue) => {
      const matchesTab =
        activeTab === "resolved"
          ? issue.status === "resolved"
          : issue.status !== "resolved";

      const query = searchQuery.toLowerCase();
      const matchesSearch =
        (issue.id || "").toLowerCase().includes(query) ||
        (issue.title || "").toLowerCase().includes(query);

      return matchesTab && matchesSearch;
    });
  }, [activeTab, issuesList, searchQuery]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setCurrentPage(1);
    setOpenId(null);
  };

  const handleSearchChange = (val) => {
    setSearchQuery(val);
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
      setRepliesById((prev) => ({
        ...prev,
        [id]: [
          ...(prev[id] || []),
          {
            text: sanitized,
            senderType: "user",
            createdAt: new Date().toLocaleString("en-IN", {
              hour: "2-digit",
              minute: "2-digit",
              day: "2-digit",
              month: "short",
            }),
          },
        ],
      }));
    } catch (error) {
      console.log(error);
      setReplyErrors((prev) => ({ ...prev, [id]: "Failed to send reply" }));
    } finally {
      setTimeout(() => {
        setReplyAdding(false);
      }, 1500);
    }

    setReplyText((prev) => ({ ...prev, [id]: "" }));
  };

  return (
    <div className="space-y-4">
      {/* Top Header Controls: Tabs, Search & Raise New */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex rounded-xl bg-slate-100 p-1 border border-slate-200">
          <button
            onClick={() => handleTabChange("open")}
            className={`flex-1 rounded-lg px-4 py-1.5 text-xs font-medium transition-colors sm:flex-none ${
              activeTab === "open"
                ? "bg-white text-slate-800 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            Open
          </button>
          <button
            onClick={() => handleTabChange("resolved")}
            className={`flex-1 rounded-lg px-4 py-1.5 text-xs font-medium transition-colors sm:flex-none ${
              activeTab === "resolved"
                ? "bg-white text-slate-800 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            Resolved
          </button>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-1.5 shadow-sm">
            <Search className="h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Search your issues..."
              className="w-32 bg-transparent text-xs text-slate-700 placeholder-slate-400 outline-none sm:w-44"
            />
          </div>

          {onRaiseNew && (
            <button
              onClick={onRaiseNew}
              className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-indigo-700 transition-colors"
            >
              <PlusCircle className="h-3.5 w-3.5" />
              Raise Issue
            </button>
          )}
        </div>
      </div>

      {/* Issues Accordion List */}
      <div className="space-y-3">
        {filteredIssues.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-8 text-center text-xs text-slate-500">
            No {activeTab} issues found.
          </div>
        ) : (
          filteredIssues.map((issue) => {
            const expanded = openId === issue.id;
            const threadForIssue = [
              ...(issue.replies || []),
              ...(repliesById[issue.id] || []),
            ];

            return (
              <div
                key={issue.id}
                className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
              >
                <button
                  onClick={() => setOpenId(expanded ? null : issue.id)}
                  className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left hover:bg-slate-50 transition-colors"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="hidden shrink-0 rounded-lg bg-slate-100 px-2 py-1 font-mono text-[11px] text-slate-500 sm:inline">
                      {issue.id}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-slate-800 font-body">
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
                          <span className="ml-2 text-indigo-600">
                            · {threadForIssue.length} repl
                            {threadForIssue.length === 1 ? "y" : "ies"}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <PriorityDot priority={issue.priority} />
                    <StatusBadge status={issue.status} />
                    <ChevronDown
                      className={`h-4 w-4 text-slate-400 transition-transform duration-300 ${
                        expanded ? "rotate-180" : ""
                      }`}
                    />
                  </div>
                </button>

                {expanded && (
                  <div className="animate-fade-slide-in border-t border-slate-200 px-5 py-4">
                    <p className="mb-4 text-sm leading-relaxed text-slate-700 font-body">
                      {issue.description}
                    </p>

                    {/* Reply thread — user's original message + admin/user replies */}
                    {threadForIssue.length > 0 && (
                      <div className="mb-4 space-y-2">
                        {threadForIssue.map((reply, idx) => {
                          const isAdmin = reply.senderType === "admin";
                          return (
                            <div
                              key={reply.replyId ?? idx}
                              className={`rounded-xl border px-3 py-2 ${
                                isAdmin
                                  ? "border-indigo-200 bg-indigo-50"
                                  : "border-slate-200 bg-slate-50"
                              }`}
                            >
                              <div className="mb-1 flex items-center justify-between">
                                <span
                                  className={`text-[11px] font-medium ${
                                    isAdmin
                                      ? "text-indigo-600"
                                      : "text-slate-600"
                                  }`}
                                >
                                  {isAdmin ? "Support team" : "You"}
                                </span>
                                <span className="text-[10px] text-slate-400">
                                  {reply.createdAt}
                                </span>
                              </div>
                              <p className="text-xs leading-relaxed text-slate-700 font-body">
                                {reply.text}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Only allow the user to reply if there's at least an admin
                        response to react to, i.e. the ticket isn't waiting on them
                        with nothing to add — adjust this condition to your flow */}
                    <div className="mb-4 flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                      <MessageSquare className="h-4 w-4 shrink-0 text-slate-400" />
                      <input
                        value={replyText[issue.id] || ""}
                        onChange={(e) =>
                          handleReplyChange(issue.id, e.target.value)
                        }
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleSendReply(issue.id);
                        }}
                        placeholder="Not satisfied? Reply here…"
                        className="w-full bg-transparent text-sm text-slate-700 placeholder-slate-400 outline-none font-body"
                      />
                    </div>
                    {replyErrors[issue.id] && (
                      <div className="mt-1 text-xs text-rose-600 pb-2 capitalize">
                        {replyErrors[issue.id]}
                      </div>
                    )}

                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => handleSendReply(issue.id)}
                        className="rounded-lg bg-indigo-600 px-3.5 py-2 text-xs font-medium text-white shadow-sm hover:bg-indigo-700 transition-colors disabled:opacity-50"
                        disabled={replyAdding}
                      >
                        {replyAdding ? "Sending..." : "Send Reply"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

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
        darkMode={false}
      />
    </div>
  );
}
