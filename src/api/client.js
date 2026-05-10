import axios from "axios";

// Shared axios instance for all frontend API calls.
const api = axios.create({
  baseURL: "/api",
  withCredentials: true,
});

// Authentication endpoints.
export const authAPI = {
  login: (data) => api.post("/auth/login", data),
  logout: () => api.post("/auth/logout"),
  register: (data) => api.post("/auth/register", data),
  me: () => api.get("/auth/me"),
};

// Patient-facing endpoints for profile, booking, billing, and records.
export const patientAPI = {
  dashboard: () => api.get("/patient/dashboard"),
  profile: () => api.get("/patient/profile"),
  updateProfile: (data) => api.put("/patient/profile", data),
  appointments: () => api.get("/patient/appointments"),
  referringDoctors: () => api.get("/patient/referring-doctors"),
  availableSlots: (date) =>
    api.get(`/patient/available-slots?date=${encodeURIComponent(date)}`),
  bookAppointment: (data) => api.post("/patient/book-appointment", data),
  cancelAppointment: (id) => api.post(`/patient/cancel-appointment/${id}`),
  rescheduleAppointment: (id, data) =>
    api.post(`/patient/reschedule-appointment/${id}`, data),
  billing: () => api.get("/patient/billing"),
  payInvoice: (id) => api.post(`/patient/pay-invoice/${id}`),
  records: () => api.get("/patient/records"),
  // Reuses the staff image endpoint to fetch scans linked to patient records.
  getImages: (orderId) => api.get(`/staff/images/${orderId}`),
};

// Staff-facing endpoints for appointments, orders, reporting, and imaging assets.
export const staffAPI = {
  dashboard: () => api.get("/staff/dashboard"),
  appointments: () => api.get("/staff/appointments"),
  updateAppointment: (id, data) =>
    api.post(`/staff/update-appointment/${id}`, data),
  imagingOrders: () => api.get("/staff/imaging-orders"),
  updateOrder: (id, data) => api.post(`/staff/update-order/${id}`, data),
  getReport: (orderId) => api.get(`/staff/radiology-report/${orderId}`),
  saveReport: (orderId, data) =>
    api.post(`/staff/radiology-report/${orderId}`, data),
  uploadImage: (orderId, file) => {
    const fd = new FormData();
    fd.append("file", file);
    return api.post(`/staff/upload-image/${orderId}`, fd, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
  getImages: (orderId) => api.get(`/staff/images/${orderId}`),
  getMachines: () => api.get("/staff/machines"),
  updateMachine: (id, data) => api.put(`/staff/machines/${id}`, data),
  deleteImage: (fileId) => api.delete(`/staff/images/${fileId}`),
};

// Admin-facing endpoints for operational oversight.
export const adminAPI = {
  dashboard: () => api.get("/admin/dashboard"),
  staff: () => api.get("/admin/staff"),
  addStaff: (data) => api.post("/admin/staff", data),
  deleteStaff: (id) => api.delete(`/admin/staff/${id}`),
  patients: () => api.get("/admin/patients"),
  billing: () => api.get("/admin/billing"),
  reports: () => api.get("/admin/reports"),
};

// Chatbot endpoint with user message and optional conversation history.
export const chatbotAPI = {
  send: (message, history) => api.post("/chatbot", { message, history }),
};

export default api;
