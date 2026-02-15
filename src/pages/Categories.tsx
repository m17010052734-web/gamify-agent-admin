import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { homeApi } from "../services/api";
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
  EyeIcon,
  EyeSlashIcon,
  Bars3Icon,
  PauseIcon,
  PlayIcon,
} from "@heroicons/react/24/outline";

interface Category {
  id?: number;
  key: string;
  name: string;
  icon?: string;
  description?: string;
  is_published?: boolean;
  is_active?: boolean;
  sort_order?: number;
}

interface UploadingState {
  index: number;
  progress: number;
}

type TabType = "home" | "creative";

export default function Categories() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>("home");
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<UploadingState | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [touchDragState, setTouchDragState] = useState<{
    startIndex: number;
    startY: number;
    currentIndex: number;
  } | null>(null);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const fileInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    loadCategories();
  }, [activeTab]);

  const loadCategories = async () => {
    try {
      setLoading(true);
      const response =
        activeTab === "home"
          ? await homeApi.getAllCategories()
          : await homeApi.getAllCreativeCategories();
      if (response.data && response.data.categories) {
        const sorted = [...response.data.categories].sort(
          (a, b) => (a.sort_order || 0) - (b.sort_order || 0)
        );
        setCategories(sorted);
      }
    } catch (error) {
      console.error("加载分类失败:", error);
      setMessage({ type: "error", text: "加载分类失败" });
    } finally {
      setLoading(false);
    }
  };

  const addCategory = () => {
    const newCategory: Category =
      activeTab === "home"
        ? { key: "", name: "", icon: "", is_published: false, is_active: true, sort_order: categories.length }
        : { key: "", name: "", icon: "", description: "", is_published: false, is_active: true, sort_order: categories.length };
    setCategories([...categories, newCategory]);
  };

  const removeCategory = async (index: number) => {
    const category = categories[index];
    if (category.id) {
      if (!window.confirm("确定要删除这个分类吗？")) return;
      try {
        setSaving(true);
        if (activeTab === "home") {
          await homeApi.deleteCategory(category.id);
        } else {
          await homeApi.deleteCreativeCategory(category.id);
        }
        await loadCategories();
        setMessage({ type: "success", text: "删除成功" });
      } catch (error) {
        console.error("删除分类失败:", error);
        setMessage({ type: "error", text: "删除失败" });
      } finally {
        setSaving(false);
      }
    } else {
      if (categories.length <= 1) {
        setMessage({ type: "error", text: "至少保留一个分类" });
        return;
      }
      const newCategories = [...categories];
      newCategories.splice(index, 1);
      setCategories(newCategories);
      fileInputRefs.current.splice(index, 1);
    }
  };

  const updateCategory = (
    index: number,
    field: keyof Category,
    value: string | boolean | number,
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

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;
  };

  const handleDrop = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newCategories = [...categories];
    const draggedItem = newCategories[draggedIndex];
    newCategories.splice(draggedIndex, 1);
    newCategories.splice(index, 0, draggedItem);

    // 更新 sort_order
    const updatedCategories = newCategories.map((cat, i) => ({
      ...cat,
      sort_order: i,
    }));

    setCategories(updatedCategories);
    setDraggedIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const handleTouchStart = (index: number, e: React.TouchEvent) => {
    const touch = e.touches[0];
    setTouchDragState({
      startIndex: index,
      startY: touch.clientY,
      currentIndex: index,
    });
    setDraggedIndex(index);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchDragState) return;
    
    const touch = e.touches[0];
    const deltaY = touch.clientY - touchDragState.startY;
    const cardHeight = 200; 
    const movedCards = Math.round(deltaY / cardHeight);
    
    let newIndex = touchDragState.startIndex + movedCards;
    newIndex = Math.max(0, Math.min(newIndex, categories.length - 1));
    
    if (newIndex !== touchDragState.currentIndex) {
      const newCategories = [...categories];
      const draggedItem = newCategories[touchDragState.currentIndex];
      newCategories.splice(touchDragState.currentIndex, 1);
      newCategories.splice(newIndex, 0, draggedItem);
      setCategories(newCategories);
      setTouchDragState({ ...touchDragState, currentIndex: newIndex });
    }
  };

  const handleTouchEnd = () => {
    if (touchDragState && touchDragState.currentIndex !== touchDragState.startIndex) {
      const updatedCategories = categories.map((cat, i) => ({
        ...cat,
        sort_order: i,
      }));
      setCategories(updatedCategories);
    }
    setTouchDragState(null);
    setDraggedIndex(null);
  };

  const saveCategories = async () => {
    // 验证
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

      // 分离已存在ID的分类和新分类
      const existingCategories = categories.filter((c) => c.id);
      const newCategories = categories.filter((c) => !c.id);

      // 更新已有分类
      for (const cat of existingCategories) {
        if (cat.id) {
          if (activeTab === "home") {
            await homeApi.updateCategory(cat.id, {
              key: cat.key,
              name: cat.name,
              icon: cat.icon,
              is_published: cat.is_published,
              sort_order: cat.sort_order,
            });
          } else {
            await homeApi.updateCreativeCategory(cat.id, {
              key: cat.key,
              name: cat.name,
              icon: cat.icon,
              description: cat.description,
              is_published: cat.is_published,
              sort_order: cat.sort_order,
            });
          }
        }
      }

      // 创建新分类
      for (const cat of newCategories) {
        if (activeTab === "home") {
          await homeApi.createCategory({
            key: cat.key,
            name: cat.name,
            icon: cat.icon,
          });
        } else {
          await homeApi.createCreativeCategory({
            key: cat.key,
            name: cat.name,
            icon: cat.icon,
            description: cat.description,
          });
        }
      }

      // 保存排序
      const orders = categories.map((cat, index) => ({
        id: cat.id || 0,
        sort_order: index,
      }));
      if (activeTab === "home") {
        await homeApi.updateSortOrders(orders);
      } else {
        await homeApi.updateCreativeSortOrders(orders);
      }

      await loadCategories();
      setMessage({ type: "success", text: "保存成功" });
    } catch (error) {
      console.error("保存分类失败:", error);
      setMessage({ type: "error", text: "保存失败" });
    } finally {
      setSaving(false);
    }
  };

  const togglePublish = async (index: number) => {
    const category = categories[index];
    if (!category.id) {
      setMessage({ type: "error", text: "请先保存分类后再发布" });
      return;
    }

    try {
      setSaving(true);
      const newStatus = !category.is_published;
      if (activeTab === "home") {
        await homeApi.togglePublish(category.id, newStatus);
      } else {
        await homeApi.toggleCreativePublish(category.id, newStatus);
      }
      updateCategory(index, "is_published", newStatus);
      setMessage({
        type: "success",
        text: newStatus ? "发布成功" : "已取消发布",
      });
    } catch (error) {
      console.error("操作失败:", error);
      setMessage({ type: "error", text: "操作失败" });
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (index: number) => {
    const category = categories[index];
    if (!category.id) {
      setMessage({ type: "error", text: "请先保存分类后再操作" });
      return;
    }

    try {
      setSaving(true);
      const newStatus = !category.is_active;
      if (activeTab === "home") {
        await homeApi.updateCategory(category.id, { is_active: newStatus });
      } else {
        await homeApi.updateCreativeCategory(category.id, { is_active: newStatus });
      }
      updateCategory(index, "is_active", newStatus);
      setMessage({
        type: "success",
        text: newStatus ? "已启用" : "已禁用",
      });
    } catch (error) {
      console.error("操作失败:", error);
      setMessage({ type: "error", text: "操作失败" });
    } finally {
      setSaving(false);
    }
  };

  const resetCategories = async () => {
    const confirmText =
      activeTab === "home"
        ? "确定要重置为默认首页分类吗？"
        : "确定要重置为默认创意模板分类吗？";
    if (!window.confirm(confirmText)) return;

    try {
      setSaving(true);
      setMessage(null);
      if (activeTab === "home") {
        await homeApi.resetCategories();
      } else {
        await homeApi.resetCreativeCategories();
      }
      await loadCategories();
      setMessage({ type: "success", text: "已重置为默认分类" });
    } catch (error) {
      console.error("重置分类失败:", error);
      setMessage({ type: "error", text: "重置失败" });
    } finally {
      setSaving(false);
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
                  分类配置
                </h1>
                <p className="text-xs sm:text-sm text-gray-500 mt-0.5 truncate">
                  {activeTab === "home"
                    ? "管理首页游戏广场的分类筛选标签"
                    : "管理话题生成页面的创意模板分类标签"}
                </p>
              </div>
            </div>
            <div className="flex flex-row gap-2 sm:gap-3 sm:items-center">
              <button
                onClick={resetCategories}
                disabled={saving}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 py-2 sm:px-4 text-sm text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                <ArrowPathIcon className="w-4 h-4" />
                <span>重置</span>
              </button>
              <button
                onClick={saveCategories}
                disabled={saving}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 py-2 sm:px-4 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    保存中...
                  </>
                ) : (
                  <>
                    <CheckCircleIcon className="w-4 h-4" />
                    保存
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Tab Navigation */}
        <div className="mb-6 border-b border-gray-200 overflow-x-auto">
          <nav className="-mb-px flex gap-2 md:space-x-8 min-w-max">
            <button
              onClick={() => setActiveTab("home")}
              className={`py-3 px-2 md:px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
                activeTab === "home"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              首页分类
            </button>
            <button
              onClick={() => setActiveTab("creative")}
              className={`py-3 px-2 md:px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
                activeTab === "creative"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              创意模板分类
            </button>
          </nav>
        </div>

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

        {/* Info Card */}
        <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <TagIcon className="w-5 h-5 text-blue-600 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">使用说明</p>
              <ul className="list-disc list-inside space-y-1">
                <li>新建分类默认不发布，需要手动发布后才能在前端显示</li>
                <li>拖拽分类可调整顺序，保存后生效</li>
                <li>只有已发布的分类才会在前端显示</li>
              </ul>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* Desktop Table - Only show on md+ screens */}
            <div className="hidden md:block bg-white rounded-xl border border-gray-200 shadow-sm overflow-x-auto">
              {/* Table Header */}
              <div className="grid grid-cols-12 gap-4 px-6 py-4 bg-gray-50 border-b border-gray-200 rounded-t-xl min-w-[800px]">
              <div className="col-span-1">
                <div className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                  排序
                </div>
              </div>
              <div className="col-span-2">
                <div className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Key
                </div>
              </div>
              <div className="col-span-2">
                <div className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                  名称
                </div>
              </div>
              <div className="col-span-2">
                <div className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                  图标
                </div>
              </div>
              {activeTab === "creative" && (
                <div className="col-span-2">
                  <div className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                    描述
                  </div>
                </div>
              )}
              <div className="col-span-2">
                <div className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                  状态
                </div>
              </div>
              <div className="col-span-1">
                <div className="text-xs font-medium text-gray-500 uppercase tracking-wider text-right">
                  操作
                </div>
              </div>
            </div>

            {/* Category Items */}
            <div className="divide-y divide-gray-100 min-w-[800px]">
              {categories.map((category, index) => (
                <div
                  key={index}
                  draggable
                  onDragStart={() => handleDragStart(index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDrop={(e) => handleDrop(e, index)}
                  onDragEnd={handleDragEnd}
                  className={`grid grid-cols-12 gap-4 px-4 md:px-6 py-4 items-center hover:bg-gray-50 transition-colors ${
                    draggedIndex === index ? "opacity-50" : ""
                  }`}
                >
                  {/* Drag Handle */}
                  <div className="col-span-1">
                    <div className="flex items-center gap-2">
                      <div className="cursor-move p-1 text-gray-400 hover:text-gray-600">
                        <Bars3Icon className="w-5 h-5" />
                      </div>
                      <span className="text-sm text-gray-500">{index + 1}</span>
                    </div>
                  </div>

                  {/* Key */}
                  <div className="col-span-2">
                    <input
                      type="text"
                      value={category.key}
                      onChange={(e) =>
                        updateCategory(index, "key", e.target.value)
                      }
                      className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                      placeholder={activeTab === "home" ? "如: adventure" : "如: parody"}
                    />
                  </div>

                  {/* Name */}
                  <div className="col-span-2">
                    <input
                      type="text"
                      value={category.name}
                      onChange={(e) =>
                        updateCategory(index, "name", e.target.value)
                      }
                      className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                      placeholder={activeTab === "home" ? "如: 冒险" : "如: 恶搞"}
                    />
                  </div>

                  {/* Icon */}
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
                            <span className="text-sm">{uploading.progress}%</span>
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

                  {/* Description */}
                  {activeTab === "creative" && (
                    <div className="col-span-2">
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
                  )}

                  {/* Status (is_active) */}
                  <div className="col-span-1">
                    <button
                      onClick={() => toggleActive(index)}
                      disabled={!category.id}
                      className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-sm font-medium transition-colors ${
                        category.id
                          ? category.is_active
                            ? "bg-blue-100 text-blue-700 hover:bg-blue-200"
                            : "bg-red-100 text-red-700 hover:bg-red-200"
                          : "bg-gray-50 text-gray-400 cursor-not-allowed"
                      }`}
                    >
                      {category.is_active ? (
                        <>
                          <PlayIcon className="w-3 h-3" />
                          启用
                        </>
                      ) : (
                        <>
                          <PauseIcon className="w-3 h-3" />
                          禁用
                        </>
                      )}
                    </button>
                  </div>

                  {/* Publish Status */}
                  <div className="col-span-1">
                    <button
                      onClick={() => togglePublish(index)}
                      disabled={!category.id}
                      className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-sm font-medium transition-colors ${
                        category.id
                          ? category.is_published
                            ? "bg-green-100 text-green-700 hover:bg-green-200"
                            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                          : "bg-gray-50 text-gray-400 cursor-not-allowed"
                      }`}
                    >
                      {category.is_published ? (
                        <>
                          <EyeIcon className="w-3 h-3" />
                          已发布
                        </>
                      ) : (
                        <>
                          <EyeSlashIcon className="w-3 h-3" />
                          未发布
                        </>
                      )}
                    </button>
                  </div>

                  {/* Actions */}
                  <div className="col-span-1 text-right">
                    <button
                      onClick={() => removeCategory(index)}
                      className="inline-flex items-center gap-1 px-2 py-1 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <TrashIcon className="w-4 h-4" />
                      删除
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Add Button */}
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

            {/* Mobile Card Layout - Only show on small screens */}
            <div className="md:hidden space-y-4 px-4">
              {categories.map((category, index) => (
                <div 
                  key={index} 
                  className={`bg-white rounded-xl border border-gray-200 shadow-sm p-4 transition-transform ${touchDragState?.currentIndex === index ? 'scale-105 shadow-lg z-10' : ''}`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div 
                        onTouchStart={(e) => handleTouchStart(index, e)}
                        onTouchMove={handleTouchMove}
                        onTouchEnd={handleTouchEnd}
                        className="cursor-move p-1 text-gray-400 hover:text-gray-600 touch-none"
                      >
                        <Bars3Icon className="w-5 h-5" />
                      </div>
                      <span className="font-medium text-gray-700">#{index + 1}</span>
                    </div>
                    <button 
                      onClick={() => removeCategory(index)} 
                      className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <TrashIcon className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Key</label>
                      <input
                        type="text"
                        value={category.key}
                        onChange={(e) => updateCategory(index, "key", e.target.value)}
                        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                        placeholder="如: adventure"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">名称</label>
                      <input
                        type="text"
                        value={category.name}
                        onChange={(e) => updateCategory(index, "name", e.target.value)}
                        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                        placeholder="如: 冒险"
                      />
                    </div>
                    {activeTab === "creative" && (
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">描述</label>
                        <input
                          type="text"
                          value={category.description || ""}
                          onChange={(e) => updateCategory(index, "description", e.target.value)}
                          className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                          placeholder="描述内容"
                        />
                      </div>
                    )}
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">状态</label>
                      <button
                        onClick={() => toggleActive(index)}
                        disabled={!category.id}
                        className={`w-full flex items-center justify-center gap-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                          category.id
                            ? category.is_active
                                ? "bg-blue-100 text-blue-700 hover:bg-blue-200"
                                : "bg-red-100 text-red-700 hover:bg-red-200"
                            : "bg-gray-50 text-gray-400 cursor-not-allowed"
                        }`}
                      >
                        {category.is_active ? (
                          <>
                            <PlayIcon className="w-3 h-3" />
                            启用
                          </>
                        ) : (
                          <>
                            <PauseIcon className="w-3 h-3" />
                            发布
                          </>
                        )}
                      </button>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">发布</label>
                      <button
                        onClick={() => togglePublish(index)}
                        disabled={!category.id}
                        className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                          category.id
                            ? category.is_published
                              ? "bg-green-100 text-green-700 hover:bg-green-200"
                              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                            : "bg-gray-50 text-gray-400 cursor-not-allowed"
                        }`}
                      >
                        {category.is_published ? (
                          <>
                            <EyeIcon className="w-4 h-4" />
                            已发布
                          </>
                        ) : (
                          <>
                            <EyeSlashIcon className="w-4 h-4" />
                            未发布
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              <button
                onClick={addCategory}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors border-2 border-dashed border-blue-200"
              >
                <PlusIcon className="w-5 h-5" />
                添加分类
              </button>
            </div>
          </>
        )}

        {/* Field Help */}
        <div className="mt-6 text-sm text-gray-500">
          <div className="grid grid-cols-4 gap-4">
            <div>
              <span className="font-medium text-gray-700">排序:</span>{" "}
              拖拽调整顺序
            </div>
            <div>
              <span className="font-medium text-gray-700">Key:</span>{" "}
              分类唯一标识
            </div>
            <div>
              <span className="font-medium text-gray-700">图标:</span>{" "}
              支持 PNG/JPG/SVG/WebP
            </div>
            <div>
              <span className="font-medium text-gray-700">状态:</span>{" "}
              发布后前端可见
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
