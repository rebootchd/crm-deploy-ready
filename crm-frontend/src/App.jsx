import React, { useState, useEffect } from "react";
import Sidebar from "./components/Sidebar";
import Dashboard from "./components/Dashboard";
import Assign from "./components/Assign";
import Leads from "./components/Leads";
import Clients from "./components/Clients";
import Projects from "./components/Projects";
import Reports from "./components/Reports";
import Communication from "./components/Communication";
import Calendar from "./components/Calendar";
import Employees from "./components/Employees";
import CallLogs from "./components/CallLogs";
import FollowUps from "./components/FollowUps";
import TrackingPage from "./pages/Tracking.jsx";
import Login from "./components/Login";


const BASE = process.env.REACT_APP_API_BASE_URL || "http://127.0.0.1:8000/crm/v1/";

function HeaderImportDropdown({ onStartImport }) {
  const fileRef = React.useRef(null);
  const [open, setOpen] = React.useState(false);


  const FILES = {
      Employees: "/templates/employees.xlsx",
      Leads: "/templates/leads.xlsx",
      Clients: "/templates/clients.xlsx",
      Projects: "/templates/projects.xlsx",
      Assignments: "/templates/assignments.xlsx",
      CallLogs: "/templates/calllogs.xlsx",
      FollowUps: "/templates/followups.xlsx",
  };


  const downloadTemplate = (label) => {
      const url = FILES[label];
      if (!url) return;

      const a = document.createElement("a");
      a.href = url;
      a.download = "";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      setOpen(false);
    };

  const handleFileChange = (e) => {
    const file = e.target.files && e.target.files[0];
    if (file && onStartImport) {
      onStartImport(file);
    }
    setOpen(false);
  };

  return (
    <div style={{ position: "relative", display: "inline-block", zIndex: 9999 }}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        style={{
          background: "transparent",
          color: "#1e3a8a",
          border: "none",
          fontWeight: 600,
          fontSize: 14,
          cursor: "pointer",
          padding: "6px 8px",
          borderRadius: 6,
        }}
      >
        Import ▾
      </button>

      {open && (
        <div
          style={{
            position: "absolute",
            right: 0,
            marginTop: 8,
            background: "#ffffff",
            borderRadius: 10,
            padding: 12,
            minWidth: 260,
            boxShadow: "0 10px 30px rgba(0,0,0,0.12)",
            zIndex: 10000,
          }}
        >
          <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 8 }}>
            Download Templates
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 8,
            }}
          >
            {Object.keys(FILES).map((label) => (
              <button
                key={label}
                type="button"
                onClick={() => downloadTemplate(label)}
                style={{
                  padding: "10px 12px",
                  borderRadius: 8,
                  background: "#f8fafc",
                  border: "1px solid rgba(15,23,42,0.06)",
                  cursor: "pointer",
                  fontWeight: 600,
                  fontSize: 12,
                }}
              >
                {label === "CallLogs"
                  ? "Call Logs"
                  : label.replace(/([A-Z])/g, " $1").trim()}
              </button>
            ))}
          </div>

          <div
            style={{
              borderTop: "1px solid #eef2ff",
              marginTop: 10,
              paddingTop: 10,
            }}
          >
            <button
              type="button"
              onClick={() => fileRef.current && fileRef.current.click()}
              style={{
                width: "100%",
                padding: "10px 12px",
                borderRadius: 8,
                background: "#eef6ff",
                border: "none",
                cursor: "pointer",
                fontWeight: 700,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 10,
                fontSize: 13,
              }}
            >
              <span style={{ fontSize: 18 }}>📁</span>
              Import File
            </button>

            <input
              ref={fileRef}
              type="file"
              accept=".csv,.xlsx,.xls,.zip"
              style={{ display: "none" }}
              onChange={handleFileChange}
            />
          </div>

          <div style={{ marginTop: 8, fontSize: 12, color: "#6b7280" }}>
            Each template has its own structure. Choose carefully.
          </div>
        </div>
      )}
    </div>
  );
}

