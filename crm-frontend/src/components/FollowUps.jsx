// FollowUps.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";

const BASE_EMP = "http://127.0.0.1:8000/crm/employees/";
const BASE_FU = "http://127.0.0.1:8000/crm/followups/";

// dev reference image path (you asked to include file path)
const REF_IMG = "/mnt/data/a5c0bd1e-88d8-47ba-a909-7f0ce3cfa264.png";

export default function FollowUps() {
  const [employees, setEmployees] = useState([]);
  const [followUps, setFollowUps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [filter, setFilter] = useState({ name: "", assigned: "", status: "" });
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const emptyForm = {
    linked_type: "Lead",
    linked_id: "",
    date_time: "",
    purpose: "",
    assigned_to: "",
    status: "pending",
    reminder: false,
    reminder_minutes_before: 60,
  };
  const [form, setForm] = useState(emptyForm);

  // Load followups
  useEffect(() => {
    refreshAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchEmployees = async () => {
    try {
      const res = await axios.get(BASE_EMP);
      const list = Array.isArray(res.data) ? res.data : res.data.results || [];
      setEmployees(list);
      return list;
    } catch (err) {
      console.error("Employees load error:", err);
      setEmployees([]);
      return [];
    }
  };

  const fetchFollowups = async () => {
    setLoading(true);
    try {
      const res = await axios.get(BASE_FU);
      const list = Array.isArray(res.data) ? res.data : res.data.results || res.data.results || [];
      setFollowUps(list);
      setError("");
    } catch (err) {
      console.error("Followups load error:", err);
      setFollowUps([]);
      setError("Failed to load follow-ups from server.");
    } finally {
      setLoading(false);
    }
  };

  const refreshAll = async () => {
    setLoading(true);
    await Promise.all([fetchEmployees(), fetchFollowups()]);
    setLoading(false);
  };

  // Resolve assigned name (if backend didn't provide display)
  const resolveAssigned = (f) => {
    if (f.assigned_display) return f.assigned_display;
    if (!f.assigned_to) return "-";
    // assigned_to might be id or name; try to find by id or name in employees
    const emp = employees.find(
      (e) => String(e.id) === String(f.assigned_to) || (e.name && e.name === f.assigned_to)
    );
    return emp ? emp.name : String(f.assigned_to);
  };

  // OPEN CREATE modal - ensure employees loaded first
  const openCreate = async () => {
    await fetchEmployees(); // ensure employees list ready
    setForm(emptyForm);
    setEditingId(null);
    setIsOpen(true);
  };

  // OPEN EDIT modal - ensure employees loaded then fill form
  const openEdit = async (f) => {
    await fetchEmployees();
    setEditingId(f.id);
    setForm({
      linked_type: f.linked_type || "Lead",
      linked_id: f.linked_id || "",
      date_time: f.date_time ? new Date(f.date_time).toISOString().slice(0, 16) : "",
      purpose: f.purpose || "",
      assigned_to: f.assigned_to || "",
      status: f.status || "pending",
      reminder: !!f.reminder,
      reminder_minutes_before: f.reminder_minutes_before ?? 60,
    });
    setIsOpen(true);
  };

  const handleSave = async (ev) => {
    ev && ev.preventDefault();
    setSaving(true);
    try {
      const payload = {
        linked_type: form.linked_type,
        linked_id: form.linked_id || null,
        date_time: new Date(form.date_time).toISOString(),
        purpose: form.purpose,
        assigned_to: form.assigned_to || null,
        status: form.status,
        reminder: !!form.reminder,
        reminder_minutes_before: Number(form.reminder_minutes_before || 60),
      };
      if (editingId) {
        await axios.put(`${BASE_FU}${editingId}/`, payload);
      } else {
        await axios.post(BASE_FU, payload);
      }
      await fetchFollowups();
      setIsOpen(false);
      setEditingId(null);
      setForm(emptyForm);
      setError("");
    } catch (err) {
      console.error("Save error:", err.response?.data || err.message);
      setError("Failed to save follow-up.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this follow-up?")) return;
    try {
      await axios.delete(`${BASE_FU}${id}/`);
      await fetchFollowups();
    } catch (err) {
      console.error("Delete error:", err);
      setError("Failed to delete follow-up.");
    }
  };

  const toggleStatus = async (f) => {
    try {
      const newStatus = f.status === "pending" ? "done" : "pending";
      await axios.patch(`${BASE_FU}${f.id}/`, { status: newStatus });
      await fetchFollowups();
    } catch (err) {
      console.error("Toggle status error:", err);
      setError("Failed to update status.");
    }
  };

  // filtered list
  const filtered = followUps.filter((f) => {
    if (filter.name && !(`${f.linked_name || f.linked_id || ""}`).toLowerCase().includes(filter.name.toLowerCase())) return false;
    if (filter.assigned && String(f.assigned_to) !== String(filter.assigned)) return false;
    if (filter.status && f.status !== filter.status) return false;
    return true;
  });

  // UI styles (matching your Leads UI)
  const styles = {
    page: { padding: 24, background: "#f4f7fb", minHeight: "100vh", fontFamily: "Inter, Arial, sans-serif" },
    card: { background: "#fff", borderRadius: 12, padding: 20, boxShadow: "0 6px 18px rgba(20,24,40,0.06)" },
    topRow: { display: "flex", gap: 12, alignItems: "center", marginBottom: 16 },
    input: { padding: "10px 12px", borderRadius: 8, border: "1px solid #e6edf3", minWidth: 180 },
    select: { padding: "10px 12px", borderRadius: 8, border: "1px solid #e6edf3" },
    createBtn: { background: "linear-gradient(180deg,#2b6ef6,#1e4fd9)", color: "#fff", padding: "8px 18px", borderRadius: 8, border: "none", boxShadow: "0 4px 0 rgba(0,0,0,0.12)" },
    resetBtn: { background: "linear-gradient(180deg,#ef4444,#b91c1c)", color: "#fff", padding: "8px 18px", borderRadius: 8, border: "none", boxShadow: "0 4px 0 rgba(0,0,0,0.12)" },
    tableWrapper: { marginTop: 10, borderRadius: 12, overflow: "hidden", border: "1px solid #eef3f7" },
    thead: { background: "#f7fafc", fontWeight: 700 },
    th: { padding: "14px 18px", textAlign: "left", borderBottom: "1px solid #eef3f7" },
    td: { padding: "14px 18px", borderBottom: "1px solid #f5f7fb" },
    actionBtn: { padding: "6px 10px", borderRadius: 8, border: "none", cursor: "pointer" },
    blue: { background: "linear-gradient(180deg,#2563eb,#1e40af)", color: "#fff" },
    red: { background: "linear-gradient(180deg,#ef4444,#b91c1c)", color: "#fff" },
    searchWrap: { marginLeft: "auto" },
    smallNote: { marginTop: 8, color: "#6b7280", fontSize: 13 },
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 8 }}>
          <h2 style={{ margin: 0, fontSize: 22 }}>Manage Follow-ups</h2>
          <img src={REF_IMG} alt="ref" style={{ height: 36, opacity: 0 }} />
        </div>

        <div style={styles.topRow}>
          <input
            placeholder="Name / linked"
            style={styles.input}
            value={filter.name}
            onChange={(e) => setFilter({ ...filter, name: e.target.value })}
          />
          <select style={styles.select} value={filter.assigned} onChange={(e) => setFilter({ ...filter, assigned: e.target.value })}>
            <option value="">Assigned (all)</option>
            {employees.map((emp) => (
              <option key={emp.id} value={emp.id}>
                {emp.name}
              </option>
            ))}
          </select>
          <select style={styles.select} value={filter.status} onChange={(e) => setFilter({ ...filter, status: e.target.value })}>
            <option value="">All status</option>
            <option value="pending">Pending</option>
            <option value="done">Done</option>
            <option value="skipped">Skipped</option>
            <option value="postponed">Postponed</option>
          </select>

          <div style={styles.searchWrap}>
            <input placeholder="Search leads..." style={{ ...styles.input, width: 220 }} onChange={() => {}} />
          </div>

          <div style={{ marginLeft: 12, display: "flex", gap: 8 }}>
            <button style={styles.createBtn} onClick={openCreate}>Create</button>
            <button style={styles.resetBtn} onClick={() => { setFilter({ name: "", assigned: "", status: "" }); }}>Reset</button>
          </div>
        </div>

        <div style={styles.tableWrapper}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead style={styles.thead}>
              <tr>
                <th style={styles.th}>ID</th>
                <th style={styles.th}>Linked</th>
                <th style={styles.th}>Date/Time</th>
                <th style={styles.th}>Purpose</th>
                <th style={styles.th}>Assigned</th>
                <th style={styles.th}>Status</th>
                <th style={styles.th}>Reminder</th>
                <th style={styles.th}>Actions</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr><td colSpan={8} style={{ ...styles.td, textAlign: "center" }}>Loading follow-ups...</td></tr>
              ) : followUps.length === 0 ? (
                <tr><td colSpan={8} style={{ ...styles.td, textAlign: "center" }}>No follow-ups</td></tr>
              ) : (
                filtered.map((f) => (
                  <tr key={f.id}>
                    <td style={styles.td}>{f.id}</td>
                    <td style={styles.td}>{(f.linked_type || "Lead")} - {f.linked_name || f.linked_id || "-"}</td>
                    <td style={styles.td}>{f.date_time ? new Date(f.date_time).toLocaleString() : "-"}</td>
                    <td style={styles.td}>{f.purpose}</td>
                    <td style={styles.td}>{resolveAssigned(f)}</td>
                    <td style={styles.td}>
                      <button
                        onClick={() => toggleStatus(f)}
                        style={{
                          ...styles.actionBtn,
                          ...(f.status === "done" ? { background: "#10b981", color: "#fff" } : { background: "#fde68a" })
                        }}
                      >
                        {f.status}
                      </button>
                    </td>
                    <td style={styles.td}>{f.reminder ? `${f.reminder_minutes_before} mins` : "No"}</td>
                    <td style={{ ...styles.td }}>
                      <div style={{ display: "flex", gap: 8 }}>
                        <button style={{ ...styles.actionBtn, ...styles.blue }} onClick={() => openEdit(f)}>Edit</button>
                        <button style={{ ...styles.actionBtn, ...styles.red }} onClick={() => handleDelete(f.id)}>Delete</button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {error && <div style={{ color: "#ef4444", marginTop: 10 }}>{error}</div>}
        <div style={styles.smallNote}>Note: This demo uses in-browser notifications for reminders. For production, implement a server-side scheduler + email/SMS/push.</div>
      </div>

      {/* modal */}
      {isOpen && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 999 }}>
          <form onSubmit={handleSave} style={{ width: 720, background: "#fff", borderRadius: 12, padding: 18 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <h3 style={{ margin: 0 }}>{editingId ? "Edit Follow-up" : "Create Follow-up"}</h3>
              <button type="button" onClick={() => { setIsOpen(false); setEditingId(null); setForm(emptyForm); }}>Close</button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <label style={{ display: "block", marginBottom: 6 }}>Linked Type</label>
                <select value={form.linked_type} onChange={(e) => setForm({ ...form, linked_type: e.target.value })} style={styles.input}>
                  <option>Lead</option>
                  <option>Client</option>
                  <option>Call</option>
                </select>
              </div>

              <div>
                <label style={{ display: "block", marginBottom: 6 }}>Linked (Lead)</label>
                <select value={form.linked_id} onChange={(e) => setForm({ ...form, linked_id: e.target.value })} style={styles.input}>
                  <option value="">-</option>
                  {/* show leads as options if you want; using employees list for demo */}
                  {employees.map((emp) => <option key={emp.id} value={emp.id}>{emp.name}</option>)}
                </select>
              </div>

              <div>
                <label style={{ display: "block", marginBottom: 6 }}>Date & Time</label>
                <input required type="datetime-local" value={form.date_time} onChange={(e) => setForm({ ...form, date_time: e.target.value })} style={styles.input} />
              </div>

              <div>
                <label style={{ display: "block", marginBottom: 6 }}>Assigned To</label>
                <select required value={form.assigned_to} onChange={(e) => setForm({ ...form, assigned_to: e.target.value })} style={styles.input}>
                  <option value="">Select</option>
                  {employees.length === 0 ? (
                    <option value="" disabled>Loading employees…</option>
                  ) : (
                    employees.map(emp => <option key={emp.id} value={emp.id}>{emp.name}</option>)
                  )}
                </select>
              </div>

              <div style={{ gridColumn: "1 / -1" }}>
                <label style={{ display: "block", marginBottom: 6 }}>Purpose</label>
                <textarea required rows={3} value={form.purpose} onChange={(e) => setForm({ ...form, purpose: e.target.value })} style={{ ...styles.input, minHeight: 80 }} />
              </div>

              <div>
                <label style={{ display: "block", marginBottom: 6 }}>Status</label>
                <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} style={styles.input}>
                  <option value="pending">Pending</option>
                  <option value="done">Done</option>
                  <option value="skipped">Skipped</option>
                  <option value="postponed">Postponed</option>
                </select>
              </div>

              <div>
                <label style={{ display: "block", marginBottom: 6 }}>Reminder</label>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <input type="checkbox" checked={!!form.reminder} onChange={(e) => setForm({ ...form, reminder: e.target.checked })} />
                  <input type="number" value={form.reminder_minutes_before} onChange={(e) => setForm({ ...form, reminder_minutes_before: e.target.value })} style={{ width: 120, padding: 8, borderRadius: 8, border: "1px solid #e6edf3" }} />
                  <span style={{ color: "#6b7280" }}>minutes before</span>
                </div>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 14 }}>
              <button type="button" onClick={() => { setIsOpen(false); setForm(emptyForm); setEditingId(null); }} style={{ padding: "8px 14px", borderRadius: 8, border: "1px solid #e6edf3" }}>Cancel</button>
              <button disabled={saving} type="submit" style={{ ...styles.createBtn }}>{saving ? "Saving..." : "Save"}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
