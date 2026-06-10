/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import { createServer as createViteServer } from "vite";
import { 
  User, 
  UserRole, 
  Prospect, 
  ChatMessage, 
  Grievance, 
  GrievanceReply, 
  ScheduleEvent, 
  ScheduleAlert 
} from "./src/types";

const app = express();
const PORT = 3000;
const DB_DIR = path.join(process.cwd(), "data");
const DB_FILE = path.join(DB_DIR, "db.json");

// Define basic JSON structure
interface DatabaseSchema {
  users: Record<string, User & { passwordHash: string }>;
  prospects: Record<string, Prospect>;
  chats: ChatMessage[];
  grievances: Record<string, Grievance>;
  schedules: Record<string, ScheduleEvent>;
  alerts: ScheduleAlert[];
}

// Ensure the data directory and db file exist
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

// Helper to hash password securely
function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password).digest("hex");
}

// Initial Admin seed password
const DEFAULT_ADMIN_EMAIL = "manishakamal1994@gmail.com";
const DEFAULT_ADMIN_HASH = hashPassword("Admin123!");

// Initialize database with default template if not exists
const initialDb: DatabaseSchema = {
  users: {
    "admin-seeded": {
      id: "admin-seeded",
      name: "Manisha Kamal",
      email: DEFAULT_ADMIN_EMAIL.toLowerCase(),
      role: "CEO",
      status: "approved",
      passwordHash: DEFAULT_ADMIN_HASH,
      createdAt: new Date().toISOString()
    },
    "ee-seeded": {
      id: "ee-seeded",
      name: "John Employee",
      email: "john@example.com",
      role: "Employee",
      status: "approved",
      passwordHash: hashPassword("John123!"),
      createdAt: new Date().toISOString()
    }
  },
  prospects: {
    "cand-1": {
      id: "cand-1",
      name: "Robert Smith",
      email: "robert@prospect.com",
      phone: "+1-555-0199",
      roleApplied: "Lead UI Developer",
      cvSummary: "7+ years UI Designer & React Specialist. Expert in Tailwind CSS, CSS Grid, animations, and typography.",
      stage: "Prospect",
      createdAt: new Date().toISOString()
    },
    "cand-2": {
      id: "cand-2",
      name: "Emily Watson",
      email: "emily@prospect.com",
      phone: "+1-555-0240",
      roleApplied: "VP of Product",
      cvSummary: "Ex-Stripe technical project lead with deep experience building B2B SaaS and mobile enterprise workflow application layers.",
      stage: "Interviewing",
      createdAt: new Date().toISOString()
    }
  },
  chats: [
    {
      id: "chat-1",
      prospectId: "cand-1",
      senderName: "Manisha Kamal",
      senderEmail: DEFAULT_ADMIN_EMAIL.toLowerCase(),
      senderRole: "CEO",
      message: "Welcome to the recruitment pipe, Robert. Your CV summary looks outstanding. Let's arrange a chat.",
      createdAt: new Date().toISOString()
    }
  ],
  grievances: {
    "griv-1": {
      id: "griv-1",
      ticketNo: "GRV-3852",
      title: "Lack of clean desks in layout area",
      description: "Desks in Sector C are dusty. Need general custodial reviews scheduled.",
      category: "Work Environment",
      level: "Medium",
      status: "Open",
      submittedByEmail: "john@example.com",
      submittedByName: "John Employee",
      replies: [
        {
          id: "r-1",
          senderName: "Manisha Kamal",
          senderEmail: DEFAULT_ADMIN_EMAIL.toLowerCase(),
          senderRole: "CEO",
          message: "Acknowledged, John. I have flagged this with our layout supervisor directly.",
          createdAt: new Date().toISOString()
        }
      ],
      createdAt: new Date().toISOString()
    }
  },
  schedules: {
    "sch-1": {
      id: "sch-1",
      title: "Summer Outdoor Barbecue",
      description: "Company-wide social mixer, casual get-together with food, drinks, and team-building activities.",
      date: "2026-06-14",
      time: "14:00",
      type: "Gathering",
      targetAudience: "All",
      specificPersonnel: [],
      createdByEmail: DEFAULT_ADMIN_EMAIL.toLowerCase(),
      createdByName: "Manisha Kamal",
      createdAt: new Date().toISOString()
    }
  },
  alerts: [
    {
      id: "al-1",
      scheduleId: "sch-1",
      title: "Summer Outdoor Barbecue",
      text: "The HR department has scheduled a Gathering: Summer Outdoor Barbecue on Sunday 2026-06-14 at 14:00. Please acknowledge your attendance!",
      date: "2026-06-14",
      type: "Gathering",
      forUserEmail: "john@example.com",
      status: "unread",
      createdAt: new Date().toISOString()
    }
  ]
};

