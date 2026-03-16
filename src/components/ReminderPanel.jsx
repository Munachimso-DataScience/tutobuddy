import React from "react";

export default function ReminderPanel({ reminders }) {
  return (
    <div className="card">
      <h3>Reminders</h3>
      <div className="reminder-grid">
        {reminders.map((reminder) => (
          <div key={reminder.id} className="reminder">
            <p>{reminder.label}</p>
            <span>{reminder.time}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
