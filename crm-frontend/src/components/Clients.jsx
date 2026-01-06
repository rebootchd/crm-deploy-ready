// src/components/Clients.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";

const BASE_URL = "http://127.0.0.1:8000/crm/clients/";

export default function Clients() {
  const [clients, setClients] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [editData, setEditData] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);

  // form fields that your API actually accepts on /clients/
  const [form, setForm] = useState({
    name: "",
    industry: "",
    assigned: "",
    notes: "",
  });

  // Load employees for Assigned select
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

  // Fetch clients
  const fetchClients = async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await axios.get(BASE_URL);
      const data = Array.isArray(r.data) ? r.data : r.data.results ?? r.data;
      setClients(data || []);
      if (Array.isArray(data) && data.length) {
        console.log("Clients sample (inspect keys):", data[0]);
      }
    } catch (err) {
      setError(err.response?.data || err.message || "Failed to fetch clients");
      setClients([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  // Create client (matches your API: name, industry, assigned (pk), notes)
  const handleCreate = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const payload = {
      name: form.name || "",
      industry: form.industry || "",
      assigned: form.assigned ? Number(form.assigned) : null,
      notes: form.notes ?? "", // never null
    };

    try {
      await axios.post(BASE_URL, payload);
      setForm({ name: "", industry: "", assigned: "", notes: "" });
      fetchClients();
    } catch (err) {
      const server = err.response?.data ?? err.message;
      setError(typeof server === "string" ? server : JSON.stringify(server));
      alert("Create failed: " + (err.response?.status || "") + " " + JSON.stringify(server));
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setForm({ name: "", industry: "", assigned: "", notes: "" });
    setError(null);
  };

  // Prepare edit modal (use fields that exist)
  const handleEdit = (c) => {
    setEditData({
      id: c.id,
      name: c.name ?? "",
      industry: c.industry ?? "",
      assigned_to: c.assigned?.id ?? c.assigned ?? "",
      notes: c.notes ?? "",
    });
    setShowEditModal(true);
  };

  // Update client
  const handleUpdate = async () => {
    if (!editData?.id) return alert("No client selected");

    const payload = {
      name: editData.name || "",
      industry: editData.industry || "",
      assigned_to: editData.assigned_to ? Number(editData.assigned_to) : null,
      notes: editData.notes === null ? "" : String(editData.notes ?? ""),
    };

    try {
      await axios.patch(`${BASE_URL}${editData.id}/`, payload);
      alert("Client updated successfully!");
      setShowEditModal(false);
      fetchClients();
    } catch (err) {
      alert("Failed to update: " + (err.response?.data ? JSON.stringify(err.response.data) : err.message));
    }
  };

  // Delete client
  const handleDelete = async (id) => {
    if (!window.confirm("Delete this client?")) return;
    try {
      await axios.delete(`${BASE_URL}${id}/`);
      setClients((prev) => prev.filter((x) => x.id !== id));
    } catch (err) {
      alert("Failed to delete client: " + (err.response?.data ? JSON.stringify(err.response.data) : err.message));
    }
  };

  return (
    <div style={{ padding: 40, background: "#f8fafc", minHeight: "100vh" }}>
      <div style={{ background: "white", padding: 25, borderRadius: 16, boxShadow: "0 4px 20px rgba(0,0,0,0.1)" }}>
        <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 12 }}>Manage Clients</h2>

        {/* Create Form */}
        <form onSubmit={handleCreate} style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 18 }}>
          <input
            type="text"
            placeholder="Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            style={inputStyle}
            required
          />
          <input
            type="text"
            placeholder="Industry"
            value={form.industry}
            onChange={(e) => setForm({ ...form, industry: e.target.value })}
            style={inputStyle}
          />
          <select
            value={form.assigned || ""}
            onChange={(e) => setForm({ ...form, assigned: e.target.value })}
            style={inputStyle}
          >
            <option value="">Assign to (optional)</option>
            {employees.map((emp) => (
              <option key={emp.id} value={emp.id}>
                {emp.name}
              </option>
            ))}
          </select>
          <input
            type="text"
            placeholder="Notes"
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            style={inputStyle}
          />

          <button type="submit" className="btn3d blue" disabled={saving}>
            Create
          </button>
          <button type="button" className="btn3d red" onClick={handleReset}>
            Reset
          </button>
        </form>

        {/* Search + Table */}
        <div style={tableContainer}>
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 10 }}>
            <input
              type="text"
              placeholder="Search clients..."
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
                <th style={thCell}>Industry</th>
                <th style={thCell}>Assigned</th>
                <th style={thCell}>Created</th>
                <th style={thCell}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: "center" }}>
                    {error ? `Error: ${JSON.stringify(error)}` : "Loading clients..."}
                  </td>
                </tr>
              ) : clients.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: "center" }}>No clients found.</td>
                </tr>
              ) : (
                clients
                  .filter((c) =>
                    [c.name, c.industry, c.assigned_display].some((f) =>
                      String(f || "").toLowerCase().includes(searchTerm.toLowerCase())
                    )
                  )
                  .map((c) => (
                    <tr key={c.id}>
                      <td style={tdCell}>{c.id}</td>
                      <td style={tdCell}>{c.name}</td>
                      <td style={tdCell}>{c.industry || "-"}</td>
                      <td style={tdCell}>{c.assigned_display || "-"}</td>
                      <td style={tdCell}>{c.created_at ? new Date(c.created_at).toLocaleDateString() : "-"}</td>
                      <td style={tdCell}>
                        <div style={{ display: "flex", gap: 10 }}>
                          <button className="btn3d blue" onClick={() => handleEdit(c)}>Edit</button>
                          <button className="btn3d red" onClick={() => handleDelete(c.id)}>Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))
              )}
            </tbody>
          </table>
        </div>

        {error && (
          <p style={{ color: "red", marginTop: 10 }}>
            {typeof error === "string" ? error : JSON.stringify(error)}
          </p>
        )}
      </div>

      {/* Edit Modal */}
      {showEditModal && editData && (
        <div style={modalOverlay}>
          <div style={modalBox}>
            <h3>Edit Client</h3>

            <input
              type="text"
              value={editData.name}
              onChange={(e) => setEditData({ ...editData, name: e.target.value })}
              style={inputStyle}
              placeholder="Name"
            />
            <input
              type="text"
              value={editData.industry}
              onChange={(e) => setEditData({ ...editData, industry: e.target.value })}
              style={inputStyle}
              placeholder="Industry"
            />
            <select
              value={editData.assigned_to || ""}
              onChange={(e) => setEditData({ ...editData, assigned_to: e.target.value })}
              style={inputStyle}
            >
              <option value="">Assign to (optional)</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.name}
                </option>
              ))}
            </select>

            <textarea
              value={editData.notes ?? ""}
              onChange={(e) => setEditData({ ...editData, notes: e.target.value })}
              style={{ ...inputStyle, minHeight: 90 }}
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
        .btn3d { border: none; padding: 8px 14px; color: #fff; border-radius: 8px; font-weight: 600; box-shadow: 0 4px #999; transition: all 0.1s ease-in-out; cursor: pointer; }
        .btn3d:active { transform: translateY(2px); box-shadow: 0 2px #666; }
        .btn3d.blue { background: linear-gradient(145deg, #2563eb, #1e40af); }
        .btn3d.red { background: linear-gradient(145deg, #ef4444, #b91c1c); }
      `}</style>
    </div>
  );
}

// styles
const inputStyle = { flex: 1, padding: "10px", borderRadius: "8px", border: "1px solid #ccc", minWidth: 150 };
const tableContainer = { overflowX: "auto", overflowY: "auto", maxHeight: 500, borderRadius: 12, background: "#fff", boxShadow: "0 2px 6px rgba(0,0,0,0.06)", marginTop: 16 };
const theadStyle = { background: "#f8fafc", fontWeight: 700, position: "sticky", top: 0, zIndex: 1, textAlign: "left" };
const tableStyle = { width: "100%", borderSpacing: "0 10px", textAlign: "left", borderCollapse: "separate" };
const thCell = { padding: "12px 16px" };
const tdCell = { padding: "8px 16px" };
const modalOverlay = { position: "fixed", top: 0, left: 0, width: "100%", height: "100%", backgroundColor: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000 };
const modalBox = { background: "#fff", padding: "20px", borderRadius: "10px", width: "400px", boxShadow: "0 2px 8px rgba(0,0,0,0.2)", display: "flex", flexDirection: "column", gap: "10px" };