function readDb(): DatabaseSchema {
  try {
    if (!fs.existsSync(DB_FILE)) {
      fs.writeFileSync(DB_FILE, JSON.stringify(initialDb, null, 2), "utf8");
      return initialDb;
    }
    const content = fs.readFileSync(DB_FILE, "utf8");
    return JSON.parse(content) as DatabaseSchema;
  } catch (err) {
    console.error("Error reading database file, returning default schema", err);
    return initialDb;
  }
}

function writeDb(data: DatabaseSchema) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf8");
  } catch (err) {
    console.error("Error writing to database file", err);
  }
}

app.use(express.json());

// --- Authenticaton & Users APIs ---

// Register
app.post("/api/auth/register", (req, res) => {
  const { name, email, password, role } = req.body;
  if (!name || !email || !password || !role) {
    return res.status(400).json({ error: "Missing required registration parameters." });
  }

  const db = readDb();
  const lowerEmail = email.toLowerCase().trim();

  // Check if user already exists
  const existingUser = Object.values(db.users).find(u => u.email === lowerEmail);
  if (existingUser) {
    return res.status(400).json({ error: "User with this email is already registered." });
  }

  // Determine approval state.
  // manishakamal1994@gmail.com is pre-approved and CEO by default
  const isDefaultAdmin = lowerEmail === DEFAULT_ADMIN_EMAIL.toLowerCase();
  const assignedRole: UserRole = isDefaultAdmin ? "CEO" : role;
  const status = isDefaultAdmin ? "approved" : "pending";

  const userId = "user_" + Math.random().toString(36).substring(2, 9);
  const newUser = {
    id: userId,
    name: name.trim(),
    email: lowerEmail,
    role: assignedRole,
    status: status as "pending" | "approved",
    passwordHash: hashPassword(password),
    createdAt: new Date().toISOString()
  };

  db.users[userId] = newUser;
  writeDb(db);

  const { passwordHash, ...userResponse } = newUser;
  res.status(201).json({
    message: isDefaultAdmin 
      ? "Admin account registered and auto-approved!" 
      : "Registration submitted successfully! Awaiting Administrator approval.",
    user: userResponse
  });
});

// Login
app.post("/api/auth/login", (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required." });
  }

  const db = readDb();
  const lowerEmail = email.toLowerCase().trim();
  const hash = hashPassword(password);

  const userRecord = Object.values(db.users).find(u => u.email === lowerEmail);

  if (!userRecord || userRecord.passwordHash !== hash) {
    return res.status(401).json({ error: "Invalid email or password." });
  }

  if (userRecord.status === "pending") {
    return res.status(403).json({ 
      error: "Your registration is still pending approval by an administrator. Please contact HR or the CEO." 
    });
  }

  const { passwordHash, ...userResponse } = userRecord;
  res.json({
    message: "Login successful!",
    user: userResponse
  });
});

// Admin Panel: Get all users (HR/CEO/Director only)
app.get("/api/admin/users", (req, res) => {
  const adminEmail = req.headers["x-user-email"] as string;
  const db = readDb();

  const requester = Object.values(db.users).find(u => u.email === adminEmail?.toLowerCase());
  const isPrivileged = requester && (requester.role === "CEO" || requester.role === "HR" || requester.role === "Director");

  if (!isPrivileged) {
    return res.status(403).json({ error: "Access Denied. Elevated privileges required." });
  }

  const usersList = Object.values(db.users).map(({ passwordHash, ...u }) => u);
  res.json(usersList);
});

