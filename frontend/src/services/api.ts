import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const stored = localStorage.getItem('auth-storage');
  if (stored) {
    try {
      const { state } = JSON.parse(stored);
      if (state?.token) {
        config.headers.Authorization = `Bearer ${state.token}`;
      }
    } catch {}
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('auth-storage');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  },
);

export default api;

// === Auth ===
export const auth = {
  login: (data: { email: string; password: string }) => api.post('/auth/login', data),
  register: (data: { name: string; email: string; password: string; tenantName: string }) =>
    api.post('/auth/register', data),
  hasUsers: () => api.get('/auth/has-users'),
  setup: (data: { name: string; email: string; password: string; tenantName: string }) =>
    api.post('/auth/setup', data),
  me: () => api.get('/auth/me'),
};

// === Tenants ===
export const tenants = {
  list: () => api.get('/tenants'),
  get: (id: string) => api.get(`/tenants/${id}`),
  create: (data: { name: string }) => api.post('/tenants', data),
  remove: (id: string) => api.delete(`/tenants/${id}`),
};

// === Users ===
export const users = {
  list: (tenantId: string) => api.get(`/tenants/${tenantId}/users`),
};

// === Products ===
export const products = {
  list: (tenantId: string) => api.get(`/tenants/${tenantId}/products`),
  create: (tenantId: string, data: { name: string; type: string }) =>
    api.post(`/tenants/${tenantId}/products`, data),
};

// === Leads ===
export const leads = {
  list: (tenantId: string, productId?: string) =>
    api.get(`/tenants/${tenantId}/leads`, { params: { productId } }),
  get: (tenantId: string, id: string) => api.get(`/tenants/${tenantId}/leads/${id}`),
  create: (tenantId: string, data: any) => api.post(`/tenants/${tenantId}/leads`, data),
  createForProduct: (tenantId: string, productId: string, data: any) =>
    api.post(`/tenants/${tenantId}/leads/product/${productId}`, data),
  updateStage: (tenantId: string, id: string, stage: string) =>
    api.patch(`/tenants/${tenantId}/leads/${id}/stage`, { stage }),
};

// === Posts ===
export const posts = {
  list: (tenantId: string, productId?: string) =>
    api.get(`/tenants/${tenantId}/posts`, { params: { productId } }),
  create: (tenantId: string, data: any) => api.post(`/tenants/${tenantId}/posts`, data),
  approve: (tenantId: string, id: string, data: { action: string; reason?: string; feedbackText?: string }) =>
    api.post(`/tenants/${tenantId}/posts/${id}/approve`, data),
  createV2: (tenantId: string, id: string, data: any) =>
    api.post(`/tenants/${tenantId}/posts/${id}/v2`, data),
};

// === Campaigns ===
export const campaigns = {
  list: (tenantId: string, productId?: string) =>
    api.get(`/tenants/${tenantId}/campaigns`, { params: { productId } }),
  create: (tenantId: string, data: any) => api.post(`/tenants/${tenantId}/campaigns`, data),
  addKeyword: (tenantId: string, id: string, text: string, cpc?: number) =>
    api.post(`/tenants/${tenantId}/campaigns/${id}/keywords`, { text, cpc }),
  pauseKeyword: (tenantId: string, keywordId: string) =>
    api.patch(`/tenants/${tenantId}/campaigns/keywords/${keywordId}/pause`),
};

// === Competitors ===
export const competitors = {
  list: (tenantId: string) =>
    api.get(`/tenants/${tenantId}/competitors`),
  create: (tenantId: string, data: any) => api.post(`/tenants/${tenantId}/competitors`, data),
};

// === SEO Pages ===
export const seoPages = {
  list: (tenantId: string) =>
    api.get(`/tenants/${tenantId}/seo-pages`),
  create: (tenantId: string, data: any) => api.post(`/tenants/${tenantId}/seo-pages`, data),
};

// === Onboarding ===
export const onboarding = {
  list: (tenantId: string) => api.get(`/tenants/${tenantId}/onboarding`),
  create: (tenantId: string) => api.post(`/tenants/${tenantId}/onboarding`),
  updateTask: (tenantId: string, id: string, taskKey: string, status: string) =>
    api.patch(`/tenants/${tenantId}/onboarding/${id}/tasks/${taskKey}`, { status }),
};

// === SEO Rankings ===
export const seoRankings = {
  list: (tenantId: string, params?: any) =>
    api.get(`/tenants/${tenantId}/seo-rankings/latest`, { params }),
  create: (tenantId: string, data: any) => api.post(`/tenants/${tenantId}/seo-rankings`, data),
};

// === Proposals ===
export const proposals = {
  list: (tenantId: string, params?: { status?: string; productId?: string }) =>
    api.get(`/tenants/${tenantId}/proposals`, { params }),
  get: (tenantId: string, id: string) => api.get(`/tenants/${tenantId}/proposals/${id}`),
  approve: (tenantId: string, id: string, data?: { feedback?: string }) =>
    api.post(`/tenants/${tenantId}/proposals/${id}/approve`, data || {}),
  reject: (tenantId: string, id: string, data?: { reason?: string }) =>
    api.post(`/tenants/${tenantId}/proposals/${id}/reject`, data || {}),
};

// === Settings / Connections ===
export const settings = {
  get: (tenantId: string, productId: string) =>
    api.get(`/tenants/${tenantId}/products/${productId}/settings`),
  update: (tenantId: string, productId: string, data: any) =>
    api.patch(`/tenants/${tenantId}/products/${productId}/settings`, data),
  upload: (tenantId: string, productId: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post(`/tenants/${tenantId}/products/${productId}/settings/upload`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  getUploads: (tenantId: string, productId: string) =>
    api.get(`/tenants/${tenantId}/products/${productId}/settings/uploads`),
};
