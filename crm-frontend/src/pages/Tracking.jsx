// src/pages/Tracking.jsx
import React, { useState, useEffect } from "react";
import "./tracking.css";

import KPI from "../components/KPI";
import RevenueChart from "../components/RevenueChart";
import CountryBars from "../components/CountryBars";
import RecentActivity from "../components/RecentActivity";
import TaskProgressChart from "../components/TaskProgressChart";



export default function Tracking() {
  const [panel, setPanel] = useState({ open: false, title: "", content: null });
  const openPanel = (title, content) => setPanel({ open: true, title, content });
  const closePanel = () => setPanel({ open: false, title: "", content: null });

  const regions = [
    { name: "India North", v: 82 },
    { name: "India South", v: 68 },
    { name: "India West", v: 55 },
    { name: "India East", v: 40 },
  ];

  // ---------- DASHBOARD SUMMARY (KPIs) ----------
  const [summary, setSummary] = useState({
    totalRevenue: "₹ 8.9 L",
    totalRevenuePercent: 58,
    employeesActive: 12,
    employeesPending: 31,
    receivables: "₹1,20,450",
    receivablesNote: "Current / Overdue",
    cashBalance: "₹2,34,000",
    cashNote: "Available",
  });
    // ---------- DASHBOARD SUMMARY LOAD ----------
  useEffect(() => {
    fetch("http://127.0.0.1:8000/crm/dashboard/")
      .then(res => (res.ok ? res.json() : Promise.reject()))
      .then(data => {
        setSummary(prev => ({
          ...prev,
          totalRevenue: data.total_revenue ?? prev.totalRevenue,
          totalRevenuePercent: data.total_revenue_percent ?? prev.totalRevenuePercent,
          employeesActive: data.employees_active ?? prev.employeesActive,
          employeesPending: data.employees_pending ?? prev.employeesPending,
          receivables: data.receivables ?? prev.receivables,
          receivablesNote: data.receivables_note ?? prev.receivablesNote,
          cashBalance: data.cash_balance ?? prev.cashBalance,
          cashNote: data.cash_note ?? prev.cashNote,
        }));
      })
      .catch(() => {
        // ignore error, fallback values already in state
      });
  }, []);



  // ---------- TASK LOADING ----------
  const [tasks, setTasks] = useState([]);
  const [tasksLoading, setTasksLoading] = useState(true);
  const [tasksError, setTasksError] = useState(null);

  const [filter, setFilter] = useState("All");
  const filteredTasks = tasks.filter(t => {
      if (filter === "All") return true;

      const status = (t.status || "").toUpperCase();
      const p = Number(t.progress || 0);

      if (filter === "Pending") return status === "PENDING" || p === 0;
      if (filter === "InProgress") return status === "IN_PROGRESS" || (p > 0 && p < 100);
      if (filter === "Completed") return status === "COMPLETED" || p >= 100;

      return true;
    });


  useEffect(() => {
    // fallback only inside effect → no warnings
    const fallback = [
      { id: 1, title: "GST filing FY24", owner: "Ramesh", priority: "High", due: "2025-12-05", progress: 62 },
      { id: 2, title: "Invoice follow-up", owner: "Seema", priority: "Medium", due: "2025-12-02", progress: 34 },
      { id: 3, title: "Stock update", owner: "Anil", priority: "Low", due: "2025-12-01", progress: 95 },
    ];

    let mounted = true;
    setTasksLoading(true);

    fetch("http://127.0.0.1:8000/crm/tasks/")
      .then(res => (res.ok ? res.json() : Promise.reject()))
      .then(data => {
        if (!mounted) return;
        setTasks(Array.isArray(data) && data.length ? data : fallback);
        setTasksError(null);
      })
      .catch(() => {
        if (!mounted) return;
        setTasks(fallback);
        setTasksError("Failed to load tasks");
      })
      .finally(() => mounted && setTasksLoading(false));

    return () => { mounted = false; };
  }, []);

  // ---------- EXPORT CSV ----------
  function downloadCSV(filename, rows) {
    if (!rows || !rows.length) return;
    const keys = Object.keys(rows[0]);
    const csv = [
      keys.join(","),
      ...rows.map(r => keys.map(k => `"${(r[k] ?? "").toString().replace(/"/g, '""')}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  function handleExport() {
    const rows = tasks.map(t => ({
      Title: t.title,
      Owner: t.owner,
      Priority: t.priority,
      Due: t.due,
      Progress: t.progress,
    }));
    downloadCSV("tasks_export.csv", rows);
  }

  // ---------- NEW TASK PANEL ----------
  function openNewTask() {
    openPanel(
      "New Task",
      <NewTaskForm
        onCancel={closePanel}
        onSave={(task) => {
          const nextId = tasks.length ? Math.max(...tasks.map(t => t.id)) + 1 : 1;
          setTasks(prev => [{ id: nextId, ...task }, ...prev]);
          closePanel();
        }}
      />
    );
  }

  return (
    <div className="ms-root">
      <div className="ms-shell">

        {/* Header */}
        <header className="ms-header">
          <div className="ms-brand">
            <div className="ms-logo">A</div>
            <div>
              <div className="ms-title">Accounts2Arun</div>
              <div className="ms-sub">Tracking dashboard</div>
            </div>
          </div>

          <div className="ms-controls">
            <div className="ms-filter">
              <select className="ms-select" defaultValue="India">
                <option>India</option>
                <option>USA</option>
                <option>Canada</option>
              </select>
              <select className="ms-select small" defaultValue="This Month">
                <option>This Month</option>
                <option>Last 3 Months</option>
                <option>This Year</option>
              </select>
            </div>

            <div className="ms-actions">
              <button className="btn btn-ghost" onClick={handleExport}>Export</button>
              <button className="btn btn-primary" onClick={openNewTask}>New</button>
            </div>
          </div>
        </header>

        {/* KPIs */}
        <section className="ms-kpis">
          <KPI
              variant="neon"
              title="Total Revenue"
              value={summary.totalRevenue}
              percent={summary.totalRevenuePercent}
              subtitle="MTD • Q3"
            />
            <KPI
              variant="default"
              title="Employees Active"
              value={summary.employeesActive}
              subtitle={`Pending ${summary.employeesPending}`}
            />
            <KPI
              variant="default"
              title="Receivables"
              value={summary.receivables}
              subtitle={summary.receivablesNote}
            />
            <KPI
              variant="default"
              title="Cash Balance"
              value={summary.cashBalance}
              subtitle={summary.cashNote}
            />

        </section>

        {/* Search + Filters */}
        <div className="ms-filterbar">
          <input className="ms-search" placeholder="Search tasks, invoices, clients..." />
          <div className="ms-filter-chips">
              <button
                className={`chip ${filter === "All" ? "active" : ""}`}
                onClick={() => setFilter("All")}
              >
                All
              </button>

              <button
                className={`chip ${filter === "Pending" ? "active" : ""}`}
                onClick={() => setFilter("Pending")}
              >
                Pending
              </button>

              <button
                className={`chip ${filter === "InProgress" ? "active" : ""}`}
                onClick={() => setFilter("InProgress")}
              >
                In Progress
              </button>

              <button
                className={`chip ${filter === "Completed" ? "active" : ""}`}
                onClick={() => setFilter("Completed")}
              >
                Completed
              </button>
            </div>

        </div>

        {/* Main Grid */}
        <div className="ms-grid">
          <main className="ms-main">
            {/* Revenue Trend */}
            <div className="card chart-card">
              <div className="card-head">
                <div>
                  <div className="card-title">Revenue Trend</div>
                  <div className="card-sub">Monthly • 2025</div>
                </div>
              </div>

              <div style={{ height: 320, width: "100%" }}>
                <RevenueChart
                  height={320}
                  onBarClick={(p) => openPanel(p.month, <div>Revenue: ₹{p.revenue}</div>)}
                />
              </div>
            </div>

            {/* Tasks */}
            <div className="card tasks-card">
              <div className="card-title">Recent Tasks</div>

              {tasksLoading && <div style={{ padding: 20 }}>Loading tasks…</div>}
              {tasksError && <div style={{ padding: 20, color: "#b91c1c" }}>Failed to load — showing fallback</div>}

              {filteredTasks.map(t => (
                <TaskRow
                  key={t.id}
                  title={t.title}
                  owner={t.owner}
                  priority={t.priority}
                  due={t.due}
                  progress={t.progress}
                  onClick={() => openPanel(t.title, <TaskDetail task={t} />)}
                />
              ))}
            </div>
          </main>

          {/* Right Side */}
          <aside className="ms-side">
            <div className="card">
              <div className="card-title">Revenue by Region</div>
              <CountryBars data={regions} />
            </div>

            <div className="card">
              <RecentActivity />
            </div>
            <div className="card">
              <TaskProgressChart tasks={filteredTasks} />

            </div>

          </aside>
        </div>

        {/* Side Panel */}
        {panel.open && (
          <div className="side-overlay" onClick={closePanel}>
            <div className="side-panel" onClick={(e) => e.stopPropagation()}>
              <div className="side-head">
                <div className="side-title">{panel.title}</div>
                <button className="btn-close" onClick={closePanel}>✕</button>
              </div>
              <div className="side-body">{panel.content}</div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

function TaskRow({ title, owner, priority, due, progress, onClick }) {
  return (
    <div className="task-row" onClick={onClick}>
      <div>
        <div className="task-title">{title}</div>
        <div className="task-meta">
          <span className="muted">{owner}</span> ·
          <span className={`prio ${priority?.toLowerCase()}`}> {priority}</span> ·
          Due {due}
        </div>
      </div>

      <div className="task-right">
        <div className="progress-small">
          <div className="progress-fill" style={{ width: `${progress}%` }} />
        </div>
        <div className="progress-num">{progress}%</div>
      </div>
    </div>
  );
}

function TaskDetail({ task }) {
  const [title, setTitle] = useState(task.title);
  const [owner, setOwner] = useState(task.owner);
  const [priority, setPriority] = useState(task.priority || "Medium");
  const [due, setDue] = useState(task.due);
  const [progress, setProgress] = useState(task.progress || 0);
  const [notes, setNotes] = useState(task.notes || "");

  const status =
    progress >= 100 ? "Completed"
    : progress > 0 ? "In Progress"
    : "Pending";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

      {/* TITLE */}
      <div>
        <label className="muted">Title</label>
        <input
          className="ms-input"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>

      {/* OWNER */}
      <div>
        <label className="muted">Owner</label>
        <input
          className="ms-input"
          value={owner}
          onChange={(e) => setOwner(e.target.value)}
        />
      </div>

      {/* PRIORITY */}
      <div>
        <label className="muted">Priority</label>
        <select
          className="ms-input"
          value={priority}
          onChange={(e) => setPriority(e.target.value)}
        >
          <option>High</option>
          <option>Medium</option>
          <option>Low</option>
        </select>
      </div>

      {/* DUE DATE */}
      <div>
        <label className="muted">Due Date</label>
        <input
          type="date"
          className="ms-input"
          value={due}
          onChange={(e) => setDue(e.target.value)}
        />
      </div>

      {/* PROGRESS */}
      <div>
        <label className="muted">Progress ({progress}%)</label>
        <input
          type="range"
          min="0"
          max="100"
          value={progress}
          onChange={(e) => setProgress(Number(e.target.value))}
        />
      </div>

      {/* STATUS DISPLAY */}
      <div style={{ marginTop: 5 }}>
        <strong>Status: </strong>
        {status === "Completed" && <span style={{ color: "#10b981" }}>✓ Completed</span>}
        {status === "In Progress" && <span style={{ color: "#3b82f6" }}>⟳ In Progress</span>}
        {status === "Pending" && <span style={{ color: "#f97316" }}>• Pending</span>}
      </div>

      {/* NOTES */}
      <div>
        <label className="muted">Notes</label>
        <textarea
          className="ms-input"
          rows={3}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </div>

      {/* ACTIONS */}
      <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
        <button
          className="btn btn-primary"
          onClick={() => {
            alert("Save to backend (future API).");
          }}
        >
          Save Changes
        </button>

        <button
          className="btn btn-ghost"
          onClick={() => setProgress(100)}
        >
          Mark Completed
        </button>
      </div>
    </div>
  );
}


function NewTaskForm({ onSave, onCancel }) {
  const [title, setTitle] = useState("");
  const [owner, setOwner] = useState("");
  const [priority, setPriority] = useState("Medium");
  const [due, setDue] = useState("");
  const [progress, setProgress] = useState(0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <label>Title</label>
      <input value={title} onChange={e => setTitle(e.target.value)} />

      <label>Owner</label>
      <input value={owner} onChange={e => setOwner(e.target.value)} />

      <label>Priority</label>
      <select value={priority} onChange={e => setPriority(e.target.value)}>
        <option>High</option>
        <option>Medium</option>
        <option>Low</option>
      </select>

      <label>Due Date</label>
      <input type="date" value={due} onChange={e => setDue(e.target.value)} />

      <label>Progress (%)</label>
      <input type="number" value={progress} onChange={e => setProgress(e.target.value)} min="0" max="100" />

      <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
        <button className="btn btn-primary" onClick={() => onSave({ title, owner, priority, due, progress })}>Save</button>
        <button className="btn btn-ghost" onClick={onCancel}>Cancel</button>
      </div>
    </div>
  );
}
