import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { api } from "../services/api";

// Use a single canonical base (ensure v1 present)
const BASE_API = "http://127.0.0.1:8000/crm/v1/";

export default function Employees({ selectedEmployeeForWork, setSelectedEmployeeForWork }) {
  const [employees, setEmployees] = useState([]);
  const [form, setForm] = useState({
    name: "",
    role: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    joining_date: "",
    gender: "",
    emergency_contact: "",
    status: "Active",
    role_description: "",
    access_level: "Executive", // default access level
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [editData, setEditData] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [profileData, setProfileData] = useState(null);
  const [attendanceSummary, setAttendanceSummary] = useState(null); // optional: may remain null

  // unified modal state
  const [showEmployeeModal, setShowEmployeeModal] = useState(false);
  const [activeEmployeeTab, setActiveEmployeeTab] = useState("profile"); // "profile" | "work"

  // WorkGiven related state
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [workGivenList, setWorkGivenList] = useState([]);
  const [workForm, setWorkForm] = useState({
    title: "",
    description: "",
    submission_date: "",
    priority: "Medium",
  });




  // ---- Load employees on mount ----
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`${BASE_API}employees/`);
        const data = res.data;
        const list = Array.isArray(data) ? data : data.results || [];
        const normalized = list.map((emp) => ({
          ...emp,
          status: emp.status || "Active",
          role_description: emp.role_description || "",
          access_level: emp.access_level || "Executive",
        }));
        if (mounted) setEmployees(normalized);
      } catch (err) {
        console.error("Employees Load Error:", err);
        if (mounted) setEmployees([]);
        setError("Failed to load employees.");
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, []);

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${BASE_API}employees/`);
      const list = Array.isArray(res.data) ? res.data : res.data.results || [];

      const normalized = list.map((emp) => ({
        ...emp,
        status: emp.status || "Active",
        role_description: emp.role_description || "",
        access_level: emp.access_level || "Executive",
      }));

      setEmployees(normalized);
    } catch (err) {
      console.error("Error fetching employees:", err);
      setError("Failed to load employees.");
    } finally {
      setLoading(false);
    }
  };

  // Create new employee
  const handleCreate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await axios.post(`${BASE_API}employees/`, {
        name: form.name,
        role: form.role,
        email: form.email,
        phone: form.phone,
        address: form.address,
        city: form.city,
        state: form.state,
        joining_date: form.joining_date,
        gender: form.gender,
        emergency_contact: form.emergency_contact,
        status: form.status,
        role_description: form.role_description,
        access_level: form.access_level,
      });
      setForm({
        name: "",
        role: "",
        email: "",
        phone: "",
        address: "",
        city: "",
        state: "",
        joining_date: "",
        gender: "",
        emergency_contact: "",
        status: "Active",
        role_description: "",
        access_level: "Executive",
      });
      fetchEmployees();
    } catch (err) {
      console.error("Error creating employee:", err.response?.data || err.message);
      setError(
        `Failed to create employee: ${JSON.stringify(
          err.response?.data || err.message
        )}`
      );
    } finally {
      setSaving(false);
    }
  };

  // fetch full profile details (expected endpoint: GET /crm/v1/employees/:id/)
  const fetchProfile = async (empId) => {
    try {
      const res = await axios.get(`${BASE_API}employees/${empId}/`); // expecting employee detail object
      const p = res.data || {};
      // map personal fields too
      setProfileData({
        id: p.id,
        name: p.name,
        email: p.email,
        phone: p.phone || "",
        address: p.address || "",
        city: p.city || "",
        state: p.state || "",
        joining_date: p.joining_date || "",
        gender: p.gender || "",
        emergency_contact: p.emergency_contact || "",
        role: p.role,
        status: p.status || "Active",
        role_description: p.role_description || "",
        access_level: p.access_level || "Executive",
        documents: p.documents || [], // expecting [{type:'PAN', url:'...'}]
        attendance_summary: p.attendance_summary || null, // optional
      });

      // if backend provides attendance summary, set it
      if (p.attendance_summary) setAttendanceSummary(p.attendance_summary);
      else setAttendanceSummary(null);

      // also load work history if not already loaded (reuse api.workGivenList or existing function)
      try {
        const res2 = await api.workGivenList({
          entity_type: "EMPLOYEE",
          entity_id: empId,
        });
        const list = Array.isArray(res2.data) ? res2.data : res2.data?.results || [];
        setWorkGivenList(
          list.map((w) => ({
            ...w,
            priority: w.priority || w.priority_level || "Medium",
          }))
        );
      } catch (werr) {
        console.warn("Work list fetch failed while loading profile:", werr);
      }
    } catch (err) {
      console.error("Failed to fetch profile:", err);
      setProfileData(null);
      alert("Failed to load profile details.");
    } finally {
      // no-op
    }
  };

  // Delete employee
  const handleDelete = async (id) => {
    if (!window.confirm("Delete this employee?")) return;
    try {
      await axios.delete(`${BASE_API}employees/${id}/`);
      fetchEmployees();
    } catch (err) {
      console.error("Error deleting employee:", err);
      setError("Failed to delete employee.");
    }
  };

  const handleReset = () =>
    setForm({
      name: "",
      role: "",
      email: "",
      phone: "",
      address: "",
      city: "",
      state: "",
      joining_date: "",
      gender: "",
      emergency_contact: "",
      status: "Active",
      role_description: "",
      access_level: "Executive",
    });

  const handleEdit = (emp) => {
    // populate editData and open modal
    setEditData({
      ...emp,
      status: emp.status || "Active",
      role_description: emp.role_description || "",
      access_level: emp.access_level || "Executive",
      phone: emp.phone || "",
      address: emp.address || "",
      city: emp.city || "",
      state: emp.state || "",
      joining_date: emp.joining_date || "",
      gender: emp.gender || "",
      emergency_contact: emp.emergency_contact || "",
    });
    setShowEditModal(true);
  };

    const handleEmployeeClick = useCallback(async (emp) => {
      setSelectedEmployee(emp);
      setActiveEmployeeTab("profile");
      setShowEmployeeModal(true);

      try {
        await fetchProfile(emp.id);
      } catch (err) {
        console.warn("Profile fetch failed:", err);
      }

      try {
        const res = await api.workGivenList({
          entity_type: "EMPLOYEE",
          entity_id: emp.id,
        });
        const list = Array.isArray(res.data) ? res.data : res.data?.results || [];
        setWorkGivenList(
          list.map((w) => ({
            ...w,
            priority: w.priority || w.priority_level || "Medium",
          }))
        );
      } catch (err) {
        console.warn("Work list fetch failed:", err);
        setWorkGivenList([]);
      }
    }, []);


    useEffect(() => {
      if (selectedEmployeeForWork) {
        handleEmployeeClick(selectedEmployeeForWork);
        setActiveEmployeeTab("work");
        setSelectedEmployeeForWork(null);
      }
    }, [selectedEmployeeForWork, handleEmployeeClick, setSelectedEmployeeForWork]);



  const handleWorkGivenCreate = async (e) => {
    e.preventDefault();
    if (!selectedEmployee) return;

    if (!workForm.title || !workForm.submission_date) {
      return alert("Please select service and submission date");
    }

    const payload = {
      employee: selectedEmployee.id,
      title: workForm.title,
      description: workForm.description,
      submission_date: workForm.submission_date,
      priority: workForm.priority,
    };

    console.log(">>> Sending CreateWork payload:", payload);

    // optimistic UI
    const optimisticItem = {
      id: `temp-${Date.now()}`,
      title: workForm.title,
      description: workForm.description,
      submission_date: workForm.submission_date,
      priority: workForm.priority || "Medium",
      status: "PENDING",
      given_on: new Date().toISOString().slice(0, 10),
    };
    setWorkGivenList((prev) => [optimisticItem, ...(prev || [])]);

    try {
      // capture response
      const createRes = await api.createWorkGiven(payload);
      console.log("<<< Create response:", createRes?.data ?? createRes);

      // clear form (explicit default)
      setWorkForm({
        title: "",
        description: "",
        submission_date: "",
        priority: "Medium",
      });

      // refetch list and normalize
      const res = await api.workGivenList({
        entity_type: "EMPLOYEE",
        entity_id: selectedEmployee.id,
      });
      const list = Array.isArray(res.data) ? res.data : res.data?.results || [];
      console.log("<<< Fetched work list from server:", list);
      setWorkGivenList(
        list.map((w) => ({
          ...w,
          priority: w.priority || w.priority_level || "Medium",
        }))
      );
    } catch (err) {
      console.error("Error creating work given:", err);
      alert("Work was not saved — please check the console for errors.");
      // remove optimistic
      setWorkGivenList((prev) =>
        prev ? prev.filter((i) => !String(i.id).startsWith("temp-")) : []
      );
    }
  };

  const handleUpdate = async () => {
    if (!editData?.id) return alert("No employee selected");
    try {
      await axios.put(`${BASE_API}employees/${editData.id}/`, {
        name: editData.name,
        email: editData.email,
        role: editData.role,
        phone: editData.phone,
        address: editData.address,
        city: editData.city,
        state: editData.state,
        joining_date: editData.joining_date,
        gender: editData.gender,
        emergency_contact: editData.emergency_contact,
        status: editData.status,
        role_description: editData.role_description,
        access_level: editData.access_level,
      });
      alert("Employee updated successfully!");
      setShowEditModal(false);
      fetchEmployees();
    } catch (err) {
      console.error("Update failed:", err.response?.data || err.message);
      alert("Failed to update employee");
    }
  };

  // Change status inline
  const handleStatusChange = async (empId, newStatus) => {
    setEmployees((prev) =>
      prev.map((e) => (e.id === empId ? { ...e, status: newStatus } : e))
    );
    try {
      await axios.patch(`${BASE_API}employees/${empId}/`, { status: newStatus });
    } catch (err) {
      console.error("Failed to update status:", err);
      setError("Failed to update status");
      fetchEmployees();
    }
  };

  // Change access level inline
  const handleAccessChange = async (empId, newAccess) => {
    setEmployees((prev) =>
      prev.map((e) =>
        e.id === empId ? { ...e, access_level: newAccess } : e
      )
    );
    try {
      await axios.patch(`${BASE_API}employees/${empId}/`, { access_level: newAccess });
    } catch (err) {
      console.error("Failed to update access level:", err);
      setError("Failed to update access level");
      fetchEmployees();
    }
  };

  // helper to update editData fields in modal
  const setEditField = (k, v) => setEditData((prev) => ({ ...prev, [k]: v }));

  // form change handler for create form
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const filteredEmployees = employees.filter((emp) =>
    [emp.name, emp.role, emp.email, emp.role_description, emp.access_level].some(
      (field) =>
        (field || "").toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  const statusColor = (status) => {
    if (!status) return "#9CA3AF";
    if (status === "Active") return "#10B981";
    if (status === "On Leave") return "#F59E0B";
    if (status === "Inactive") return "#EF4444";
    return "#9CA3AF";
  };

  const accessColor = (access) => {
    if (!access) return "#9CA3AF";
    if (access === "Admin") return "#ef4444"; // red
    if (access === "Manager") return "#2563eb"; // blue
    if (access === "Executive") return "#10b981"; // green
    return "#9CA3AF";
  };

  // compute simple performance stats from work list
  const computePerformance = (works) => {
    if (!Array.isArray(works)) return { total: 0, done: 0, pending: 0 };
    const total = works.length;
    const done = works.filter(
      (w) => (w.status || "").toUpperCase() === "DONE"
    ).length;
    const pending = total - done;
    return { total, done, pending };
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
          Manage Employees
        </h2>

        {/* CREATE FORM */}
        <form
          onSubmit={handleCreate}
          style={{
            display: "flex",
            gap: "10px",
            marginBottom: "20px",
            flexWrap: "wrap",
          }}
        >
          <input
            type="text"
            name="name"
            placeholder="Name"
            value={form.name}
            onChange={handleChange}
            style={inputStyle}
            required
          />

          <input
            type="email"
            name="email"
            placeholder="Email"
            value={form.email}
            onChange={handleChange}
            style={inputStyle}
          />

          <input
            type="text"
            name="role"
            placeholder="Role"
            value={form.role}
            onChange={handleChange}
            style={inputStyle}
          />

          <input
            type="text"
            name="role_description"
            placeholder="Role description (short)"
            value={form.role_description}
            onChange={handleChange}
            style={{
              padding: "10px",
              borderRadius: "8px",
              border: "1px solid #ccc",
              minWidth: 220,
            }}
          />

          {/* Address / City / State as dropdowns */}
          <input
                  type="text"
                  name="address"
                  placeholder="Address"
                  value={form.address}
                  onChange={handleChange}
                  style={inputStyle}
                />

                <input
                  type="text"
                  name="city"
                  placeholder="City"
                  value={form.city}
                  onChange={handleChange}
                  style={inputStyle}
                />

                <input
                  type="text"
                  name="state"
                  placeholder="State"
                  value={form.state}
                  onChange={handleChange}
                  style={inputStyle}
                />

          {/* Joining date */}
          <input
            type="date"
            name="joining_date"
            value={form.joining_date}
            onChange={handleChange}
            style={inputStyle}
          />

          {/* Gender */}
          <select name="gender" value={form.gender} onChange={handleChange} style={inputStyle}>
            <option value="">Select gender</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
          </select>

          {/* Phone and emergency contact */}
          <input
            type="text"
            name="phone"
            placeholder="Phone"
            value={form.phone}
            onChange={handleChange}
            style={inputStyle}
          />
          <input
            type="text"
            name="emergency_contact"
            placeholder="Emergency Contact"
            value={form.emergency_contact}
            onChange={handleChange}
            style={inputStyle}
          />

          {/* Status & Access */}
          <select
            name="status"
            value={form.status}
            onChange={handleChange}
            style={{
              padding: "10px",
              borderRadius: "8px",
              border: "1px solid #ccc",
              minWidth: 140,
            }}
          >
            <option value="Active">Active</option>
            <option value="On Leave">On Leave</option>
            <option value="Inactive">Inactive</option>
          </select>

          <select
            name="access_level"
            value={form.access_level}
            onChange={handleChange}
            style={{
              padding: "10px",
              borderRadius: "8px",
              border: "1px solid #ccc",
              minWidth: 140,
            }}
          >
            <option value="Executive">Executive</option>
            <option value="Manager">Manager</option>
            <option value="Admin">Admin</option>
          </select>

          <button type="submit" className="btn3d blue" disabled={saving}>
            Create
          </button>
          <button
            type="button"
            className="btn3d dark red"
            onClick={handleReset}
          >
            Reset
          </button>
        </form>

        {/* TABLE */}
        <div style={tableContainer}>
          {/* SEARCH BAR */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: "10px",
            }}
          >
            <div style={{ display: "flex", gap: 10 }}>
              <input
                type="text"
                placeholder="Search by name, role, access..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  padding: "15px 15px",
                  borderRadius: "10px",
                  border: "1px solid #ccc",
                  width: "350px",
                }}
              />
            </div>
          </div>

          <table style={tableStyle}>
            <thead style={theadStyle}>
              <tr>
                <th style={{ padding: "12px 20px" }}>ID</th>
                <th style={{ padding: "12px 20px" }}>Name</th>
                <th style={{ padding: "12px 20px" }}>Email</th>
                <th style={{ padding: "12px 20px" }}>Role</th>
                <th style={{ padding: "12px 20px" }}>Role Description</th>
                <th style={{ padding: "12px 20px" }}>Access</th>
                <th style={{ padding: "12px 20px" }}>Status</th>
                <th style={{ padding: "12px 20px" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: "center" }}>
                    Loading employees...
                  </td>
                </tr>
              ) : filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: "center" }}>
                    No employees found.
                  </td>
                </tr>
              ) : (
                filteredEmployees.map((emp) => (
                  <tr key={emp.id}>
                    <td style={{ padding: "8px 20px" }}>{emp.id}</td>
                    <td
                      style={{
                        padding: "8px 20px",
                        cursor: "pointer",
                        color: "#2563eb",
                        textDecoration: "underline",
                        fontWeight: 600,
                      }}
                      onClick={() => handleEmployeeClick(emp)}
                    >
                      {emp.name}
                    </td>

                    <td style={{ padding: "8px 20px" }}>
                      {emp.email || "-"}
                    </td>
                    <td style={{ padding: "8px 20px" }}>
                      {emp.role || "-"}
                    </td>
                    <td
                      style={{
                        padding: "8px 20px",
                        maxWidth: 300,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {emp.role_description || "-"}
                    </td>

                    {/* Access column */}
                    <td style={{ padding: "8px 20px" }}>
                      <div
                        style={{ display: "flex", alignItems: "center", gap: 10 }}
                      >
                        <span
                          style={{
                            display: "inline-block",
                            width: 10,
                            height: 10,
                            borderRadius: 6,
                            background: accessColor(emp.access_level),
                          }}
                          title={emp.access_level}
                        />
                        <select
                          value={emp.access_level || "Executive"}
                          onChange={(e) =>
                            handleAccessChange(emp.id, e.target.value)
                          }
                          style={{
                            padding: "6px 10px",
                            borderRadius: 6,
                            border: "1px solid #e5e7eb",
                          }}
                        >
                          <option value="Executive">Executive</option>
                          <option value="Manager">Manager</option>
                          <option value="Admin">Admin</option>
                        </select>
                      </div>
                    </td>

                    {/* Status cell */}
                    <td
                      style={{
                        padding: "8px 20px",
                        verticalAlign: "middle",
                      }}
                    >
                      <div
                        style={{ display: "flex", alignItems: "center", gap: 10 }}
                      >
                        <span
                          style={{
                            display: "inline-block",
                            width: 12,
                            height: 12,
                            borderRadius: 6,
                            background: statusColor(emp.status),
                            boxShadow: "0 1px 0 rgba(0,0,0,0.15)",
                          }}
                          title={emp.status}
                        />
                        <select
                          value={emp.status || "Active"}
                          onChange={(e) =>
                            handleStatusChange(emp.id, e.target.value)
                          }
                          style={{
                            padding: "6px 10px",
                            borderRadius: 6,
                            border: "1px solid #e5e7eb",
                          }}
                        >
                          <option value="Active">Active</option>
                          <option value="On Leave">On Leave</option>
                          <option value="Inactive">Inactive</option>
                        </select>
                      </div>
                    </td>

                    <td style={{ padding: "8px 20px" }}>
                      <div
                        style={{ display: "flex", gap: "10px", alignItems: "center" }}
                      >
                        <button
                          className="btn3d blue"
                          onClick={() => handleEdit(emp)}
                        >
                          Edit
                        </button>
                        <button
                          className="btn3d red"
                          onClick={() => handleDelete(emp.id)}
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

        {error && (
          <p style={{ color: "red", marginTop: "10px" }}>{error}</p>
        )}
      </div>

      {/* Unified Employee Modal (Profile <-> Work) */}
      {showEmployeeModal && selectedEmployee && (
        <div style={modalOverlay}>
          <div
            style={{
              ...modalBox,
              width: "820px",
              maxHeight: "90vh",
              overflowY: "auto",
            }}
          >
            {/* Header + Tab Buttons */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 12,
              }}
            >
              <div>
                <h3 style={{ margin: 0 }}>{selectedEmployee.name}</h3>
                <div style={{ fontSize: 13, color: "#6b7280", marginTop: 6 }}>
                  {selectedEmployee.email && (
                    <div>Email: {selectedEmployee.email}</div>
                  )}
                  {selectedEmployee.role && (
                    <div>Role: {selectedEmployee.role}</div>
                  )}
                </div>
              </div>

              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <button
                  className={`btn3d ${
                    activeEmployeeTab === "profile" ? "blue" : "gray"
                  }`}
                  onClick={() => setActiveEmployeeTab("profile")}
                  style={{ padding: "8px 12px", fontSize: 14 }}
                >
                  View Profile
                </button>
                <button
                  className={`btn3d ${
                    activeEmployeeTab === "work" ? "blue" : "gray"
                  }`}
                  onClick={() => setActiveEmployeeTab("work")}
                  style={{ padding: "8px 12px", fontSize: 14 }}
                >
                  Work Given
                </button>
                <button
                  className="btn3d gray"
                  onClick={() => setShowEmployeeModal(false)}
                  style={{ padding: "8px 12px", fontSize: 14 }}
                >
                  Close
                </button>
              </div>
            </div>

            <hr style={{ margin: "12px 0" }} />

            {/* CONTENT: toggles between profile and work */}
            {activeEmployeeTab === "profile" ? (
              // ---------- PROFILE VIEW ----------
              <div>
                {/* Use profileData if available, else fallback to selectedEmployee */}
                <div style={{ display: "flex", gap: 20, marginBottom: 12 }}>
                  <div style={{ flex: "1 1 60%" }}>
                    <h4 style={{ margin: "6px 0" }}>Personal Details</h4>
                    <div style={{ color: "#374151" }}>
                      <div>
                        <strong>Name:</strong>{" "}
                        {profileData?.name || selectedEmployee.name}
                      </div>
                      <div>
                        <strong>Email:</strong>{" "}
                        {profileData?.email ||
                          selectedEmployee.email ||
                          "-"}
                      </div>
                      <div>
                        <strong>Phone:</strong>{" "}
                        {profileData?.phone || "-"}
                      </div>
                      <div>
                        <strong>Address:</strong>{" "}
                        {profileData?.address || "-"}
                      </div>
                      <div>
                        <strong>City:</strong>{" "}
                        {profileData?.city || "-"}
                      </div>
                      <div>
                        <strong>State:</strong>{" "}
                        {profileData?.state || "-"}
                      </div>
                      <div>
                        <strong>Joining Date:</strong>{" "}
                        {profileData?.joining_date || "-"}
                      </div>
                      <div>
                        <strong>Gender:</strong>{" "}
                        {profileData?.gender || "-"}
                      </div>
                      <div>
                        <strong>Emergency Contact:</strong>{" "}
                        {profileData?.emergency_contact || "-"}
                      </div>
                      <div>
                        <strong>Role:</strong>{" "}
                        {profileData?.role || selectedEmployee.role || "-"}
                      </div>
                      <div>
                        <strong>Access:</strong>{" "}
                        {profileData?.access_level ||
                          selectedEmployee.access_level ||
                          "-"}
                      </div>
                      <div>
                        <strong>Status:</strong>{" "}
                        {profileData?.status ||
                          selectedEmployee.status ||
                          "-"}
                      </div>
                      {(profileData?.role_description ||
                        selectedEmployee.role_description) && (
                        <div style={{ marginTop: 6 }}>
                          <strong>About:</strong>{" "}
                          {profileData?.role_description ||
                            selectedEmployee.role_description}
                        </div>
                      )}
                    </div>
                  </div>

                  <div style={{ flex: "1 1 40%" }}>
                    <h4 style={{ margin: "6px 0" }}>Documents</h4>
                    {Array.isArray(profileData?.documents) &&
                    profileData.documents.length > 0 ? (
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: 8,
                        }}
                      >
                        {profileData.documents.map((doc, idx) => (
                          <div
                            key={idx}
                            style={{
                              padding: 8,
                              borderRadius: 8,
                              border: "1px solid #e5e7eb",
                            }}
                          >
                            <div
                              style={{ fontSize: 13, fontWeight: 600 }}
                            >
                              {doc.type || "Document"}
                            </div>
                            {doc.url ? (
                              <a
                                href={doc.url}
                                target="_blank"
                                rel="noreferrer"
                              >
                                View / Download
                              </a>
                            ) : (
                              <div style={{ color: "#9ca3af" }}>
                                No file link
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div style={{ color: "#9ca3af" }}>
                        No documents uploaded.
                      </div>
                    )}
                  </div>
                </div>

                <div style={{ marginBottom: 12 }}>
                  <h4 style={{ margin: "6px 0" }}>Attendance Summary</h4>
                  {attendanceSummary ? (
                    <div>
                      <div>
                        Days Present (month):{" "}
                        {attendanceSummary.days_present ?? "-"}
                      </div>
                      <div>
                        Days Absent (month):{" "}
                        {attendanceSummary.days_absent ?? "-"}
                      </div>
                      <div>
                        Times Late:{" "}
                        {attendanceSummary.times_late ?? "-"}
                      </div>
                    </div>
                  ) : (
                    <div style={{ color: "#9ca3af" }}>
                      Attendance data not available.
                    </div>
                  )}
                </div>

                {/* Performance cards */}
                <div style={{ display: "flex", gap: 12, marginBottom: 14 }}>
                  {(() => {
                    const stats = computePerformance(workGivenList || []);
                    return (
                      <>
                        <div
                          style={{
                            padding: 12,
                            borderRadius: 8,
                            background: "#f8fafc",
                            minWidth: 120,
                          }}
                        >
                          <div
                            style={{
                              fontSize: 12,
                              color: "#6b7280",
                            }}
                          >
                            Assigned
                          </div>
                          <div
                            style={{
                              fontSize: 20,
                              fontWeight: 700,
                            }}
                          >
                            {stats.total}
                          </div>
                        </div>
                        <div
                          style={{
                            padding: 12,
                            borderRadius: 8,
                            background: "#f8fafc",
                            minWidth: 120,
                          }}
                        >
                          <div
                            style={{
                              fontSize: 12,
                              color: "#6b7280",
                            }}
                          >
                            Done
                          </div>
                          <div
                            style={{
                              fontSize: 20,
                              fontWeight: 700,
                            }}
                          >
                            {stats.done}
                          </div>
                        </div>
                        <div
                          style={{
                            padding: 12,
                            borderRadius: 8,
                            background: "#f8fafc",
                            minWidth: 120,
                          }}
                        >
                          <div
                            style={{
                              fontSize: 12,
                              color: "#6b7280",
                            }}
                          >
                            Pending
                          </div>
                          <div
                            style={{
                              fontSize: 20,
                              fontWeight: 700,
                            }}
                          >
                            {stats.pending}
                          </div>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>
            ) : (
              // ---------- WORK GIVEN VIEW (assign & history) ----------
              <div>
                <form
                  onSubmit={handleWorkGivenCreate}
                  style={{
                    display: "flex",
                    gap: 12,
                    flexWrap: "wrap",
                    marginBottom: 12,
                  }}
                >
                  <select
                    value={workForm.title}
                    onChange={(e) =>
                      setWorkForm({ ...workForm, title: e.target.value })
                    }
                    style={{
                      flex: "1 1 50%",
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
                      flex: "1 1 20%",
                      padding: 12,
                      borderRadius: 8,
                      border: "1px solid #e5e7eb",
                    }}
                    required
                  />

                  {/* Priority selector */}
                  <select
                    value={workForm.priority}
                    onChange={(e) =>
                      setWorkForm({
                        ...workForm,
                        priority: e.target.value,
                      })
                    }
                    style={{
                      flex: "1 1 15%",
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
                      flex: "1 1 100%",
                      padding: 12,
                      borderRadius: 8,
                      border: "1px solid #e5e7eb",
                      minHeight: 80,
                    }}
                  />

                  <div
                    style={{
                      width: "100%",
                      display: "flex",
                      justifyContent: "flex-start",
                      marginTop: 6,
                    }}
                  >
                    <button type="submit" className="btn3d blue">
                      Assign Work
                    </button>
                  </div>
                </form>

                <h4 style={{ marginTop: 8, marginBottom: 8 }}>
                  Work history
                </h4>
                <div style={{ overflowX: "auto" }}>
                  <table
                    style={{
                      width: "100%",
                      borderCollapse: "collapse",
                      tableLayout: "fixed",
                      fontSize: 14,
                    }}
                  >
                    <thead>
                      <tr>
                        <th
                          style={{
                            width: "25%",
                            textAlign: "left",
                            padding: 10,
                          }}
                        >
                          Work Title
                        </th>
                        <th
                          style={{
                            width: "20%",
                            textAlign: "left",
                            padding: 10,
                          }}
                        >
                          Given On
                        </th>
                        <th
                          style={{
                            width: "20%",
                            textAlign: "left",
                          }}
                        >
                          Submission Date
                        </th>
                        <th
                          style={{
                            width: "20%",
                            textAlign: "left",
                          }}
                        >
                          Priority
                        </th>
                        <th
                          style={{
                            width: "20%",
                            textAlign: "left",
                          }}
                        >
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {Array.isArray(workGivenList) &&
                      workGivenList.length === 0 ? (
                        <tr>
                          <td
                            colSpan={5}
                            style={{ padding: 12, color: "#9ca3af" }}
                          >
                            No work given yet for this employee.
                          </td>
                        </tr>
                      ) : (
                        workGivenList.map((w) => (
                          <tr key={w.id}>
                            <td
                              style={{
                                padding: 12,
                                borderBottom: "1px solid #f3f4f6",
                              }}
                            >
                              {w.title}
                            </td>
                            <td
                              style={{
                                padding: 12,
                                borderBottom: "1px solid #f3f4f6",
                              }}
                            >
                              {w.given_on}
                            </td>
                            <td
                              style={{
                                padding: 12,
                                borderBottom: "1px solid #f3f4f6",
                              }}
                            >
                              {w.submission_date}
                            </td>
                            <td
                              style={{
                                padding: 12,
                                borderBottom: "1px solid #f3f4f6",
                                verticalAlign: "middle",
                              }}
                            >
                              <span
                                style={{
                                  padding: "4px 10px",
                                  borderRadius: "6px",
                                  fontSize: "12px",
                                  fontWeight: 600,
                                  background:
                                    w.priority === "High"
                                      ? "#fee2e2"
                                      : w.priority === "Medium"
                                      ? "#fff7ed"
                                      : "#ecfdf5",
                                  color:
                                    w.priority === "High"
                                      ? "#b91c1c"
                                      : w.priority === "Medium"
                                      ? "#b45309"
                                      : "#047857",
                                }}
                              >
                                {w.priority}
                              </span>
                            </td>


                            <td
                              style={{
                                padding: 12,
                                borderBottom: "1px solid #f3f4f6",
                              }}
                            >
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 8,
                                }}
                              >
                                <span style={{ fontWeight: 700 }}>
                                  {w.status}
                                </span>
                                {w.status !== "DONE" && (
                                  <button
                                    type="button"
                                    className="btn3d blue"
                                    onClick={async () => {
                                      await api.updateWorkGiven(w.id, {
                                        ...w,
                                        status: "DONE",
                                      });
                                      const res =
                                        await api.workGivenList({
                                          entity_type: "EMPLOYEE",
                                          entity_id: selectedEmployee.id,
                                        });
                                      const list = Array.isArray(res.data)
                                        ? res.data
                                        : res.data.results || [];
                                      setWorkGivenList(
                                        list.map((item) => ({
                                          ...item,
                                          priority:
                                            item.priority ||
                                            item.priority_level ||
                                            "Medium",
                                        }))
                                      );
                                    }}
                                    style={{
                                      marginLeft: 8,
                                      padding: "6px 8px",
                                      fontSize: 13,
                                    }}
                                  >
                                    Mark Done
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* EDIT EMPLOYEE POPUP */}
      {showEditModal && editData && (
        <div style={modalOverlay}>
          <div style={modalBox}>
            <h3>Edit Employee</h3>

            <input
              type="text"
              value={editData.name || ""}
              onChange={(e) => setEditField("name", e.target.value)}
              style={inputStyle}
              placeholder="Name"
            />

            <input
              type="email"
              value={editData.email || ""}
              onChange={(e) => setEditField("email", e.target.value)}
              style={inputStyle}
              placeholder="Email"
            />

            <input
              type="text"
              value={editData.phone || ""}
              onChange={(e) => setEditField("phone", e.target.value)}
              style={inputStyle}
              placeholder="Phone Number"
            />

          <input
              type="text"
              value={editData.address || ""}
              onChange={(e) => setEditField("address", e.target.value)}
              placeholder="Address"
              style={inputStyle}
            />

            <input
              type="text"
              value={editData.city || ""}
              onChange={(e) => setEditField("city", e.target.value)}
              placeholder="City"
              style={inputStyle}
            />

            <input
              type="text"
              value={editData.state || ""}
              onChange={(e) => setEditField("state", e.target.value)}
              placeholder="State"
              style={inputStyle}
            />

            <input
              type="date"
              value={editData.joining_date || ""}
              onChange={(e) => setEditField("joining_date", e.target.value)}
              style={inputStyle}
            />

            <select value={editData.gender || ""} onChange={(e) => setEditField("gender", e.target.value)} style={inputStyle}>
              <option value="">Select gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>

            <input
              type="text"
              value={editData.emergency_contact || ""}
              onChange={(e) => setEditField("emergency_contact", e.target.value)}
              style={inputStyle}
              placeholder="Emergency Contact"
            />

            <input
              type="text"
              value={editData.role || ""}
              onChange={(e) => setEditField("role", e.target.value)}
              style={inputStyle}
              placeholder="Role"
            />

            <textarea
              value={editData.role_description || ""}
              onChange={(e) => setEditField("role_description", e.target.value)}
              placeholder="Role Description"
              style={{
                padding: "10px",
                borderRadius: "8px",
                border: "1px solid #ccc",
                marginTop: 8,
                minHeight: 60,
              }}
            />

            <select
              value={editData.status || "Active"}
              onChange={(e) => setEditField("status", e.target.value)}
              style={{
                padding: "10px",
                borderRadius: "8px",
                border: "1px solid #ccc",
                marginTop: 8,
              }}
            >
              <option value="Active">Active</option>
              <option value="On Leave">On Leave</option>
              <option value="Inactive">Inactive</option>
            </select>

            <select
              value={editData.access_level || "Executive"}
              onChange={(e) => setEditField("access_level", e.target.value)}
              style={{
                padding: "10px",
                borderRadius: "8px",
                border: "1px solid #ccc",
                marginTop: 8,
              }}
            >
              <option value="Executive">Executive</option>
              <option value="Manager">Manager</option>
              <option value="Admin">Admin</option>
            </select>

            <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
              <button className="btn3d blue" onClick={handleUpdate}>
                Update
              </button>
              <button
                className="btn3d red"
                onClick={() => setShowEditModal(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

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
        .btn3d.gray {
          background: linear-gradient(145deg, #6b7280, #4b5563);
        }
      `}</style>
    </div>
  );
}

// Reusable Styles
const inputStyle = {
  flex: 1,
  padding: "10px",
  borderRadius: "8px",
  border: "1px solid #ccc",
  minWidth: "150px",
};

const tableContainer = {
  overflowX: "auto",
  overflowY: "auto",
  maxHeight: "500px",
  borderRadius: "20px",
  background: "#fff",
  boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
  marginTop: "20px",
};

const theadStyle = {
  background: "#f1f5f9",
  fontWeight: "bold",
  textAlign: "left",
  position: "sticky",
  top: 6,
  zIndex: 1,
};

const tableStyle = {
  width: "100%",
  borderSpacing: "0 10px",
  textAlign: "left",
  borderCollapse: "separate",
};

const modalOverlay = {
  position: "fixed",
  top: 0,
  left: 0,
  width: "100%",
  height: "100%",
  backgroundColor: "rgba(0, 0, 0, 0.5)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  zIndex: 1000,
};

const modalBox = {
  background: "#fff",
  padding: "20px",
  borderRadius: "10px",
  width: "600px",
  boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
};
