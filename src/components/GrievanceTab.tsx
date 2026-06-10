/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { User, Grievance, GrievanceCategory, GrievanceStatus, GrievanceLevel } from "../types";
import { 
  FilePlus, 
  MessageSquare, 
  AlertTriangle, 
  CheckCircle, 
  Send, 
  Inbox, 
  ShieldAlert,
  Sliders,
  TrendingUp,
  Tag,
  Clock
} from "lucide-react";

interface GrievanceTabProps {
  user: User;
}

export default function GrievanceTab({ user }: GrievanceTabProps) {
  const [grievances, setGrievances] = useState<Grievance[]>([]);
  const [selectedGrievance, setSelectedGrievance] = useState<Grievance | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // New ticket form
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<GrievanceCategory>("Work Environment");
  const [level, setLevel] = useState<GrievanceLevel>("Medium");
  const [justRaisedTicket, setJustRaisedTicket] = useState<string | null>(null);

  // Reply state
  const [replyText, setReplyText] = useState("");

  const isPrivileged = user.role === "CEO" || user.role === "HR" || user.role === "Director";

  const fetchGrievances = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/grievances", {
        headers: { "x-user-email": user.email },
      });
      if (res.ok) {
        const data = await res.json();
        setGrievances(data);
      } else {
        throw new Error("Grievances ledger could not be retrieved.");
      }
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGrievances();
  }, [user.email]);

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description) return;
    setErrorMsg("");
    setJustRaisedTicket(null);
    setLoading(true);

    try {
      const res = await fetch("/api/grievances", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-email": user.email,
          "x-user-name": user.name,
        },
        body: JSON.stringify({ title, description, category, level }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Grievance ticketing failed");
      }
      setJustRaisedTicket(data.ticketNo);
      setSuccessMsg(`Ticket Generated! Formally Filed under ticket reference ${data.ticketNo}`);
      setTitle("");
      setDescription("");
      fetchGrievances();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAdminAction = async (id: string, updates: { status?: GrievanceStatus; level?: GrievanceLevel; category?: GrievanceCategory }) => {
    try {
      const res = await fetch(`/api/grievances/${id}/action`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-email": user.email,
        },
        body: JSON.stringify(updates),
      });
      if (res.ok) {
        const updated = await res.json();
        setGrievances((prev) => prev.map((g) => (g.id === id ? updated : g)));
        if (selectedGrievance?.id === id) {
          setSelectedGrievance(updated);
        }
        setSuccessMsg("Admin case categorization changes saved!");
        setTimeout(() => setSuccessMsg(""), 3000);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !selectedGrievance) return;

    try {
      const res = await fetch(`/api/grievances/${selectedGrievance.id}/replies`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-email": user.email,
          "x-user-name": user.name,
        },
        body: JSON.stringify({ message: replyText }),
      });
      if (res.ok) {
        const updated = await res.json();
        setGrievances((prev) => prev.map((g) => (g.id === selectedGrievance.id ? updated : g)));
        setSelectedGrievance(updated);
        setReplyText("");
      } else {
        const data = await res.json();
        setErrorMsg(data.error || "Failed to submit reply thread");
      }
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  const categories: GrievanceCategory[] = [
    "Harassment (Sexual/Physical/Mental)",
    "Recruitment Related",
    "Work Environment",
    "Compensation & Benefits",
    "Other Issues",
  ];

  return (
    <div className="space-y-6">
      
      {/* Alert Header for just generated tickets */}
      {justRaisedTicket && (
        <div className="p-5 rounded-none bg-black text-white border-2 border-black flex items-center justify-between gap-4">
          <div>
            <span className="text-[9px] font-black uppercase tracking-widest bg-zinc-800 text-zinc-100 px-2.5 py-1">Security System Alert</span>
            <h4 className="font-sans font-black uppercase tracking-tight text-md mt-2">Ticket Raised: <span className="font-mono font-black bg-zinc-800 px-2 py-0.5">{justRaisedTicket}</span></h4>
            <p className="text-xs text-zinc-400 mt-1.5 font-semibold">Your privacy is confidential. Our HR and corporate compliance desk is examining your ticket.</p>
          </div>
          <CheckCircle className="h-10 w-10 shrink-0 opacity-80 text-orange-550" />
        </div>
      )}

      {successMsg && !justRaisedTicket && (
        <div className="p-4 bg-orange-50 border-l-2 border-orange-500 text-orange-950 text-xs rounded-none font-bold text-left animate-fade-in">
          {successMsg}
        </div>
      )}

      {errorMsg && (
        <div className="p-4 bg-red-50 border-l-2 border-red-500 text-red-900 text-xs rounded-none font-bold text-left animate-fade-in">
          {errorMsg}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Submitting Case Form (Only for employees, or anyone who wants to submit a grievance) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white rounded-none border border-zinc-200 p-5 text-left">
            <h3 className="font-sans font-black text-[11px] uppercase tracking-[0.16em] text-zinc-900 mb-3.5 flex items-center gap-2 border-b border-zinc-150 pb-2.5">
              <FilePlus className="h-4 w-4 text-zinc-900" /> File Grievance Ticket
            </h3>
            
            <form onSubmit={handleCreateTicket} className="space-y-3.5">
              <p className="text-xs text-zinc-500 leading-relaxed font-medium">
                Registered personnel or active candidates can file secure complaints regarding physical, sexual, or mental harassment, discrimination, layout issues or recruiting anomalies.
              </p>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.18em] block">Grievance Topic Title</label>
                <input 
                  type="text" 
                  id="griv-title-input"
                  required
                  placeholder="Summarize the core concern..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 rounded-none border border-zinc-200 bg-white outline-none focus:border-black font-semibold"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.18em] block">Classification Category</label>
                <select 
                  id="griv-cat-select"
                  value={category}
                  onChange={(e) => setCategory(e.target.value as GrievanceCategory)}
                  className="w-full text-xs px-3.5 py-2.5 rounded-none border border-zinc-200 bg-white outline-none focus:border-black font-bold"
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.18em] block">Initial Severity</label>
                  <select 
                    id="griv-level-select"
                    value={level}
                    onChange={(e) => setLevel(e.target.value as GrievanceLevel)}
                    className="w-full text-xs px-3.5 py-2.5 rounded-none border border-zinc-200 bg-white outline-none focus:border-black font-bold"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.18em] block">Submitter</label>
                  <input 
                    type="text" 
                    disabled 
                    value={user.email} 
                    className="w-full text-xs px-3.5 py-2.5 rounded-none border border-zinc-200 bg-zinc-50 text-zinc-400 font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.18em] block">Specific Details / Witnesses</label>
                <textarea 
                  id="griv-desc-input"
                  required
                  rows={4}
                  placeholder="Outline dates, times, personnel involved, and specific details..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 rounded-none border border-zinc-200 bg-white outline-none focus:border-black font-semibold resize-none"
                />
              </div>

              <button
                type="submit"
                id="btn-raise-ticket"
                className="w-full py-3 bg-black hover:bg-zinc-900 text-white font-black text-xs uppercase tracking-widest rounded-none cursor-pointer transition-all"
              >
                Raise Confidential Ticket
              </button>
            </form>
          </div>
        </div>

        {/* Center / Right Column: Tickets Oversight Ledger (8 cols) */}
        <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-12 gap-4">
          
          {/* Tickets list (5 cols) */}
          <div className="md:col-span-5 bg-white rounded-none border border-zinc-200 p-4 space-y-3">
            <h3 className="font-sans font-black text-[11px] uppercase tracking-[0.16em] text-zinc-900 mb-3 pb-2.5 border-b border-zinc-150 flex items-center justify-between">
              <span className="flex items-center gap-1.5"><Inbox className="h-4 w-4 text-zinc-400" /> Case Ledger</span>
              <span className="text-[10px] font-mono text-zinc-400">({grievances.length} tickets)</span>
            </h3>

            {grievances.length === 0 ? (
              <div className="text-center py-10 text-zinc-400 italic text-xs font-semibold">
                No tickets submitted yet. Submit using the tender case form!
              </div>
            ) : (
              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                {grievances.map((g) => (
                  <div
                    key={g.id}
                    onClick={() => setSelectedGrievance(g)}
                    className={`p-3.5 rounded-none border cursor-pointer transition-all text-left ${
                      selectedGrievance?.id === g.id
                        ? "bg-zinc-50/80 border-2 border-black"
                        : "bg-white border-zinc-200 hover:border-zinc-350"
                    }`}
                  >
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="font-mono text-[9px] font-black text-zinc-600 bg-zinc-100 border border-zinc-200 px-1.5 py-0.5 rounded-none">
                        {g.ticketNo}
                      </span>
                      <span className={`px-2 py-0.5 rounded-none text-[8px] font-black tracking-widest uppercase border-2 ${
                        g.status === "Open" ? "bg-amber-50 text-amber-900 border-amber-300" :
                        g.status === "Under Review" ? "bg-blue-50 text-blue-900 border-blue-300" :
                        g.status === "Escalated" ? "bg-purple-50 text-purple-900 border-purple-300" :
                        "bg-emerald-50 text-emerald-900 border-emerald-300"
                      }`}>
                        {g.status}
                      </span>
                    </div>

                    <h4 className="font-black text-xs text-zinc-900 truncate uppercase mt-1">{g.title}</h4>
                    <p className="text-[10px] text-zinc-400 font-semibold truncate mt-0.5">{g.category}</p>

                    <div className="flex justify-between items-center mt-3.5 pt-1.5 border-t border-zinc-100 text-[9px]">
                      <span className="text-zinc-500 font-bold truncate max-w-[120px]" title={g.submittedByEmail}>
                        By: {g.submittedByName.split(" ")[0].toUpperCase()}
                      </span>
                      <span className={`font-black uppercase tracking-wider ${
                        g.level === "Escalated" ? "text-purple-700" :
                        g.level === "High" ? "text-red-750" :
                        g.level === "Medium" ? "text-amber-700" :
                        "text-zinc-500"
                      }`}>
                        {g.level} Severity
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Ticket detail & operations (7 cols) */}
          <div className="md:col-span-7 bg-white rounded-none border border-zinc-200 p-4 flex flex-col h-[550px]">
            {!selectedGrievance ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center text-zinc-400 p-6">
                <ShieldAlert className="h-8 w-8 mb-2 opacity-40 text-black" />
                <p className="text-xs italic font-medium">Select a grievance ticket from the ledger to conduct reviews, replies, escalation status updates, and closures.</p>
              </div>
            ) : (
              <div className="flex-1 flex flex-col overflow-hidden h-full">
                
                {/* Header detail */}
                <div className="border-b border-zinc-200 pb-3.5 mb-3 text-left">
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <span className="font-mono text-[9px] font-black text-zinc-600 bg-zinc-100 border border-zinc-200 px-2 py-0.5 rounded-none">
                        {selectedGrievance.ticketNo}
                      </span>
                      <h4 className="font-sans font-black text-sm text-zinc-900 mt-1.5 uppercase tracking-tight">{selectedGrievance.title}</h4>
                      <p className="text-[10px] text-zinc-400 font-semibold flex items-center gap-1 mt-1">
                        <Tag className="h-3 w-3" /> Submitted by {selectedGrievance.submittedByName} ({selectedGrievance.submittedByEmail})
                      </p>
                    </div>

                    <span className={`px-2 py-0.5 rounded-none text-[9px] font-black tracking-widest uppercase border-2 shrink-0 ${
                      selectedGrievance.level === "Escalated" ? "bg-purple-50 text-purple-700 border-purple-300" :
                      selectedGrievance.level === "High" ? "bg-red-50 text-red-700 border-red-300" :
                      "bg-zinc-50 text-zinc-650 border-zinc-300"
                    }`}>
                      {selectedGrievance.level} Severity
                    </span>
                  </div>

                  <p className="text-xs text-zinc-700 bg-zinc-50 p-3.5 rounded-none border-l-2 border-zinc-400 mt-3.5 leading-relaxed whitespace-pre-line italic font-medium">
                    "{selectedGrievance.description}"
                  </p>
                </div>

                {/* Admin Controllers Row if high privilege role */}
                {isPrivileged && (
                  <div className="bg-zinc-50 rounded-none p-3.5 mb-3.5 border-2 border-zinc-900 space-y-2 text-left">
                    <span className="text-[9px] uppercase font-black text-zinc-400 tracking-wider block">Admin Management (High Privilege Oversight)</span>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-0.5">
                        <span className="text-[9px] font-black uppercase text-zinc-400 tracking-wider">Class Category</span>
                        <select
                          value={selectedGrievance.category}
                          onChange={(e) => handleAdminAction(selectedGrievance.id, { category: e.target.value as GrievanceCategory })}
                          className="w-full text-xs bg-white border border-zinc-200 rounded-none p-1 font-bold outline-none"
                        >
                          {categories.map((c) => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-0.5">
                        <span className="text-[9px] font-black uppercase text-zinc-400 tracking-wider">Status Updates</span>
                        <select
                          value={selectedGrievance.status}
                          onChange={(e) => handleAdminAction(selectedGrievance.id, { status: e.target.value as GrievanceStatus })}
                          className="w-full text-xs bg-white border border-zinc-200 rounded-none p-1 font-bold outline-none"
                        >
                          <option value="Open">Open</option>
                          <option value="Under Review">Under Review</option>
                          <option value="Escalated">Escalated</option>
                          <option value="Closed">Closed / Resolved</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-zinc-200">
                      <div className="flex items-center gap-1 bg-white px-2 py-0.5 rounded-none border border-zinc-300">
                        <span className="text-[9px] text-zinc-400 uppercase font-black tracking-wider">Level:</span>
                        <select
                          value={selectedGrievance.level}
                          onChange={(e) => handleAdminAction(selectedGrievance.id, { level: e.target.value as GrievanceLevel })}
                          className="text-[10px] font-black bg-transparent border-0 outline-none cursor-pointer"
                        >
                          <option value="Low">Low</option>
                          <option value="Medium">Medium</option>
                          <option value="High">High</option>
                          <option value="Escalated">Escalated</option>
                        </select>
                      </div>

                      <div className="flex gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleAdminAction(selectedGrievance.id, { status: "Escalated", level: "Escalated" })}
                          className="px-2.5 py-1 bg-purple-600 hover:bg-purple-750 text-white rounded-none text-[9px] font-black uppercase tracking-wider cursor-pointer"
                        >
                          Escalate Team
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAdminAction(selectedGrievance.id, { status: "Closed" })}
                          className="px-2.5 py-1 bg-neutral-900 hover:bg-black text-white rounded-none text-[9px] font-black uppercase tracking-wider cursor-pointer"
                        >
                          Close Incident
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Replies Thread */}
                <span className="text-[9px] uppercase font-black text-zinc-400 tracking-[0.16em] block mb-2 text-left pb-1 border-b border-zinc-100 flex items-center gap-1">
                  <MessageSquare className="h-3 w-3" /> Case Updates Chronology Feed
                </span>
                
                <div className="flex-1 overflow-y-auto space-y-2.5 p-2.5 bg-zinc-50/50 rounded-none border border-zinc-200 min-h-[140px]">
                  {selectedGrievance.replies.length === 0 ? (
                    <p className="text-center py-8 text-zinc-400 text-xs italic font-medium">No messages logged on this incident record yet.</p>
                  ) : (
                    selectedGrievance.replies.map((r) => (
                      <div key={r.id} className={`p-2.5 rounded-none border-l-2 text-xs text-left ${
                        r.senderEmail.toLowerCase() === user.email.toLowerCase()
                          ? "bg-zinc-100 border-zinc-900 ml-5"
                          : "bg-orange-50/40 border-orange-500 mr-5"
                      }`}>
                        <div className="flex justify-between items-center text-[9px] text-zinc-400 mb-0.5">
                          <span className="font-black uppercase">{r.senderName} ({r.senderRole})</span>
                          <span className="font-mono text-zinc-400">{new Date(r.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <p className="text-zinc-805 text-xs leading-relaxed font-semibold">{r.message}</p>
                      </div>
                    ))
                  )}
                </div>

                {/* Reply bar */}
                <form onSubmit={handleSendReply} className="flex gap-2 border-t border-zinc-150 pt-3 shrink-0">
                  <input
                    type="text"
                    placeholder="Contribute statement or action noteConfidential statement..."
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    className="flex-1 text-xs px-3.5 py-2.5 rounded-none border border-zinc-200 bg-white outline-none focus:border-black font-semibold"
                  />
                  <button
                    type="submit"
                    disabled={!replyText.trim()}
                    className="px-4 py-2.5 bg-black hover:bg-zinc-950 text-white rounded-none text-xs font-black uppercase tracking-widest cursor-pointer disabled:bg-zinc-350 disabled:cursor-not-allowed"
                  >
                    Reply
                  </button>
                </form>

              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}
