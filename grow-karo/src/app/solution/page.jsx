"use client";

import React, { useState } from "react";
import { 
  HelpCircle, 
  Search, 
  ChevronDown, 
  LifeBuoy, 
  Send, 
  FileText, 
  CheckCircle, 
  ArrowRight,
  ShieldAlert,
  HeadsetIcon
} from "lucide-react";

export default function SolutionsHelpCenter() {
  const [searchQuery, setSearchQuery] = useState("");
  const [openFaq, setOpenFaq] = useState(null);
  
  const [issueSubmitted, setIssueSubmitted] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [ticketData, setTicketData] = useState({
    category: "payout",
    email: "",
    transactionId: "",
    description: ""
  });

  const faqData = [
    {
      id: 1,
      question: "Why is my manual withdrawal request marked as 'Pending Review'?",
      answer: "To secure the platform network, any daily withdrawal surpassing your configured instant auto-approval ceiling (typically ₹25,000) or hitting an anomalous risk profile requires secondary hardware-authenticated verification from the admin panel layer. Reviews are usually settled within 15–30 minutes."
    },
    {
      id: 2,
      question: "How do I update our platform management transaction fee?",
      answer: "Go directly to your 'System Control & Gateway Configurations' module under settings. Choose the 'Financial & Limits' panel, adjust the percentage matrix, and click 'Save System Changes' to commit the state global updates instantly."
    },
    {
      id: 3,
      question: "What happens if a critical webhook dispatch endpoint responds with 500?",
      answer: "Grow-Karo implements an exponential backoff retry layout strategy over 4 hours. If routing continues to fail, the audit log triggers a high-severity notification alert visible inside your admin console navbar tray."
    }
  ];

  const filteredFaqs = faqData.filter(faq => 
    faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setTicketData(prev => ({ ...prev, [name]: value }));
  };

  const handleTicketSubmit = (e) => {
    e.preventDefault();
    setIsSending(true);
    setTimeout(() => {
      setIsSending(false);
      setIssueSubmitted(true);
      setTicketData({ category: "payout", email: "", transactionId: "", description: "" });
    }, 1500);
  };

  return (
    // Clean, crisp light mode presentation layer
    <div className="w-full min-h-screen bg-slate-50 text-slate-800 p-6 md:p-12 selection:bg-teal-100 selection:text-teal-900">
      <div className="max-w-6xl mx-auto space-y-12">
        
        {/* Modernized Header Group */}
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <div className="h-12 w-12 rounded-2xl bg-teal-50 border border-teal-200 flex items-center justify-center mx-auto shadow-md shadow-teal-500/5">
            <HeadsetIcon className="h-6 w-6 text-teal-600 animate-pulse" style={{ animationDuration: '20s' }} />
          </div>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight sm:text-4xl">
            Resolution Matrix & Support Gateway
          </h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            Search our terminal knowledge vault for instant self-healing rules, or dispatch an urgent encrypted ticket directly to the supervising authority.
          </p>
        </div>

        {/* Master Content Split Layout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT: FAQ Vault Segment (7 Columns) */}
          <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2.5">
                <HelpCircle className="h-5 w-5 text-teal-600" />
                Knowledge Base Lookup
              </h3>
              <span className="text-[10px] font-mono font-bold text-teal-700 bg-teal-50 border border-teal-200 px-2.5 py-0.5 rounded-full">
                v1.4 Live
              </span>
            </div>

            {/* Interactive Search Field */}
            <div className="relative">
              <Search className="absolute left-4 top-3.5 h-4 w-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search troubleshooting keywords, error logs..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-11 pr-4 py-3 text-xs text-slate-800 focus:outline-none focus:border-slate-400 focus:bg-white placeholder-slate-400 transition-all"
              />
            </div>

            {/* Accordion List Matrix */}
            <div className="space-y-3 pt-2">
              {filteredFaqs.length > 0 ? (
                filteredFaqs.map((faq) => (
                  <div 
                    key={faq.id} 
                    className="border border-slate-200 bg-white rounded-xl overflow-hidden shadow-2xs transition-all duration-200"
                  >
                    <button
                      onClick={() => setOpenFaq(openFaq === faq.id ? null : faq.id)}
                      className="w-full flex items-center justify-between p-4.5 text-left gap-4 hover:bg-slate-50 transition-colors"
                    >
                      <span className="text-xs font-semibold text-slate-800 leading-tight">{faq.question}</span>
                      <ChevronDown className={`h-4 w-4 text-slate-400 shrink-0 transition-transform duration-300 ${openFaq === faq.id ? "rotate-180 text-teal-600" : ""}`} />
                    </button>
                    
                    <div 
                      className={`transition-all duration-300 ease-in-out overflow-hidden ${
                        openFaq === faq.id ? "max-h-75 border-t border-slate-100 bg-slate-50/50" : "max-h-0"
                      }`}
                    >
                      <p className="p-4.5 text-[12px] text-slate-600 leading-relaxed font-normal">
                        {faq.answer}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 border border-dashed border-slate-200 rounded-xl">
                  <p className="text-xs text-slate-400">No matching system parameters resolved in local cache.</p>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT: Escalation Form Segment (5 Columns) */}
          <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            {issueSubmitted ? (
              <div className="text-center py-12 space-y-4">
                <div className="h-14 w-14 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center mx-auto">
                  <CheckCircle className="h-6 w-6 text-emerald-600" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-slate-900">Ticket Securely Dispatched</h4>
                  <p className="text-xs text-slate-600 mt-1.5 max-w-xs mx-auto leading-relaxed">
                    Your report has been committed to the support queue. An administrator will review your logs shortly.
                  </p>
                </div>
                <button
                  onClick={() => setIssueSubmitted(false)}
                  className="mx-auto flex items-center gap-2 text-xs font-bold text-teal-700 hover:text-teal-800 bg-slate-50 border border-slate-200 px-4 py-2 rounded-xl transition-colors"
                >
                  File Another Ticket <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <form onSubmit={handleTicketSubmit} className="space-y-4">
                <div className="border-b border-slate-100 pb-4">
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2.5">
                    <FileText className="h-5 w-5 text-rose-500" />
                    Escalate to Authority
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Route a diagnostics inquiry directly into core supervisor support lines.
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-[11px] uppercase tracking-wider text-slate-500 font-bold mb-2">
                      Operational Category
                    </label>
                    <select
                      name="category"
                      value={ticketData.category}
                      onChange={handleInputChange}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-slate-400 focus:bg-white transition-colors"
                    >
                      <option value="payout">Payout & Financial Gateway Hold</option>
                      <option value="security">MFA Verification Lockout</option>
                      <option value="system">Webhook Synchronization Conflict</option>
                      <option value="other">General Structural Anomaly</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] uppercase tracking-wider text-slate-500 font-bold mb-2">
                      Registered Email Address
                    </label>
                    <input
                      required
                      type="email"
                      name="email"
                      placeholder="admin@grow-karo.com"
                      value={ticketData.email}
                      onChange={handleInputChange}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-slate-400 focus:bg-white transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] uppercase tracking-wider text-slate-500 font-bold mb-2">
                      Reference Transaction ID <span className="text-slate-400 font-normal">(Optional)</span>
                    </label>
                    <input
                      type="text"
                      name="transactionId"
                      placeholder="TXN-90821-X"
                      value={ticketData.transactionId}
                      onChange={handleInputChange}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 font-mono focus:outline-none focus:border-slate-400 focus:bg-white transition-colors placeholder-slate-300"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] uppercase tracking-wider text-slate-500 font-bold mb-2">
                      Situation Diagnostics Detail
                    </label>
                    <textarea
                      required
                      name="description"
                      rows={4}
                      placeholder="Provide tracing logs, error messages, or context regarding the issue..."
                      value={ticketData.description}
                      onChange={handleInputChange}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-slate-400 focus:bg-white transition-colors placeholder-slate-400 resize-none leading-relaxed"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSending}
                  className="w-full bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white font-bold py-3 px-4 rounded-xl text-xs transition-all flex items-center justify-center gap-2 shadow-sm mt-4 cursor-pointer"
                >
                  {isSending ? (
                    <>
                      <ShieldAlert className="h-4 w-4 animate-pulse text-white" />
                      <span>Transmitting Payload...</span>
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      <span>Transmit Secure Ticket</span>
                    </>
                  )}
                </button>
              </form>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}