// src/components/TaskProgressChart.jsx
import React, { useMemo, useEffect, useState } from "react";

export default function TaskProgressChart({ tasks = [] }) {
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    // Trigger animation shortly after mount
    const t = setTimeout(() => setAnimate(true), 100);
    return () => clearTimeout(t);
  }, []);

  const summary = useMemo(() => {
    const total = tasks.length || 0;

    let completed = 0;
    let inProgress = 0;
    let pending = 0;

    tasks.forEach((t) => {
      const status = (t.status || "").toUpperCase();
      const p = Number(t.progress || 0);

      if (status === "COMPLETED") completed++;
      else if (status === "IN_PROGRESS") inProgress++;
      else if (status === "PENDING") pending++;
      else {
        // fallback
        if (p >= 100) completed++;
        else if (p > 0) inProgress++;
        else pending++;
      }
    });

    return { total, completed, inProgress, pending };
  }, [tasks]);

  const { total, completed, inProgress, pending } = summary;
  const percent = (n) => Math.round((n / (total || 1)) * 100);

  return (
    <div className="card">
      <div className="card-head">
        <div>
          <div className="card-title">Task Status Summary</div>
          <div className="card-sub">
            Total {total} • Completed {completed} • In progress {inProgress} • Pending {pending}
          </div>
        </div>
      </div>

      <div style={{ paddingTop: 12 }}>
        <Bar
          icon="✓"
          label="Completed"
          count={completed}
          percent={percent(completed)}
          gradient="linear-gradient(90deg, #8b5cf6, #3b82f6)"
          animate={animate}
        />

        <Bar
          icon="⟳"
          label="In Progress"
          count={inProgress}
          percent={percent(inProgress)}
          gradient="linear-gradient(90deg, #7c3aed, #4f46e5)"
          animate={animate}
        />

        <Bar
          icon="•"
          label="Pending"
          count={pending}
          percent={percent(pending)}
          gradient="linear-gradient(90deg, #a1a1aa, #d1d5db)"
          animate={animate}
        />
      </div>
    </div>
  );
}

function Bar({ icon, label, count, percent, gradient, animate }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontSize: 13,
          marginBottom: 4,
        }}
      >
        <span>
          <strong style={{ marginRight: 6 }}>{icon}</strong> {label}
        </span>
        <span>{count} ({percent}%)</span>
      </div>

      <div
        style={{
          width: "100%",
          height: 10,
          background: "#f0f0f0",
          borderRadius: 999,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: animate ? `${percent}%` : "0%",
            height: "100%",
            background: gradient,
            transition: "width 0.8s cubic-bezier(0.4, 0, 0.2, 1)",
          }}
        />
      </div>
    </div>
  );
}