export default function App() {
  const [page, setPage] = useState("dashboard");
  const [employees, setEmployees] = useState([]);
  const [, setSelectedEmployeeForWork] = useState(null);
  const [clients, setClients] = useState([]);
  const [leads, setLeads] = useState([]);
  const [projects, setProjects] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [calllogs, setCalllogs] = useState([]);
  const [followups, setFollowups] = useState([]);
  const [user, setUser] = useState(null);


  useEffect(() => {
    fetchAllData();
    const token = localStorage.getItem("token");
    if (token) {
      setUser({ loggedIn: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const normalizeList = (data) => {
    if (!data) return [];
    if (Array.isArray(data)) return data;
    if (data.results && Array.isArray(data.results)) return data.results;
    return [];
  };

    async function fetchAllData() {
      try {
        // FIXED: removed extra /crm/ because BASE already ends with /crm/v1/
        const urls = [
          `${BASE}employees/`,
          `${BASE}clients/`,
          `${BASE}leads/`,
          `${BASE}projects/`,
          `${BASE}assignments/`,
        ];

        const responses = await Promise.all(
          urls.map((url) =>
            fetch(url, {
              method: "GET",
              headers: {
                Accept: "application/json",
              },
            }).catch(() => null)
          )
        );

        const jsonData = await Promise.all(
          responses.map((res) => {
            if (!res) return null;
            return res
              .text()
              .then((txt) => (txt ? JSON.parse(txt) : null))
              .catch(() => null);
          })
        );

        const [empData, clientData, leadData, projData, assignData] = jsonData;

        setEmployees(normalizeList(empData));
        setClients(normalizeList(clientData));
        setLeads(normalizeList(leadData));
        setProjects(normalizeList(projData));
        setAssignments(normalizeList(assignData));

        try {
          // FIXED: removed extra /crm/
          const summaryRes = await fetch(`${BASE}summary/`, {
            method: "GET",
            headers: { Accept: "application/json" },
          });

          if (summaryRes.ok) {
            const summary = await summaryRes.json();
            const cl = Number(summary.total_calllogs || 0);
            const fu = Number(summary.total_followups || 0);
            setCalllogs(Array(cl).fill({}));
            setFollowups(Array(fu).fill({}));
          } else {
            setCalllogs([]);
            setFollowups([]);
          }
        } catch {
          setCalllogs([]);
          setFollowups([]);
        }
      } catch {
        setEmployees([]);
        setClients([]);
        setLeads([]);
        setProjects([]);
        setAssignments([]);
        setCalllogs([]);
        setFollowups([]);
      }
    }


  const assignWork = ({ employeeId, workType, workId }) => {
    const newAssignment = {
      id: Date.now(),
      employeeId,
      workType,
      workId,
      assignedAt: new Date().toISOString(),
    };

    setAssignments((prev) => [newAssignment, ...prev]);

    if (workType === "lead") {
      setLeads((prev) =>
        prev.map((l) => (l.id === workId ? { ...l, assigned: employeeId } : l))
      );
    } else if (workType === "client") {
      setClients((prev) =>
        prev.map((c) => (c.id === workId ? { ...c, assigned: employeeId } : c))
      );
    } else if (workType === "project") {
      setProjects((prev) =>
        prev.map((p) => (p.id === workId ? { ...p, assigned: employeeId } : p))
      );
    }

    const emp = employees.find((e) => e.id === employeeId);
    const empName = emp ? emp.name : `Employee ${employeeId}`;

    setNotifications((prev) => [
      {
        id: Date.now(),
        text: `Assigned ${workType}:${workId} to ${empName}`,
        seen: false,
      },
      ...prev,
    ]);
  };

  const unassign = (assignmentId) => {
    setAssignments((prev) => prev.filter((a) => a.id !== assignmentId));
  };

  const updateLead = (id, patch) => {
    setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, ...patch } : l)));
  };

  const updateClient = (id, patch) => {
    setClients((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  };

  const updateProject = (id, patch) => {
    setProjects((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  };

  const prettyTitle = (key) => {
    if (!key) return "";
    return key.charAt(0).toUpperCase() + key.slice(1);
  };

    const handleLogin = (userData) => {
      setUser(userData || { loggedIn: true });
      setPage("dashboard");
    };

    const handleLogout = () => {
      const confirmLogout = window.confirm("Are you sure you want to logout?");
      if (!confirmLogout) return;

      localStorage.removeItem("token");
      setUser(null);
      setPage("login");
    };



    const handleHeaderImport = async (file) => {
      try {
        const formData = new FormData();
        formData.append("file", file);

        const res = await fetch(`${BASE}call-logs/import/`, {
          method: "POST",
          body: formData,
        });

        const text = await res.text();
        console.log("Raw response:", text); // ADD THIS - see what server actually returns

        let data = {};

        try {
          data = JSON.parse(text);
        } catch (parseError) {
          console.error("Parse error:", parseError); // Better error logging
          console.error("Response text:", text); // See the actual response
          throw new Error("Invalid server response");
        }

        if (!res.ok) {
          // Log the full error details
          console.error("Server error:", data);
          throw new Error(data.error || data.detail || "Import failed");
        }

        alert(`Import success. Created: ${data.created}`);
      } catch (e) {
        console.error("Full error:", e);
        alert(`Import error: ${e.message}\nCheck console for details.`);
      }
    };


  const commonProps = {
    employees,
    clients,
    leads,
    projects,
    assignments,
    calllogs,
    followups,
    assignWork,
    unassign,
    updateLead,
    updateClient,
    updateProject,
    notifications,
    setNotifications,
    setPage,
  };

 if (!user) {
   return <Login onLogin={handleLogin} />;
 }

  const renderPage = () => {
    switch (page) {
      case "dashboard":
        return (
          <Dashboard
            {...commonProps}
            setSelectedEmployeeForWork={setSelectedEmployeeForWork}
          />
        );

      case "assign":
        return <Assign {...commonProps} />;
      case "leads":
        return <Leads {...commonProps} />;
      case "clients":
        return <Clients {...commonProps} />;
      case "projects":
        return <Projects {...commonProps} />;
      case "reports":
        return <Reports {...commonProps} />;
      case "communication":
        return <Communication {...commonProps} />;
      case "calendar":
        return <Calendar {...commonProps} />;
      case "employees":
        return <Employees {...commonProps} />;
      case "calllogs":
        return <CallLogs {...commonProps} />;
      case "followups":
        return <FollowUps {...commonProps} />;
      case "tracking":
        return <TrackingPage {...commonProps} />;

      default:
        return <Dashboard {...commonProps} />;
    }
  };

  return (
    <div className="app-shell">
      {user && (
          <Sidebar
            onNavigate={(item) => setPage(item.key)}
            onLogout={handleLogout}
          />
      )}

      <main className="main-area">
        <header
          className="topbar"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
            height: 70,
            background: "#e6ecf5",
            boxShadow:
              "inset 0 1px 2px rgba(255,255,255,0.6), inset 0 -2px 6px rgba(0,0,0,0.1)",
            borderBottom: "1px solid #d1d5db",
          }}
        >
          {page !== "dashboard" && (
            <button
              type="button"
              onClick={() => setPage("dashboard")}
              style={{
                position: "absolute",
                left: 20,
                top: "50%",
                transform: "translateY(-50%)",
                background: "#e6ecf5",
                color: "#1e3a8a",
                border: "none",
                borderRadius: 12,
                padding: "10px 22px",
                fontWeight: 700,
                fontSize: 16,
                boxShadow:
                  "6px 6px 12px rgba(0,0,0,0.15), -6px -6px 12px rgba(255,255,255,0.9)",
                cursor: "pointer",
              }}
            >
              ← Back
            </button>
          )}

          <nav
            className="top-navbar"
            style={{
              position: "absolute",
              right: 20,
              top: "50%",
              transform: "translateY(-50%)",
              display: "flex",
              alignItems: "center",
              gap: 18,
            }}
          >
            <a
              href="/"
              style={{ textDecoration: "none", color: "#1e3a8a", fontWeight: 600 }}
            >
              Home
            </a>
            <a
              href="/reports"
              style={{ textDecoration: "none", color: "#1e3a8a", fontWeight: 600 }}
            >
              Reports
            </a>
            <a
              href="/settings"
              style={{ textDecoration: "none", color: "#1e3a8a", fontWeight: 600 }}
            >
              Settings
            </a>
            <a
              href="/profile"
              style={{ textDecoration: "none", color: "#1e3a8a", fontWeight: 600 }}
            >
              Profile
            </a>

            <HeaderImportDropdown onStartImport={handleHeaderImport} />

            <button
              type="button"
              onClick={handleLogout}

              style={{
                background: "#1e3a8a",
                color: "#ffffff",
                border: "none",
                padding: "6px 14px",
                borderRadius: 8,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Logout
            </button>
          </nav>

          <h2
            className="page-title"
            style={{
              margin: 0,
              fontSize: 24,
              fontWeight: 700,
              color: "#1e3a8a",
              textAlign: "center",
              letterSpacing: 0.5,
            }}
          >
            {prettyTitle(page)}
          </h2>
        </header>

        <section className="content-area">{renderPage()}</section>
      </main>
    </div>
  );
}
