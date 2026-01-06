import React from 'react';

/* Simple mock charts using SVG */
export default function Reports({ leads, projects }) {
  const conv = [2,5,3,6,4];
  return (
    <div className="grid-2">
      <div className="card">
        <h3>Leads Conversion (mock)</h3>
        <svg viewBox="0 0 300 120" width="100%" height="120">
          {conv.map((v,i)=> <rect key={i} x={i*58+8} y={120-v*12} width="40" height={v*12} fill="#2563eb" rx="6" />)}
        </svg>
        <p className="muted">Conversion trend over months (demo data)</p>
      </div>

      <div className="card">
        <h3>Project Completion</h3>
        <ul className="list">
          <li>GST Filing - Q3 <strong>40%</strong></li>
          <li>Year end audit <strong>20%</strong></li>
        </ul>
      </div>
    </div>
  );
}
