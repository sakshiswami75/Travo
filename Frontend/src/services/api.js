import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authService = {
  login: (data) => api.post('/auth/login', data),
  signup: (data) => api.post('/auth/signup', data),
  getMe: () => api.get('/auth/me'),
  logout: () => api.post('/auth/logout'),
};

export const homeService = {
  getDashboard: () => api.get('/home/dashboard'),
  getAlerts: () => api.get('/home/alerts'),
  getRoutes: () => api.get('/home/routes'),
};

export const mapService = {
  getMarkers: () => api.get('/maps/markers'),
  getAlerts: () => api.get('/maps/alerts'),
  getRoute: (data) => api.post('/maps/route', data),
};

export const reportService = {
  // Upload image to Cloudinary via backend
  uploadImage: (formData) =>
    api.post('/reports/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  // Run AI pixel analysis on actual image file
  detectFile: (formData) =>
    api.post('/reports/detect', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  // Run Roboflow AI detection on a URL (fallback)
  detectHazard: (imageUrl) =>
    api.post('/reports/detect', { imageUrl }),

  // Save complete report to MongoDB
  createReport: (data) =>
    api.post('/reports/create', data),

  // Get user's past reports
  getReports: () => api.get('/reports'),

  // Get all reports for map
  getAllReports: () => api.get('/reports/all'),

  // Verify report (crowdsourcing)
  verifyReport: (id, action) => api.put(`/reports/verify/${id}`, { action })
};

export const complaintService = {
  createComplaint: (formData) =>
    api.post('/complaints', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  getComplaints: () => api.get('/complaints'),
};

export default api;