// Admin Panel: Create standard personnel directly
app.post("/api/admin/users/create", (req, res) => {
  const adminEmail = req.headers["x-user-email"] as string;
  const db = readDb();

  const requester = Object.values(db.users).find(u => u.email === adminEmail?.toLowerCase());
  const isPrivileged = requester && (requester.role === "CEO" || requester.role === "HR" || requester.role === "Director");

  if (!isPrivileged) {
    return res.status(403).json({ error: "Access Denied." });
  }

  const { name, email, password, role } = req.body;
  if (!name || !email || !password || !role) {
    return res.status(400).json({ error: "Please provide complete parameters." });
  }

  const lowerEmail = email.toLowerCase().trim();
  const existing = Object.values(db.users).find(u => u.email === lowerEmail);
  if (existing) {
    return res.status(400).json({ error: "User already exists with this email." });
  }

  const userId = "user_" + Math.random().toString(36).substring(2, 9);
  const newUser = {
    id: userId,
    name: name.trim(),
    email: lowerEmail,
    role: role as UserRole,
    status: "approved" as const,
    passwordHash: hashPassword(password),
    createdAt: new Date().toISOString()
  };

  db.users[userId] = newUser;
  writeDb(db);

  const { passwordHash, ...response } = newUser;
  res.status(201).json(response);
});

// Admin Panel: Approved a user
app.post("/api/admin/users/:id/approve", (req, res) => {
  const adminEmail = req.headers["x-user-email"] as string;
  const db = readDb();

  const requester = Object.values(db.users).find(u => u.email === adminEmail?.toLowerCase());
  const isPrivileged = requester && (requester.role === "CEO" || requester.role === "HR" || requester.role === "Director");

  if (!isPrivileged) {
    return res.status(403).json({ error: "Access Denied." });
  }

  const { id } = req.params;
  if (db.users[id]) {
    db.users[id].status = "approved";
    writeDb(db);
    return res.json({ message: "User status updated to approved.", user: db.users[id] });
  }

  res.status(404).json({ error: "User not found." });
});

// Admin Panel: Update role / categorisation
app.post("/api/admin/users/:id/role", (req, res) => {
  const adminEmail = req.headers["x-user-email"] as string;
  const db = readDb();

  const requester = Object.values(db.users).find(u => u.email === adminEmail?.toLowerCase());
  const isPrivileged = requester && (requester.role === "CEO" || requester.role === "HR" || requester.role === "Director");

  if (!isPrivileged) {
    return res.status(403).json({ error: "Access Denied." });
  }

  const { id } = req.params;
  const { role } = req.body;

  if (db.users[id]) {
    db.users[id].role = role as UserRole;
    writeDb(db);
    return res.json({ message: "User role modernized successfully.", user: db.users[id] });
  }

  res.status(404).json({ error: "User not found." });
});

// Admin Panel: Delete custom personnel in real-time
app.delete("/api/admin/users/:id", (req, res) => {
  const adminEmail = req.headers["x-user-email"] as string;
  const db = readDb();

  const requester = Object.values(db.users).find(u => u.email === adminEmail?.toLowerCase());
  const isPrivileged = requester && (requester.role === "CEO" || requester.role === "HR" || requester.role === "Director");

  if (!isPrivileged) {
    return res.status(403).json({ error: "Access Denied." });
  }

  const { id } = req.params;
  if (db.users[id]) {
    if (db.users[id].email === DEFAULT_ADMIN_EMAIL.toLowerCase()) {
      return res.status(400).json({ error: "Cannot delete the default seed CEO administrator." });
    }
    delete db.users[id];
    writeDb(db);
    return res.json({ message: "Personnel removed successfully." });
  }

  res.status(404).json({ error: "User record not found." });
});


// --- CASE MANAGER 1: RECRUITING ---

