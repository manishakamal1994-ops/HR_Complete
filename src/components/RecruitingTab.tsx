/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { User, Prospect, ChatMessage, CandidateStage } from "../types";
import { 
  Users, 
  MessageSquare, 
  Trash2, 
  Send, 
  ArrowRight, 
  Clock, 
  Phone, 
  Mail, 
  Briefcase, 
  TrendingUp,
  FileText
} from "lucide-react";

interface RecruitingTabProps {
  user: User;
}

export default function RecruitingTab({ user }: RecruitingTabProps) {
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [selectedProspect, setSelectedProspect] = useState<Prospect | null>(null);
  const [chats, setChats] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const isPrivileged = user.role === "CEO" || user.role === "HR" || user.role === "Director";

  const fetchProspects = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/prospects", {
        headers: { "x-user-email": user.email },
      });
      if (res.ok) {
        const data = await res.json();
        setProspects(data);
      } else {
        throw new Error("Could not fetch recruitment candidate list");
      }
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProspects();
  }, [user.email]);

  const handleUpdateStage = async (id: string, newStage: CandidateStage) => {
    try {
      const res = await fetch(`/api/prospects/${id}/stage`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-email": user.email,
        },
        body: JSON.stringify({ stage: newStage }),
      });
      if (res.ok) {
        const updated = await res.json();
        setProspects((prev) => prev.map((p) => (p.id === id ? updated : p)));
        if (selectedProspect && selectedProspect.id === id) {
          setSelectedProspect(updated);
        }
        setSuccessMsg("Recruitment pipeline Stage modernized successfully!");
        setTimeout(() => setSuccessMsg(""), 3000);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteProspect = async (id: string) => {
    if (!window.confirm("Are you positive you wish to remove this candidate's career files and logs?")) return;
    try {
      const res = await fetch(`/api/prospects/${id}`, {
        method: "DELETE",
        headers: { "x-user-email": user.email },
      });
      if (res.ok) {
        setProspects((prev) => prev.filter((p) => p.id !== id));
        if (selectedProspect?.id === id) {
          setSelectedProspect(null);
          setChats([]);
        }
        setSuccessMsg("Candidate and chats purged cleanly.");
        setTimeout(() => setSuccessMsg(""), 3000);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSelectProspect = async (prospect: Prospect) => {
    setSelectedProspect(prospect);
    await fetchChats(prospect.id);
  };

  const fetchChats = async (prospectId: string) => {
    try {
      const res = await fetch(`/api/prospects/${prospectId}/chats`);
      if (res.ok) {
        const data = await res.json();
        setChats(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSendChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedProspect) return;

    try {
      const res = await fetch(`/api/prospects/${selectedProspect.id}/chats`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-email": user.email,
          "x-user-name": user.name,
        },
        body: JSON.stringify({ message: newMessage }),
      });
      if (res.ok) {
        const chat = await res.json();
        setChats((prev) => [...prev, chat]);
        setNewMessage("");
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Visual Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-none border border-zinc-200 flex items-center gap-4">
          <span className="p-3 bg-zinc-100 rounded-none text-zinc-900 border border-zinc-200">
            <Users className="h-5 w-5" />
          </span>
          <div>
            <p className="text-[10px] text-zinc-400 font-black uppercase tracking-[0.2em]">Total Prospect Pool</p>
            <p className="text-3xl font-black text-zinc-900 mt-1 leading-none">{prospects.length}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-none border border-zinc-200 flex items-center gap-4">
          <span className="p-3 bg-zinc-100 rounded-none text-zinc-900 border border-zinc-200">
            <TrendingUp className="h-5 w-5" />
          </span>
          <div>
            <p className="text-[10px] text-zinc-400 font-black uppercase tracking-[0.2em]">Active Interviews</p>
            <p className="text-3xl font-black text-zinc-900 mt-1 leading-none">
              {prospects.filter((p) => p.stage === "Interviewing").length}
            </p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-none border border-zinc-200 flex items-center gap-4">
          <span className="p-3 bg-zinc-100 rounded-none text-zinc-900 border border-zinc-200">
            <Briefcase className="h-5 w-5" />
          </span>
          <div>
            <p className="text-[10px] text-zinc-400 font-black uppercase tracking-[0.2em]">Offered Positions</p>
            <p className="text-3xl font-black text-zinc-900 mt-1 leading-none">
              {prospects.filter((p) => p.stage === "Offered").length}
            </p>
          </div>
        </div>
      </div>

      {successMsg && (
        <div className="p-4 bg-orange-50 border-l-2 border-orange-500 text-orange-950 text-xs rounded-none font-bold text-left">
          {successMsg}
        </div>
      )}

      {errorMsg && (
        <div className="p-4 bg-red-50 border-l-2 border-red-500 text-red-900 text-xs rounded-none font-bold text-left">
          {errorMsg}
        </div>
      )}

      {/* Main Grid split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Candidates Panel (8 cols of list if privileged, or 12 cols of dashboard) */}
        <div className={`${isPrivileged ? "lg:col-span-7" : "lg:col-span-12"} space-y-4`}>
          <div className="bg-white rounded-none border border-zinc-200 p-5">
            <h3 className="font-sans font-black text-[11px] uppercase tracking-[0.16em] text-zinc-900 mb-4 flex items-center gap-1.5 border-b border-zinc-150 pb-2.5 text-left">
              <Users className="h-4 w-4" /> 
              {isPrivileged ? "Active Talent Sourcing Pipelines (Admin Control)" : "Registered Recruiting Pipelines (Read-Only)"}
            </h3>

            {prospects.length === 0 ? (
              <div className="text-center py-10 text-zinc-400 italic text-xs">
                No potential prospects/candidates retrieved. Make submissions on the Login Page!
              </div>
            ) : (
              <div className="space-y-4 max-h-[550px] overflow-y-auto pr-1">
                {prospects.map((p) => (
                  <div 
                    key={p.id}
                    className={`p-4 rounded-none border transition-all text-left ${
                      selectedProspect?.id === p.id 
                      ? "bg-zinc-50/80 border-2 border-black" 
                      : "bg-white border-zinc-200 hover:border-zinc-350"
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row justify-between items-start gap-2 mb-3">
                      <div>
                        <h4 className="font-black text-sm text-zinc-900 flex items-center gap-1.5">
                          {p.name} 
                          <span className="text-[10px] text-zinc-400 font-mono">({p.id})</span>
                        </h4>
                        <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1 text-xs text-zinc-500 font-semibold">
                          <span className="flex items-center gap-1"><Mail className="h-3 w-3 text-zinc-400" /> {p.email}</span>
                          {p.phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3 text-zinc-400" /> {p.phone}</span>}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className={`px-2.5 py-0.5 rounded-none text-[9px] font-black tracking-widest uppercase border-2 ${
                          p.stage === "Prospect" ? "bg-purple-50 text-purple-700 border-purple-300" :
                          p.stage === "Contacted" ? "bg-blue-50 text-blue-700 border-blue-300" :
                          p.stage === "Interviewing" ? "bg-orange-50 text-orange-700 border-orange-300" :
                          p.stage === "Offered" ? "bg-emerald-50 text-emerald-700 border-emerald-300" :
                          "bg-red-50 text-red-750 border-red-300"
                        }`}>
                          {p.stage}
                        </span>
                      </div>
                    </div>

                    <div className="p-3 bg-zinc-50 text-xs text-zinc-700 rounded-none border-l-2 border-zinc-400 font-medium italic flex items-start gap-1.5 mb-4">
                      <FileText className="h-3.5 w-3.5 text-zinc-450 shrink-0 mt-0.5" />
                      <span>{p.cvSummary}</span>
                    </div>

                    {isPrivileged && (
                      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-zinc-150 pt-3">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">Update Stage:</span>
                          <select
                            value={p.stage}
                            onChange={(e) => handleUpdateStage(p.id, e.target.value as CandidateStage)}
                            className="text-xs bg-white border border-zinc-200 rounded-none px-2 py-0.5 font-bold focus:border-black outline-none"
                          >
                            <option value="Prospect">Prospect</option>
                            <option value="Contacted">Contacted</option>
                            <option value="Interviewing">Interviewing</option>
                            <option value="Offered">Offered</option>
                            <option value="Rejected">Rejected</option>
                          </select>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleSelectProspect(p)}
                            className="px-3 py-1.5 text-[9px] uppercase font-black tracking-widest bg-zinc-900 border border-transparent hover:bg-black text-white rounded-none transition-colors flex items-center gap-1 cursor-pointer"
                          >
                            <MessageSquare className="h-3 w-3" /> Chat Board
                          </button>
                          
                          <button
                            type="button"
                            onClick={() => handleDeleteProspect(p.id)}
                            className="p-1 hover:text-red-650 transition-colors cursor-pointer text-zinc-400"
                            title="Purge Application"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Messaging Chat Client for Admins on the right (5 cols) */}
        {isPrivileged && (
          <div className="lg:col-span-5">
            <div className="bg-white rounded-none border border-zinc-200 p-5 sticky top-20 flex flex-col h-[550px] text-left">
              <h3 className="font-sans font-black text-[11px] uppercase tracking-[0.16em] text-zinc-900 mb-3 pb-2.5 border-b border-zinc-150 flex items-center justify-between">
                <span className="flex items-center gap-1.5"><MessageSquare className="h-4 w-4 text-zinc-400" /> Candidate Comms</span>
                {selectedProspect && (
                  <span className="text-[10px] text-orange-600 font-extrabold font-mono">[{selectedProspect.name.split(" ")[0].toUpperCase()}]</span>
                )}
              </h3>

              {!selectedProspect ? (
                <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-zinc-400">
                  <MessageSquare className="h-8 w-8 mb-2 opacity-40 text-black" />
                  <p className="text-xs italic font-medium">Select a candidate's "Chat Board" from the sourcing pipelines roster to interact in real-time.</p>
                </div>
              ) : (
                <div className="flex-1 flex flex-col overflow-hidden h-full">
                  {/* Summary candidate panel top */}
                  <div className="p-3 bg-zinc-50 rounded-none text-xs space-y-1 mb-3 border-l-2 border-black">
                    <div className="flex justify-between items-center gap-2">
                      <span className="font-black text-zinc-900 uppercase tracking-wide">{selectedProspect.name}</span>
                      <span className="text-[10px] text-zinc-400 font-mono">{selectedProspect.email}</span>
                    </div>
                    <p className="text-zinc-600 leading-tight font-medium">Applying for: <strong>{selectedProspect.roleApplied}</strong></p>
                  </div>

                  {/* Messages Feed */}
                  <div className="flex-1 overflow-y-auto mb-3 space-y-2.5 p-2.5 bg-zinc-50/50 rounded-none border border-zinc-200">
                    {chats.length === 0 ? (
                      <p className="text-center py-10 text-zinc-400 text-xs italic font-medium">No logged chats. Send a greetings briefing message to initialize contact.</p>
                    ) : (
                      chats.map((c) => (
                        <div key={c.id} className={`p-2.5 rounded-none border-l-2 text-xs leading-relaxed max-w-[85%] ${
                          c.senderRole === "candidate" || c.senderRole === "prospect"
                            ? "bg-zinc-100 border-zinc-800 mr-auto" 
                            : "bg-orange-50/55 text-zinc-900 ml-auto border-orange-500"
                        }`}>
                          <div className="flex justify-between items-center text-[9px] text-zinc-400 mb-0.5 gap-3">
                            <span className="font-black uppercase">{c.senderName} ({c.senderRole})</span>
                            <span className="font-mono">{new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                          <p className="text-zinc-800 text-xs break-words font-medium">{c.message}</p>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Reply Form */}
                  <form onSubmit={handleSendChat} className="flex gap-2 border-t border-zinc-100 pt-2.5 shrink-0">
                    <input 
                      type="text" 
                      placeholder={`Draft message to ${selectedProspect.name.split(" ")[0]}...`}
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      className="flex-1 text-xs px-3.5 py-2.5 rounded-none border border-zinc-200 bg-white outline-none focus:border-black font-semibold"
                    />
                    <button
                      type="submit"
                      disabled={!newMessage.trim()}
                      className="p-2.5 px-4 bg-black hover:bg-zinc-900 text-white rounded-none transition-colors shrink-0 cursor-pointer disabled:bg-zinc-300 disabled:cursor-not-allowed"
                    >
                      <Send className="h-3.5 w-3.5" />
                    </button>
                  </form>
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
