import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL ?? 'https://backend-1-s2fl.onrender.com/api/v1';

export const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Inject token from localStorage on every request
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// On 401: clear storage and signal the AuthContext via a custom event.
// We do NOT use window.location.href here — that causes a hard page reload
// which destroys React state before the auth context can react cleanly.
apiClient.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_refresh_token');
      localStorage.removeItem('auth_shop_id');
      // Notify AuthContext so it can clear state and let React Router redirect
      window.dispatchEvent(new CustomEvent('auth:unauthorized'));
    }
    return Promise.reject(err);
  },
);
