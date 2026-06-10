/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type UserRole = "HR" | "Director" | "CEO" | "Employee";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: "pending" | "approved";
  createdAt: string;
}

export type CandidateStage = "Prospect" | "Contacted" | "Interviewing" | "Offered" | "Rejected";

export interface Prospect {
  id: string;
  name: string;
  email: string;
  phone: string;
  roleApplied: string;
  cvSummary: string;
  stage: CandidateStage;
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  prospectId: string;
  senderName: string;
  senderEmail: string;
  senderRole: "candidate" | UserRole;
  message: string;
  createdAt: string;
}

export type GrievanceCategory = "Harassment (Sexual/Physical/Mental)" | "Recruitment Related" | "Work Environment" | "Compensation & Benefits" | "Other Issues";
export type GrievanceStatus = "Open" | "Under Review" | "Escalated" | "Closed";
export type GrievanceLevel = "Low" | "Medium" | "High" | "Escalated";

export interface GrievanceReply {
  id: string;
  senderName: string;
  senderEmail: string;
  senderRole: "candidate" | UserRole | "prospect";
  message: string;
  createdAt: string;
}

export interface Grievance {
  id: string;
  ticketNo: string;
  title: string;
  description: string;
  category: GrievanceCategory;
  level: GrievanceLevel;
  status: GrievanceStatus;
  submittedByEmail: string;
  submittedByName: string;
  replies: GrievanceReply[];
  createdAt: string;
}

export type ScheduleType = "Event" | "Meeting" | "Festival" | "Gathering";

export interface ScheduleEvent {
  id: string;
  title: string;
  description: string;
  date: string; // ISO or YYYY-MM-DD
  time: string;
  type: ScheduleType;
  targetAudience: "All" | "Specific Employees";
  specificPersonnel: string[]; // List of emails
  createdByEmail: string;
  createdByName: string;
  createdAt: string;
}

export interface ScheduleAlert {
  id: string;
  scheduleId: string;
  title: string;
  text: string;
  date: string;
  type: ScheduleType;
  forUserEmail: string;
  status: "unread" | "acknowledged";
  createdAt: string;
}
