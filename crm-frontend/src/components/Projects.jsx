import React, { useEffect, useState } from "react";
import axios from "axios";

const BASE_URL = "http://127.0.0.1:8000/crm/projects/";

export default function Projects() {
  const [projects, setProjects] = useState([]);
  const [form, setForm] = useState({
    title: "",
    client: "",
    assigned: "",
    progress: "",
    issue_date: "",
    submission_date: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchProjects();
  }, []);

  // ✅ Fetch all projects
  const fetchProjects = async () => {
    setLoading(true);
    try {
      const res = await axios.get(BASE_URL);
      setProjects(Array.isArray(res.data) ? res.data : res.data.results || []);
    } catch (err) {
      console.error("Error fetching projects:", err);
      setError("Failed to load projects.");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Create new project
  const handleCreate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await axios.post(BASE_URL, form);
      setForm({
        title: "",
        client: "",
        assigned: "",
        progress: "",
        issue_date: "",
        submission_date: "",
      });
      fetchProjects();
    } catch (err) {
      console.error("Error creating project:", err.response?.data || err.message);
      setError("Failed to create project.");
    } finally {
      setSaving(false);
    }
  };

  // ✅ Delete project
  const handleDelete = async (id) => {
    if (!window.confirm("Delete this project?")) return;
    try {
      await axios.delete(`${BASE_URL}${id}/`);
      fetchProjects();
    } catch (err) {
      console.error("Error deleting project:", err);
      setError("Failed to delete project.");
    }
  };

  // ✅ Reset form
  const handleReset = () =>
    setForm({
      title: "",
      client: "",
      assigned: "",
      progress: "",
      issue_date: "",
      submission_date: "",
    });

  // ✅ Format Date
  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    const date = new Date(dateStr);
    return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    })}`;
  };

  return (
    <div style={{ padding: "40px", background: "#f8fafc", minHeight: "100vh" }}>
      <div
        style={{
          background: "white",
          padding: "25px",
          borderRadius: "16px",
          boxShadow: "0 4px 20px rgba(0, 0, 0, 0.1)",
          marginTop: "20px",
        }}
      >
        <h2 style={{ fontSize: "22px", fontWeight: "bold", marginBottom: "10px" }}>
          Manage Projects
        </h2>

        {/* FORM */}
        <form
          onSubmit={handleCreate}
          style={{ display: "flex", gap: "10px", marginBottom: "20px", flexWrap: "wrap" }}
        >
          <input
            type="text"
            placeholder="Title"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            style={inputStyle}
            required
          />
          <input
            type="text"
            placeholder="Client"
            value={form.client}
            onChange={(e) => setForm({ ...form, client: e.target.value })}
            style={inputStyle}
          />
          <input
            type="text"
            placeholder="Assigned"
            value={form.assigned}
            onChange={(e) => setForm({ ...form, assigned: e.target.value })}
            style={inputStyle}
          />
          <input
            type="number"
            placeholder="Progress %"
            value={form.progress}
            onChange={(e) => setForm({ ...form, progress: e.target.value })}
            style={inputStyle}
          />
          <input
            type="datetime-local"
            placeholder="Issue Date"
            value={form.issue_date}
            onChange={(e) => setForm({ ...form, issue_date: e.target.value })}
            style={inputStyle}
          />
          <input
            type="datetime-local"
            placeholder="Submission Date"
            value={form.submission_date}
            onChange={(e) => setForm({ ...form, submission_date: e.target.value })}
            style={inputStyle}
          />
          <button type="submit" className="btn3d blue" disabled={saving}>
            Create
          </button>
          <button type="button" className="btn3d red" onClick={handleReset}>
            Reset
          </button>
        </form>

        {/* SEARCH BAR */}
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "10px" }}>
          <input
            type="text"
            placeholder="Search by title..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              padding: "15px 15px",
              borderRadius: "10px",
              border: "1px solid #ccc",
              width: "250px",
            }}
          />
        </div>

        {/* TABLE */}
        <div style={tableContainer}>
          <table style={tableStyle}>
            <thead style={theadStyle}>
              <tr>
                <th>ID</th>
                <th>Title</th>
                <th>Client</th>
                <th>Assigned</th>
                <th>Progress</th>
                <th>Issue Date</th>
                <th>Submission Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: "center" }}>
                    Loading projects...
                  </td>
                </tr>
              ) : projects.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: "center" }}>
                    No projects found.
                  </td>
                </tr>
              ) : (
                projects
                  .filter((p) =>
                    [p.title, p.client, p.assigned]
                      .join(" ")
                      .toLowerCase()
                      .includes(searchTerm.toLowerCase())
                  )
                  .map((p) => (
                    <tr key={p.id}>
                      <td>{p.id}</td>
                      <td>{p.title}</td>
                      <td>{p.client}</td>
                      <td>{p.assigned}</td>
                      <td>{p.progress ? `${p.progress}%` : "-"}</td>
                      <td>{formatDate(p.issue_date)}</td>
                      <td>{formatDate(p.submission_date)}</td>
                      <td>
                        <div style={{ display: "flex", gap: "14px" }}>
                          <button className="btn3d blue">Edit</button>
                          <button
                            className="btn3d red"
                            onClick={() => handleDelete(p.id)}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
              )}
            </tbody>
          </table>
        </div>

        {error && <p style={{ color: "red", marginTop: "10px" }}>{error}</p>}
      </div>

      {/* STYLES */}
      <style>{`
        .btn3d {
          border: none;
          padding: 8px 16px;
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
        .btn3d.blue {
          background: linear-gradient(145deg, #2563eb, #1e40af);
        }
        .btn3d.red {
          background: linear-gradient(145deg, #ef4444, #b91c1c);
        }
      `}</style>
    </div>
  );
}




// ✅ Reusable Styles
const inputStyle = {
  flex: 1,
  padding: "10px",
  borderRadius: "8px",
  border: "1px solid #ccc",
  minWidth: "150px",
};

const tableContainer = {
  overflowX: "auto",   // Horizontal scroll if table is wide
  overflowY: "auto",   // Vertical scroll if there are many rows
  maxHeight: "500px",  // Limit visible height (adjust as needed)
  borderRadius: "20px",
  background: "#fff",
  boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
  marginTop: "20px",
};

const theadStyle = {
  background: "#f1f5f9",
  fontWeight: "bold",
  textAlign: "100px",
  position: "sticky",  // Keeps header visible while scrolling
  top: 6,
  zIndex: 1,
};


const tableStyle = {
  width: "100%",
  borderSpacing: "0 10px",
  textAlign: "left",
  borderCollapse: "separate",
};


