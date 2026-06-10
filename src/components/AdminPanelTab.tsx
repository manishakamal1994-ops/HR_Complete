/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { User, UserRole } from "../types";
import { 
  Users, 
  UserPlus, 
  CheckCircle, 
  Trash2, 
  ShieldAlert, 
  ShieldCheck, 
  CircleDot, 
  Crown, 
  Clock, 
  Save,
  Lock
} from "lucide-react";

interface AdminPanelTabProps {
  currentUser: User;
  onPersonnelModified: () => void;
}

export default function AdminPanelTab({ currentUser, onPersonnelModified }: AdminPanelTabProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Direct addition form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState<UserRole>("Employee");

  const isCEOOrHR = currentUser.role === "CEO" || currentUser.role === "HR";

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/users", {
        headers: { "x-user-email": currentUser.email },
      });
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      } else {
        const data = await res.json();
        throw new Error(data.error || "Roster query rejected by database.");
      }
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [currentUser.email]);

  const handleApproveUser = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/users/${id}/approve`, {
        method: "POST",
        headers: { "x-user-email": currentUser.email },
      });
      if (res.ok) {
        setSuccessMsg("Registration authorized cleanly! Account is now approved.");
        setTimeout(() => setSuccessMsg(""), 3000);
        fetchUsers();
        onPersonnelModified();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateRole = async (id: string, role: UserRole) => {
    try {
      const res = await fetch(`/api/admin/users/${id}/role`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-email": currentUser.email,
        },
        body: JSON.stringify({ role }),
      });
      if (res.ok) {
        setSuccessMsg("Personnel security role updated successfully!");
        setTimeout(() => setSuccessMsg(""), 3000);
        fetchUsers();
        onPersonnelModified();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteUser = async (id: string, email: string) => {
    if (email.toLowerCase() === currentUser.email.toLowerCase()) {
      setErrorMsg("Deauthorization Error: You cannot remove your own active credentials.");
      return;
    }
    if (!window.confirm(`Are you positive you wish to remove the personnel record for "${email}" instantly?`)) return;

    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: "DELETE",
        headers: { "x-user-email": currentUser.email },
      });
      if (res.ok) {
        setSuccessMsg("Personnel record purged from corporate directory.");
        setTimeout(() => setSuccessMsg(""), 3000);
        fetchUsers();
        onPersonnelModified();
      } else {
        const data = await res.json();
        setErrorMsg(data.error || "Removal failed");
      }
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  const handleCreatePersonnel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newEmail || !newPassword) return;
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const res = await fetch("/api/admin/users/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-email": currentUser.email,
        },
        body: JSON.stringify({ name: newName, email: newEmail, password: newPassword, role: newRole }),
      });
      if (res.ok) {
        setSuccessMsg(`Instantly added ${newName} to directory with ${newRole} access keys!`);
        setNewName("");
        setNewEmail("");
        setNewPassword("");
        setNewRole("Employee");
        setShowAddForm(false);
        fetchUsers();
        onPersonnelModified();
      } else {
        const data = await res.json();
        throw new Error(data.error || "Creation rejected");
      }
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  // Splitting approved vs pending accounts
  const pendingUsers = users.filter((u) => u.status === "pending");
  const approvedUsers = users.filter((u) => u.status === "approved");

  return (
    <div className="space-y-6">
      
      {/* Overview Ribbon */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-none border border-zinc-200 text-left">
        <div>
          <h2 className="font-sans font-black text-base text-zinc-950 flex items-center gap-1.5 uppercase tracking-tight">
            <Crown className="h-5 w-5 text-black" /> Administrative Personnel Dashboard
          </h2>
          <p className="text-xs text-zinc-400 font-semibold mt-1">Add, delete, approve registered candidates, and modify authorization records in real-time.</p>
        </div>

        <button
          type="button"
          id="btn-admin-add-toggle"
          onClick={() => setShowAddForm(!showAddForm)}
          className="p-2.5 px-4 bg-black hover:bg-zinc-900 text-white rounded-none text-xs font-black uppercase tracking-widest inline-flex items-center gap-1.5 cursor-pointer transition-all shrink-0"
        >
          <UserPlus className="h-4 w-4" /> Add Personnel
        </button>
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

      {/* Conditional Add Personnel Form */}
      {showAddForm && (
        <form onSubmit={handleCreatePersonnel} className="p-5 bg-white rounded-none border-2 border-black text-left space-y-4">
          <span className="text-[11px] font-black uppercase tracking-[0.2em] text-red-650 block border-b border-zinc-150 pb-2">Add Authorized Personnel Profile</span>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.18em] block">Full Name</label>
              <input 
                type="text" 
                id="add-username"
                required
                placeholder="Jane Smith"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="w-full text-xs px-3.5 py-2.5 rounded-none border border-zinc-200 bg-white outline-none focus:border-black font-semibold"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.18em] block">Company Email Address</label>
              <input 
                type="email" 
                id="add-email"
                required
                placeholder="jane@company.com"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                className="w-full text-xs px-3.5 py-2.5 rounded-none border border-zinc-200 bg-white outline-none focus:border-black font-semibold"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.18em] block">Authorized Password</label>
              <input 
                type="password" 
                id="add-password"
                required
                placeholder="SecurePass123!"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full text-xs px-3.5 py-2.5 rounded-none border border-zinc-200 bg-white outline-none focus:border-black font-semibold"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.18em] block">Company Access Role</label>
              <select
                id="add-role-select"
                value={newRole}
                onChange={(e) => setNewRole(e.target.value as UserRole)}
                className="w-full text-xs px-3.5 py-2.5 border border-zinc-200 bg-white rounded-none outline-none focus:border-black font-bold"
              >
                <option value="Employee">Employee (Read-Only access)</option>
                <option value="HR">HR Manager (High privilege access)</option>
                <option value="Director">Director (High privilege access)</option>
                <option value="CEO">CEO (Ultimate owner access)</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-zinc-150">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 border border-zinc-250 bg-white hover:bg-zinc-50 text-zinc-700 text-xs font-black uppercase tracking-widest rounded-none cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              id="btn-admin-add-submit"
              className="px-5 py-2 bg-black hover:bg-zinc-900 text-white text-xs font-black uppercase tracking-widest rounded-none cursor-pointer"
            >
              Insert Authorized Profile
            </button>
          </div>
        </form>
      )}

      {/* Grid: Pending Approvals & Employee Roster */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Approvals Pending Queue (4 Cols) */}
        <div className="lg:col-span-4 bg-white rounded-none border border-zinc-200 p-4 space-y-3 flex flex-col">
          <div className="text-left border-b border-zinc-150 pb-3 flex justify-between items-center flex-wrap gap-2">
            <div>
              <h3 className="font-sans font-black text-[11px] uppercase tracking-[0.16em] text-zinc-900">Awaiting Authentication</h3>
              <p className="text-[10px] text-zinc-400 font-semibold mt-0.5">Registrations requiring approval</p>
            </div>
            <span className="font-mono text-[9px] bg-red-50 text-red-900 border-2 border-red-300 px-2 py-0.5 rounded-none font-black uppercase tracking-wider">
              {pendingUsers.length} Pending
            </span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 max-h-[450px]">
            {pendingUsers.length === 0 ? (
              <div className="text-center py-12 text-zinc-400 italic text-[11px] font-semibold">
                No pending registration requests. All registered users authenticated.
              </div>
            ) : (
              pendingUsers.map((u) => (
                <div key={u.id} className="p-3.5 rounded-none bg-orange-50/40 border border-zinc-200 border-l-2 border-l-orange-500 text-left space-y-3 font-semibold">
                  <div>
                    <h4 className="font-black text-xs text-zinc-900 leading-none uppercase tracking-tight">{u.name}</h4>
                    <p className="text-[10px] text-zinc-500 font-mono mt-1.5">{u.email}</p>
                    <div className="flex items-center gap-1.5 mt-2.5">
                      <span className="text-[9px] font-black text-zinc-400 uppercase tracking-wider">Requested Access:</span>
                      <span className="px-2 py-0.2 rounded-none border border-blue-400 text-[9px] font-black uppercase bg-blue-50 text-blue-900">
                        {u.role}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2 border-t border-zinc-150 pt-2.5">
                    <button
                      type="button"
                      onClick={() => handleApproveUser(u.id)}
                      className="flex-1 py-1.5 px-3 bg-black hover:bg-zinc-950 text-white text-[10px] font-black uppercase tracking-widest rounded-none cursor-pointer inline-flex items-center justify-center gap-1 transition-all"
                    >
                      <ShieldCheck className="h-3 w-3 text-white" /> Approve
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteUser(u.id, u.email)}
                      className="p-1 px-2.5 text-zinc-400 hover:text-black hover:border-black transition-all bg-white border border-zinc-200 rounded-none cursor-pointer"
                      title="Decline Account"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Active directory Roster (8 Cols) */}
        <div className="lg:col-span-8 bg-white rounded-none border border-zinc-200 p-5 space-y-4">
          <div className="text-left border-b border-zinc-150 pb-3">
            <h3 className="font-sans font-black text-[11px] uppercase tracking-[0.16em] text-zinc-900">Active Directory Roster</h3>
            <p className="text-[10px] text-zinc-400 font-semibold mt-0.5">Overview of certified personnel, modify security categories, or eject individuals</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left text-zinc-500 border-collapse">
              <thead className="text-[9px] text-zinc-400 uppercase tracking-[0.18em] bg-zinc-50/50 border-b border-zinc-250">
                <tr>
                  <th scope="col" className="px-4 py-3.5 font-black">Name & Email</th>
                  <th scope="col" className="px-4 py-3.5 font-black">Active Role (Categorisation)</th>
                  <th scope="col" className="px-4 py-3.5 font-black">Security Status</th>
                  <th scope="col" className="px-4 py-3.5 font-black text-center">Roster Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-150">
                {approvedUsers.map((u) => {
                  const isCurrent = u.email.toLowerCase() === currentUser.email.toLowerCase();

                  return (
                    <tr key={u.id} className="hover:bg-zinc-50/50 transition-colors">
                      
                      {/* Name Col */}
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2.5 text-left">
                          <CircleDot className={`h-3 w-3 shrink-0 ${isCurrent ? "text-orange-550 animate-pulse" : "text-zinc-350"}`} />
                          <div>
                            <span className="font-black text-zinc-900 flex items-center gap-1 uppercase text-xs tracking-tight">
                              {u.name} {isCurrent && <span className="text-[9px] font-mono text-orange-600 tracking-normal italic font-semibold">(Me)</span>}
                            </span>
                            <span className="block text-[10px] text-zinc-400 font-mono mt-0.5">{u.email}</span>
                          </div>
                        </div>
                      </td>

                      {/* Role selection dropdown */}
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-1.5 text-left">
                          <select
                            disabled={!isCEOOrHR || isCurrent}
                            value={u.role}
                            onChange={(e) => handleUpdateRole(u.id, e.target.value as UserRole)}
                            className="bg-white border-2 border-zinc-200 rounded-none px-2 py-1 text-xs text-zinc-900 focus:border-black font-extrabold outline-none disabled:bg-zinc-100 disabled:text-zinc-450 cursor-pointer"
                          >
                            <option value="Employee">Employee</option>
                            <option value="HR">HR</option>
                            <option value="Director">Director</option>
                            <option value="CEO">CEO</option>
                          </select>
                        </div>
                      </td>

                      {/* Status badge */}
                      <td className="px-4 py-4">
                        <span className="bg-emerald-50 text-emerald-900 border-2 border-emerald-300 text-[8px] font-black tracking-widest uppercase px-2.5 py-0.5 rounded-none inline-flex items-center gap-1">
                          Approved Authorized
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-4 text-center">
                        <button
                          type="button"
                          disabled={isCurrent}
                          onClick={() => handleDeleteUser(u.id, u.email)}
                          className="p-1 px-2.5 bg-white border border-zinc-200 hover:border-black hover:text-black rounded-none transition-all text-xs disabled:opacity-20 disabled:cursor-not-allowed cursor-pointer text-zinc-400"
                          title={isCurrent ? "Cannot delete self" : "Revoke Access"}
                        >
                          <Trash2 className="h-4 w-4 inline" />
                        </button>
                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
