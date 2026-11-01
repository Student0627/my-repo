import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach JWT
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('fineguard_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor to handle 401 unauthorized
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear token and redirect to login if session expired
      const path = window.location.pathname;
      if (path !== '/login' && path !== '/register') {
        localStorage.removeItem('fineguard_token');
        localStorage.removeItem('fineguard_user');
      }
    }
    return Promise.reject(error);
  }
);

export const authService = {
  register: async (name, email, password) => {
    const res = await api.post('/auth/register', { name, email, password });
    return res.data;
  },
  login: async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    return res.data;
  },
  getMe: async () => {
    const res = await api.get('/auth/me');
    return res.data;
  },
};

export const dashboardService = {
  getSummary: async () => {
    const res = await api.get('/dashboard/summary');
    return res.data;
  },
};

export const loanService = {
  predict: async (loanData) => {
    const res = await api.post('/loans/predict', loanData);
    return res.data;
  },
};

export const insuranceService = {
  predict: async (data) => {
    const res = await api.post('/insurance/predict', data);
    return res.data;
  },
  analyzePolicy: async (formData) => {
    const res = await api.post('/insurance/analyze-policy', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return res.data;
  },
};

export const investmentService = {
  predict: async (data) => {
    const res = await api.post('/investments/predict', data);
    return res.data;
  },
};

export const fraudService = {
  predict: async (data) => {
    const res = await api.post('/fraud/predict', data);
    return res.data;
  },
};

export const simulationService = {
  run: async (simData) => {
    const res = await api.post('/simulation/run', simData);
    return res.data;
  },
};

export const reportService = {
  list: async () => {
    const res = await api.get('/reports');
    return res.data;
  },
  get: async (id) => {
    const res = await api.get(`/reports/${id}`);
    return res.data;
  },
  create: async (data) => {
    const res = await api.post('/reports', data);
    return res.data;
  },
  delete: async (id) => {
    const res = await api.delete(`/reports/${id}`);
    return res.data;
  },
  downloadPdf: async (id, filename = 'report.pdf') => {
    const res = await api.get(`/reports/${id}/pdf`, { responseType: 'blob' });
    const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },
};

export default api;
