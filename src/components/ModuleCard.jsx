import React from "react";

const statusStyles = {
  planned: "status planned",
  active: "status active",
  complete: "status complete"
};

export default function ModuleCard({ title, description, status }) {
  return (
    <article className="card">
      <div className="card-header">
        <h3>{title}</h3>
        <span className={statusStyles[status] ?? "status"}>{status}</span>
      </div>
      <p>{description}</p>
    </article>
  );
}
