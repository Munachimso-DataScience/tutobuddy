import React from "react";

export default function TaskList({ tasks }) {
  return (
    <div className="card">
      <h3>Upcoming Tasks</h3>
      <ul className="list">
        {tasks.map((task) => (
          <li key={task.id} className="list-item">
            <div>
              <strong>{task.title}</strong>
              <span>{task.course}</span>
            </div>
            <span className="badge">{task.due}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
