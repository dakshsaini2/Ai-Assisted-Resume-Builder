import axios from 'axios';

export function getApiBaseUrl(customUrl?: string): string {
  const globalObj = typeof globalThis !== 'undefined' ? (globalThis as any) : undefined;
  const envUrl =
    customUrl !== undefined
      ? customUrl
      : (globalObj?.process?.env?.VITE_API_URL) ||
        (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL);

  if (!envUrl || typeof envUrl !== 'string' || envUrl.trim() === '') {
    return '/api';
  }
  const trimmed = envUrl.trim();
  if (trimmed.startsWith('/')) {
    return trimmed.replace(/\/+$/, '');
  }
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      throw new Error(`Unsupported protocol "${parsed.protocol}" in VITE_API_URL. Expected http: or https:`);
    }
    return trimmed.replace(/\/+$/, '');
  } catch (err: any) {
    if (err.message.includes('Unsupported protocol')) {
      throw err;
    }
    throw new Error(`Malformed VITE_API_URL configuration: ${err.message}`);
  }
}

export const API_BASE_URL = getApiBaseUrl();

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const unauthenticatedApi = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    let token: string | null = null;
    try {
      if (typeof localStorage !== 'undefined' && typeof localStorage.getItem === 'function') {
        token = localStorage.getItem('token');
      }
    } catch {
    }

    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      try {
        if (typeof localStorage !== 'undefined' && typeof localStorage.removeItem === 'function') {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        }
      } catch {
      }

      if (
        typeof window !== 'undefined' &&
        window.location &&
        !window.location.pathname.includes('/login') &&
        !window.location.pathname.includes('/register') &&
        !window.location.pathname.includes('/render') &&
        window.location.pathname !== '/'
      ) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

