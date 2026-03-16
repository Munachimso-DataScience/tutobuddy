import React from "react";
import ModuleCard from "./components/ModuleCard.jsx";
import SectionHeader from "./components/SectionHeader.jsx";
import TaskList from "./components/TaskList.jsx";
import ReminderPanel from "./components/ReminderPanel.jsx";
import ResourceGrid from "./components/ResourceGrid.jsx";
import PerformancePanel from "./components/PerformancePanel.jsx";

const modules = [
  {
    id: "schedule",
    title: "Timetable & Schedule",
    description:
      "Plan classes, labs, and campus events with a weekly overview and quick edits.",
    status: "active"
  },
  {
    id: "assignments",
    title: "Assignments & Deadlines",
    description:
      "Track submissions, attach course materials, and receive deadline alerts.",
    status: "active"
  },
  {
    id: "collaboration",
    title: "Communication Hub",
    description:
      "Join course discussion groups, share files, and sync project updates.",
    status: "planned"
  }
];

const tasks = [
  { id: "t1", title: "Mobile UX research summary", course: "CSC 402", due: "Due Fri" },
  { id: "t2", title: "Database schema review", course: "SEN 411", due: "Due Mon" },
  { id: "t3", title: "Analytics dashboard draft", course: "CSC 415", due: "Due Wed" }
];

const reminders = [
  { id: "r1", label: "Data structures quiz", time: "Tomorrow · 9:00 AM" },
  { id: "r2", label: "Library group study", time: "Thu · 2:00 PM" },
  { id: "r3", label: "Submit course feedback", time: "Fri · 4:30 PM" }
];

const resources = [
  { id: "res1", title: "Lecture slides week 5", type: "PDF" },
  { id: "res2", title: "Lab walkthrough video", type: "Video" },
  { id: "res3", title: "Exam prep checklist", type: "Document" }
];

const performance = [
  { id: "p1", title: "Current GPA", value: "4.12", note: "Up 0.15" },
  { id: "p2", title: "Tasks completed", value: "18", note: "This week" },
  { id: "p3", title: "Engagement score", value: "82%", note: "Above average" }
];

export default function App() {
  return (
    <div className="app">
      <aside className="sidebar">
        <div>
          <h1>Student Companion</h1>
          <p className="muted">Unified academic support</p>
        </div>
        <nav>
          <button type="button">Dashboard</button>
          <button type="button">Timetable</button>
          <button type="button">Assignments</button>
          <button type="button">Resources</button>
          <button type="button">Performance</button>
          <button type="button">Messages</button>
        </nav>
        <div className="profile-card">
          <div>
            <strong>Amara N.</strong>
            <span>Computer Science</span>
          </div>
          <button type="button" className="secondary">Edit Profile</button>
        </div>
      </aside>

      <main className="content">
        <section className="hero">
          <div>
            <p className="badge">Appwrite-ready</p>
            <h2>Everything you need for a focused semester.</h2>
            <p>
              Manage schedules, assignments, reminders, resources, and performance insights from
              one dashboard. Connect Appwrite to power real-time collaboration and secure storage.
            </p>
          </div>
          <div className="hero-card">
            <h3>Quick actions</h3>
            <div className="action-grid">
              <button type="button">Add task</button>
              <button type="button">Create reminder</button>
              <button type="button">Upload resource</button>
              <button type="button">Start discussion</button>
            </div>
          </div>
        </section>

        <section>
          <SectionHeader
            title="Core Modules"
            subtitle="Key areas aligned to the project objectives and SDLC implementation plan."
          />
          <div className="grid">
            {modules.map((module) => (
              <ModuleCard key={module.id} {...module} />
            ))}
          </div>
        </section>

        <section className="split">
          <TaskList tasks={tasks} />
          <ReminderPanel reminders={reminders} />
        </section>

        <section className="split">
          <ResourceGrid resources={resources} />
          <PerformancePanel entries={performance} />
        </section>

        <section className="card">
          <SectionHeader
            title="Appwrite integration checklist"
            subtitle="Configure your backend to activate authentication, data storage, and messaging."
          />
          <ol className="checklist">
            <li>Set Appwrite endpoint and project ID in <code>.env</code>.</li>
            <li>Create collections for tasks, resources, reminders, messages, and performance.</li>
            <li>Enable email-based registration and session management.</li>
            <li>Upload profile photos to the storage bucket.</li>
          </ol>
        </section>
      </main>
    </div>
  );
}
