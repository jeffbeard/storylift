import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE,
});

export const jobsAPI = {
  getAll: () => api.get('/jobs'),
  getById: (id) => api.get(`/jobs/${id}`),
  uploadPDF: (formData) => api.post('/jobs/upload-pdf', formData),
  uploadURL: (data) => api.post('/jobs/upload-url', data),
  delete: (id) => api.delete(`/jobs/${id}`),
};

export const requirementsAPI = {
  getByJobId: (jobId) => api.get(`/requirements/job/${jobId}`),
  update: (id, data) => api.put(`/requirements/${id}`, data),
  delete: (id) => api.delete(`/requirements/${id}`),
};

export const storiesAPI = {
  getByRequirementId: (requirementId) => api.get(`/stories/requirement/${requirementId}`),
  getById: (id) => api.get(`/stories/${id}`),
  create: (data) => api.post('/stories', data),
  update: (id, data) => api.put(`/stories/${id}`, data),
  delete: (id) => api.delete(`/stories/${id}`),
};

export default api;