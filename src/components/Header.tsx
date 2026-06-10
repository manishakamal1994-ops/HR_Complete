/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { User, ScheduleAlert } from "../types";
import { Bell, LogOut, Shield, UserCircle, RefreshCw, Check } from "lucide-react";

interface HeaderProps {
  user: User;
  onLogout: () => void;
  refreshTrigger: number;
}

export default function Header({ user, onLogout, refreshTrigger }: HeaderProps) {
  const [alerts, setAlerts] = useState<ScheduleAlert[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/alerts", {
        headers: { "x-user-email": user.email },
      });
      if (res.ok) {
        const data = await res.json();
        setAlerts(data);
      }
    } catch (err) {
      console.error("Alerts fetching issue", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, [user.email, refreshTrigger]);

  const handleAcknowledge = async (alertId: string) => {
    try {
      const res = await fetch(`/api/alerts/${alertId}/acknowledge`, {
        method: "POST",
        headers: { "x-user-email": user.email },
      });
      if (res.ok) {
        // Optimistic refresh
        setAlerts((prev) =>
          prev.map((a) => (a.id === alertId ? { ...a, status: "acknowledged" } : a))
        );
      }
    } catch (err) {
      console.error(err);
    }
  };

  const isPrivileged = user.role === "CEO" || user.role === "HR" || user.role === "Director";
  const unreadAlerts = alerts.filter((a) => a.status === "unread");

  return (
    <header className="bg-white border-b border-zinc-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          
          {/* Logo Brand */}
          <div className="flex items-center gap-3">
            <span className="w-8 h-8 bg-black flex items-center justify-center text-white font-black rounded-sm shrink-0">
              HR
            </span>
            <div className="text-left">
              <h1 className="font-sans font-black text-base text-zinc-900 leading-none uppercase tracking-tight">HR Associate</h1>
              <p className="text-[10px] text-zinc-400 font-extrabold tracking-[0.15em] mt-0.5">Portal Console</p>
            </div>
          </div>

          {/* User actions right */}
          <div className="flex items-center gap-4">
            
            {/* Active alerts notifications */}
            <div className="relative">
              <button
                type="button"
                id="btn-alerts-toggle"
                onClick={() => setShowDropdown(!showDropdown)}
                className={`p-2 rounded-sm border-2 transition-all relative cursor-pointer ${
                  unreadAlerts.length > 0 
                  ? "bg-orange-50 border-orange-500 text-orange-600 hover:bg-orange-100" 
                  : "bg-white border-zinc-200 text-zinc-700 hover:bg-zinc-100"
                }`}
              >
                <Bell className="h-4 w-4" />
                {unreadAlerts.length > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-none bg-orange-500 text-[9px] font-black text-white leading-none">
                    {unreadAlerts.length}
                  </span>
                )}
              </button>

              {/* Dropdown lists of alerts */}
              {showDropdown && (
                <div 
                  id="alerts-dropdown"
                  className="absolute right-0 mt-2 w-80 bg-white border border-zinc-200 rounded-none shadow-md py-1.5 z-40 text-xs overflow-hidden"
                >
                  <div className="flex justify-between items-center px-4 py-2 bg-zinc-50 border-b border-zinc-100">
                    <span className="font-black text-zinc-900 uppercase tracking-wider text-[10px]">Your Scheduler Alerts</span>
                    <button 
                      type="button"
                      onClick={fetchAlerts} 
                      className="text-zinc-500 hover:text-zinc-950"
                      disabled={loading}
                    >
                      <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} />
                    </button>
                  </div>

                  <div className="max-h-72 overflow-y-auto divide-y divide-zinc-100">
                    {alerts.length === 0 ? (
                      <p className="p-4 text-center text-zinc-400 italic">No schedule alerts pending for your role.</p>
                    ) : (
                      alerts.map((a) => (
                        <div key={a.id} className={`p-3 space-y-1 my-0.5 transition-all ${a.status === "unread" ? "bg-orange-50/50 border-l-2 border-orange-500" : "bg-white opacity-70"}`}>
                          <div className="flex justify-between items-start gap-1">
                            <span className="font-bold text-zinc-900 leading-tight">[{a.type}] {a.title}</span>
                            <span className="font-mono text-[9px] text-zinc-400 shrink-0">{a.date}</span>
                          </div>
                          <p className="text-zinc-600 text-[11px] leading-relaxed">{a.text}</p>
                          
                          {a.status === "unread" ? (
                            <button
                              type="button"
                              onClick={() => handleAcknowledge(a.id)}
                              className="mt-1 flex items-center gap-1 text-[10px] font-black uppercase text-orange-600 hover:text-orange-850 cursor-pointer"
                            >
                              <Check className="h-3 w-3" /> Acknowledge Alert
                            </button>
                          ) : (
                            <span className="text-[10px] font-bold text-zinc-400 italic">Acknowledged ✓</span>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Profile widget */}
            <div className="hidden sm:flex items-center gap-3">
              <div className="flex flex-col items-end text-right">
                <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest leading-none mb-1">
                  {user.role} {isPrivileged ? "/ High Privilege" : ""}
                </span>
                <span className="text-xs font-semibold italic text-zinc-600 leading-none">{user.email}</span>
              </div>
              <div className="w-8 h-8 rounded-full bg-zinc-900 border border-zinc-200 text-white flex items-center justify-center text-xs font-black shadow-sm shrink-0">
                {user.name.slice(0, 2).toUpperCase()}
              </div>
            </div>

            {/* Logout button */}
            <button
              type="button"
              id="btn-logout"
              onClick={onLogout}
              className="p-2 sm:px-3 sm:py-2 rounded-sm border border-zinc-200 bg-white hover:bg-zinc-900 hover:text-white text-zinc-700 transition-all cursor-pointer text-xs font-black uppercase tracking-wider flex items-center gap-1.5"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>

          </div>
        </div>
      </div>
    </header>
  );
}
