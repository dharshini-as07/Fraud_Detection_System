import axios from 'axios';

// Dynamically determine the backend API URL based on current client address
// (Works seamlessly on Mac localhost, iPhone via Wi-Fi IP, and tunnels)
const getBaseURL = () => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  if (typeof window !== 'undefined' && window.location) {
    // If served directly from Express on port 5001, use origin /api
    if (window.location.port === '5001') {
      return `${window.location.origin}/api`;
    }
    // If served from Vite dev server (e.g. 5173), target port 5001 on the same IP/host
    return `${window.location.protocol}//${window.location.hostname}:5001/api`;
  }
  return 'http://localhost:5001/api';
};

const API = axios.create({
  baseURL: getBaseURL(),
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor: Attach JWT token if stored
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor: Handle unauthorized / expired session
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default API;
