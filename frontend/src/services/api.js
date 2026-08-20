import axios from 'axios';

const getApiUrl = () => {
  // Production: use VITE_API_URL env var (set by Render/Vite)
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }

  // Local development: dynamically resolve based on hostname
  const hostname = window.location.hostname;

  // If accessing from phone/other device on network
  if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
    return `http://${hostname}:8000/api`;
  }

  // Local development on PC
  return 'http://127.0.0.1:8000/api';
};

const api = axios.create({
  baseURL: getApiUrl(),
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  timeout: 5000, // Reduced from 15000 to 5000 (5 seconds)
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Only redirect on 401 if not already on login/auth pages
    if (error.response?.status === 401) {
      const pathname = window.location.pathname;
      const isLoginPage = pathname.includes('/login');
      const isCarelinkPortal = pathname.includes('/carelink-portal');
      const isAuthPage = pathname.includes('/register') || pathname.includes('/forgot-password');

      if (!isLoginPage && !isCarelinkPortal && !isAuthPage) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        // Use replace instead of href to prevent refresh loop
        window.location.replace('/login');
      }
    }
    return Promise.reject(error);
  }
);

export default api;