// Candidates view / register as a prospect
app.post("/api/prospects", (req, res) => {
  const { name, email, phone, roleApplied, cvSummary } = req.body;
  if (!name || !email || !roleApplied) {
    return res.status(400).json({ error: "Name, email, and role are required." });
  }

  const db = readDb();
  const id = "cand_" + Math.random().toString(36).substring(2, 9);
  const newProspect: Prospect = {
    id,
    name,
    email: email.toLowerCase(),
    phone: phone || "",
    roleApplied,
    cvSummary: cvSummary || "No CV bio submitted.",
    stage: "Prospect",
    createdAt: new Date().toISOString()
  };

  db.prospects[id] = newProspect;
  writeDb(db);

  res.status(201).json(newProspect);
});

// Admin get all prospects
app.get("/api/prospects", (req, res) => {
  const userEmail = req.headers["x-user-email"] as string;
  const db = readDb();

  const requester = Object.values(db.users).find(u => u.email === userEmail?.toLowerCase());
  const isPrivileged = requester && (requester.role === "CEO" || requester.role === "HR" || requester.role === "Director");

  // If a prospect wants to retrieve their own records using their email
  if (!isPrivileged) {
    const matchedProspects = Object.values(db.prospects).filter(p => p.email === userEmail?.toLowerCase());
    return res.json(matchedProspects);
  }

  res.json(Object.values(db.prospects));
});

// Update candidate recruitment stage
app.post("/api/prospects/:id/stage", (req, res) => {
  const adminEmail = req.headers["x-user-email"] as string;
  const db = readDb();

  const requester = Object.values(db.users).find(u => u.email === adminEmail?.toLowerCase());
  const isPrivileged = requester && (requester.role === "CEO" || requester.role === "HR" || requester.role === "Director");

  if (!isPrivileged) {
    return res.status(403).json({ error: "Access Denied." });
  }

  const { id } = req.params;
  const { stage } = req.body;

  if (db.prospects[id]) {
    db.prospects[id].stage = stage;
    writeDb(db);
    return res.json(db.prospects[id]);
  }

  res.status(404).json({ error: "Prospect not found." });
});

// Delete prospect completely
app.delete("/api/prospects/:id", (req, res) => {
  const adminEmail = req.headers["x-user-email"] as string;
  const db = readDb();

  const requester = Object.values(db.users).find(u => u.email === adminEmail?.toLowerCase());
  const isPrivileged = requester && (requester.role === "CEO" || requester.role === "HR" || requester.role === "Director");

  if (!isPrivileged) {
    return res.status(403).json({ error: "Access Denied." });
  }

  const { id } = req.params;
  if (db.prospects[id]) {
    delete db.prospects[id];
    db.chats = db.chats.filter(c => c.prospectId !== id);
    writeDb(db);
    return res.json({ message: "Prospect deleted." });
  }

  res.status(404).json({ error: "Prospect record not found." });
});

// Internal Recruit Chat communications
app.get("/api/prospects/:prospectId/chats", (req, res) => {
  const db = readDb();
  const { prospectId } = req.params;
  const filtered = db.chats.filter(c => c.prospectId === prospectId);
  res.json(filtered);
});

app.post("/api/prospects/:prospectId/chats", (req, res) => {
  const senderEmail = req.headers["x-user-email"] as string;
  const senderName = req.headers["x-user-name"] as string || senderEmail;
  const { prospectId } = req.params;
  const { message } = req.body;

  if (!message) {
    return res.status(400).json({ error: "Message is empty." });
  }

  const db = readDb();
  const user = Object.values(db.users).find(u => u.email === senderEmail?.toLowerCase());
  
  let role: "candidate" | UserRole = "candidate";
  if (user) {
    role = user.role;
  }

  const chat: ChatMessage = {
    id: "msg_" + Math.random().toString(36).substring(2, 9),
    prospectId,
    senderName,
    senderEmail: senderEmail.toLowerCase(),
    senderRole: role,
    message,
    createdAt: new Date().toISOString()
  };

  db.chats.push(chat);
  writeDb(db);

  res.status(201).json(chat);
});


// --- CASE MANAGER 2: GRIEVANCE MANAGEMENT ---

