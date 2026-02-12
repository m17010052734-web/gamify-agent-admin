import axios from "axios";
import type {
  UserListResponse,
  GameReviewListResponse,
  CreditConfigListResponse,
  PlatformStats,
  CreditFlowResponse,
  ReviewLogListResponse,
} from "../types";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:8088",
  headers: {
    "Content-Type": "application/json",
  },
});

// Flag to prevent multiple refresh attempts
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

// Flag to prevent multiple redirects to login
let isRedirectingToLogin = false;

const processQueue = (error: unknown = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve();
    }
  });
  failedQueue = [];
};

// Unified login redirect function
const redirectToLogin = () => {
  if (isRedirectingToLogin) return;
  isRedirectingToLogin = true;

  localStorage.removeItem("admin_token");
  localStorage.removeItem("refresh_token");

  // Use window.location.href to ensure complete page refresh
  window.location.href = "/login";
};

// Request interceptor to add auth token and check token existence
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("admin_token");

    // If no token and not login/refresh endpoint, redirect to login
    if (
      !token &&
      !config.url?.includes("/login") &&
      !config.url?.includes("/refresh")
    ) {
      redirectToLogin();
      return Promise.reject(new Error("No token"));
    }

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Response interceptor to handle errors and auto-refresh token
api.interceptors.response.use(
  (response) => {
    // 统一处理后端响应结构：{success, data, message}
    // 将 response.data.data 提升到 response.data，简化访问
    if (
      response.data &&
      typeof response.data === "object" &&
      "data" in response.data
    ) {
      response.data = response.data.data;
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // 检查后端自定义错误码（如 AUTH_003: Token 格式无效）
    const errorCode = error.response?.data?.error;
    const authErrorCodes = ["AUTH_001", "AUTH_002", "AUTH_003", "AUTH_004", "AUTH_005"];

    if (authErrorCodes.includes(errorCode)) {
      redirectToLogin();
      return Promise.reject(error);
    }

    // If error is 401
    if (error.response?.status === 401) {
      // If this is the refresh endpoint itself returning 401, redirect to login immediately
      if (originalRequest.url?.includes("/refresh")) {
        redirectToLogin();
        return Promise.reject(error);
      }

      // If already retried, redirect to login
      if (originalRequest._retry) {
        redirectToLogin();
        return Promise.reject(error);
      }

      // If already refreshing, queue this request
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(() => api(originalRequest))
          .catch((err) => {
            redirectToLogin();
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = localStorage.getItem("refresh_token");

      if (!refreshToken) {
        redirectToLogin();
        return Promise.reject(error);
      }

      try {
        // Attempt to refresh the token
        const response = await axios.post(
          `${api.defaults.baseURL}/admin/auth/refresh`,
          { refresh_token: refreshToken },
          {
            headers: {
              "Content-Type": "application/json",
            },
          },
        );

        const { access_token, refresh_token: newRefreshToken } = response.data;

        // Update tokens in localStorage
        localStorage.setItem("admin_token", access_token);
        if (newRefreshToken) {
          localStorage.setItem("refresh_token", newRefreshToken);
        }

        // Update authorization header
        originalRequest.headers.Authorization = `Bearer ${access_token}`;

        // Process queued requests
        processQueue();

        // Retry the original request
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh failed, clear tokens and redirect to login
        processQueue(refreshError);
        redirectToLogin();
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  },
);

// User management APIs
export const userApi = {
  getUsers: (params: {
    page?: number;
    page_size?: number;
    status?: string;
    keyword?: string;
  }) => api.get("/admin/list-users", { params }),

  adjustCredit: (data: { user_id: string; amount: number; reason: string }) =>
    api.post("/admin/adjust-user-credit", data),

  getCreditFlow: (params: {
    user_id: string;
    page?: number;
    page_size?: number;
  }) => api.get("/admin/get-user-credit-flow", { params }),

  updateStatus: (data: { user_id: string; status: string; reason?: string }) =>
    api.post("/admin/update-user-status", data),
};

// Game review APIs
export const gameApi = {
  getReviewList: (params: {
    page?: number;
    page_size?: number;
    status?: string;
  }) => api.get("/admin/list-review-games", { params }),

  reviewGame: (data: {
    game_id: string;
    action: "approve" | "reject";
    message?: string;
  }) => api.post("/admin/review-game", data),

  getGameDetail: (gameId: string) => api.get(`/admin/game-detail/${gameId}`),
};

// Credit config APIs
export const creditApi = {
  getConfigs: () => api.get("/admin/list-credit-configs"),

  updateConfig: (data: { config_key: string; config_value: number }) =>
    api.put("/admin/update-credit-config", data),

  batchUpdateConfigs: (data: {
    configs: Array<{ config_key: string; config_value: number }>;
  }) => api.put("/admin/batch-update-credit-configs", data),
};

// Stats APIs
export const statsApi = {
  getPlatformStats: () => api.get("/admin/get-platform-stats"),
};

// Auth APIs
export const authApi = {
  login: (data: { email: string; password: string }) =>
    api.post("/admin/auth/login", data),

  logout: () => api.post("/admin/auth/logout"),

  refresh: (data: { refresh_token: string }) =>
    api.post("/admin/auth/refresh", data),
};

// Review log APIs
export const reviewLogApi = {
  getReviewLogs: (params: {
    page?: number;
    page_size?: number;
    game_id?: string;
    admin_id?: string;
    status?: string;
    start_date?: string;
    end_date?: string;
  }) => api.get("/admin/review-logs", { params }),
};

// Index game library APIs
export const indexGameApi = {
  getIndexGames: (params: {
    page?: number;
    page_size?: number;
    category?: string;
    source_type?: string;
    keyword?: string;
  }) => api.get("/admin/list-index-games", { params }),

  createIndexGame: (data: {
    title: string;
    description?: string;
    source_type: "url" | "code";
    game_url?: string;
    html_code?: string;
    cover_url: string;
    thumbnail_url?: string;
    category: string;
    tags?: string[];
    show_in_banner?: boolean;
    weight?: number;
  }) => api.post("/admin/create-index-game", data),

  updateIndexGame: (
    gameId: string,
    data: {
      title?: string;
      description?: string;
      game_url?: string;
      html_code?: string;
      cover_url?: string;
      thumbnail_url?: string;
      category?: string;
      tags?: string[];
      status?: string;
      show_in_banner?: boolean;
      weight?: number;
    },
  ) => api.put(`/admin/update-index-game/${gameId}`, data),

  deleteIndexGame: (gameId: string) =>
    api.delete(`/admin/delete-index-game/${gameId}`),

  toggleBanner: (gameId: string) => api.put(`/admin/toggle-banner/${gameId}`),

  updateGameWeight: (gameId: string, weight: number) =>
    api.put(`/admin/update-game-weight/${gameId}`, { weight }),

  uploadGameCover: async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return api.post("/admin/upload-game-cover", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },
};

// Home categories APIs
export const homeApi = {
  getCategories: () => api.get("/admin/home/categories"),

  updateCategories: (
    categories: Array<{ key: string; name: string; icon?: string }>,
  ) => api.put("/admin/home/categories", { categories }),

  resetCategories: () => api.post("/admin/home/categories/reset"),
};

export default api;
