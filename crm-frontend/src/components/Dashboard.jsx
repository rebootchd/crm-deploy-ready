// src/components/Dashboard.jsx
import React, { useState } from "react";
import { api } from "../services/api";


export default function Dashboard({
  employees = [],
  clients = [],
  projects = [],
  assignments = [],
  leads = [],
  calllogs = [],
  followups = [],
  tracking = [],
  setPage = null,

}) {
  const [modalOpen, setModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState("");
  const [modalItems, setModalItems] = useState([]);
  const [modalType, setModalType] = useState(""); // 'tracking' | 'status' | ''
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [workGivenList, setWorkGivenList] = useState([]);
  const [workPanelEmployee, setWorkPanelEmployee] = useState(null);
  const [workForm, setWorkForm] = useState({
    title: "",
    description: "",
    submission_date: "",
    priority: "Medium",
  });

  const debug = (tag, v) => {
    try {
      console.log(`[DBG] ${tag}`, v);
    } catch (e) {}
  };

  // --- Helpers ---
  const getEmployeeId = (a) =>
    a?.employeeId ?? a?.employee ?? a?.employee_id ?? null;
  const getWorkType = (a) => a?.workType ?? a?.work_type ?? "";
  const getWorkId = (a) => a?.workId ?? a?.work_id ?? a?.work ?? null;

  // --- Compute status buckets ---
  const computeLeadStatus = () => {
    let red = 0,
      yellow = 0,
      green = 0;
    const redList = [],
      yellowList = [],
      greenList = [];

    (leads || []).forEach((l) => {
      const s = (l?.status || "").toLowerCase();
      if (s === "new" || s === "lost") {
        red++;
        redList.push(l);
      } else if (s === "contacted" || s === "qualified") {
        yellow++;
        yellowList.push(l);
      } else if (s === "converted" || s === "won") {
        green++;
        greenList.push(l);
      } else {
        yellow++;
        yellowList.push(l);
      }
    });

    return { red, yellow, green, redList, yellowList, greenList };
  };

  const computeProjectStatus = () => {
    let red = 0,
      yellow = 0,
      green = 0;
    const redList = [],
      yellowList = [],
      greenList = [];

    (projects || []).forEach((p) => {
      const prog = Number(p?.progress ?? p?.progress_percent ?? 0);
      if (Number.isNaN(prog) || prog <= 0) {
        red++;
        redList.push(p);
      } else if (prog < 100) {
        yellow++;
        yellowList.push(p);
      } else {
        green++;
        greenList.push(p);
      }
    });

    return { red, yellow, green, redList, yellowList, greenList };
  };

  const computeClientStatus = () => {
    const redList = [],
      greenList = [];
    (clients || []).forEach((c) => {
      if (c?.assigned == null) redList.push(c);
      else greenList.push(c);
    });
    return {
      red: redList.length,
      yellow: 0,
      green: greenList.length,
      redList,
      yellowList: [],
      greenList,
    };
  };

  const computeEmployeeStatus = () => {
    const greenList = [...(employees || [])];
    return {
      red: 0,
      yellow: 0,
      green: greenList.length,
      redList: [],
      yellowList: [],
      greenList,
    };
  };

  const computeAssignmentStatus = () => {
    let red = 0,
      yellow = 0,
      green = 0;
    const redList = [],
      yellowList = [],
      greenList = [];

    (assignments || []).forEach((a) => {
      const workType = getWorkType(a);
      const workId = getWorkId(a);

      if (workType === "project") {
        const p = projects.find((px) => Number(px?.id) === Number(workId));
        const prog = p ? Number(p?.progress ?? 0) : null;
        if (prog === null) {
          yellow++;
          yellowList.push(a);
        } else if (prog <= 0) {
          red++;
          redList.push(a);
        } else if (prog < 100) {
          yellow++;
          yellowList.push(a);
        } else {
          green++;
          greenList.push(a);
        }
      } else if (workType === "lead" || workType === "leads") {
        const l = leads.find((ll) => Number(ll?.id) === Number(workId));
        if (!l) {
          yellow++;
          yellowList.push(a);
        } else {
          const s = (l?.status || "").toLowerCase();
          if (s === "new" || s === "lost") {
            red++;
            redList.push(a);
          } else if (s === "contacted" || s === "qualified") {
            yellow++;
            yellowList.push(a);
          } else {
            green++;
            greenList.push(a);
          }
        }
      } else {
        yellow++;
        yellowList.push(a);
      }
    });

    return { red, yellow, green, redList, yellowList, greenList };
  };

  const computeCallLogStatus = () => {
  const total = Array.isArray(calllogs) ? calllogs.length : 0;

  // When calllogs are coming from summary count (empty objects),
  // treat all as "done" by default
  return {
    red: 0,
    yellow: 0,
    green: total,
    redList: [],
    yellowList: [],
    greenList: calllogs || [],
  };
};



  // --- Metrics ---
  const leadStatus = computeLeadStatus();
  const projectStatus = computeProjectStatus();
  const clientStatus = computeClientStatus();
  const employeeStatus = computeEmployeeStatus();
  const assignmentStatus = computeAssignmentStatus();
  const calllogStatus = computeCallLogStatus();


  const metrics = [
    {
      key: "employees",
      title: "Employees",
      desc: "Manage employees and roles",
      count: employees?.length ?? 0,
      status: employeeStatus,
    },
    {
      key: "leads",
      title: "Leads",
      desc: "Active leads in funnel",
      count: leads?.length ?? 0,
      status: leadStatus,
    },
    {
      key: "clients",
      title: "Clients",
      desc: "Current clients",
      count: clients?.length ?? 0,
      status: clientStatus,
    },
    {
      key: "projects",
      title: "Projects",
      desc: "Ongoing work",
      count: projects?.length ?? 0,
      status: projectStatus,
    },
    {
      key: "assignments",
      title: "Assignments",
      desc: "Work assigned to employees",
      count: assignments?.length ?? 0,
      status: assignmentStatus,
    },
    {
      key: "calllogs",
      title: "Call logs",
      desc: "Recent calls",
      count: calllogs?.length ?? 0,
      status: calllogStatus,
    },
    {
      key: "followups",
      title: "Follow ups",
      desc: "Pending follow ups",
      count: followups?.length ?? 0,
      status: { red: 0, yellow: 0, green: 0, redList: [], yellowList: [], greenList: [] },
    },
    {
      key: "tracking",
      title: "Tracking",
      desc: "Real-time tracking",
      count: tracking?.length ?? 0,
      status: { red: 0, yellow: 0, green: 0, redList: [], yellowList: [], greenList: [] },
    },
  ];



  // --- Modal opener ---
  const openStatusModal = (metricKey, color) => {
    debug("openStatusModal called", { metricKey, color });
    const m = metrics.find((mt) => mt.key === metricKey);
    if (!m) return;

    const title = `${m.title} — ${
      color === "red" ? "Not started / Inactive" : color === "yellow" ? "In progress" : "Completed"
    }`;
    let items = [];

    switch (metricKey) {
      case "leads":
        items = color === "red" ? leadStatus.redList : color === "yellow" ? leadStatus.yellowList : leadStatus.greenList;
        break;
      case "projects":
        items =
          color === "red" ? projectStatus.redList : color === "yellow" ? projectStatus.yellowList : projectStatus.greenList;
        break;
      case "clients":
        items = color === "red" ? clientStatus.redList : clientStatus.greenList;
        break;
      case "employees":
        items = color === "green" ? employeeStatus.greenList : [];
        break;
      case "assignments":
        items =
          color === "red"
            ? assignmentStatus.redList
            : color === "yellow"
            ? assignmentStatus.yellowList
            : assignmentStatus.greenList;
        break;

      case "calllogs":
          if (color === "red") {
            // 🔴 Not called / missed
            items = (calllogs || []).filter(
              c =>
                c.__raw?.outcome === "no_answer" ||
                c.__raw?.outcome === "busy"
            );
          } else if (color === "yellow") {
            // 🟡 Follow-ups
            items = (calllogs || []).filter(
              c => c.followUp === true
            );
          } else {
            // 🟢 Completed calls
            items = (calllogs || []).filter(
              c =>
                c.__raw?.called_at ||
                c.__raw?.duration_seconds > 0
            );
          }
          break;



      default:
        items = [];
    }

    const formatted = (items || []).map((it) => {
      if (!it) return "";
      if (metricKey === "leads") return `Lead #${it.id} — ${it.name} (${it.status || "unknown"})`;
      if (metricKey === "projects") return `Project #${it.id} — ${it.title} — ${it.progress ?? 0}%`;
      if (metricKey === "clients") return `Client #${it.id} — ${it.name}`;
      if (metricKey === "employees")
          return {
            type: "employee",
            id: it.id,
            name: it.name,
          };

      if (metricKey === "assignments") {
        const empId = getEmployeeId(it);
        const wType = getWorkType(it);
        const wId = getWorkId(it);
        return `Assignment #${it.id} — ${wType}:${wId} → Employee #${empId ?? "N/A"}`;
      }
      return JSON.stringify(it);
    });

    setModalTitle(title);
    setModalItems(formatted);
    setModalType("status");
    setModalOpen(true);
  };


    const handleWorkGivenCreate = async (e) => {
      e.preventDefault();
      if (!selectedEmployee) return;

      if (!workForm.title || !workForm.submission_date) {
        return alert("Please select title and submission date");
      }

      const payload = {
        employee: selectedEmployee.id,
        title: workForm.title,
        description: workForm.description,
        submission_date: workForm.submission_date,
        priority: workForm.priority,
      };

      const optimisticItem = {
        id: `temp-${Date.now()}`,
        title: workForm.title,
        description: workForm.description,
        submission_date: workForm.submission_date,
        priority: workForm.priority,
        status: "PENDING",
        given_on: new Date().toISOString().slice(0, 10),
      };

      setWorkGivenList((prev) => [optimisticItem, ...(prev || [])]);

      try {
        await api.createWorkGiven(payload);
        const res = await api.workGivenList({
          entity_type: "EMPLOYEE",
          entity_id: selectedEmployee.id,
        });
        const list = Array.isArray(res.data) ? res.data : res.data.results || [];
        setWorkGivenList(list);
        setWorkForm({
          title: "",
          description: "",
          submission_date: "",
          priority: "Medium",
        });
      } catch (err) {
        alert("Work save failed");
      }
    };




    const handleViewDetails = (key) => {
      debug("handleViewDetails called for", key);

      if (key === "calllogs") {
        setPage && setPage("calllogs");
        return;
      }


      // Tracking always opens full page
      if (key === "tracking") {
        if (typeof setPage === "function") {
          setPage("tracking");
        }
        return;
      }

      // Fix assignments → assign
      if (key === "assignments") {
        setPage && setPage("assign");
        return;
      }

      // Normal navigation
      if (typeof setPage === "function") {
        setPage(key);
        return;
      }

      openStatusModal(key, "yellow");
    };


  return (
    <div className="dashboard">
      <div className="cards-grid">
        {metrics.map((m) => (
          <div key={m.key} className="card" aria-live="polite">
            <div className="card-head">
              <div className="card-icon" aria-hidden>
                {m.key === "employees" && "🧑‍💼"}
                {m.key === "leads" && "📋"}
                {m.key === "clients" && "🤝"}
                {m.key === "projects" && "🧾"}
                {m.key === "assignments" && "🎯"}
                {m.key === "calllogs" && "📞"}
                {m.key === "followups" && "⏰"}
                {m.key === "tracking" && "📈"}
              </div>
              <div>
                <h3>{m.title}</h3>
                <p className="muted">{m.desc}</p>
              </div>
            </div>

            <div className="card-body">
              <div className="metric">{m.count}</div>
              <button type="button" className="btn small" onClick={() => handleViewDetails(m.key)}>
                View Details
              </button>
            </div>

            <div className="card-status">
              {["red", "yellow", "green"].map((color) => (
                <div
                  key={color}
                  className="status-item clickable"
                  title={color === "red" ? "Not started / inactive" : color === "yellow" ? "In progress" : "Completed"}
                  onClick={() => openStatusModal(m.key, color)}
                >
                  <span className={`status-dot ${color}`} />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>



      {/* Insights Section */}
      <section className="dashboard-lower single-panel">
        <div className="panel">
          <h4>Quick Insights</h4>
          <p className="muted">Leads are converting at ~12% in this demo. Projects with due dates are shown on the calendar.</p>

          <div style={{ marginTop: 12 }}>
            <svg viewBox="0 0 300 120" width="100%" height="120">
              {[3, 6, 2, 9, 4, 7].map((v, idx) => (
                <rect key={idx} x={idx * 46 + 8} y={120 - v * 12} width={32} height={v * 12} rx="6" fill="#10b981" />
              ))}
            </svg>
          </div>
        </div>
      </section>

        {/* ================= MAIN STATUS MODAL ================= */}
        {modalOpen && (
          <div className="modal-backdrop" role="dialog" aria-modal="true">
            <div className="modal">
              <div className="modal-head">
                <h3>{modalTitle}</h3>
                <button className="modal-close" onClick={() => setModalOpen(false)}>
                  ✕
                </button>
              </div>

              <div className="modal-body" style={{ display: "flex", gap: 18 }}>
                {modalType === "tracking" ? null : (

                  <div>
                    {modalItems.length === 0 ? (
                      <p className="muted">No items found for this status.</p>
                    ) : (
                      <ul className="list">
                        {modalItems.map((it, idx) => {
                          if (it?.type === "employee") {
                            return (
                              <li
                                key={idx}
                                style={{
                                  cursor: "pointer",
                                  color: "#2563eb",
                                  textDecoration: "underline",
                                  fontWeight: 600,
                                }}
                                onClick={() => {
                                  const emp = employees.find(
                                    (e) => e.id === it.id
                                  );
                                  if (emp) {
                                    setWorkPanelEmployee(emp);
                                    setSelectedEmployee(emp);
                                  }
                                  setModalOpen(false);
                                }}
                              >
                                Employee #{it.id} — {it.name}
                              </li>
                            );
                          }
                          return <li key={idx}>{String(it)}</li>;
                        })}
                      </ul>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        {/* ================= END STATUS MODAL ================= */}


        {/* ================= WORK GIVEN MODAL ================= */}
        {workPanelEmployee && (
          <div className="modal-backdrop">
            <div className="modal" style={{ width: 820 }}>
              <div className="modal-head">
                <h3>Work Given — {workPanelEmployee.name}</h3>
                <button
                  className="modal-close"
                  onClick={() => setWorkPanelEmployee(null)}
                >
                  ✕
                </button>
              </div>

              <div className="modal-body">
                <form
                  onSubmit={handleWorkGivenCreate}
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 12,
                  }}
                >
                  {/* 🔸 First row */}
                  <div style={{ display: "flex", gap: 12, width: "100%" }}>
                    <select
                      value={workForm.title}
                      onChange={(e) =>
                        setWorkForm({ ...workForm, title: e.target.value })
                      }
                      style={{
                        flex: 2,
                        padding: 12,
                        borderRadius: 8,
                        border: "1px solid #e5e7eb",
                      }}
                      required
                    >
                      <option value="">Select service</option>
                      <option value="Service A">Service A</option>
                      <option value="Service B">Service B</option>
                      <option value="Service C">Service C</option>
                      <option value="Service D">Service D</option>
                    </select>

                    <input
                      type="date"
                      value={workForm.submission_date}
                      onChange={(e) =>
                        setWorkForm({
                          ...workForm,
                          submission_date: e.target.value,
                        })
                      }
                      style={{
                        flex: 1,
                        padding: 12,
                        borderRadius: 8,
                        border: "1px solid #e5e7eb",
                      }}
                      required
                    />

                    <select
                      value={workForm.priority}
                      onChange={(e) =>
                        setWorkForm({
                          ...workForm,
                          priority: e.target.value,
                        })
                      }
                      style={{
                        flex: 1,
                        padding: 12,
                        borderRadius: 8,
                        border: "1px solid #e5e7eb",
                        minWidth: 120,
                      }}
                      required
                    >
                      <option value="High">High</option>
                      <option value="Medium">Medium</option>
                      <option value="Low">Low</option>
                    </select>
                  </div>

                  {/* 🔸 Second row */}
                  <textarea
                    placeholder="Description"
                    value={workForm.description}
                    onChange={(e) =>
                      setWorkForm({
                        ...workForm,
                        description: e.target.value,
                      })
                    }
                    style={{
                      width: "100%",
                      padding: 12,
                      borderRadius: 8,
                      border: "1px solid #e5e7eb",
                      minHeight: 80,
                    }}
                  />

                  {/* 🔸 Button row */}
                  <div style={{ width: "100%" }}>
                    <button type="submit" className="btn3d blue">
                      Assign Work
                    </button>
                  </div>
                </form>

                <h4 style={{ marginTop: 20 }}>Work history</h4>

                <table className="table">
                  <thead>
                    <tr>
                      <th>Title</th>
                      <th>Due Date</th>
                      <th>Priority</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {workGivenList.length === 0 ? (
                      <tr>
                        <td colSpan="4" className="muted">
                          No work assigned yet
                        </td>
                      </tr>
                    ) : (
                      workGivenList.map((w) => (
                        <tr key={w.id}>
                          <td>{w.title}</td>
                          <td>{w.submission_date}</td>
                          <td>{w.priority}</td>
                          <td>{w.status}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
        {/* ================= END WORK GIVEN MODAL ================= */}
      </div>
  );
}


