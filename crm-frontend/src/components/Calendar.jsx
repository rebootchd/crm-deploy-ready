import React from 'react';

export default function Calendar({ projects }) {
  return (
    <div>
      <div className="card">
        <h3>Calendar (mock)</h3>
        <div className="calendar-grid">
          {projects.map(p => (
            <div key={p.id} className="calendar-item">
              <strong>{p.due}</strong>
              <div>{p.title}</div>
              <div className="muted">Client #{p.clientId}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
