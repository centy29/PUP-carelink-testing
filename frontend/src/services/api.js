import axios from 'axios';

const getApiUrl = () => {
  // Production: use VITE_API_URL env var (baked in at build time by Vite —
  // see frontend/.env.production and the ARG/ENV lines in frontend/Dockerfile)
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }

  // Production fallback: if the build did not receive VITE_API_URL, point
  // directly at the live Render backend instead of falling through to the
  // local-dev resolution below (which would break when deployed on Render).
  if (import.meta.env.PROD) {
    return 'https://pup-carelink-testing-backend.onrender.com/api';
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
  // Render's free tier spins the backend down when idle; the first request
  // after that can take 30-60s to wake the service up, so allow enough time.
  timeout: 60000,
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
