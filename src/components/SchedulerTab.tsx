/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { User, ScheduleEvent, ScheduleType, ScheduleAlert } from "../types";
import { 
  Calendar, 
  Plus, 
  MapPin, 
  Clock, 
  Users, 
  Check, 
  AlertCircle, 
  PartyPopper, 
  Briefcase, 
  Sparkles, 
  Compass,
  CheckCircle2
} from "lucide-react";

interface SchedulerTabProps {
  user: User;
  onAlertChange: () => void; // call to refresh alerts on header
}

export default function SchedulerTab({ user, onAlertChange }: SchedulerTabProps) {
  const [events, setEvents] = useState<ScheduleEvent[]>([]);
  const [alerts, setAlerts] = useState<ScheduleAlert[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Create form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("2026-06-14");
  const [time, setTime] = useState("14:00");
  const [type, setType] = useState<ScheduleType>("Gathering");
  const [targetAudience, setTargetAudience] = useState<"All" | "Specific Employees">("All");
  const [inviteEmails, setInviteEmails] = useState(""); // Comma split e.g. john@example.com, alan@prospect.com
  const [showCreateForm, setShowCreateForm] = useState(false);

  const isPrivileged = user.role === "CEO" || user.role === "HR" || user.role === "Director";

  const fetchData = async () => {
    try {
      setLoading(true);
      // Fetch events
      const resEv = await fetch("/api/schedules", {
        headers: { "x-user-email": user.email },
      });
      if (resEv.ok) {
        const eventsData = await resEv.json();
        // Sort events chronologically by date
        eventsData.sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());
        setEvents(eventsData);
      }

      // Fetch alerts
      const resAl = await fetch("/api/alerts", {
        headers: { "x-user-email": user.email },
      });
      if (resAl.ok) {
        const alertsData = await resAl.json();
        setAlerts(alertsData);
      }
    } catch (err) {
      console.error("Scheduler loading issue", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user.email]);

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description || !date || !time) return;
    setErrorMsg("");
    setSuccessMsg("");
    setLoading(true);

    const personnelList = inviteEmails
      ? inviteEmails.split(",").map((email) => email.trim().toLowerCase()).filter(Boolean)
      : [];

    try {
      const res = await fetch("/api/schedules", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-email": user.email,
        },
        body: JSON.stringify({
          title,
          description,
          date,
          time,
          type,
          targetAudience,
          specificPersonnel: personnelList,
        }),
      });
      if (res.ok) {
        setSuccessMsg(`Outstanding! New ${type} event scheduled successfully. Notifications auto-broadcasted to audience pools!`);
        setTitle("");
        setDescription("");
        setInviteEmails("");
        setShowCreateForm(false);
        fetchData();
        onAlertChange(); // refresh notification indicators
      } else {
        const data = await res.json();
        throw new Error(data.error || "Event scheduling failed");
      }
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAcknowledgeAlert = async (alertId: string) => {
    try {
      const res = await fetch(`/api/alerts/${alertId}/acknowledge`, {
        method: "POST",
        headers: { "x-user-email": user.email },
      });
      if (res.ok) {
        setAlerts((prev) =>
          prev.map((al) => (al.id === alertId ? { ...al, status: "acknowledged" } : al))
        );
        onAlertChange(); // refresh notification indicators
      }
    } catch (err) {
      console.error(err);
    }
  };

  const getTypeIcon = (type: ScheduleType) => {
    switch (type) {
      case "Festival":
        return <Sparkles className="h-4 w-4 text-amber-500" />;
      case "Gathering":
        return <PartyPopper className="h-4 w-4 text-emerald-500" />;
      case "Meeting":
        return <Briefcase className="h-4 w-4 text-blue-500" />;
      default:
        return <Compass className="h-4 w-4 text-purple-500" />;
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-5 rounded-none border border-zinc-200 gap-4 text-left">
        <div>
          <h2 className="font-sans font-black text-base text-zinc-950 flex items-center gap-2 uppercase tracking-tight">
            <Calendar className="h-5 w-5 text-black" /> Active Company Schedule Planning
          </h2>
          <p className="text-xs text-zinc-400 font-semibold mt-1">Governance of corporate gatherings, board meetings, and casual team-building festivals.</p>
        </div>

        {isPrivileged && (
          <button
            type="button"
            id="btn-trigger-schedule-form"
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="p-2.5 px-4 bg-black hover:bg-zinc-900 text-white rounded-none text-xs font-black uppercase tracking-widest inline-flex items-center gap-1 cursor-pointer transition-all shrink-0"
          >
            <Plus className="h-3.5 w-3.5" /> Schedule Event
          </button>
        )}
      </div>

      {successMsg && (
        <div className="p-4 bg-orange-50 border-l-2 border-orange-500 text-orange-950 text-xs rounded-none font-bold text-left animate-fade-in">
          {successMsg}
        </div>
      )}

      {errorMsg && (
        <div className="p-4 bg-red-50 border-l-2 border-red-500 text-red-900 text-xs rounded-none font-bold text-left animate-fade-in">
          {errorMsg}
        </div>
      )}

      {/* Conditional Create Event Form */}
      {showCreateForm && isPrivileged && (
        <form onSubmit={handleCreateEvent} className="bg-white rounded-none border-2 border-black p-5 space-y-4 text-left">
          <span className="text-[11px] font-black uppercase tracking-[0.2em] text-red-650 block border-b border-zinc-150 pb-2">Plan New Event (Admin Panel)</span>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.18em] block">Event / Meeting Title</label>
              <input 
                type="text" 
                id="sch-title"
                required
                placeholder="e.g. CEO Townhall Meeting / Sunday Barbecue"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full text-xs px-3.5 py-2.5 rounded-none border border-zinc-200 bg-white outline-none focus:border-black font-semibold"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.18em] block">Schedule Type</label>
              <select 
                id="sch-type"
                value={type}
                onChange={(e) => setType(e.target.value as ScheduleType)}
                className="w-full text-xs px-3.5 py-2.5 rounded-none border border-zinc-200 bg-white outline-none focus:border-black font-bold"
              >
                <option value="Event">Event</option>
                <option value="Meeting">Meeting</option>
                <option value="Festival">Festival</option>
                <option value="Gathering">Gathering</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.18em] block">Target Date</label>
              <input 
                type="date" 
                id="sch-date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full text-xs px-3.5 py-2.5 rounded-none border border-zinc-200 outline-none focus:border-black font-semibold"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.18em] block">Hour Time</label>
              <input 
                type="time" 
                id="sch-time"
                required
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full text-xs px-3.5 py-2.5 rounded-none border border-zinc-200 outline-none focus:border-black font-semibold"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.18em] block">Target Audience Pool</label>
            <select
              id="sch-audience"
              value={targetAudience}
              onChange={(e) => setTargetAudience(e.target.value as any)}
              className="w-full text-xs px-3.5 py-2.5 rounded-none border border-zinc-200 bg-white outline-none focus:border-black font-bold"
            >
              <option value="All">All Approved Employees (Auto-broadcast alert notification)</option>
              <option value="Specific Employees">Specific Employees List (Comma separated emails)</option>
            </select>
          </div>

          {targetAudience === "Specific Employees" && (
            <div className="space-y-1">
              <label className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.18em] block">Individual Invited Emails (Comma split)</label>
              <input 
                type="text" 
                id="sch-emails"
                placeholder="john@example.com, alice@example.com"
                value={inviteEmails}
                onChange={(e) => setInviteEmails(e.target.value)}
                className="w-full text-xs px-3.5 py-2.5 rounded-none border border-zinc-200 bg-white outline-none focus:border-black font-semibold"
              />
            </div>
          )}

          <div className="space-y-1">
            <label className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.18em] block">Event Agenda / Personnel Required & Logistics</label>
            <textarea 
              id="sch-description"
              required
              rows={3}
              placeholder="Detail required personnel and items to bring..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full text-xs px-3.5 py-2.5 rounded-none border border-zinc-200 bg-white outline-none focus:border-black resize-none font-semibold"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowCreateForm(false)}
              className="px-4 py-2 border border-zinc-250 bg-white hover:bg-zinc-50 text-zinc-700 text-xs font-black uppercase tracking-widest rounded-none cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              id="btn-schedule-submit"
              className="px-5 py-2 bg-black hover:bg-zinc-900 text-white text-xs font-black uppercase tracking-widest rounded-none cursor-pointer"
            >
              Broadcast Schedule
            </button>
          </div>
        </form>
      )}

      {/* Active Calendars List */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        
        {/* Alerts status log (4 cols) */}
        <div className="md:col-span-4 bg-white rounded-none border border-zinc-200 p-5 space-y-4">
          <div className="text-left border-b border-zinc-150 pb-3">
            <h3 className="font-sans font-black text-[11px] uppercase tracking-[0.16em] text-zinc-900">Your Action List</h3>
            <p className="text-[10px] text-zinc-400 font-semibold mt-0.5 animate-pulse">Incoming schedules requiring acknowledgement</p>
          </div>

          <div className="space-y-3.5 max-h-[400px] overflow-y-auto pr-1">
            {alerts.length === 0 ? (
              <p className="text-center py-6 text-zinc-400 italic text-[11px] font-semibold">No scheduler notification alerts issued to you.</p>
            ) : (
              alerts.map((al) => (
                <div 
                  key={al.id} 
                  className={`p-3.5 rounded-none border-l-2 text-left text-xs ${
                    al.status === "unread" 
                    ? "bg-orange-50/40 border-orange-500 border-t border-r border-b border-zinc-150 font-bold" 
                    : "bg-zinc-50/75 border-zinc-400 border-t border-r border-b border-zinc-150 opacity-65 font-medium"
                  }`}
                >
                  <div className="flex justify-between items-start mb-1.5 gap-2">
                    <span className="font-black text-zinc-900 flex items-center gap-1 truncate pr-2 uppercase text-[11px] tracking-tight">
                      {getTypeIcon(al.type)} {al.title}
                    </span>
                    <span className="font-mono text-[9px] text-zinc-400 shrink-0 font-bold bg-zinc-100 px-1 py-0.2 border border-zinc-200">{al.date}</span>
                  </div>
                  <p className="text-zinc-650 text-[11px] leading-relaxed mb-3 font-medium">{al.text}</p>
                  
                  {al.status === "unread" ? (
                    <button
                      type="button"
                      onClick={() => handleAcknowledgeAlert(al.id)}
                      className="p-1.5 px-3 bg-black hover:bg-zinc-900 text-white rounded-none text-[9px] font-black uppercase tracking-widest inline-flex items-center gap-1 cursor-pointer transition-all"
                    >
                      <Check className="h-3 w-3" /> Acknowledge Invitation
                    </button>
                  ) : (
                    <span className="text-[10px] text-emerald-900 font-black flex items-center gap-0.5 uppercase tracking-wider">
                      <CheckCircle2 className="h-3 w-3 text-emerald-600" /> Confirmed
                    </span>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Calendar timeline feed (8 cols) */}
        <div className="md:col-span-8 bg-white rounded-none border border-zinc-200 p-5 space-y-4">
          <div className="text-left border-b border-zinc-150 pb-3">
            <h3 className="font-sans font-black text-[11px] uppercase tracking-[0.16em] text-zinc-900">Chronological Timelines</h3>
            <p className="text-[10px] text-zinc-400 font-semibold mt-0.5">Upcoming company agenda, workshops & gatherings mapping</p>
          </div>

          {events.length === 0 ? (
            <p className="text-center py-12 text-zinc-400 italic text-xs font-semibold">No active events listed in the company matrix.</p>
          ) : (
            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-1">
              {events.map((ev) => {
                const correspondingAlert = alerts.find(a => a.scheduleId === ev.id);
                const isAcknowledged = correspondingAlert?.status === "acknowledged";

                return (
                  <div key={ev.id} className="p-4 rounded-none border border-zinc-200 text-left bg-white transition-all hover:bg-zinc-50/50 flex flex-col sm:flex-row items-stretch sm:items-start gap-4">
                    <div className="p-3 bg-black text-white rounded-none font-mono text-center min-w-[64px] shrink-0 border border-black flex sm:flex-col justify-center gap-1 sm:gap-2">
                      <span className="block text-[10px] font-black tracking-widest leading-none text-zinc-400">{new Date(ev.date).toLocaleString('default', { month: 'short' }).toUpperCase()}</span>
                      <span className="block text-2xl font-black leading-none text-white">{new Date(ev.date).getDate()}</span>
                    </div>

                    <div className="flex-1 space-y-2">
                      <div className="flex items-center justify-between gap-2 flex-wrap pb-1.5 border-b border-zinc-100">
                        <div className="flex items-center gap-2">
                          <span className="p-1 bg-zinc-100 border border-zinc-200 rounded-none">
                            {getTypeIcon(ev.type)}
                          </span>
                          <h4 className="font-black text-xs text-zinc-900 uppercase tracking-tight">{ev.title}</h4>
                        </div>

                        <div className="flex items-center gap-1.5 text-[9px] font-mono text-zinc-400 font-bold uppercase">
                          <span className="flex items-center gap-0.5"><Clock className="h-3 w-3" /> {ev.time}</span>
                          <span>•</span>
                          <span className="bg-zinc-100 border border-zinc-200 text-zinc-700 px-1.5 py-0.2 rounded-none">Type: {ev.type}</span>
                        </div>
                      </div>

                      <p className="text-xs text-zinc-650 leading-relaxed font-semibold">{ev.description}</p>

                      <div className="flex items-center justify-between border-t border-zinc-100 pt-2 flex-wrap gap-2 text-[10px]">
                        <span className="text-zinc-400 font-bold">
                          Target Pool: <strong className="text-zinc-700 font-extrabold uppercase">{ev.targetAudience}</strong> 
                          {ev.specificPersonnel.length > 0 && ` (${ev.specificPersonnel.join(", ")})`}
                        </span>

                        {correspondingAlert && (
                          <div className="shrink-0">
                            {isAcknowledged ? (
                              <span className="text-[9px] font-black uppercase tracking-wider text-emerald-900 bg-emerald-50 border-2 border-emerald-300 px-2 py-0.5 rounded-none flex items-center gap-0.5">
                                <CheckCircle2 className="h-3 w-3 text-emerald-600" /> Confirmed ✓
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleAcknowledgeAlert(correspondingAlert.id)}
                                className="px-2.5 py-1 bg-black hover:bg-zinc-900 text-white text-[9px] font-black uppercase tracking-widest rounded-none cursor-pointer transition-all border border-black"
                              >
                                Accept Agenda
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
