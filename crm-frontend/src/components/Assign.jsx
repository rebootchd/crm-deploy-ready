// src/components/Assign.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";

const BASE_URL = "http://127.0.0.1:8000/crm/assignments/";

export default function Assign() {
  const [assignments, setAssignments] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showEditModal, setShowEditModal] = useState(false);
  const [editData, setEditData] = useState(null);

  // Work type choices: replaced by OPTIONS if backend provides real list
  const [WORK_TYPE_CHOICES, setWorkTypeChoices] = useState([
    { label: "Project",    value: "project" },
    { label: "Lead",       value: "lead" },
    { label: "Client",     value: "client" },
    { label: "Invoice",    value: "invoice" },
    { label: "Assignment", value: "assignment" },
  ]);

  const [form, setForm] = useState({
    employee: "",
    work_type: "",
    work_id: "",
    assigned_at: "",
    notes: "",
  });

  // Helpers
  const toDateInput = (iso) => (iso ? String(iso).split("T")[0] : "");
  const getEmployeeName = (id) => {
    const emp = employees.find((e) => e.id === Number(id));
    return emp ? emp.name : id || "-";
  };

  // Try to load work_type choices via OPTIONS (DRF metadata)
  useEffect(() => {
    const fetchChoicesViaOptions = async () => {
      try {
        const meta = await axios.options(BASE_URL);
        const actions = meta.data.actions || meta.data;
        const field =
          actions?.POST?.work_type ||
          actions?.PUT?.work_type ||
          actions?.PATCH?.work_type ||
          meta.data?.work_type;

        let choices = [];
        if (field) {
          if (Array.isArray(field.choices)) {
            choices = field.choices.map((c) =>
              typeof c === "string"
                ? { value: c, label: c }
                : { value: c[0] ?? c.value, label: c[1] ?? c.label ?? c.display_name ?? c.value }
            );
          } else if (Array.isArray(field)) {
            choices = field.map((c) =>
              typeof c === "string"
                ? { value: c, label: c }
                : { value: c.value ?? c[0], label: c.label ?? c[1] ?? c.value }
            );
          }
        }
        if (choices.length) {
          setWorkTypeChoices(choices);
          console.log("Loaded work_type choices from OPTIONS:", choices);
        } else {
          console.log("No work_type choices from OPTIONS; using defaults.");
        }
      } catch (e) {
        console.log("OPTIONS not available; using default WORK_TYPE_CHOICES.");
      }
    };
    fetchChoicesViaOptions();
  }, []);

  // Load employees
  useEffect(() => {
    (async () => {
      try {
        const r = await axios.get("http://127.0.0.1:8000/crm/employees/");
        const data = Array.isArray(r.data) ? r.data : r.data.results ?? r.data;
        setEmployees(data || []);
      } catch {
        setEmployees([]);
      }
    })();
  }, []);

  // Fetch assignments
  const fetchAssignments = async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await axios.get(BASE_URL);
      const data = Array.isArray(r.data) ? r.data : r.data.results ?? r.data;
      setAssignments(data || []);
    } catch (err) {
      setError(err.response?.data || err.message || "Failed to fetch assignments");
      setAssignments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignments();
  }, []);

  // Build variants for work_type to try if server rejects initial token
  const workTypeVariants = (raw) => {
    if (!raw && raw !== 0) return [null];
    const s = String(raw).trim();
    const list = [
      s,
      s.toLowerCase(),
      s.toUpperCase(),
      s.replace(/\s+/g, "_").toLowerCase(),
      s.replace(/\s+/g, "_").toUpperCase(),
      s.replace(/\s+/g, "-").toLowerCase(),
      s.replace(/\s+/g, "-").toUpperCase(),
    ];
    WORK_TYPE_CHOICES.forEach((c) => {
      list.push(String(c.value));
      list.push(String(c.label));
      list.push(String(c.value).toLowerCase());
      list.push(String(c.value).toUpperCase());
    });
    return [...new Set(list.filter(Boolean))];
  };

  const tryCreateWithWorkTypeVariants = async (payloadBase) => {
    const variants = workTypeVariants(payloadBase.work_type);
    let lastErr = null;
    for (let i = 0; i < variants.length; i++) {
      const v = variants[i];
      const payload = { ...payloadBase, work_type: v };
      try {
        const r = await axios.post(BASE_URL, payload);
        return { ok: true, data: r.data };
      } catch (err) {
        lastErr = err;
        // continue trying other variants
      }
    }
    return { ok: false, error: lastErr };
  };

  // Create
  const handleCreate = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const payloadBase = {
      employee: form.employee ? Number(form.employee) : null,
      work_type: form.work_type || "",
      work_id: form.work_id ? Number(form.work_id) : null,
      assigned_at: form.assigned_at || "",
      notes: form.notes ?? "",
    };

    try {
      // direct attempt
      await axios.post(BASE_URL, payloadBase);
      setForm({ employee: "", work_type: "", work_id: "", assigned_at: "", notes: "" });
      fetchAssignments();
    } catch (err) {
      // fallback attempts with variants
      const result = await tryCreateWithWorkTypeVariants(payloadBase);
      if (result.ok) {
        setForm({ employee: "", work_type: "", work_id: "", assigned_at: "", notes: "" });
        fetchAssignments();
      } else {
        const server = err.response?.data ?? result.error?.response?.data ?? err.message;
        const msg = typeof server === "string" ? server : JSON.stringify(server);
        setError(msg);
        alert("Create failed: " + msg);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setForm({ employee: "", work_type: "", work_id: "", assigned_at: "", notes: "" });
    setError(null);
  };

  // Edit / Update
  const handleEdit = (a) => {
    setEditData({
      id: a.id,
      employee: a.employee ?? "",
      work_type: a.work_type ?? "",
      work_id: a.work_id ?? "",
      assigned_at: toDateInput(a.assigned_at) ?? "",
      notes: a.notes ?? "",
    });
    setShowEditModal(true);
  };

  const handleUpdate = async () => {
    if (!editData?.id) return alert("No assignment selected");

    // if OPTIONS loaded real choices, validate against them
    const allowed = WORK_TYPE_CHOICES.map((c) => String(c.value));
    if (editData.work_type && WORK_TYPE_CHOICES.length && !allowed.includes(String(editData.work_type))) {
      return alert(`Invalid work type. Allowed: ${WORK_TYPE_CHOICES.map((c) => c.label).join(", ")}`);
    }

    const payload = {
      employee: editData.employee ? Number(editData.employee) : null,
      work_type: editData.work_type || "",
      work_id: editData.work_id ? Number(editData.work_id) : null,
      assigned_at: editData.assigned_at || "",
      notes: editData.notes === null ? "" : String(editData.notes ?? ""),
    };

    try {
      await axios.patch(`${BASE_URL}${editData.id}/`, payload);
      alert("Updated successfully!");
      setShowEditModal(false);
      fetchAssignments();
    } catch (err) {
      alert("Failed to update: " + (err.response?.data ? JSON.stringify(err.response.data) : err.message));
    }
  };

  // Delete
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this assignment?")) return;
    try {
      await axios.delete(`${BASE_URL}${id}/`);
      setAssignments((prev) => prev.filter((x) => x.id !== id));
    } catch {
      alert("Failed to delete assignment.");
    }
  };

  // UI
  return (
    <div style={{ padding: 40, background: "#f8fafc", minHeight: "100vh" }}>
      <div style={{ background: "white", padding: 25, borderRadius: 16, boxShadow: "0 4px 20px rgba(0,0,0,0.1)", marginTop: 20 }}>
        <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 12 }}>Assign Work</h2>

        {/* Create Form */}
        <form onSubmit={handleCreate} style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 18 }}>
          <select
            value={form.employee || ""}
            onChange={(e) => setForm({ ...form, employee: e.target.value })}
            style={inputStyle}
            required
          >
            <option value="">Select Employee</option>
            {employees.map((emp) => (
              <option key={emp.id} value={emp.id}>{emp.name}</option>
            ))}
          </select>

          {/* Work Type Dropdown */}
          <select
            value={form.work_type || ""}
            onChange={(e) => setForm({ ...form, work_type: e.target.value })}
            style={inputStyle}
            required
          >
            <option value="">Select Work Type</option>
            {WORK_TYPE_CHOICES.map((wt) => (
              <option key={wt.value} value={wt.value}>{wt.label}</option>
            ))}
          </select>

          <input
            type="number"
            placeholder="Work ID"
            value={form.work_id}
            onChange={(e) => setForm({ ...form, work_id: e.target.value })}
            style={inputStyle}
            required
          />

          <input
            type="date"
            placeholder="Assigned At"
            value={form.assigned_at}
            onChange={(e) => setForm({ ...form, assigned_at: e.target.value })}
            style={inputStyle}
          />

          <input
            type="text"
            placeholder="Notes"
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            style={inputStyle}
          />

          <button type="submit" className="btn3d blue" disabled={saving}>Create</button>
          <button type="button" className="btn3d red" onClick={handleReset}>Reset</button>
        </form>

        {/* Search + Table */}
        <div style={tableContainer}>
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 10 }}>
            <input
              type="text"
              placeholder="Search by employee / type / id..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ padding: "12px 12px", borderRadius: 8, border: "1px solid #ccc", width: 260 }}
            />
          </div>

          <table style={tableStyle}>
            <thead style={theadStyle}>
              <tr>
                <th style={thCell}>ID</th>
                <th style={thCell}>Employee</th>
                <th style={thCell}>Work Type</th>
                <th style={thCell}>Work ID</th>
                <th style={thCell}>Assigned At</th>
                <th style={thCell}>Notes</th>
                <th style={thCell}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: "center" }}>
                    {error ? `Error: ${JSON.stringify(error)}` : "Loading assignments..."}
                  </td>
                </tr>
              ) : assignments.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: "center" }}>No assignments found.</td>
                </tr>
              ) : (
                assignments
                  .filter((a) =>
                    [
                      a.employee_display || getEmployeeName(a.employee),
                      a.work_type,
                      a.work_id,
                      a.notes,
                    ].some((f) => String(f || "").toLowerCase().includes(searchTerm.toLowerCase()))
                  )
                  .map((a) => (
                    <tr key={a.id}>
                      <td style={tdCell}>{a.id}</td>
                      <td style={tdCell}>{a.employee_display || getEmployeeName(a.employee)}</td>
                      <td style={tdCell}>{a.work_type || "-"}</td>
                      <td style={tdCell}>{a.work_id ?? "-"}</td>
                      <td style={tdCell}>{a.assigned_at ? new Date(a.assigned_at).toLocaleDateString() : "-"}</td>
                      <td style={tdCell}>{a.notes || "-"}</td>
                      <td style={tdCell}>
                        <div style={{ display: "flex", gap: 10 }}>
                          <button className="btn3d blue" onClick={() => handleEdit(a)}>Edit</button>
                          <button className="btn3d red" onClick={() => handleDelete(a.id)}>Delete</button>
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

      {/* Edit Modal */}
      {showEditModal && editData && (
        <div style={modalOverlay}>
          <div style={modalBox}>
            <h3>Edit Assignment</h3>

            <select
              value={editData.employee || ""}
              onChange={(e) => setEditData({ ...editData, employee: e.target.value })}
              style={inputStyle}
            >
              <option value="">Select Employee</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>{emp.name}</option>
              ))}
            </select>

            {/* Work Type dropdown in modal */}
            <select
              value={editData.work_type || ""}
              onChange={(e) => setEditData({ ...editData, work_type: e.target.value })}
              style={inputStyle}
            >
              <option value="">Select Work Type</option>
              {WORK_TYPE_CHOICES.map((wt) => (
                <option key={wt.value} value={wt.value}>{wt.label}</option>
              ))}
            </select>

            <input
              type="number"
              value={editData.work_id}
              onChange={(e) => setEditData({ ...editData, work_id: e.target.value })}
              style={inputStyle}
              placeholder="Work ID"
            />

            <input
              type="date"
              value={editData.assigned_at || ""}
              onChange={(e) => setEditData({ ...editData, assigned_at: e.target.value })}
              style={inputStyle}
            />

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

      {/* Buttons */}
      <style>{`
        .btn3d { border: none; padding: 8px 14px; color: #fff; border-radius: 8px; font-weight: 600; box-shadow: 0 4px #999; transition: all 0.1s ease-in-out; cursor: pointer; }
        .btn3d:active { transform: translateY(2px); box-shadow: 0 2px #666; }
        .btn3d.blue { background: linear-gradient(145deg, #2563eb, #1e40af); }
        .btn3d.red { background: linear-gradient(145deg, #ef4444, #b91c1c); }
      `}</style>
    </div>
  );
}

// Styles
const inputStyle = { flex: 1, padding: "10px", borderRadius: "8px", border: "1px solid #ccc", minWidth: 150 };
const tableContainer = { overflowX: "auto", overflowY: "auto", maxHeight: 500, borderRadius: 12, background: "#fff", boxShadow: "0 2px 6px rgba(0,0,0,0.06)", marginTop: 16 };
const theadStyle = { background: "#f8fafc", fontWeight: 700, position: "sticky", top: 0, zIndex: 1, textAlign: "left" };
const tableStyle = { width: "100%", borderSpacing: "0 10px", textAlign: "left", borderCollapse: "separate" };
const thCell = { padding: "12px 16px" };
const tdCell = { padding: "8px 16px" };
const modalOverlay = { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000 };
const modalBox = { background: "#fff", padding: 20, borderRadius: 10, width: 480, boxShadow: "0 6px 20px rgba(0,0,0,0.12)", display: "flex", flexDirection: "column", gap: 10 };
