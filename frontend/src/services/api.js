import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_BASE,
});

export const jobsAPI = {
  getAll: () => api.get('/jobs'),
  getByUserId: (userId) => api.get(`/jobs?user_id=${userId}`),
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
  getByUserId: (userId) => api.get(`/stories/user/${userId}`),
  getById: (id) => api.get(`/stories/${id}`),
  create: (data) => api.post('/stories', data),
  update: (id, data) => api.put(`/stories/${id}`, data),
  delete: (id) => api.delete(`/stories/${id}`),
};

export const usersAPI = {
  register: (userData) => api.post('/users/register', userData),
  login: (email) => api.post('/users/login', { email }),
  getById: (id) => api.get(`/users/${id}`),
  getAll: () => api.get('/users'),
};

export const matchingAPI = {
  getJobMatches: (jobId, userId) => api.post(`/matching/job/${jobId}`, { userId }),
  mapStoryToRequirement: (storyId, requirementId) => api.post('/matching/map', { storyId, requirementId }),
  unmapStoryFromRequirement: (storyId, requirementId) => api.delete('/matching/map', { data: { storyId, requirementId } }),
  getStoriesForRequirement: (requirementId) => api.get(`/matching/requirement/${requirementId}/stories`),
  getSuggestions: (jobId, userId) => api.get(`/matching/suggestions/${jobId}?user_id=${userId}`),
};

export default api;