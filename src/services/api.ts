import axios from "axios";

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
    user_type?: string;
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
    screenshots?: string[];
    author_name?: string;
    author_avatar_url?: string;
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
      source_type?: "url" | "code";
      game_url?: string;
      html_code?: string;
      cover_url?: string;
      thumbnail_url?: string;
      screenshots?: string[];
      author_name?: string;
      author_avatar_url?: string;
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

// Creative template APIs
export const creativeTemplateApi = {
  getCreativeTemplates: (params: {
    page?: number;
    page_size?: number;
    category?: string;
    status?: string;
    keyword?: string;
  }) => api.get("/admin/creative-templates", { params }),

  createCreativeTemplate: (data: {
    name: string;
    description?: string;
    prompt: string;
    category: string;
    cover_url?: string;
    tags?: string[];
    example_output?: string;
    game_source_type?: "none" | "code" | "url";
    game_url?: string;
    game_code?: string;
    sort_order?: number;
    is_hot?: boolean;
    is_new?: boolean;
  }) => api.post("/admin/creative-templates", data),

  updateCreativeTemplate: (
    templateId: string,
    data: {
      name?: string;
      description?: string;
      prompt?: string;
      category?: string;
      cover_url?: string;
      tags?: string[];
      example_output?: string;
      game_source_type?: "none" | "code" | "url";
      game_url?: string;
      game_code?: string;
      sort_order?: number;
      is_hot?: boolean;
      is_new?: boolean;
      status?: string;
    },
  ) => api.put(`/admin/creative-templates/${templateId}`, data),

  deleteCreativeTemplate: (templateId: string) =>
    api.delete(`/admin/creative-templates/${templateId}`),

  uploadCover: async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return api.post("/admin/upload-game-cover", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },

  toggleTemplateStatus: (templateId: string) =>
    api.post(`/admin/creative-templates/${templateId}/toggle-status`),
};

// Home categories APIs
export const homeApi = {
  // 获取已发布分类（前端用）
  getCategories: () => api.get("/admin/home/categories"),

  // 获取所有分类（管理后台用，包含未发布）
  getAllCategories: () => api.get("/admin/home/categories/all"),

  // 创建分类
  createCategory: (data: {
    key: string;
    name: string;
    icon?: string;
  }) => api.post("/admin/home/categories", data),

  // 更新分类
  updateCategory: (
    categoryId: number,
    data: {
      key?: string;
      name?: string;
      icon?: string;
      is_published?: boolean;
      is_active?: boolean;
      sort_order?: number;
    },
  ) => api.put(`/admin/home/categories/${categoryId}`, data),

  // 删除分类
  deleteCategory: (categoryId: number) =>
    api.delete(`/admin/home/categories/${categoryId}`),

  // 批量更新排序
  updateSortOrders: (orders: Array<{ id: number; sort_order: number }>) =>
    api.post("/admin/home/categories/sort", { orders }),

  // 发布/取消发布分类
  togglePublish: (categoryId: number, isPublished: boolean) =>
    api.put(`/admin/home/categories/${categoryId}/publish`, null, {
      params: { is_published: isPublished },
    }),

  // 兼容旧接口
  updateCategories: (
    categories: Array<{ key: string; name: string; icon?: string }>,
  ) => api.put("/admin/home/categories", { categories }),

  resetCategories: () => api.post("/admin/home/categories/reset"),

  // 创意模板分类
  getCreativeCategories: () => api.get("/admin/home/creative-categories"),

  getAllCreativeCategories: () =>
    api.get("/admin/home/creative-categories/all"),

  createCreativeCategory: (data: {
    key: string;
    name: string;
    icon?: string;
    description?: string;
  }) => api.post("/admin/home/creative-categories", data),

  updateCreativeCategory: (
    categoryId: number,
    data: {
      key: string;
      name: string;
      icon?: string;
      description?: string;
      is_published?: boolean;
      is_active?: boolean;
      sort_order?: number;
    },
  ) => api.put(`/admin/home/creative-categories/${categoryId}`, data),

  deleteCreativeCategory: (categoryId: number) =>
    api.delete(`/admin/home/creative-categories/${categoryId}`),

  updateCreativeSortOrders: (
    orders: Array<{ id: number; sort_order: number }>,
  ) => api.post("/admin/home/creative-categories/sort", { orders }),

  toggleCreativePublish: (categoryId: number, isPublished: boolean) =>
    api.put(`/admin/home/creative-categories/${categoryId}/publish`, null, {
      params: { is_published: isPublished },
    }),

  updateCreativeCategories: (
    categories: Array<{
      key: string;
      name: string;
      icon?: string;
      description?: string;
    }>,
  ) => api.put("/admin/home/creative-categories", { categories }),

  resetCreativeCategories: () =>
    api.post("/admin/home/creative-categories/reset"),
};

// Cache Management APIs
export const cacheApi = {
  // 获取缓存统计
  getStats: () => api.get("/admin/cache/stats"),

  // 清除缓存
  clearCache: (cacheType: "home" | "plaza" | "projects" | "all" = "all") =>
    api.post("/admin/cache/clear", { cache_type: cacheType }),

  // 清除首页缓存
  clearHomeCache: () => api.post("/admin/cache/clear-home"),

  // 清除广场缓存
  clearPlazaCache: () => api.post("/admin/cache/clear-plaza"),

  // 清除项目缓存
  clearProjectsCache: () => api.post("/admin/cache/clear-projects"),

  // 按 pattern 清除缓存
  clearByPattern: (pattern: string) =>
    api.post("/admin/cache/clear-pattern", { pattern }),
};

export default api;