// Raise grievance ticket
app.post("/api/grievances", (req, res) => {
  const email = (req.headers["x-user-email"] as string || "").toLowerCase();
  const name = req.headers["x-user-name"] as string || email;

  const { title, description, category, level } = req.body;
  if (!title || !description || !category) {
    return res.status(400).json({ error: "Missing required grievance details." });
  }

  const db = readDb();
  const id = "griv_" + Math.random().toString(36).substring(2, 9);
  const ticketNo = "GRV-" + Math.floor(1000 + Math.random() * 9000);

  const newGrievance: Grievance = {
    id,
    ticketNo,
    title,
    description,
    category,
    level: level || "Low",
    status: "Open",
    submittedByEmail: email,
    submittedByName: name,
    replies: [],
    createdAt: new Date().toISOString()
  };

  db.grievances[id] = newGrievance;
  writeDb(db);

  res.status(201).json(newGrievance);
});

// Get Grievances lists
app.get("/api/grievances", (req, res) => {
  const userEmail = (req.headers["x-user-email"] as string || "").toLowerCase();
  const db = readDb();

  const requester = Object.values(db.users).find(u => u.email === userEmail);
  const isPrivileged = requester && (requester.role === "CEO" || requester.role === "HR" || requester.role === "Director");

  // Admin gets EVERYTHING.
  // Employee/Prospect user gets only what matches their registered email.
  if (isPrivileged) {
    res.json(Object.values(db.grievances));
  } else {
    const list = Object.values(db.grievances).filter(g => g.submittedByEmail === userEmail);
    res.json(list);
  }
});

// Admin Reply/escalate and close operations. Alternate/Modify Categories & Level
app.post("/api/grievances/:id/action", (req, res) => {
  const userEmail = (req.headers["x-user-email"] as string || "").toLowerCase();
  const db = readDb();

  const requester = Object.values(db.users).find(u => u.email === userEmail);
  const isPrivileged = requester && (requester.role === "CEO" || requester.role === "HR" || requester.role === "Director");

  if (!isPrivileged) {
    return res.status(403).json({ error: "Access Denied." });
  }

  const { id } = req.params;
  const { status, level, category } = req.body;

  if (db.grievances[id]) {
    if (status) db.grievances[id].status = status;
    if (level) db.grievances[id].level = level;
    if (category) db.grievances[id].category = category;

    writeDb(db);
    return res.json(db.grievances[id]);
  }

  res.status(404).json({ error: "Grievance ticket not found." });
});

// Write message update/reply on grievance
app.post("/api/grievances/:id/replies", (req, res) => {
  const senderEmail = (req.headers["x-user-email"] as string || "").toLowerCase();
  const senderName = req.headers["x-user-name"] as string || senderEmail;
  const { id } = req.params;
  const { message } = req.body;

  if (!message) {
    return res.status(400).json({ error: "Reply body cannot be blank." });
  }

  const db = readDb();
  if (!db.grievances[id]) {
    return res.status(404).json({ error: "Grievance not found." });
  }

  // Auth roles
  const user = Object.values(db.users).find(u => u.email === senderEmail);
  const matchedProspect = Object.values(db.prospects).find(p => p.email === senderEmail);
  let senderRole: any = "prospect";

  if (user) {
    senderRole = user.role;
  } else if (matchedProspect) {
    senderRole = "candidate";
  }

  // Security guard: employees should only review/reply to their standard grievances
  const isPrivileged = user && (user.role === "CEO" || user.role === "HR" || user.role === "Director");
  if (!isPrivileged && db.grievances[id].submittedByEmail !== senderEmail) {
    return res.status(403).json({ error: "Access Denied." });
  }

  const newReply: GrievanceReply = {
    id: "rpl_" + Math.random().toString(36).substring(2, 9),
    senderName,
    senderEmail,
    senderRole,
    message,
    createdAt: new Date().toISOString()
  };

  db.grievances[id].replies.push(newReply);
  writeDb(db);

  res.status(201).json(db.grievances[id]);
});


// --- CASE MANAGER 3: THE SCHEDULER & ALERTS ---

