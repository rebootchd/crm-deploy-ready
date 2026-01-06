import React, { useEffect, useMemo, useState, useCallback } from "react";
import axios from "axios";

const BASE_URL = "http://127.0.0.1:8000/crm/v1/call-logs/";

export default function CallLogs() {
  const [logs, setLogs] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showEditModal, setShowEditModal] = useState(false);
  const [editData, setEditData] = useState(null);
  const [showFollowUps, setShowFollowUps] = useState(false);
  const [dayFilter, setDayFilter] = useState("all");



  const [form, setForm] = useState({
    name: "",
    phone: "",
    duration: "",
    assigned: "",
    called_at: "",
    notes: "",
    call_type: "outbound",
    outcome: "other",
  });



  // Helpers
  const toDateTimeLocal = (ts) => {
    if (!ts) return "";
    const d = new Date(ts);
    if (isNaN(d.getTime())) {
      const s = String(ts);
      if (s.includes("T")) return s.slice(0, 16);
      return `${s}T00:00`;
    }
    const pad = (n) => String(n).padStart(2, "0");
    const yyyy = d.getFullYear();
    const mm = pad(d.getMonth() + 1);
    const dd = pad(d.getDate());
    const hh = pad(d.getHours());
    const min = pad(d.getMinutes());
    return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
  };

  const fromDateTimeLocal = (s) => s || "";

  const getEmployeeName = useCallback(
    (id) => {
      if (id === null || id === undefined || id === "") return "-";
      const num = Number(id);
      const emp = employees.find((e) => e.id === num);
      return emp ? emp.name : String(id);
    },
    [employees]
  );

  const formatSeconds = (total) => {
    const t = Number(total) || 0;
    const h = Math.floor(t / 3600);
    const m = Math.floor((t % 3600) / 60);
    const s = t % 60;
    if (h > 0)
      return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  // Normalize row
  const normalizeRow = useCallback(
    (x) => {
      const assignedDisplay = x.assigned_display || getEmployeeName(x.assigned ?? x.assigned_to);

      const name =
        x.name ||
        x.lead_name ||
        x.client_name ||
        x.lead_display ||
        x.client_display ||
        "Unknown";

      const phone =
        x.phone ||
        x.phone_number ||
        x.mobile ||
        x.to_number ||
        x.from_number ||
        x.caller_phone ||
        "-";


      const calledAt = x.called_at ?? x.start_time ?? x.call_time ?? x.created_at ?? null;

      const durationVal =
        typeof x.duration_seconds === "number"
          ? formatSeconds(x.duration_seconds)
          : "-";

      const outcome =
         x.outcome
           ? x.outcome.replace("_", " ")
           : "-";


      return {
        id: x.id,
        name,
        phone,
        outcome,
        duration: durationVal,
        calledAt: calledAt ? new Date(calledAt).toLocaleString() : "",
        assigned: assignedDisplay || "",
        followUp: x.follow_up || false,
        __raw: x,
      };
    },
    [getEmployeeName]
  );

  // Load employees
  useEffect(() => {
    fetch("http://127.0.0.1:8000/crm/v1/employees/")
      .then((res) => res.json())
      .then((data) => {
        const list = Array.isArray(data) ? data : data.results || [];
        setEmployees(list);
      })
      .catch((err) => {
        console.error("Employees Load Error:", err);
        setEmployees([]);
      });
  }, []);

  // Fetch logs
  const fetchLogs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await axios.get(BASE_URL);
      const raw = Array.isArray(r.data) ? r.data : r.data.results ?? r.data;
      const normalized = (raw || []).map(normalizeRow);
      setLogs(normalized);
    } catch (err) {
      setError(err.response?.data || err.message || "Failed to fetch call logs");
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }, [normalizeRow]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const toggleFollowUp = useCallback(
    async (id) => {
      try {
        await axios.patch(
          `http://127.0.0.1:8000/crm/v1/call-logs/${id}/toggle_follow_up/`
        );
        await fetchLogs();
      } catch {
        alert("Failed to toggle follow-up");
      }
    },
    [fetchLogs]
  );

  const totalCalls = logs.length;
  const missedCalls = logs.filter(
    l => l.__raw?.outcome === "no_answer" || l.__raw?.outcome === "busy"
  ).length;
  const followUps = logs.filter(l => l.followUp).length;
  const answeredCalls = totalCalls - missedCalls;

  // Create handler
  const handleCreate = async (e) => {
      e.preventDefault();

      // 1️⃣ Phone first
      if (!form.phone || !form.phone.trim()) {
        alert("Phone number required");
        return;
      }



      setSaving(true);
      setError(null);



    try {
      const payload = {
        name: form.name || "",
        phone: form.phone || "",
        call_type: form.call_type || "outbound",
        called_at: form.called_at || new Date().toISOString(),
        duration_seconds: Number(form.duration) || 0,
        outcome: form.outcome || "other",
        notes: form.notes || "",
        follow_up: Boolean(form.follow_up),
        is_missed: form.is_missed || false,
        assigned: form.assigned ? Number(form.assigned) : null,
      };

      await axios.post(BASE_URL, payload);

      setForm({
        name: "",
        phone: "",
        call_type: "outbound",
        called_at: "",
        duration: "",
        outcome: "other",
        follow_up: false,
        is_missed: false,
        notes: "",
        assigned: "",

      });

      fetchLogs();
    } catch (err) {
      console.error("Error creating call log:", err.response?.data || err.message);
      setError(
        `Failed to create call log: ${JSON.stringify(
          err.response?.data || err.message
        )}`
      );
    } finally {
      setSaving(false);
    }
  };

  // Reset form
  const handleReset = () => {
    setForm({
      name: "",
      phone: "",
      duration: "",
      assigned: "",
      called_at: "",
      notes: "",
      call_type: "outbound",
      outcome: "other",
    });
    setError(null);
  };

  // Edit handler
  const handleEdit = (row) => {
    const r = row.__raw || {};
    setEditData({
      id: row.id,
      name: row.name || r.name || r.client_display || r.lead_display || "",
      phone:
        row.phone ||
        r.phone ||
        r.caller_phone ||
        r.to_number ||
        r.from_number ||
        r.phone_number ||
        "",
      related_type:
        r.related_type || (r.client ? "client" : r.lead ? "lead" : r.project ? "project" : r.invoice ? "invoice" : r.assignment ? "assignment" : ""),
      related_id: r.related_id || r.client || r.lead || r.project || r.invoice || r.assignment || "",
      duration: r.duration_seconds ?? r.duration ?? "",
      assigned: r.assigned ?? r.assigned_to ?? "",
      called_at: toDateTimeLocal(r.called_at || r.start_time || r.call_time || r.created_at),
      notes: r.notes ?? r.note ?? "",
      call_type: r.call_type ?? r.callType ?? "outbound",
      outcome: r.outcome ?? r.result ?? "other",
    });
    setShowEditModal(true);
  };

  // Update handler
  const handleUpdate = async () => {
    if (!editData?.id) return alert("No call log selected");

    const payload = {
      call_type: editData.call_type,
      outcome: editData.outcome,
      note: editData.notes === null ? "" : String(editData.notes ?? ""),
      phone: editData.phone || undefined,
      called_at: fromDateTimeLocal(editData.called_at) || undefined,
    };

    if (editData.assigned) payload.assigned = Number(editData.assigned);
    if (editData.duration) payload.duration_seconds = Number(editData.duration);

    if (editData.related_type && editData.related_id) {
      const rid = Number(editData.related_id);
      if (editData.related_type === "lead") payload.lead = rid;
      else if (editData.related_type === "client") payload.client = rid;
    }

    Object.keys(payload).forEach((k) => payload[k] === undefined && delete payload[k]);

    try {
      await axios.patch(`${BASE_URL}${editData.id}/`, payload);
      alert("Call log updated successfully!");
      setShowEditModal(false);
      fetchLogs();
    } catch (err) {
      alert("Failed to update: " + (err.response?.data ? JSON.stringify(err.response.data) : err.message));
    }
  };

  // Delete handler
  const handleDelete = async (id) => {
    if (!window.confirm("Delete this call log?")) return;
    try {
      await axios.delete(`${BASE_URL}${id}/`);
      setLogs((prev) => prev.filter((x) => x.id !== id));
    } catch (err) {
      alert("Failed to delete call log: " + (err.response?.data ? JSON.stringify(err.response.data) : err.message));
    }
  };

  const viewCols = useMemo(() => {
    return {
      name: (row) => row.name || "-",
      phone: (row) => row.phone || "-",
      duration: (row) => row.duration || "-",
      outcome: (row) => row.outcome || "-",
      assigned: (row) => row.assigned_name || row.assigned || "-",
      calledAt: (row) => row.calledAt || "-",

    };
  }, []);

  return (
    <div style={{ padding: 40, background: "#f8fafc", minHeight: "100vh" }}>
      <div style={{ background: "white", padding: 25, borderRadius: 16, boxShadow: "0 4px 20px rgba(0,0,0,0.1)", marginTop: 20 }}>
        <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 12 }}>Call Logs</h2>

        <form onSubmit={handleCreate} style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 18 }}>
          <input 
            type="text" 
            placeholder="Name" 
            value={form.name || ""} 
            onChange={(e) => setForm({ ...form, name: e.target.value })} 
            style={inputStyle} 
          />
          <input 
            type="text" 
            placeholder="Phone" 
            value={form.phone || ""} 
            onChange={(e) => setForm({ ...form, phone: e.target.value })} 
            style={inputStyle} 
          />

          <input 
            type="number" 
            placeholder="Duration (seconds)" 
            value={form.duration} 
            onChange={(e) => setForm({ ...form, duration: e.target.value })} 
            style={inputStyle} 
          />

          <select 
            value={form.assigned || ""} 
            onChange={(e) => setForm({ ...form, assigned: e.target.value })} 
            style={inputStyle}
          >
            <option value="">Assign to (optional)</option>
            {employees.map((emp) => (
              <option key={emp.id} value={emp.id}>{emp.name}</option>
            ))}
          </select>

          <input 
            type="datetime-local" 
            value={form.called_at} 
            onChange={(e) => setForm({ ...form, called_at: e.target.value })} 
            style={inputStyle} 
          />

          <select 
            value={form.call_type} 
            onChange={(e) => setForm({ ...form, call_type: e.target.value })} 
            style={inputStyle}
          >
            <option value="outbound">Outbound</option>
            <option value="inbound">Inbound</option>
          </select>

          <select 
            value={form.outcome} 
            onChange={(e) => setForm({ ...form, outcome: e.target.value })} 
            style={inputStyle}
          >
            <option value="connected">Connected</option>
            <option value="voicemail">Voicemail</option>
            <option value="no_answer">No Answer</option>
            <option value="busy">Busy</option>
            <option value="other">Other</option>
          </select>

          <input 
            type="text" 
            placeholder="Notes" 
            value={form.notes} 
            onChange={(e) => setForm({ ...form, notes: e.target.value })} 
            style={inputStyle} 
          />

          <button type="submit" className="btn3d blue" disabled={saving}>
            {saving ? "Creating..." : "Create"}
          </button>
          <button type="button" className="btn3d red" onClick={handleReset}>Reset</button>
        </form>

        <div style={{ display: "flex", gap: 10, marginBottom: 15, flexWrap: "wrap" }}>
          <button
            className="btn3d blue"
            onClick={() => setShowFollowUps(!showFollowUps)}
          >
            {showFollowUps ? "Show All Calls" : "Show Follow-ups 🔔"}
          </button>

          <button 
            className={`btn3d ${dayFilter === "today" ? "blue" : "gray"}`}
            onClick={() => setDayFilter("today")}
          >
            Today
          </button>
          <button 
            className={`btn3d ${dayFilter === "yesterday" ? "blue" : "gray"}`}
            onClick={() => setDayFilter("yesterday")}
          >
            Yesterday
          </button>
          <button 
            className={`btn3d ${dayFilter === "all" ? "blue" : "gray"}`}
            onClick={() => setDayFilter("all")}
          >
            All
          </button>
        </div>

        <div style={{ display: "flex", gap: 20, marginBottom: 15 }}>
          <b>Total: {totalCalls}</b>
          <b>Answered: {answeredCalls}</b>
          <b>Missed: {missedCalls}</b>
          <b>Follow-ups 🔔: {followUps}</b>
        </div>

        <div style={tableContainer}>
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 10 }}>
            <input 
              type="text" 
              placeholder="Search..." 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)} 
              style={{ padding: "12px 12px", borderRadius: 8, border: "1px solid #ccc", width: 260 }} 
            />
          </div>

          <table style={tableStyle}>
            <thead style={theadStyle}>
              <tr>
                <th style={thCell}>ID</th>
                <th style={thCell}>Name</th>
                <th style={thCell}>Phone</th>
                <th style={thCell}>Duration</th>
                <th style={thCell}>Outcome</th>
                <th style={thCell}>Assigned</th>
                <th style={thCell}>Called At</th>
                <th style={thCell}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="8" style={{ textAlign: "center", padding: 20 }}>
                  {error ? `Error: ${JSON.stringify(error)}` : "Loading call logs..."}
                </td></tr>
              ) : logs.length === 0 ? (
                <tr><td colSpan="8" style={{ textAlign: "center", padding: 20 }}>No call logs found.</td></tr>
              ) : (
                logs
                  .filter((row) =>
                    [viewCols.name(row), viewCols.phone(row),  viewCols.assigned(row)]
                      .some((f) => String(f || "").toLowerCase().includes(searchTerm.toLowerCase()))
                  )
                  .filter(row => {
                    if (dayFilter === "all") return true;

                    const d = new Date(row.calledAt);
                    const today = new Date();

                    if (dayFilter === "today") {
                      return d.toDateString() === today.toDateString();
                    }

                    if (dayFilter === "yesterday") {
                      const y = new Date();
                      y.setDate(today.getDate() - 1);
                      return d.toDateString() === y.toDateString();
                    }

                    return true;
                  })
                  .filter(row => !showFollowUps || row.followUp)
                  .map((row) => (
                    <tr key={row.id}>
                      <td style={tdCell}>{row.id}</td>
                      <td style={tdCell}>
                        <span
                          style={{ cursor: "pointer", marginRight: 6 }}
                          onClick={() => toggleFollowUp(row.id)}
                        >
                          {row.followUp ? "🔔" : "🔕"}
                        </span>
                        {row.name || "-"}
                      </td>
                      <td style={tdCell}>{row.phone || "-"}</td>
                      <td style={tdCell}>{row.duration || "00:00"}</td>
                       <td>{row.outcome || "-"}</td>      {/* ✅ Outcome */}
                       <td>{row.assigned || "-"}</td>
                      <td style={tdCell}>{row.calledAt || "-"}</td>
                      <td style={tdCell}>
                        <div style={{ display: "flex", gap: 10 }}>
                          <button className="btn3d blue" onClick={() => handleEdit(row)}>Edit</button>
                          <button className="btn3d red" onClick={() => handleDelete(row.id)}>Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))
              )}
            </tbody>
          </table>
        </div>

        {error && <p style={{ color: "red", marginTop: 10 }}>{typeof error === "string" ? error : JSON.stringify(error)}</p>}
      </div>

      {showEditModal && editData && (
        <div style={modalOverlay}>
          <div style={modalBox}>
            <h3>Edit Call Log</h3>

            <input 
              type="text" 
              value={editData.name} 
              onChange={(e) => setEditData({ ...editData, name: e.target.value })} 
              style={inputStyle} 
              placeholder="Name" 
            />
            <input 
              type="text" 
              value={editData.phone} 
              onChange={(e) => setEditData({ ...editData, phone: e.target.value })} 
              style={inputStyle} 
              placeholder="Phone" 
            />

            <input 
              type="number" 
              value={editData.duration} 
              onChange={(e) => setEditData({ ...editData, duration: e.target.value })} 
              style={inputStyle} 
              placeholder="Duration (seconds)" 
            />

            <select 
              value={editData.assigned || ""} 
              onChange={(e) => setEditData({ ...editData, assigned: e.target.value })} 
              style={inputStyle}
            >
              <option value="">Assign to (optional)</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>{emp.name}</option>
              ))}
            </select>

            <input 
              type="datetime-local" 
              value={editData.called_at} 
              onChange={(e) => setEditData({ ...editData, called_at: e.target.value })} 
              style={inputStyle} 
            />

            <select 
              value={editData.call_type || "outbound"} 
              onChange={(e) => setEditData({ ...editData, call_type: e.target.value })} 
              style={inputStyle}
            >
              <option value="outbound">Outbound</option>
              <option value="inbound">Inbound</option>
            </select>

            <select 
              value={editData.outcome || "other"} 
              onChange={(e) => setEditData({ ...editData, outcome: e.target.value })} 
              style={inputStyle}
            >
              <option value="connected">Connected</option>
              <option value="voicemail">Voicemail</option>
              <option value="no_answer">No Answer</option>
              <option value="busy">Busy</option>
              <option value="other">Other</option>
            </select>

            <input 
              type="text" 
              value={editData.notes ?? ""} 
              onChange={(e) => setEditData({ ...editData, notes: e.target.value })} 
              style={inputStyle} 
              placeholder="Notes" 
            />

            <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
              <button className="btn3d blue" onClick={handleUpdate}>Update</button>
              <button className="btn3d red" onClick={() => setShowEditModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .btn3d { 
          border: none; 
          padding: 8px 14px; 
          color: #fff; 
          border-radius: 8px; 
          font-weight: 600; 
          box-shadow: 0 4px #999; 
          transition: all 0.1s ease-in-out; 
          cursor: pointer; 
        }
        .btn3d:active { 
          transform: translateY(2px); 
          box-shadow: 0 2px #666; 
        }
        .btn3d:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .btn3d.blue { 
          background: linear-gradient(145deg, #2563eb, #1e40af); 
        }
        .btn3d.red { 
          background: linear-gradient(145deg, #ef4444, #b91c1c); 
        }
        .btn3d.gray { 
          background: linear-gradient(145deg, #6b7280, #4b5563); 
        }
      `}</style>
    </div>
  );
}

// Styles
const inputStyle = { 
  flex: 1, 
  padding: "10px", 
  borderRadius: "8px", 
  border: "1px solid #ccc", 
  minWidth: 150 
};

const tableContainer = { 
  overflowX: "auto", 
  overflowY: "auto", 
  maxHeight: 500, 
  borderRadius: 12, 
  background: "#fff", 
  boxShadow: "0 2px 6px rgba(0,0,0,0.06)", 
  marginTop: 16 
};

const theadStyle = { 
  background: "#f8fafc", 
  fontWeight: 700, 
  position: "sticky", 
  top: 0, 
  zIndex: 1, 
  textAlign: "left" 
};

const tableStyle = { 
  width: "100%", 
  borderSpacing: "0 10px", 
  textAlign: "left", 
  borderCollapse: "separate" 
};

const thCell = { padding: "12px 16px" };
const tdCell = { padding: "8px 16px" };

const modalOverlay = { 
  position: "fixed", 
  top: 0, 
  left: 0, 
  right: 0, 
  bottom: 0, 
  background: "rgba(0,0,0,0.5)", 
  display: "flex", 
  justifyContent: "center", 
  alignItems: "center", 
  zIndex: 1000 
};

const modalBox = { 
  background: "#fff", 
  padding: 20, 
  borderRadius: 10, 
  width: 480, 
  maxHeight: "90vh",
  overflowY: "auto",
  boxShadow: "0 10px 30px rgba(0,0,0,0.2)"
};


