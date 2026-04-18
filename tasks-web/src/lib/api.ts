import axios from 'axios';
import { clearSession, getSessionToken } from './session';

const api = axios.create({
  baseURL: '/taskflow/api',
});

api.interceptors.request.use((config) => {
  const token = getSessionToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    const requestUrl = error?.config?.url ?? '';
    const isAuthRequest =
      typeof requestUrl === 'string' && requestUrl.startsWith('/auth/');

    if (typeof window !== 'undefined' && status === 401 && !isAuthRequest) {
      clearSession();

      if (window.location.pathname !== '/login') {
        window.location.replace('/login');
      }
    }

    return Promise.reject(error);
  },
);

export default api;