// Get Schedules (Meetings / Events)
app.get("/api/schedules", (req, res) => {
  const email = (req.headers["x-user-email"] as string || "").toLowerCase();
  if (!email) {
    return res.status(401).json({ error: "Email header missing." });
  }

  const db = readDb();
  const requester = Object.values(db.users).find(u => u.email === email);
  const isPrivileged = requester && (requester.role === "CEO" || requester.role === "HR" || requester.role === "Director");

  if (isPrivileged) {
    return res.json(Object.values(db.schedules));
  }

  // Filter schedules that target 'All' or specific employee lists
  const filtered = Object.values(db.schedules).filter(
    s => s.targetAudience === "All" || s.specificPersonnel.some(p => p.toLowerCase() === email)
  );

  res.json(filtered);
});

// Admin Post a Schedule. Creates system-wide alerts instantly
app.post("/api/schedules", (req, res) => {
  const creatorEmail = (req.headers["x-user-email"] as string || "").toLowerCase();
  const db = readDb();

  const requester = Object.values(db.users).find(u => u.email === creatorEmail);
  const isPrivileged = requester && (requester.role === "CEO" || requester.role === "HR" || requester.role === "Director");

  if (!isPrivileged) {
    return res.status(403).json({ error: "Access Denied." });
  }

  const { title, description, date, time, type, targetAudience, specificPersonnel } = req.body;
  if (!title || !description || !date || !time || !type) {
    return res.status(400).json({ error: "Missing scheduling parameter definitions." });
  }

  const scheduleId = "sch_" + Math.random().toString(36).substring(2, 9);
  const personnelArray = (specificPersonnel || []) as string[];

  const newEvent: ScheduleEvent = {
    id: scheduleId,
    title,
    description,
    date,
    time,
    type,
    targetAudience,
    specificPersonnel: personnelArray,
    createdByEmail: creatorEmail,
    createdByName: requester?.name || "HR Manager",
    createdAt: new Date().toISOString()
  };

  db.schedules[scheduleId] = newEvent;

  // Build target alert recipients
  let targetRecipients: string[] = [];
  if (targetAudience === "All") {
    // Alert all approved users
    targetRecipients = Object.values(db.users)
      .filter(u => u.status === "approved")
      .map(u => u.email);
  } else {
    // Specific email inputs
    targetRecipients = personnelArray.map(p => p.toLowerCase().trim());
  }

  // Create notifications/alerts records
  targetRecipients.forEach(userEmail => {
    const alertId = "al_" + Math.random().toString(36).substring(2, 9);
    const text = `The HR department has scheduled a ${type}: ${title} on ${date} at ${time}. Action required: Review and acknowledge.`;
    
    db.alerts.push({
      id: alertId,
      scheduleId,
      title,
      text,
      date,
      type,
      forUserEmail: userEmail,
      status: "unread",
      createdAt: new Date().toISOString()
    });
  });

  writeDb(db);
  res.status(201).json(newEvent);
});

// Get alert updates
app.get("/api/alerts", (req, res) => {
  const email = (req.headers["x-user-email"] as string || "").toLowerCase();
  if (!email) {
    return res.status(400).json({ error: "User email unavailable." });
  }

  const db = readDb();
  const userAlerts = db.alerts.filter(al => al.forUserEmail === email);
  res.json(userAlerts);
});

// Acknowledge alert
app.post("/api/alerts/:id/acknowledge", (req, res) => {
  const email = (req.headers["x-user-email"] as string || "").toLowerCase();
  const { id } = req.params;

  const db = readDb();
  const alertIndex = db.alerts.findIndex(al => al.id === id && al.forUserEmail === email);

  if (alertIndex !== -1) {
    db.alerts[alertIndex].status = "acknowledged";
    writeDb(db);
    return res.json({ message: "Alert acknowledged.", alert: db.alerts[alertIndex] });
  }

  res.status(404).json({ error: "Notification record not located for this user." });
});


// Fallback catch-all static or development integration
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[HR Associate Server] Active on port ${PORT}`);
  });
}

startServer();
