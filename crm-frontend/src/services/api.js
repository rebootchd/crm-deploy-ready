// src/services/api.js
import axios from "axios";

//const BASE = process.env.REACT_APP_API_BASE_URL;

const BASE = process.env.REACT_APP_API_BASE_URL || "http://127.0.0.1:8000/crm/v1/";

// Create axios instance
const instance = axios.create({
  baseURL: BASE,
  headers: { "Content-Type": "application/json" },
});

// Automatically attach token if available
instance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("access_token") || localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ✅ Unified API functions
export const api = {
  // Employees
  employees: () => instance.get("employees/"),
  createEmployee: (data) => instance.post("employees/", data),
  updateEmployee: (id, data) => instance.put(`employees/${id}/`, data),
  deleteEmployee: (id) => instance.delete(`employees/${id}/`),

  // ✅ Leads (fixed endpoint)
  leads: () => instance.get("leads/"),
  createLead: (data) => instance.post("leads/", data),
  updateLead: (id, data) => instance.put(`leads/${id}/`, data),
  deleteLead: (id) => instance.delete(`leads/${id}/`),

  // Call Logs
  callLogs: () => instance.get("call-logs/"),
  createCallLog: (data) => instance.post("call-logs/", data),
  updateCallLog: (id, data) => instance.put(`call-logs/${id}/`, data),
  deleteCallLog: (id) => instance.delete(`call-logs/${id}/`),


  // Work Given (NEW)
  workGivenList: (params) => instance.get("work-given/", { params }),
  createWorkGiven: (data) => instance.post("work-given/", data),
  updateWorkGiven: (id, data) => instance.put(`work-given/${id}/`, data),
  deleteWorkGiven: (id) => instance.delete(`work-given/${id}/`),


  servicesList: (params) => instance.get("services/", { params }),


  // Clients
  clients: () => instance.get("clients/"),

  // Projects
  projects: () => instance.get("projects/"),

  // Assignments
  assignments: () => instance.get("assignments/"),

  // Follow-ups
  followUps: () => instance.get("follow-ups/"),
};

export default instance;
