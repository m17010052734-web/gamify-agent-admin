import { useState, useEffect } from 'react';
import { creativeTemplateApi, homeApi } from '../services/api';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline';
import Modal from '../components/Modal';
import { useToast } from '../contexts/ToastContext';

interface CreativeTemplate {
  id: string;
  name: string;
  description?: string;
  prompt: string;
  category: string;
  cover_url?: string;
  tags: string[];
  example_output?: string;
  game_source_type: 'none' | 'code' | 'url';
  game_url?: string;
  game_code?: string;
  sort_order: number;
  is_hot: boolean;
  is_new: boolean;
  use_count: number;
  status: 'active' | 'inactive' | null;
  created_at: string;
  updated_at: string;
}

const GAME_SOURCE_TYPES = [
  { key: 'none', name: '无' },
  { key: 'code', name: '代码' },
  { key: 'url', name: 'URL' },
];

interface CategoryOption {
  key: string;
  name: string;
}

export default function CreativeTemplates() {
  const toast = useToast();
  const [templates, setTemplates] = useState<CreativeTemplate[]>([]);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('');
  const [status, setStatus] = useState('');
  const [keyword, setKeyword] = useState('');

  // Create/Edit modal
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<CreativeTemplate | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    prompt: '',
    category: '',
    cover_url: '',
    tags: [] as string[],
    example_output: '',
    game_source_type: 'none' as 'none' | 'code' | 'url',
    game_url: '',
    game_code: '',
    sort_order: 0,
    is_hot: false,
    is_new: false,
    status: 'active' as 'active' | 'inactive',
  });

  // Loading states
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [toggling, setToggling] = useState<string | null>(null);
  const [uploadingCover, setUploadingCover] = useState(false);

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    loadTemplates();
  }, [page, category, status, keyword]);

  const loadCategories = async () => {
    try {
      const response = await homeApi.getAllCreativeCategories();
      if (response.data?.categories) {
        setCategories(response.data.categories.map((c: any) => ({
          key: c.key,
          name: c.name,
        })));
      }
    } catch (err) {
      console.error('Failed to load categories:', err);
    }
  };

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const response = await creativeTemplateApi.getCreativeTemplates({
        page,
        page_size: pageSize,
        category: category || undefined,
        status: status || undefined,
        keyword: keyword || undefined,
      });
      setTemplates(response.data.items);
      setTotal(response.data.total);
    } catch (err) {
      console.error('Failed to load templates:', err);
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditingTemplate(null);
    setFormData({
      name: '',
      description: '',
      prompt: '',
      category: 'parody',
      cover_url: '',
      tags: [],
      example_output: '',
      game_source_type: 'none',
      game_url: '',
      game_code: '',
      sort_order: 0,
      is_hot: false,
      is_new: false,
      status: 'active',
    });
    setShowEditModal(true);
  };

  const openEditModal = (template: CreativeTemplate) => {
    setEditingTemplate(template);
    const formDataToSet = {
      name: template.name,
      description: template.description || '',
      prompt: template.prompt,
      category: template.category,
      cover_url: template.cover_url || '',
      tags: template.tags || [],
      example_output: template.example_output || '',
      game_source_type: template.game_source_type,
      game_url: template.game_url || '',
      game_code: template.game_code || '',
      sort_order: template.sort_order,
      is_hot: template.is_hot,
      is_new: template.is_new,
      status: template.status || 'active',
    };
    console.log('openEditModal - template:', template);
    console.log('openEditModal - formData:', formDataToSet);
    setFormData(formDataToSet);
    setShowEditModal(true);
  };

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      console.log('Submitting formData:', JSON.stringify(formData, null, 2));
      if (editingTemplate) {
        console.log('Updating template:', editingTemplate.id);
        await creativeTemplateApi.updateCreativeTemplate(editingTemplate.id, formData);
        toast.success('更新成功');
      } else {
        await creativeTemplateApi.createCreativeTemplate(formData);
        toast.success('创建成功');
      }
      setShowEditModal(false);
      loadTemplates();
    } catch (err: any) {
      toast.error(err.message || '操作失败');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除这个模板吗？')) return;
    try {
      setDeleting(id);
      await creativeTemplateApi.deleteCreativeTemplate(id);
      toast.success('删除成功');
      loadTemplates();
    } catch (err: any) {
      toast.error(err.message || '删除失败');
    } finally {
      setDeleting(null);
    }
  };

  const handleToggleStatus = async (id: string) => {
    try {
      setToggling(id);
      await creativeTemplateApi.toggleTemplateStatus(id);
      toast.success('状态更新成功');
      loadTemplates();
    } catch (err: any) {
      toast.error(err.message || '操作失败');
    } finally {
      setToggling(null);
    }
  };

  const getCategoryName = (key: string) => {
    return categories.find(c => c.key === key)?.name || key;
  };

  const getSourceTypeName = (key: string) => {
    return GAME_SOURCE_TYPES.find(t => t.key === key)?.name || key;
  };

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">创意模板管理</h1>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
        >
          <PlusIcon className="w-5 h-5" />
          添加模板
        </button>
      </div>

      {/* Filters - Desktop */}
      <div className="hidden md:flex flex-wrap gap-4 items-center">
        <div className="flex items-center gap-2">
          <select
            value={category}
            onChange={(e) => { setCategory(e.target.value); setPage(1); }}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">全部分类</option>
            {categories.map(cat => (
              <option key={cat.key} value={cat.key}>{cat.name}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={status}
            onChange={(e) => { setStatus(e.target.value); setPage(1); }}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">全部状态</option>
            <option value="active">启用</option>
            <option value="inactive">禁用</option>
          </select>
        </div>
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <div className="relative flex-1">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={keyword}
              onChange={(e) => { setKeyword(e.target.value); setPage(1); }}
              placeholder="搜索模板名称..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>
      </div>

      {/* Filters - Mobile */}
      <div className="md:hidden space-y-3">
        <div className="flex gap-2">
          <input
            type="text"
            value={keyword}
            onChange={(e) => { setKeyword(e.target.value); setPage(1); }}
            placeholder="搜索模板..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
          />
          <select
            value={category}
            onChange={(e) => { setCategory(e.target.value); setPage(1); }}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">全部分类</option>
            {categories.map(cat => (
              <option key={cat.key} value={cat.key}>{cat.name}</option>
            ))}
          </select>
          <select
            value={status}
            onChange={(e) => { setStatus(e.target.value); setPage(1); }}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">状态</option>
            <option value="active">启用</option>
            <option value="inactive">禁用</option>
          </select>
        </div>
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">模板名称</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">分类</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">来源类型</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">热门/新品</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">使用次数</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">状态</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">操作</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                  加载中...
                </td>
              </tr>
            ) : templates.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                  暂无数据
                </td>
              </tr>
            ) : (
              templates.map((template) => (
                <tr key={template.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {template.cover_url && (
                        <img
                          src={template.cover_url}
                          alt={template.name}
                          className="w-12 h-12 object-cover rounded"
                        />
                      )}
                      <div>
                        <div className="font-medium text-gray-900">{template.name}</div>
                        <div className="text-sm text-gray-500 truncate max-w-xs">
                          {template.description}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-900">
                    {getCategoryName(template.category)}
                  </td>
                  <td className="px-6 py-4 text-gray-900">
                    {getSourceTypeName(template.game_source_type)}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      {template.is_hot && (
                        <span className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded">热门</span>
                      )}
                      {template.is_new && (
                        <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded">新品</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-900">
                    {template.use_count}
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => handleToggleStatus(template.id)}
                      disabled={toggling === template.id}
                      className={`px-2 py-1 text-xs rounded ${
                        template.status === 'active'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {template.status === 'active' ? '启用' : '禁用'}
                    </button>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => openEditModal(template)}
                        className="p-2 text-indigo-600 hover:text-indigo-900 hover:bg-indigo-50 rounded-lg"
                        title="编辑"
                      >
                        <PencilIcon className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(template.id)}
                        disabled={deleting === template.id}
                        className="p-2 text-red-600 hover:text-red-900 hover:bg-red-50 rounded-lg"
                        title="删除"
                      >
                        <TrashIcon className="w-5 h-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Card List */}
      <div className="md:hidden space-y-4">
        {loading ? (
          <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
            加载中...
          </div>
        ) : templates.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
            暂无数据
          </div>
        ) : (
          templates.map((template) => (
            <div key={template.id} className="bg-white rounded-lg shadow p-4">
              <div className="flex gap-3">
                {template.cover_url && (
                  <img
                    src={template.cover_url}
                    alt={template.name}
                    className="w-16 h-16 object-cover rounded-lg flex-shrink-0"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-900 truncate">{template.name}</div>
                  <div className="text-sm text-gray-500 truncate">{template.description}</div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded">
                      {getCategoryName(template.category)}
                    </span>
                    <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded">
                      {getSourceTypeName(template.game_source_type)}
                    </span>
                    {template.is_hot && (
                      <span className="px-2 py-0.5 text-xs bg-red-100 text-red-800 rounded">热门</span>
                    )}
                    {template.is_new && (
                      <span className="px-2 py-0.5 text-xs bg-green-100 text-green-800 rounded">新品</span>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Mobile Actions */}
              <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">使用: {template.use_count}</span>
                  <button
                    onClick={() => handleToggleStatus(template.id)}
                    disabled={toggling === template.id}
                    className={`px-3 py-1.5 text-xs rounded-lg ${
                      template.status === 'active'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {template.status === 'active' ? '已启用' : '已禁用'}
                  </button>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => openEditModal(template)}
                    className="flex items-center gap-1 px-3 py-1.5 text-sm text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg"
                  >
                    <PencilIcon className="w-4 h-4" />
                    编辑
                  </button>
                  <button
                    onClick={() => handleDelete(template.id)}
                    disabled={deleting === template.id}
                    className="flex items-center gap-1 px-3 py-1.5 text-sm text-red-600 bg-red-50 hover:bg-red-100 rounded-lg"
                  >
                    <TrashIcon className="w-4 h-4" />
                    删除
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 flex-wrap">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-1.5 border rounded disabled:opacity-50 text-sm"
          >
            上一页
          </button>
          <span className="px-3 py-1 text-sm text-gray-600">
            第 {page} / {totalPages} 页
          </span>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-3 py-1.5 border rounded disabled:opacity-50 text-sm"
          >
            下一页
          </button>
        </div>
      )}

      {/* Edit Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title={editingTemplate ? '编辑模板' : '创建模板'}
        maxWidth="2xl"
      >
        <div className="space-y-4 max-h-[70vh] overflow-y-auto">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              模板名称 *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              描述
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              生成提示词 *
            </label>
            <textarea
              value={formData.prompt}
              onChange={(e) => setFormData({ ...formData, prompt: e.target.value })}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                分类 *
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              >
                {categories.map(cat => (
                  <option key={cat.key} value={cat.key}>{cat.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                游戏来源类型
              </label>
              <select
                value={formData.game_source_type}
                onChange={(e) => setFormData({ ...formData, game_source_type: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              >
                {GAME_SOURCE_TYPES.map(type => (
                  <option key={type.key} value={type.key}>{type.name}</option>
                ))}
              </select>
            </div>
          </div>

          {formData.game_source_type === 'url' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                游戏 URL
              </label>
              <input
                type="url"
                value={formData.game_url}
                onChange={(e) => setFormData({ ...formData, game_url: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          )}

          {formData.game_source_type !== 'url' ? (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                游戏代码
              </label>
              <textarea
                value={formData.game_code}
                onChange={(e) => setFormData({ ...formData, game_code: e.target.value })}
                rows={6}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 font-mono text-sm"
                placeholder="<!DOCTYPE html>..."
              />
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                游戏代码 <span className="text-gray-400 text-xs">(来源类型为URL时不需要填写)</span>
              </label>
              <textarea
                value={formData.game_code}
                onChange={(e) => setFormData({ ...formData, game_code: e.target.value })}
                rows={6}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 font-mono text-sm text-gray-400"
                placeholder="来源类型为URL时不需要填写"
                disabled
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              封面图片
            </label>
            <div className="flex gap-4 items-start">
              <div className="flex-1">
                <input
                  type="url"
                  value={formData.cover_url}
                  onChange={(e) => setFormData({ ...formData, cover_url: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  placeholder="封面图URL或点击上传"
                />
                <div className="mt-2">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      try {
                        setUploadingCover(true);
                        const response = await creativeTemplateApi.uploadCover(file);
                        if (response.data?.url) {
                          setFormData({ ...formData, cover_url: response.data.url });
                          toast.success('上传成功');
                        }
                      } catch (err: any) {
                        toast.error(err.message || '上传失败');
                      } finally {
                        setUploadingCover(false);
                      }
                    }}
                    className="hidden"
                    id="cover-upload"
                  />
                  <label
                    htmlFor="cover-upload"
                    className="inline-flex items-center px-4 py-2 bg-indigo-50 text-indigo-700 rounded-lg cursor-pointer hover:bg-indigo-100 transition-colors"
                  >
                    {uploadingCover ? '上传中...' : '选择图片'}
                  </label>
                </div>
              </div>
              {formData.cover_url && (
                <div className="w-24 h-24 rounded-lg overflow-hidden border border-gray-200 flex-shrink-0">
                  <img
                    src={formData.cover_url}
                    alt="封面预览"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://via.placeholder.com/96?text=No+Image';
                    }}
                  />
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              标签 (用逗号分隔)
            </label>
            <input
              type="text"
              value={formData.tags.join(', ')}
              onChange={(e) => setFormData({ ...formData, tags: e.target.value.split(',').map(t => t.trim()).filter(Boolean) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              placeholder="标签1, 标签2"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                排序权重
              </label>
              <input
                type="number"
                value={formData.sort_order}
                onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                状态
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as 'active' | 'inactive' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              >
                <option value="active">启用</option>
                <option value="inactive">禁用</option>
              </select>
            </div>
            <div className="flex items-center gap-4 pt-6">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.is_hot}
                  onChange={(e) => setFormData({ ...formData, is_hot: e.target.checked })}
                  className="rounded"
                />
                <span className="text-sm">热门</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.is_new}
                  onChange={(e) => setFormData({ ...formData, is_new: e.target.checked })}
                  className="rounded"
                />
                <span className="text-sm">新品</span>
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              onClick={() => setShowEditModal(false)}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              取消
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting || !formData.name || !formData.prompt}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
            >
              {submitting ? '提交中...' : '提交'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
