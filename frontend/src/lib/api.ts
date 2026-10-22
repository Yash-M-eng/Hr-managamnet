import axios from 'axios';

const getBaseUrl = (): string => {
  let url = process.env.NEXT_PUBLIC_API_URL || '';

  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('acme_api_url');
    if (saved) return saved.trim().replace(/\/+$/, '');
  }

  if (!url) {
    if (typeof window !== 'undefined') {
      if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        return 'http://localhost:4000';
      }
      if (window.location.hostname.endsWith('.onrender.com')) {
        const backendHost = window.location.hostname.replace('frontend', 'backend');
        return `https://${backendHost}`;
      }
    }
    return 'http://localhost:4000';
  }

  url = url.trim().replace(/\/+$/, '');
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = `https://${url}`;
  }
  if (
    typeof window !== 'undefined' &&
    window.location.protocol === 'https:' &&
    url.startsWith('http://') &&
    !url.includes('localhost') &&
    !url.includes('127.0.0.1')
  ) {
    url = url.replace(/^http:\/\//, 'https://');
  }
  return url;
};

const API_BASE_URL = getBaseUrl();

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach JWT token
api.interceptors.request.use((config) => {
  if (!config.baseURL || config.baseURL === 'http://localhost:4000') {
    config.baseURL = getBaseUrl();
  }
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('acme_auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Response interceptor to handle 401 unauthorized
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('acme_auth_token');
      localStorage.removeItem('acme_user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  },
);

export function formatCurrency(amount: number, currency: string = 'USD'): string {
  if (currency === 'USD') {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(amount);
  }
  if (currency === 'EUR') {
    return new Intl.NumberFormat('en-IE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(amount);
  }
  if (currency === 'GBP') {
    return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', maximumFractionDigits: 0 }).format(amount);
  }
  if (currency === 'INR') {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
  }
  if (currency === 'CAD') {
    return new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 }).format(amount);
  }
  if (currency === 'SGD') {
    return new Intl.NumberFormat('en-SG', { style: 'currency', currency: 'SGD', maximumFractionDigits: 0 }).format(amount);
  }
  return `${currency} ${amount.toLocaleString()}`;
}
