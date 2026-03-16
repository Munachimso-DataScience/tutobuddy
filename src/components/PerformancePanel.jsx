import React from "react";

export default function PerformancePanel({ entries }) {
  return (
    <div className="card">
      <h3>Performance Snapshot</h3>
      <div className="performance-grid">
        {entries.map((entry) => (
          <div key={entry.id} className="performance">
            <span className="performance-title">{entry.title}</span>
            <strong>{entry.value}</strong>
            <span>{entry.note}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
