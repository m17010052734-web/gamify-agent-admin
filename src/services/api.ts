import axios from 'axios';
import type {
  UserListResponse,
  GameReviewListResponse,
  CreditConfigListResponse,
  PlatformStats,
  CreditFlowResponse,
} from '../types';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('admin_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('admin_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// User management APIs
export const userApi = {
  getUsers: (params: {
    page?: number;
    page_size?: number;
    status?: string;
    keyword?: string;
  }) => api.get<UserListResponse>('/admin/users/list', { params }),

  adjustCredit: (data: { user_id: string; amount: number; reason: string }) =>
    api.post('/admin/users/adjust-credit', data),

  getCreditFlow: (params: { user_id: string; page?: number; page_size?: number }) =>
    api.get<CreditFlowResponse>('/admin/users/credit-flow', { params }),

  updateStatus: (data: { user_id: string; status: string; reason?: string }) =>
    api.post('/admin/users/update-status', data),
};

// Game review APIs
export const gameApi = {
  getReviewList: (params: { page?: number; page_size?: number; status?: string }) =>
    api.get<GameReviewListResponse>('/admin/games/review-list', { params }),

  reviewGame: (data: { game_id: string; action: 'approve' | 'reject'; message?: string }) =>
    api.post('/admin/games/review', data),
};

// Credit config APIs
export const creditApi = {
  getConfigs: () => api.get<CreditConfigListResponse>('/admin/credits/configs'),

  updateConfig: (data: { config_key: string; config_value: number }) =>
    api.put('/admin/credits/config', data),

  batchUpdateConfigs: (data: { configs: Array<{ config_key: string; config_value: number }> }) =>
    api.put('/admin/credits/configs/batch', data),
};

// Stats APIs
export const statsApi = {
  getPlatformStats: () => api.get<PlatformStats>('/admin/stats/platform'),
};

export default api;
