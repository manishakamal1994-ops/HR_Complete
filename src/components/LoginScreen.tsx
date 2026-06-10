/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { User, UserRole } from "../types";
import { LayoutGrid, ShieldAlert, CheckCircle, Briefcase, UserPlus, KeyRound, MessageSquare } from "lucide-react";

interface LoginScreenProps {
  onLoginSuccess: (user: User) => void;
  apiHeaders: { "x-user-email": string; "x-user-name": string };
}

export default function LoginScreen({ onLoginSuccess, apiHeaders }: LoginScreenProps) {
  const [activeTab, setActiveTab] = useState<"login" | "register" | "candidate" | "tracker">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<UserRole>("Employee");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Candidate submission
  const [candName, setCandName] = useState("");
  const [candEmail, setCandEmail] = useState("");
  const [candPhone, setCandPhone] = useState("");
  const [candRole, setCandRole] = useState("");
  const [candCv, setCandCv] = useState("");

  // Tracker
  const [trackEmail, setTrackEmail] = useState("");
  const [trackedProspect, setTrackedProspect] = useState<any | null>(null);
  const [trackedChats, setTrackedChats] = useState<any[]>([]);
  const [newChatMessage, setNewChatMessage] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setErrorMsg("");
    setSuccessMsg("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Login failed");
      }
      onLoginSuccess(data.user);
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) {
      setErrorMsg("Please fill in all registration fields.");
      return;
    }
    setErrorMsg("");
    setSuccessMsg("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, role }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Registration failed");
      }
      setSuccessMsg(data.message);
      // Reset
      setName("");
      setEmail(email);
      setPassword("");
      setRole("Employee");
      setActiveTab("login");
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCandidateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!candName || !candEmail || !candRole) {
      setErrorMsg("Candidate Name, Email, and Position are required.");
      return;
    }
    setErrorMsg("");
    setSuccessMsg("");
    setLoading(true);

    try {
      const res = await fetch("/api/prospects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: candName,
          email: candEmail,
          phone: candPhone,
          roleApplied: candRole,
          cvSummary: candCv,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Candidate submission failed");
      }
      setSuccessMsg(`Outstanding, ${candName}! You have been registered successfully as an Active Prospect. You can track communications in the 'Track My Application' tab using your email.`);
      // Reset forms
      setCandName("");
      setCandEmail("");
      setCandPhone("");
      setCandRole("");
      setCandCv("");
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleTrackApplication = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackEmail) return;
    setErrorMsg("");
    setTrackedProspect(null);
    setLoading(true);

    try {
      const res = await fetch("/api/prospects", {
        headers: { "x-user-email": trackEmail.toLowerCase() },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "No records found");

      const list = data as any[];
      const found = list.find(p => p.email.toLowerCase() === trackEmail.toLowerCase().trim());
      if (!found) {
        throw new Error("No active prospect application listed under this email. Please register as a prospect first.");
      }
      setTrackedProspect(found);
      await fetchProspectChats(found.id);
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchProspectChats = async (id: string) => {
    try {
      const res = await fetch(`/api/prospects/${id}/chats`);
      const data = await res.json();
      if (res.ok) {
        setTrackedChats(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSendChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChatMessage.trim() || !trackedProspect) return;

    try {
      const res = await fetch(`/api/prospects/${trackedProspect.id}/chats`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-email": trackedProspect.email,
          "x-user-name": trackedProspect.name,
        },
        body: JSON.stringify({ message: newChatMessage }),
      });
      if (res.ok) {
        setNewChatMessage("");
        fetchProspectChats(trackedProspect.id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 p-4 font-sans selection:bg-orange-100 selection:text-zinc-900">
      <div className="w-full max-w-xl bg-white border-2 border-black rounded-none shadow-none overflow-hidden">
        
        {/* Banner */}
        <div className="bg-black px-6 py-7 text-white border-b-2 border-black">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-7 h-7 bg-white text-black flex items-center justify-center font-black text-sm rounded-sm shrink-0">HR</span>
            <h1 className="font-sans text-xl font-black italic tracking-tight uppercase">HR Associate Manager</h1>
          </div>
          <p className="text-xs text-zinc-400 font-medium tracking-wide">Professional governance, candidates, grievances & scheduling pipeline.</p>
        </div>

        {/* Tab triggers */}
        <div className="flex border-b border-zinc-250 bg-zinc-100/50 text-[10px] font-black uppercase tracking-wider text-zinc-500 overflow-x-auto">
          <button 
            type="button"
            id="tab-login"
            onClick={() => { setActiveTab("login"); setErrorMsg(""); }}
            className={`flex-1 min-w-[80px] py-3.5 px-4 text-center border-b-2 hover:bg-zinc-50 hover:text-zinc-900 transition-colors uppercase ${activeTab === "login" ? "border-black text-zinc-950 bg-white font-black" : "border-transparent"}`}
          >
            <KeyRound className="inline h-3.5 w-3.5 mr-1 align-sub" /> Login
          </button>
          <button 
            type="button"
            id="tab-register"
            onClick={() => { setActiveTab("register"); setErrorMsg(""); }}
            className={`flex-1 min-w-[100px] py-3.5 px-4 text-center border-b-2 hover:bg-zinc-50 hover:text-zinc-900 transition-colors uppercase ${activeTab === "register" ? "border-black text-zinc-950 bg-white font-black" : "border-transparent"}`}
          >
            <UserPlus className="inline h-3.5 w-3.5 mr-1 align-sub" /> Register
          </button>
          <button 
            type="button"
            id="tab-candidate"
            onClick={() => { setActiveTab("candidate"); setErrorMsg(""); }}
            className={`flex-1 min-w-[150px] py-3.5 px-4 text-center border-b-2 hover:bg-zinc-50 hover:text-zinc-900 transition-colors uppercase ${activeTab === "candidate" ? "border-black text-zinc-950 bg-white font-black" : "border-transparent"}`}
          >
            <Briefcase className="inline h-3.5 w-3.5 mr-1 align-sub" /> Candidate Careers
          </button>
          <button 
            type="button"
            id="tab-tracker"
            onClick={() => { setActiveTab("tracker"); setErrorMsg(""); }}
            className={`flex-1 min-w-[160px] py-3.5 px-4 text-center border-b-2 hover:bg-zinc-50 hover:text-zinc-900 transition-colors uppercase ${activeTab === "tracker" ? "border-black text-zinc-950 bg-white font-black" : "border-transparent"}`}
          >
            <MessageSquare className="inline h-3.5 w-3.5 mr-1 align-sub" /> Track App
          </button>
        </div>

        {/* Content Box */}
        <div className="p-6 md:p-8">
          
          {/* Messages */}
          {errorMsg && (
            <div id="login-error" className="mb-5 flex items-start gap-2.5 p-4 bg-red-50 text-red-900 text-xs border-l-2 border-red-600 rounded-none">
              <ShieldAlert className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
              <span className="font-semibold">{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div id="login-success" className="mb-5 flex items-start gap-2.5 p-4 bg-orange-50 text-orange-950 text-xs border-l-2 border-orange-500 rounded-none">
              <CheckCircle className="h-4 w-4 text-orange-600 shrink-0 mt-0.5" />
              <span className="font-semibold">{successMsg}</span>
            </div>
          )}

          {/* Tab 1: Login */}
          {activeTab === "login" && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1 text-left">
                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] block">Company Email</label>
                <input 
                  type="email" 
                  id="login-email"
                  required
                  placeholder="e.g. manishakamal1994@gmail.com"
                  className="w-full text-xs px-3.5 py-2.5 rounded-none border border-zinc-200 outline-none focus:border-black transition-all focus:ring-1 focus:ring-black bg-white"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className="space-y-1 text-left">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] block">Password</label>
                </div>
                <input 
                  type="password" 
                  id="login-password"
                  required
                  placeholder="••••••••"
                  className="w-full text-xs px-3.5 py-2.5 rounded-none border border-zinc-200 outline-none focus:border-black transition-all focus:ring-1 focus:ring-black bg-white"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              <button
                type="submit"
                id="btn-login-submit"
                disabled={loading}
                className="w-full py-3 px-4 bg-black hover:bg-zinc-900 text-white font-black text-xs uppercase tracking-widest rounded-none transition-all cursor-pointer disabled:bg-zinc-400 disabled:cursor-not-allowed"
              >
                {loading ? "Authenticating Session..." : "Secure Sign In"}
              </button>

              <div className="pt-4 border-t border-zinc-100 text-center text-[11px] text-zinc-450 leading-relaxed">
                <span className="font-black text-zinc-800 uppercase tracking-widest block mb-1 text-[9px]">Demonstration Defaults:</span>
                Admin User: <span className="font-mono text-zinc-650 italic">manishakamal1994@gmail.com</span> / Password: <span className="font-mono text-zinc-650 italic">Admin123!</span><br />
                Employee User: <span className="font-mono text-zinc-650 italic">john@example.com</span> / Password: <span className="font-mono text-zinc-650 italic">John123!</span>
              </div>
            </form>
          )}

          {/* Tab 2: Register */}
          {activeTab === "register" && (
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="space-y-1 text-left">
                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] block">Full Name</label>
                <input 
                  type="text" 
                  id="reg-name"
                  required
                  placeholder="e.g. John Doe"
                  className="w-full text-xs px-3.5 py-2.5 rounded-none border border-zinc-200 outline-none focus:border-black transition-all focus:ring-1 focus:ring-black bg-white"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div className="space-y-1 text-left">
                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] block">Company Email Address</label>
                <input 
                  type="email" 
                  id="reg-email"
                  required
                  placeholder="e.g. john@example.com"
                  className="w-full text-xs px-3.5 py-2.5 rounded-none border border-zinc-200 outline-none focus:border-black transition-all focus:ring-1 focus:ring-black bg-white"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className="space-y-1 text-left">
                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.16em] block">Desired Target Role</label>
                <select 
                  id="reg-role"
                  className="w-full text-xs px-3.5 py-2.5 rounded-none border border-zinc-200 outline-none bg-white focus:border-black transition-all focus:ring-1 focus:ring-black"
                  value={role}
                  onChange={(e) => setRole(e.target.value as UserRole)}
                >
                  <option value="Employee">Employee (Read-Only personal dashboard access)</option>
                  <option value="HR">HR Manager (High privilege administrative access)</option>
                  <option value="Director">Director (High privilege oversight access)</option>
                  <option value="CEO">CEO (Ultimate system owner access)</option>
                </select>
              </div>

              <div className="space-y-1 text-left">
                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] block">Password</label>
                <input 
                  type="password" 
                  id="reg-password"
                  required
                  placeholder="••••••••"
                  className="w-full text-xs px-3.5 py-2.5 rounded-none border border-zinc-200 outline-none focus:border-black transition-all focus:ring-1 focus:ring-black bg-white"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              <div className="p-3 bg-zinc-50 rounded-none border-l-2 border-zinc-900 text-[11px] text-zinc-800 text-left">
                <strong>Administrative Policy:</strong> Registering with standard emails places the account in a **Pending Approval** queue. An Administrator must log in and approve the user before they can sign in. Registering with <strong>manishakamal1994@gmail.com</strong> is auto-approved instantly.
              </div>

              <button
                type="submit"
                id="btn-register-submit"
                disabled={loading}
                className="w-full py-3 px-4 bg-black hover:bg-zinc-900 text-white font-black text-xs uppercase tracking-widest rounded-none transition-all cursor-pointer disabled:bg-zinc-400"
              >
                {loading ? "Registering Request..." : "Submit Registration Application"}
              </button>
            </form>
          )}

          {/* Tab 3: Candidate Careers */}
          {activeTab === "candidate" && (
            <form onSubmit={handleCandidateSubmit} className="space-y-4">
              <p className="text-xs text-zinc-500 mb-2 leading-relaxed text-left font-medium">
                Submit your CV summary below. HR Managers will review your application, transition your stage, and communicate with you through the application chat.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1 text-left">
                  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] block">Full Name</label>
                  <input 
                    type="text" 
                    id="cand-name-input"
                    required
                    placeholder="Alan Turing"
                    className="w-full text-xs px-3.5 py-2.5 rounded-none border border-zinc-200 bg-white outline-none focus:border-black font-semibold transition-all focus:ring-1 focus:ring-black"
                    value={candName}
                    onChange={(e) => setCandName(e.target.value)}
                  />
                </div>
                <div className="space-y-1 text-left">
                  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] block">Email Address</label>
                  <input 
                    type="email" 
                    id="cand-email-input"
                    required
                    placeholder="alan@turing.com"
                    className="w-full text-xs px-3.5 py-2.5 rounded-none border border-zinc-200 bg-white outline-none focus:border-black font-semibold transition-all focus:ring-1 focus:ring-black"
                    value={candEmail}
                    onChange={(e) => setCandEmail(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1 text-left">
                  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] block">Phone Number</label>
                  <input 
                    type="text" 
                    id="cand-phone-input"
                    placeholder="+1 555 4567"
                    className="w-full text-xs px-3.5 py-2.5 rounded-none border border-zinc-200 bg-white outline-none focus:border-black font-semibold transition-all focus:ring-1 focus:ring-black"
                    value={candPhone}
                    onChange={(e) => setCandPhone(e.target.value)}
                  />
                </div>
                <div className="space-y-1 text-left">
                  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.16em] block">Target Position</label>
                  <input 
                    type="text" 
                    id="cand-role-input"
                    required
                    placeholder="Senior HR Analyst / Backend Dev"
                    className="w-full text-xs px-3.5 py-2.5 rounded-none border border-zinc-200 bg-white outline-none focus:border-black font-semibold transition-all focus:ring-1 focus:ring-black"
                    value={candRole}
                    onChange={(e) => setCandRole(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-1 text-left">
                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] block">Professional CV & Motivation Summary</label>
                <textarea 
                  id="cand-cv-input"
                  required
                  rows={4}
                  placeholder="Outline your background, certifications, and target motivations..."
                  className="w-full text-xs px-3.5 py-2.5 rounded-none border border-zinc-200 bg-white outline-none focus:border-black font-semibold transition-all focus:ring-1 focus:ring-black resize-none"
                  value={candCv}
                  onChange={(e) => setCandCv(e.target.value)}
                />
              </div>

              <button
                type="submit"
                id="btn-candidate-submit"
                disabled={loading}
                className="w-full py-3 px-4 bg-black hover:bg-zinc-900 text-white font-black text-xs uppercase tracking-widest rounded-none transition-all cursor-pointer"
              >
                {loading ? "Uploading CV Profile..." : "Submit Candidate Application"}
              </button>
            </form>
          )}

          {/* Tab 4: Track Application */}
          {activeTab === "tracker" && (
            <div className="space-y-5">
              <form onSubmit={handleTrackApplication} className="space-y-3">
                <p className="text-xs text-zinc-500 leading-relaxed text-left font-medium">
                  Enter the email address you used during your Candidate Careers submission to track alignment stages and chat in real-time with HR.
                </p>
                <div className="flex gap-2">
                  <input 
                    type="email" 
                    id="track-email-input"
                    required
                    placeholder="alan@turing.com"
                    className="flex-1 text-xs px-3.5 py-2.5 rounded-none border border-zinc-200 bg-white outline-none focus:border-black font-bold"
                    value={trackEmail}
                    onChange={(e) => setTrackEmail(e.target.value)}
                  />
                  <button
                    type="submit"
                    id="btn-track"
                    className="px-4 py-2.5 bg-black hover:bg-zinc-950 text-white text-xs font-black uppercase tracking-wider rounded-none cursor-pointer transition-colors"
                  >
                    Track Status
                  </button>
                </div>
              </form>

              {trackedProspect && (
                <div className="p-4 rounded-none border-2 border-zinc-900 bg-zinc-50/50 space-y-4 text-left">
                  <div className="flex items-center justify-between border-b border-zinc-200 pb-2">
                    <div>
                      <h3 className="font-sans font-black text-sm text-zinc-900 leading-none">{trackedProspect.name}</h3>
                      <p className="text-xs text-zinc-500 mt-1 font-semibold">{trackedProspect.roleApplied}</p>
                    </div>
                    <span className={`px-2.5 py-0.5 rounded-none text-[9px] font-black tracking-widest uppercase border-2 ${
                      trackedProspect.stage === "Prospect" ? "bg-purple-50 text-purple-700 border-purple-300" :
                      trackedProspect.stage === "Contacted" ? "bg-blue-50 text-blue-700 border-blue-300" :
                      trackedProspect.stage === "Interviewing" ? "bg-orange-50 text-orange-700 border-orange-300" :
                      trackedProspect.stage === "Offered" ? "bg-emerald-50 text-emerald-700 border-emerald-300" :
                      "bg-red-50 text-red-750 border-red-300"
                    }`}>
                      {trackedProspect.stage}
                    </span>
                  </div>

                  {/* Chat logs */}
                  <div className="space-y-3">
                    <h4 className="text-[9px] font-black text-zinc-400 uppercase tracking-widest flex items-center gap-1">
                      <MessageSquare className="h-3 w-3" /> Communication Log with HR
                    </h4>
                    
                    <div className="max-h-48 overflow-y-auto space-y-2.5 p-2.5 bg-white rounded-none border border-zinc-200 text-xs">
                      {trackedChats.length === 0 ? (
                        <p className="text-zinc-400 italic text-center py-4">No chat communication logged yet. HR has been notified.</p>
                      ) : (
                        trackedChats.map((c) => (
                          <div key={c.id} className={`p-2.5 rounded-none border-l-2 text-left ${c.senderRole === "candidate" ? "bg-zinc-100 border-zinc-900 ml-6" : "bg-orange-50/40 border-orange-500 mr-6"}`}>
                            <div className="flex justify-between items-center text-[9px] text-zinc-400 mb-0.5">
                              <span className="font-black uppercase">{c.senderName} ({c.senderRole})</span>
                              <span className="font-mono">{new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                            <p className="text-zinc-800 leading-relaxed text-xs">{c.message}</p>
                          </div>
                        ))
                      )}
                    </div>

                    <form onSubmit={handleSendChat} className="flex gap-1.5 pt-1">
                      <input
                        type="text"
                        placeholder="Write message to HR..."
                        value={newChatMessage}
                        onChange={(e) => setNewChatMessage(e.target.value)}
                        className="flex-1 text-xs px-2.5 py-1.5 rounded-none border border-zinc-200 outline-none focus:border-black"
                      />
                      <button
                        type="submit"
                        className="px-3 py-1.5 bg-neutral-900 hover:bg-black text-white text-xs font-black uppercase tracking-wider rounded-none cursor-pointer"
                      >
                        Reply
                      </button>
                    </form>
                  </div>
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
