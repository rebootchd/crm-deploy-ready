import React, { useEffect, useState } from "react";
import axios from "axios";
import ActivityFeed from "./ActivityFeed";

const BASE_URL = "http://127.0.0.1:8000/crm/v1/leads/";

export default function Leads() {
  const [leads, setLeads] = useState([]);
  const [form, setForm] = useState({ name: "", source: "", status: "", assigned: "" });
  const [loading, setLoading] = useState(true);
  const [employees, setEmployees] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [editData, setEditData] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);

  // STATUS_CHOICES as state (will be replaced by OPTIONS if available)
  const [STATUS_CHOICES, setStatusChoices] = useState([
    { label: "New", value: "new" },
    { label: "Contacted", value: "contacted" },
    { label: "Qualified", value: "qualified" },
    { label: "Proposal", value: "proposal" },
    { label: "Won", value: "won" },
    { label: "Lost", value: "lost" },
  ]);

  // Try to load allowed choices via OPTIONS (Django REST Framework often exposes them)
  useEffect(() => {
    const fetchChoicesViaOptions = async () => {
      try {
        const res = await axios.options(BASE_URL);
        // try to find status field metadata
        const actions = res.data.actions || res.data;
        const candidateField =
          actions?.POST?.status ||
          actions?.PUT?.status ||
          actions?.PATCH?.status ||
          res.data?.status;

        let choices = [];
        if (candidateField) {
          if (Array.isArray(candidateField.choices)) {
            choices = candidateField.choices.map((c) =>
              typeof c === "string"
                ? { value: c, label: c }
                : {
                    value: c[0] ?? c.value,
                    label: c[1] ?? c.label ?? c.display_name ?? c.value,
                  }
            );
          } else if (Array.isArray(candidateField)) {
            choices = candidateField.map((c) =>
              typeof c === "string"
                ? { value: c, label: c }
                : {
                    value: c.value ?? c[0],
                    label: c.label ?? c[1] ?? c.value,
                  }
            );
          } else if (candidateField.choices && Array.isArray(candidateField.choices)) {
            choices = candidateField.choices;
          }
        }
        if (choices && choices.length) {
          setStatusChoices(choices);
          console.log("Loaded status choices from OPTIONS:", choices);
        } else {
          console.log("OPTIONS returned no choices; keeping defaults.");
        }
      } catch (err) {
        console.warn(
          "OPTIONS fetch failed (no metadata). Continuing with defaults.",
          err.message || err
        );
      }
    };
    fetchChoicesViaOptions();
  }, []);

  // Fetch employees for Assigned select
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const res = await axios.get("http://127.0.0.1:8000/crm/v1/employees/");
        const data = Array.isArray(res.data) ? res.data : res.data.results ?? res.data;
        setEmployees(data || []);
      } catch (err) {
        console.warn("Failed to load employees:", err);
        setEmployees([]);
      }
    };
    fetchEmployees();
  }, []);

  // Helper to show employee name from id
  const getEmployeeName = (id) => {
    if (!id) return "-";
    const emp = employees.find((e) => e.id === Number(id));
    return emp ? emp.name : id;
  };

  // Unified fetch function for leads
  const fetchLeads = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get(BASE_URL);
      const data = Array.isArray(res.data) ? res.data : res.data.results ?? res.data;
      setLeads(data || []);
    } catch (err) {
      console.error("Error fetching leads:", err);
      setError(err.response?.data || err.message || "Failed to fetch leads");
      setLeads([]);
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    // initial load ke time leads fetch karo
    fetchLeads();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  // Helper: produce plausible variants for a candidate status string
  const statusVariants = (raw) => {
    if (raw === null || raw === undefined || raw === "") return [null];
    const s = String(raw).trim();
    const out = [
      s,
      s.toLowerCase(),
      s.toUpperCase(),
      s.replace(/\s+/g, "_").toLowerCase(),
      s.replace(/\s+/g, "_").toUpperCase(),
      s.replace(/\s+/g, "-").toLowerCase(),
      s.replace(/\s+/g, "-").toUpperCase(),
    ];
    // also include values from STATUS_CHOICES (these are authoritative if available)
    STATUS_CHOICES.forEach((c) => {
      out.push(String(c.value));
      out.push(String(c.label));
      out.push(String(c.value).toLowerCase());
      out.push(String(c.value).toUpperCase());
    });
    return [...new Set(out.filter(Boolean))];
  };

  // Try POST with multiple variants for status until success (useful when backend tokens differ)
  const tryCreateWithStatusVariants = async (payloadBase) => {
    const variants = statusVariants(payloadBase.status);
    let lastErr = null;
    for (let i = 0; i < variants.length; i++) {
      const v = variants[i];
      const payload = { ...payloadBase, status: v };
      console.log(`Attempt ${i + 1}/${variants.length} - POST payload:`, payload);
      try {
        const res = await axios.post(BASE_URL, payload);
        console.log("Create success with status:", v, res.data);
        return { ok: true, data: res.data };
      } catch (err) {
        lastErr = err;
        console.warn(`Attempt failed for status=${v}`, err.response?.data ?? err.message);
        if (err.response?.data) {
          console.log("Server response on failure:", err.response.data);
        }
      }
    }
    return { ok: false, error: lastErr };
  };

  // Create Lead (uses tryCreateWithStatusVariants fallback)
  const handleCreate = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const payloadBase = {
      name: form.name || null,
      source: form.source || null,
      status: form.status || null, // initial canonical value from select
      assigned: form.assigned ? Number(form.assigned) : null, // numeric pk or null
    };

    try {
      // First try a straightforward POST
      console.log("Create: attempting direct POST", payloadBase);
      const res = await axios.post(BASE_URL, payloadBase);
      console.log("Create response:", res.status, res.data);
      setForm({ name: "", source: "", status: "", assigned: "" });
      fetchLeads();
      setSaving(false);
      return;
    } catch (err) {
      console.warn("Direct POST failed, trying variants...", err.response?.data ?? err.message);
      // Try variants automatically
      const result = await tryCreateWithStatusVariants(payloadBase);
      if (result.ok) {
        setForm({ name: "", source: "", status: "", assigned: "" });
        fetchLeads();
        setSaving(false);
        return;
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

  // Reset create form
  const handleReset = () => {
    setForm({ name: "", source: "", status: "", assigned: "" });
    setError(null);
    fetchLeads(); // optional — reload the list
  };

  // Edit modal prepare
  const toISODate = (v) => (v ? String(v).split("T")[0] : null);

  const handleEdit = (lead) => {
    setEditData({
      id: lead.id,
      name: lead.name ?? "",
      email: lead.email ?? "",
      phone: lead.phone ?? "",
      status: lead.status ?? "",
      source: lead.source ?? "",
      assigned_to: lead.assigned?.id ?? lead.assigned ?? lead.assigned_to ?? "",
      follow_up_date: toISODate(lead.follow_up_date) ?? "",
      notes: lead.notes ?? "",
    });
    setShowEditModal(true);
  };

  // Update lead (send canonical editData.status — set from select)
  const handleUpdate = async () => {
    if (!editData?.id) return alert("No lead selected");

    // ensure status is one of allowed values if we have choices
    const allowed = STATUS_CHOICES.map((c) => String(c.value));
    if (editData.status && STATUS_CHOICES.length && !allowed.includes(String(editData.status))) {
      return alert(`Invalid status. Allowed: ${STATUS_CHOICES.map((c) => c.label).join(", ")}`);
    }

    try {
      const payload = {
        name: editData.name || null,
        email: editData.email || null,
        phone: editData.phone || null,
        status: editData.status || null,
        source: editData.source || null,
        assigned_to: editData.assigned_to ? Number(editData.assigned_to) : null,
        follow_up_date: editData.follow_up_date ? toISODate(editData.follow_up_date) : null,
        notes: editData.notes || null,
      };
      console.log("PATCH payload:", payload);
      await axios.patch(`${BASE_URL}${editData.id}/`, payload);
      alert("Lead updated successfully!");
      setShowEditModal(false);
      fetchLeads();
    } catch (err) {
      console.error("Update failed:", err.response?.data || err.message);
      alert("Failed to update: " + (err.response?.data ? JSON.stringify(err.response.data) : err.message));
    }
  };

  // Delete
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this lead?")) return;
    try {
      await axios.delete(`${BASE_URL}${id}/`);
      setLeads((prev) => prev.filter((l) => l.id !== id));
    } catch (err) {
      console.error("Error deleting lead:", err);
      alert("Failed to delete lead.");
    }
  };

  // UI render
  return (
    <div style={{ padding: "40px", background: "#f8fafc", minHeight: "100vh" }}>
      <div style={{ background: "white", padding: "25px", borderRadius: "16px", boxShadow: "0 4px 20px rgba(0,0,0,0.1)", marginTop: "20px" }}>
        <h2 style={{ fontSize: "22px", fontWeight: "bold", marginBottom: "10px" }}>Manage Leads</h2>

        <form onSubmit={handleCreate} style={{ display: "flex", gap: "10px", marginBottom: "20px", flexWrap: "wrap" }}>
          <input type="text" placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} style={inputStyle} required />
          <input type="text" placeholder="Source" value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })} style={inputStyle} />

          <select value={form.status || ""} onChange={(e) => setForm({ ...form, status: e.target.value })} style={inputStyle}>
            <option value="">Select Status</option>
            {STATUS_CHOICES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>

          <select value={form.assigned || ""} onChange={(e) => setForm({ ...form, assigned: e.target.value })} style={inputStyle}>
            <option value="">Assign to (optional)</option>
            {employees.map((emp) => (
              <option key={emp.id} value={emp.id}>
                {emp.name}
              </option>
            ))}
          </select>

          <button type="submit" className="btn3d blue" disabled={saving}>Create</button>
          <button type="button" className="btn3d red" onClick={handleReset}>Reset</button>
        </form>

        <div style={tableContainer}>
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "10px" }}>
            <input type="text" placeholder="Search leads..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={{ padding: "15px 15px", borderRadius: "10px", border: "1px solid #ccc", width: "250px" }} />
          </div>

          <table style={tableStyle}>
            <thead style={theadStyle}>
              <tr>
                <th style={thCell}>ID</th>
                <th style={thCell}>Name</th>
                <th style={thCell}>Source</th>
                <th style={thCell}>Status</th>
                <th style={thCell}>Assigned</th>
                <th style={thCell}>Created</th>
                <th style={thCell}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: "center" }}>{error ? `Error: ${JSON.stringify(error)}` : "Loading leads..."}</td>
                </tr>
              ) : leads.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: "center" }}>No leads found.</td>
                </tr>
              ) : (
                Array.isArray(leads) &&
                leads
                  .filter((lead) => [lead.name, lead.source, lead.status, lead.assigned].some((field) => String(field || "").toLowerCase().includes(searchTerm.toLowerCase())))
                  .map((lead) => (
                    <tr key={lead.id}>
                      <td style={tdCell}>{lead.id}</td>
                      <td style={tdCell}>{lead.name}</td>
                      <td style={tdCell}>{lead.source || "-"}</td>
                      <td style={tdCell}>{lead.status || "-"}</td>
                      <td style={tdCell}>{getEmployeeName(lead.assigned)}</td>
                      <td style={tdCell}>{lead.created_at ? new Date(lead.created_at).toLocaleDateString() : "-"}</td>
                      <td style={tdCell}>
                        <div style={{ display: "flex", gap: "14px" }}>
                          <button className="btn3d blue" onClick={() => handleEdit(lead)}>Edit</button>
                          <button className="btn3d red" onClick={() => handleDelete(lead.id)}>Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))
              )}
            </tbody>
          </table>
        </div>

        {error && <p style={{ color: "red", marginTop: "10px" }}>{typeof error === "string" ? error : JSON.stringify(error)}</p>}
      </div>

      {showEditModal && editData && (
        <div style={modalOverlay}>
          <div style={modalBox}>
            <h3>Edit Lead</h3>

            <select value={editData.status || ""} onChange={(e) => setEditData({ ...editData, status: e.target.value })} style={inputStyle}>
              <option value="">Select Status</option>
              {STATUS_CHOICES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>

            <label>Name:</label>
            <input type="text" value={editData.name} onChange={(e) => setEditData({ ...editData, name: e.target.value })} style={inputStyle} />

            <label>Email:</label>
            <input type="text" value={editData.email} onChange={(e) => setEditData({ ...editData, email: e.target.value })} style={inputStyle} />

            <label>Source:</label>
            <input type="text" value={editData.source} onChange={(e) => setEditData({ ...editData, source: e.target.value })} style={inputStyle} />

            <label>Assigned:</label>
            <select value={editData.assigned_to || ""} onChange={(e) => setEditData({ ...editData, assigned_to: e.target.value })} style={inputStyle}>
              <option value="">Assign to (optional)</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.name}
                </option>
              ))}
            </select>

            {/* Activity feed for this lead */}
            {editData?.id && (
              <div style={{ marginTop: 12 }}>
                <h4 style={{ margin: '10px 0' }}>Activity</h4>
                <ActivityFeed leadId={editData.id} />
              </div>
            )}

            <div style={{ marginTop: "10px" }}>
              <button className="btn3d blue" onClick={handleUpdate}>Update</button>
              <button className="btn3d red" onClick={() => setShowEditModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .btn3d { border: none; padding: 8px 16px; color: #fff; border-radius: 8px; font-weight: 600; box-shadow: 0 4px #999; transition: all 0.1s ease-in-out; cursor: pointer; }
        .btn3d:active { transform: translateY(2px); box-shadow: 0 2px #666; }
        .btn3d.blue { background: linear-gradient(145deg, #2563eb, #1e40af); }
        .btn3d.red { background: linear-gradient(145deg, #ef4444, #b91c1c); }
      `}</style>
    </div>
  );
}

// styles
const inputStyle = { flex: 1, padding: "10px", borderRadius: "8px", border: "1px solid #ccc", minWidth: "150px" };
const tableContainer = { overflowX: "auto", overflowY: "auto", maxHeight: "500px", borderRadius: "20px", background: "#fff", boxShadow: "0 2px 6px rgba(0,0,0,0.1)", marginTop: "20px" };
const theadStyle = { background: "#f1f5f9", fontWeight: "bold", position: "sticky", top: 0, zIndex: 1 };
const tableStyle = { width: "100%", borderSpacing: "0 10px", textAlign: "left", borderCollapse: "separate" };
const thCell = { padding: "12px 20px" };
const tdCell = { padding: "8px 20px" };
const modalOverlay = { position: "fixed", top: 0, left: 0, width: "100%", height: "100%", backgroundColor: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000 };
const modalBox = { background: "#fff", padding: "20px", borderRadius: "10px", width: "400px", boxShadow: "0 2px 8px rgba(0,0,0,0.2)", display: "flex", flexDirection: "column", gap: "10px" };
