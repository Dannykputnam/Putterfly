import axios from 'axios';

const API_URL = 'http://localhost:5002/api';

// Create axios instance with base URL
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if it exists
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
    console.log('Attaching Authorization header:', config.headers.Authorization);
  } else {
    console.log('No token found; not attaching Authorization header');
  }
  return config;
});

// Auth API
export const login = (email, password) => api.post('/auth/login', { email, password });
export const register = (name, email, password) => api.post('/auth/register', { name, email, password });

// Prints API
export const getPrints = () => api.get('/prints');
export const searchPrints = (query) => api.get(`/prints/search?query=${encodeURIComponent(query)}`);
export const uploadPrints = (file) => {
  const formData = new FormData();
  formData.append('file', file);
  return api.post('/prints/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};
export const addPrint = (print) => api.post('/prints', print);
export const updatePrint = (id, print) => api.put(`/prints/${id}`, print);
export const deletePrint = (id) => api.delete(`/prints/${id}`);
// Admin destructive actions
export const deleteAllOrders = () => api.delete('/orders/all');
export const deleteAllPrints = () => api.delete('/prints/all');

// Orders API
export const getOrders = () => api.get('/orders');
export const getAllOrders = () => api.get('/orders/all');
export const createOrder = (order) => api.post('/orders', order);
export const updateOrder = (id, order) => api.put(`/orders/${id}`, order);
export const updateOrderStatus = (id, status) => api.put(`/orders/${id}/status`, { status });
export const deleteOrder = (id) => api.delete(`/orders/${id}`);

// Users API
export const getUserProfile = () => api.get('/users/profile');
export const updateUserProfile = (profile) => api.put('/users/profile', profile);
export const getUserCount = () => api.get('/users/count');

// Settings API
export const getSettings = () => api.get('/settings');
export const updateAnnouncement = (header) => api.put('/settings/announcement', { header });
export const updateHowToUse = (text) => api.put('/settings/how-to-use', { text });

export default api;
