import React from "react";

export default function ResourceGrid({ resources }) {
  return (
    <div className="card">
      <h3>Learning Resources</h3>
      <div className="resource-grid">
        {resources.map((resource) => (
          <div key={resource.id} className="resource">
            <div>
              <strong>{resource.title}</strong>
              <p>{resource.type}</p>
            </div>
            <button type="button" className="secondary">
              Open
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
