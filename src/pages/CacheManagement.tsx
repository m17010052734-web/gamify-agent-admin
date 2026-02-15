import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { cacheApi } from "../services/api";
import {
  ChevronLeftIcon,
  ArrowPathIcon,
  TrashIcon,
  CircleStackIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";

interface CacheStats {
  enabled: number;
  home: number;
  plaza: number;
  projects: number;
  total: number;
  error?: string;
}

export default function CacheManagement() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [clearing, setClearing] = useState<string | null>(null);
  const [stats, setStats] = useState<CacheStats | null>(null);
  const [pattern, setPattern] = useState("");
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const loadStats = async () => {
    try {
      setLoading(true);
      const response = await cacheApi.getStats();
      setStats(response.data);
    } catch (error) {
      console.error("获取缓存统计失败:", error);
      setMessage({ type: "error", text: "获取缓存统计失败" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  const handleClearCache = async (type: string, label: string) => {
    try {
      setClearing(type);
      setMessage(null);
      await cacheApi.clearCache(type as "home" | "plaza" | "projects" | "all");
      setMessage({ type: "success", text: `${label}缓存已清除` });
      await loadStats();
    } catch (error) {
      console.error("清除缓存失败:", error);
      setMessage({ type: "error", text: `${label}缓存清除失败` });
    } finally {
      setClearing(null);
    }
  };

  const handleClearByPattern = async () => {
    if (!pattern.trim()) {
      setMessage({ type: "error", text: "请输入 pattern" });
      return;
    }

    try {
      setClearing("pattern");
      setMessage(null);
      await cacheApi.clearByPattern(pattern.trim());
      setMessage({ type: "success", text: `匹配 ${pattern} 的缓存已清除` });
      setPattern("");
      await loadStats();
    } catch (error) {
      console.error("清除缓存失败:", error);
      setMessage({ type: "error", text: "清除缓存失败" });
    } finally {
      setClearing(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3 sm:gap-4">
              <button
                onClick={() => navigate("/")}
                className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors shrink-0"
              >
                <ChevronLeftIcon className="w-5 h-5" />
              </button>
              <div className="min-w-0">
                <h1 className="text-lg sm:text-xl font-semibold text-gray-900">
                  缓存管理
                </h1>
                <p className="text-xs sm:text-sm text-gray-500 mt-0.5 truncate">
                  管理 Redis 缓存，清除不需要的缓存数据
                </p>
              </div>
            </div>
            <button
              onClick={loadStats}
              disabled={loading}
              className="flex items-center justify-center gap-2 px-4 py-2 text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              <ArrowPathIcon className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              刷新
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Alert Message */}
        {message && (
          <div
            className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${
              message.type === "success"
                ? "bg-green-50 text-green-700 border border-green-200"
                : "bg-red-50 text-red-700 border border-red-200"
            }`}
          >
            {message.type === "success" ? (
              <CheckCircleIcon className="w-5 h-5" />
            ) : (
              <ExclamationCircleIcon className="w-5 h-5" />
            )}
            {message.text}
          </div>
        )}

        {/* Cache Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 bg-blue-100 rounded-lg">
                  <CircleStackIcon className="w-4 h-4 text-blue-600" />
                </div>
                <span className="text-sm text-gray-600">总缓存数</span>
              </div>
              <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 bg-green-100 rounded-lg">
                  <CircleStackIcon className="w-4 h-4 text-green-600" />
                </div>
                <span className="text-sm text-gray-600">首页缓存</span>
              </div>
              <div className="text-2xl font-bold text-gray-900">{stats.home}</div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 bg-purple-100 rounded-lg">
                  <CircleStackIcon className="w-4 h-4 text-purple-600" />
                </div>
                <span className="text-sm text-gray-600">广场缓存</span>
              </div>
              <div className="text-2xl font-bold text-gray-900">{stats.plaza}</div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 bg-orange-100 rounded-lg">
                  <CircleStackIcon className="w-4 h-4 text-orange-600" />
                </div>
                <span className="text-sm text-gray-600">项目缓存</span>
              </div>
              <div className="text-2xl font-bold text-gray-900">{stats.projects}</div>
            </div>
          </div>
        )}

        {/* Cache Clear Cards - Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {/* Home Games */}
          <div className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-green-100 rounded-xl">
                <CircleStackIcon className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">首页游戏列表</h3>
                <p className="text-sm text-gray-500">gamify:home:games:*</p>
              </div>
            </div>
            <button
              onClick={() => handleClearCache("home", "首页游戏列表")}
              disabled={clearing === "home"}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-green-50 text-green-700 rounded-xl hover:bg-green-100 transition-colors disabled:opacity-50"
            >
              <TrashIcon className="w-4 h-4" />
              {clearing === "home" ? "清除中..." : "清除缓存"}
            </button>
          </div>

          {/* Plaza Games */}
          <div className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-purple-100 rounded-xl">
                <CircleStackIcon className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">广场游戏列表</h3>
                <p className="text-sm text-gray-500">gamify:plaza:games:*</p>
              </div>
            </div>
            <button
              onClick={() => handleClearCache("plaza", "广场游戏列表")}
              disabled={clearing === "plaza"}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-purple-50 text-purple-700 rounded-xl hover:bg-purple-100 transition-colors disabled:opacity-50"
            >
              <TrashIcon className="w-4 h-4" />
              {clearing === "plaza" ? "清除中..." : "清除缓存"}
            </button>
          </div>

          {/* Projects */}
          <div className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-orange-100 rounded-xl">
                <CircleStackIcon className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">项目列表</h3>
                <p className="text-sm text-gray-500">gamify:projects:*</p>
              </div>
            </div>
            <button
              onClick={() => handleClearCache("projects", "项目列表")}
              disabled={clearing === "projects"}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-orange-50 text-orange-700 rounded-xl hover:bg-orange-100 transition-colors disabled:opacity-50"
            >
              <TrashIcon className="w-4 h-4" />
              {clearing === "projects" ? "清除中..." : "清除缓存"}
            </button>
          </div>
        </div>

        {/* Pattern Clear */}
        <div className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-6 shadow-sm mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-100 rounded-xl">
              <MagnifyingGlassIcon className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-medium text-gray-900">按 Pattern 清除</h3>
              <p className="text-sm text-gray-500">支持通配符 *</p>
            </div>
          </div>
          <div className="flex gap-3">
            <input
              type="text"
              value={pattern}
              onChange={(e) => setPattern(e.target.value)}
              placeholder="例如: home:games:* 或 *"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              onClick={handleClearByPattern}
              disabled={clearing === "pattern" || !pattern.trim()}
              className="flex items-center justify-center gap-2 px-6 py-2 bg-blue-50 text-blue-700 rounded-xl hover:bg-blue-100 transition-colors disabled:opacity-50 whitespace-nowrap"
            >
              <TrashIcon className="w-4 h-4" />
              {clearing === "pattern" ? "清除中..." : "清除"}
            </button>
          </div>
        </div>

        {/* Clear All Button */}
        <div className="bg-gradient-to-r from-red-50 to-orange-50 rounded-2xl border border-red-200 p-4 sm:p-6 mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="min-w-0">
              <h3 className="font-semibold text-gray-900">危险操作区</h3>
              <p className="text-sm text-gray-600 mt-1">
                清除所有缓存将重置整个系统的缓存数据，可能导致短期性能下降
              </p>
            </div>
            <button
              onClick={() => handleClearCache("all", "所有")}
              disabled={clearing === "all"}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors disabled:opacity-50 whitespace-nowrap"
            >
              <TrashIcon className="w-5 h-5" />
              {clearing === "all" ? "清除中..." : "清除所有缓存"}
            </button>
          </div>
        </div>

        {/* Cache Info */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <h3 className="font-medium text-gray-900 mb-4">缓存说明</h3>
          <div className="space-y-3 text-sm text-gray-600">
            <div className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2"></span>
              <span>
                <strong>首页游戏列表</strong> - 首页游戏分页数据，更新频率较低
              </span>
            </div>
            <div className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 bg-purple-500 rounded-full mt-2"></span>
              <span>
                <strong>广场游戏列表</strong> - 用户分享的游戏分页数据
              </span>
            </div>
            <div className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 bg-orange-500 rounded-full mt-2"></span>
              <span>
                <strong>项目列表</strong> - 已发布项目分页数据
              </span>
            </div>
            <div className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 bg-gray-400 rounded-full mt-2"></span>
              <span className="text-gray-400">
                <strong>单条详情、分类、Banner</strong> - 不再使用缓存，直接查询数据库
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
