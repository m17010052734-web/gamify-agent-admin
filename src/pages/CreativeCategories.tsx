import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import {
  PlusIcon,
  TrashIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  ChevronLeftIcon,
  TagIcon,
  PhotoIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

interface CreativeCategory {
  key: string;
  name: string;
  icon?: string;
  description?: string;
  sort?: number;
}

interface UploadingState {
  index: number;
  progress: number;
}

export default function CreativeCategories() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<CreativeCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<UploadingState | null>(null);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const fileInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      setLoading(true);
      const response = await api.get("/admin/home/creative-categories");
      if (response.data && response.data.categories) {
        setCategories(response.data.categories);
      }
    } catch (error) {
      console.error("加载创意模板分类失败:", error);
      setMessage({ type: "error", text: "加载创意模板分类失败" });
    } finally {
      setLoading(false);
    }
  };

  const addCategory = () => {
    setCategories([...categories, { key: "", name: "", icon: "", description: "" }]);
  };

  const removeCategory = (index: number) => {
    if (categories.length <= 1) {
      setMessage({ type: "error", text: "至少保留一个分类" });
      return;
    }
    const newCategories = [...categories];
    newCategories.splice(index, 1);
    setCategories(newCategories);
    fileInputRefs.current.splice(index, 1);
  };

  const updateCategory = (
    index: number,
    field: keyof CreativeCategory,
    value: string | number,
  ) => {
    const newCategories = [...categories];
    newCategories[index] = { ...newCategories[index], [field]: value };
    setCategories(newCategories);
  };

  const handleIconUpload = async (index: number, file: File) => {
    const allowedTypes = [
      "image/png",
      "image/jpeg",
      "image/jpg",
      "image/svg+xml",
      "image/webp",
    ];
    if (!allowedTypes.includes(file.type)) {
      setMessage({
        type: "error",
        text: "仅支持 PNG、JPG、SVG、WebP 格式的图片",
      });
      return;
    }

    if (file.size > 1 * 1024 * 1024) {
      setMessage({ type: "error", text: "文件大小必须小于 1MB" });
      return;
    }

    try {
      setUploading({ index, progress: 0 });
      setMessage(null);

      const formData = new FormData();
      formData.append("file", file);

      const response = await api.post(
        "/admin/home/upload-category-icon",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
          onUploadProgress: (progressEvent) => {
            if (progressEvent.total) {
              const progress = Math.round(
                (progressEvent.loaded * 100) / progressEvent.total,
              );
              setUploading({ index, progress });
            }
          },
        },
      );

      if (response.data && response.data.url) {
        updateCategory(index, "icon", response.data.url);
        setMessage({ type: "success", text: "图标上传成功" });
      }
    } catch (error) {
      console.error("上传图标失败:", error);
      setMessage({ type: "error", text: "上传图标失败" });
    } finally {
      setUploading(null);
    }
  };

  const removeIcon = (index: number) => {
    updateCategory(index, "icon", "");
  };

  const triggerFileInput = (index: number) => {
    fileInputRefs.current[index]?.click();
  };

  const saveCategories = async () => {
    for (const cat of categories) {
      if (!cat.key.trim()) {
        setMessage({ type: "error", text: "分类 key 不能为空" });
        return;
      }
      if (!cat.name.trim()) {
        setMessage({ type: "error", text: "分类名称不能为空" });
        return;
      }
    }

    try {
      setSaving(true);
      setMessage(null);
      await api.put("/admin/home/creative-categories", { categories });
      setMessage({ type: "success", text: "保存成功" });
    } catch (error) {
      console.error("保存创意模板分类失败:", error);
      setMessage({ type: "error", text: "保存失败" });
    } finally {
      setSaving(false);
    }
  };

  const resetCategories = async () => {
    if (!window.confirm("确定要重置为默认创意模板分类吗？")) return;

    try {
      setSaving(true);
      setMessage(null);
      await api.post("/admin/home/creative-categories/reset");
      await loadCategories();
      setMessage({ type: "success", text: "已重置为默认创意模板分类" });
    } catch (error) {
      console.error("重置创意模板分类失败:", error);
      setMessage({ type: "error", text: "重置失败" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate("/")}
                className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
              >
                <ChevronLeftIcon className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  创意模板分类配置
                </h1>
                <p className="text-sm text-gray-500 mt-0.5">
                  管理话题生成页面的创意模板分类标签
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={resetCategories}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                <ArrowPathIcon className="w-4 h-4" />
                重置默认
              </button>
              <button
                onClick={saveCategories}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    保存中...
                  </>
                ) : (
                  <>
                    <CheckCircleIcon className="w-4 h-4" />
                    保存配置
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
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

        <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <TagIcon className="w-5 h-5 text-blue-600 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">配置说明</p>
              <p className="text-blue-600">
                配置话题生成页面的创意模板分类标签，用户可以在前端选择不同分类浏览创意模板。
              </p>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin" />
          </div>
        ) : (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-x-auto">
            <div className="grid grid-cols-12 gap-4 px-4 md:px-6 py-4 bg-gray-50 border-b border-gray-200 rounded-t-xl items-center min-w-[800px]">
              <div className="col-span-2 text-xs font-medium text-gray-500 uppercase tracking-wider">
                排序
              </div>
              <div className="col-span-2 text-xs font-medium text-gray-500 uppercase tracking-wider">
                Key
              </div>
              <div className="col-span-2 text-xs font-medium text-gray-500 uppercase tracking-wider">
                名称
              </div>
              <div className="col-span-2 text-xs font-medium text-gray-500 uppercase tracking-wider">
                图标
              </div>
              <div className="col-span-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                描述
              </div>
              <div className="col-span-1 text-xs font-medium text-gray-500 uppercase tracking-wider text-right">
                操作
              </div>
            </div>

            <div className="divide-y divide-gray-100 min-w-[800px]">
              {categories.map((category, index) => (
                <div
                  key={index}
                  className="grid grid-cols-12 gap-4 px-4 md:px-6 py-4 items-center hover:bg-gray-50 transition-colors"
                >
                  <div className="col-span-2">
                    <input
                      type="number"
                      value={category.sort || 0}
                      onChange={(e) =>
                        updateCategory(index, "sort", parseInt(e.target.value) || 0)
                      }
                      className="w-20 px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                    />
                  </div>
                  <div className="col-span-2">
                    <input
                      type="text"
                      value={category.key}
                      onChange={(e) =>
                        updateCategory(index, "key", e.target.value)
                      }
                      className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                      placeholder="如: parody"
                    />
                  </div>
                  <div className="col-span-2">
                    <input
                      type="text"
                      value={category.name}
                      onChange={(e) =>
                        updateCategory(index, "name", e.target.value)
                      }
                      className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                      placeholder="如: 恶搞"
                    />
                  </div>
                  <div className="col-span-2">
                    <input
                      type="file"
                      ref={(el) => (fileInputRefs.current[index] = el)}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          handleIconUpload(index, file);
                        }
                      }}
                      accept="image/png,image/jpeg,image/jpg,image/svg+xml,image/webp"
                      className="hidden"
                    />
                    {category.icon ? (
                      <div className="flex items-center gap-2">
                        <div className="relative w-12 h-12 rounded-lg border border-gray-200 overflow-hidden bg-gray-50">
                          <img
                            src={category.icon}
                            alt="图标"
                            className="w-full h-full object-cover"
                          />
                          {uploading?.index === index && (
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                              <span className="text-white text-xs font-medium">
                                {uploading.progress}%
                              </span>
                            </div>
                          )}
                        </div>
                        <button
                          onClick={() => removeIcon(index)}
                          className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          title="删除图标"
                        >
                          <XMarkIcon className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => triggerFileInput(index)}
                        disabled={uploading?.index === index}
                        className="flex items-center gap-2 px-4 py-2 text-gray-600 bg-gray-50 border border-gray-200 border-dashed rounded-lg hover:bg-gray-100 hover:border-gray-300 transition-all disabled:opacity-50"
                      >
                        {uploading?.index === index ? (
                          <>
                            <div className="w-4 h-4 border-2 border-gray-400/30 border-t-gray-600 rounded-full animate-spin" />
                            <span className="text-sm">
                              {uploading.progress}%
                            </span>
                          </>
                        ) : (
                          <>
                            <PhotoIcon className="w-4 h-4" />
                            <span className="text-sm">上传</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                  <div className="col-span-3">
                    <input
                      type="text"
                      value={category.description || ""}
                      onChange={(e) =>
                        updateCategory(index, "description", e.target.value)
                      }
                      className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                      placeholder="如: 搞怪恶搞，释放压力"
                    />
                  </div>
                  <div className="col-span-1 flex justify-end">
                    <button
                      onClick={() => removeCategory(index)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <TrashIcon className="w-4 h-4" />
                      删除
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="px-6 py-4 border-t border-gray-200 rounded-b-xl">
              <button
                onClick={addCategory}
                className="flex items-center gap-2 px-4 py-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
              >
                <PlusIcon className="w-5 h-5" />
                添加分类
              </button>
            </div>
          </div>
        )}

        <div className="mt-6 grid grid-cols-4 gap-6 text-sm text-gray-500">
          <div>
            <span className="font-medium text-gray-700">Key:</span>{" "}
            分类唯一标识，用于 API 筛选
          </div>
          <div>
            <span className="font-medium text-gray-700">名称:</span>{" "}
            分类显示名称
          </div>
          <div>
            <span className="font-medium text-gray-700">图标:</span> 支持
            PNG、JPG、SVG、WebP，建议尺寸 64x64，最大 1MB
          </div>
          <div>
            <span className="font-medium text-gray-700">描述:</span>{" "}
            分类的详细描述，显示在前端
          </div>
        </div>
      </div>
    </div>
  );
}
