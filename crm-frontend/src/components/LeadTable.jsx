import React, { useState, useEffect } from 'react';

function LeadTable() {
  const [leads, setLeads] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({ name: '', email: '', company: '' });
  const [newLead, setNewLead] = useState({ name: '', email: '', company: '' });

  const API_URL = "http://127.0.0.1:8000/api/leads/"; // Change if your backend URL is different

  // Fetch leads when component loads
  useEffect(() => {
    fetchLeads();
  }, []);

  const fetchLeads = async () => {
    try {
      const response = await fetch(API_URL);
      if (response.ok) {
        const data = await response.json();
        setLeads(data);
      } else {
        console.error("Failed to fetch leads");
      }
    } catch (error) {
      console.error(error);
    }
  };

  // Handle input change for edit
  const handleEditChange = (e) => {
    setEditData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  // Handle input change for new lead
  const handleNewLeadChange = (e) => {
    setNewLead(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  // Add new lead
  const handleAddLead = async () => {
    if (!newLead.name || !newLead.email || !newLead.company) {
      alert("Please fill all fields");
      return;
    }
    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newLead),
      });
      if (response.ok) {
        const addedLead = await response.json();
        setLeads([...leads, addedLead]);
        setNewLead({ name: '', email: '', company: '' });
      } else {
        alert("Failed to add lead");
      }
    } catch (error) {
      console.error(error);
      alert("Error connecting to server");
    }
  };

  // Start editing
  const handleEditClick = (lead) => {
    setEditingId(lead.id);
    setEditData({ name: lead.name, email: lead.email, company: lead.company });
  };

  // Save edited lead
  const handleEditSave = async (id) => {
    try {
      const response = await fetch(`${API_URL}${id}/`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editData),
      });
      if (response.ok) {
        const updatedLead = await response.json();
        setLeads(leads.map(lead => (lead.id === id ? updatedLead : lead)));
        setEditingId(null);
      } else {
        alert("Failed to update lead");
      }
    } catch (error) {
      console.error(error);
      alert("Error updating lead");
    }
  };

  // Cancel editing
  const handleCancel = () => setEditingId(null);

  // Delete lead
  const handleDelete = async (id) => {
    try {
      const response = await fetch(`${API_URL}${id}/`, { method: "DELETE" });
      if (response.ok || response.status === 204) {
        setLeads(leads.filter(lead => lead.id !== id));
      } else {
        alert("Failed to delete lead");
      }
    } catch (error) {
      console.error(error);
      alert("Error deleting lead");
    }
  };

  return (
    <div className="p-4">
      {/* Add New Lead Form */}
      <div className="mb-4 p-4 bg-white shadow rounded">
        <h2 className="text-lg font-bold mb-2">Add New Lead</h2>
        <div className="grid grid-cols-3 gap-2 mb-2">
          <input
            type="text"
            name="name"
            placeholder="Name"
            value={newLead.name}
            onChange={handleNewLeadChange}
            className="border rounded p-2"
          />
          <input
            type="email"
            name="email"
            placeholder="Email"
            value={newLead.email}
            onChange={handleNewLeadChange}
            className="border rounded p-2"
          />
          <input
            type="text"
            name="company"
            placeholder="Company"
            value={newLead.company}
            onChange={handleNewLeadChange}
            className="border rounded p-2"
          />
        </div>
        <button
          onClick={handleAddLead}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Add Lead
        </button>
      </div>

      {/* Leads Table */}
      {leads.length === 0 ? (
        <p className="text-gray-600">No leads added yet.</p>
      ) : (
        <table className="w-full bg-white shadow rounded overflow-hidden">
          <thead className="bg-blue-600 text-white">
            <tr>
              <th className="p-2 text-left">Name</th>
              <th className="p-2 text-left">Email</th>
              <th className="p-2 text-left">Company</th>
              <th className="p-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {leads.map((lead) => (
              <tr key={lead.id} className="border-b last:border-0">
                {editingId === lead.id ? (
                  <>
                    <td className="p-2">
                      <input
                        type="text"
                        name="name"
                        value={editData.name}
                        onChange={handleEditChange}
                        className="border rounded p-1 w-full"
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="email"
                        name="email"
                        value={editData.email}
                        onChange={handleEditChange}
                        className="border rounded p-1 w-full"
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="text"
                        name="company"
                        value={editData.company}
                        onChange={handleEditChange}
                        className="border rounded p-1 w-full"
                      />
                    </td>
                    <td className="p-2 space-x-2">
                      <button
                        onClick={() => handleEditSave(lead.id)}
                        className="bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700"
                      >
                        Save
                      </button>
                      <button
                        onClick={handleCancel}
                        className="bg-gray-400 text-white px-2 py-1 rounded hover:bg-gray-500"
                      >
                        Cancel
                      </button>
                    </td>
                  </>
                ) : (
                  <>
                    <td className="p-2">{lead.name}</td>
                    <td className="p-2">{lead.email}</td>
                    <td className="p-2">{lead.company}</td>
                    <td className="p-2 space-x-2">
                      <button
                        onClick={() => handleEditClick(lead)}
                        className="bg-yellow-500 text-white px-2 py-1 rounded hover:bg-yellow-600"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(lead.id)}
                        className="bg-red-600 text-white px-2 py-1 rounded hover:bg-red-700"
                      >
                        Delete
                      </button>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default LeadTable;
