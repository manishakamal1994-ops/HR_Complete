/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { User } from "./types";
import LoginScreen from "./components/LoginScreen";
import Header from "./components/Header";
import RecruitingTab from "./components/RecruitingTab";
import GrievanceTab from "./components/GrievanceTab";
import SchedulerTab from "./components/SchedulerTab";
import AdminPanelTab from "./components/AdminPanelTab";
import { Briefcase, FileWarning, Calendar, Crown, RefreshCw } from "lucide-react";

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<"recruiting" | "grievances" | "scheduler" | "admin">("recruiting");
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Load user from session state on mount
  useEffect(() => {
    const saved = localStorage.getItem("hr_user_session");
    if (saved) {
      try {
        setCurrentUser(JSON.parse(saved));
      } catch (e) {
        localStorage.removeItem("hr_user_session");
      }
    }
  }, []);

  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    localStorage.setItem("hr_user_session", JSON.stringify(user));
    // Default to recruiting pipe
    setActiveTab("recruiting");
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem("hr_user_session");
  };

  const triggerAlertRefresh = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  if (!currentUser) {
    return (
      <LoginScreen 
        onLoginSuccess={handleLoginSuccess} 
        apiHeaders={{ "x-user-email": "", "x-user-name": "" }} 
      />
    );
  }

  const isPrivileged = currentUser.role === "CEO" || currentUser.role === "HR" || currentUser.role === "Director";

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col font-sans selection:bg-orange-100 selection:text-orange-950">
      
      {/* Header */}
      <Header 
        user={currentUser} 
        onLogout={handleLogout} 
        refreshTrigger={refreshTrigger} 
      />

      {/* Main Core Workspaces */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
        
        {/* Navigation Tabs Bar */}
        <div className="flex border-b border-zinc-200/80 mb-7 text-xs font-black uppercase tracking-wider text-zinc-500 items-center justify-between flex-wrap gap-2">
          
          <div className="flex bg-zinc-100/80 p-1 rounded-sm border border-zinc-200 shadow-none flex-wrap">
            <button
              type="button"
              id="nav-recruiting"
              onClick={() => setActiveTab("recruiting")}
              className={`flex items-center gap-1.5 py-2 px-4 rounded-sm transition-all cursor-pointer font-black text-[11px] uppercase tracking-wider ${
                activeTab === "recruiting"
                  ? "bg-zinc-900 text-white font-extrabold"
                  : "text-zinc-500 hover:text-zinc-950"
              }`}
            >
              <Briefcase className="h-3.5 w-3.5" /> Recruiting
            </button>

            <button
              type="button"
              id="nav-grievances"
              onClick={() => setActiveTab("grievances")}
              className={`flex items-center gap-1.5 py-2 px-4 rounded-sm transition-all cursor-pointer font-black text-[11px] uppercase tracking-wider ${
                activeTab === "grievances"
                  ? "bg-zinc-900 text-white font-extrabold"
                  : "text-zinc-500 hover:text-zinc-950"
              }`}
            >
              <FileWarning className="h-3.5 w-3.5" /> Grievance Tickets
            </button>

            <button
              type="button"
              id="nav-scheduler"
              onClick={() => setActiveTab("scheduler")}
              className={`flex items-center gap-1.5 py-2 px-4 rounded-sm transition-all cursor-pointer font-black text-[11px] uppercase tracking-wider ${
                activeTab === "scheduler"
                  ? "bg-zinc-900 text-white font-extrabold"
                  : "text-zinc-500 hover:text-zinc-950"
              }`}
            >
              <Calendar className="h-3.5 w-3.5" /> Company Scheduler
            </button>

            {isPrivileged && (
              <button
                type="button"
                id="nav-admin"
                onClick={() => setActiveTab("admin")}
                className={`flex items-center gap-1.5 py-2 px-4 rounded-sm transition-all cursor-pointer font-black text-[11px] uppercase tracking-wider ${
                  activeTab === "admin"
                    ? "bg-zinc-900 text-white font-extrabold"
                    : "text-zinc-500 hover:text-zinc-950"
                }`}
              >
                <Crown className="h-3.5 w-3.5" /> Admin Cockpit
              </button>
            )}
          </div>

          <div className="flex items-center gap-1.5 bg-zinc-200/60 p-1 rounded-sm border border-zinc-200">
            <button
              onClick={triggerAlertRefresh}
              className="p-1 hover:bg-white rounded-sm transition-all text-zinc-500 hover:text-zinc-900 cursor-pointer"
              title="Synchronize Database Feed"
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </button>
          </div>

        </div>

        {/* Tab Panel Viewports */}
        <div className="pb-12">
          {activeTab === "recruiting" && <RecruitingTab user={currentUser} />}
          {activeTab === "grievances" && <GrievanceTab user={currentUser} />}
          {activeTab === "scheduler" && <SchedulerTab user={currentUser} onAlertChange={triggerAlertRefresh} />}
          {activeTab === "admin" && isPrivileged && (
            <AdminPanelTab currentUser={currentUser} onPersonnelModified={triggerAlertRefresh} />
          )}
        </div>

      </main>
    </div>
  );
}
