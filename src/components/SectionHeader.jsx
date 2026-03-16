import React from "react";

export default function SectionHeader({ title, subtitle }) {
  return (
    <header className="section-header">
      <div>
        <h2>{title}</h2>
        {subtitle ? <p>{subtitle}</p> : null}
      </div>
    </header>
  );
}
