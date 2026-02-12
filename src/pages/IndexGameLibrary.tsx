import { useEffect, useState } from 'react';
import { indexGameApi } from '../services/api';
import type { IndexGame } from '../types';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  StarIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import Modal from '../components/Modal';
import { useToast } from '../contexts/ToastContext';

export default function IndexGameLibrary() {
  const toast = useToast();
  const [games, setGames] = useState<IndexGame[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('');
  const [sourceType, setSourceType] = useState('');
  const [keyword, setKeyword] = useState('');

  // Create/Edit modal
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingGame, setEditingGame] = useState<IndexGame | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    source_type: 'url' as 'url' | 'code',
    game_url: '',
    html_code: '',
    cover_url: '',
    thumbnail_url: '',
    category: 'mini_game',
    tags: [] as string[],
    show_in_banner: false,
    weight: 0,
  });

  // Loading states
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [toggling, setToggling] = useState<string | null>(null);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [imageLoadError, setImageLoadError] = useState(false);

  useEffect(() => {
    loadGames();
  }, [page, category, sourceType, keyword]);

  const loadGames = async () => {
    try {
      setLoading(true);
      const response = await indexGameApi.getIndexGames({
        page,
        page_size: pageSize,
        category: category || undefined,
        source_type: sourceType || undefined,
        keyword: keyword || undefined,
      });
      setGames(response.data.items);
      setTotal(response.data.total);
    } catch (err) {
      console.error('Failed to load games:', err);
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditingGame(null);
    setFormData({
      title: '',
      description: '',
      source_type: 'url',
      game_url: '',
      html_code: '',
      cover_url: '',
      thumbnail_url: '',
      category: 'mini_game',
      tags: [],
      show_in_banner: false,
      weight: 0,
    });
    setShowEditModal(true);
  };

  const openEditModal = (game: IndexGame) => {
    setEditingGame(game);
    setFormData({
      title: game.title,
      description: game.description || '',
      source_type: game.source_type,
      game_url: game.game_url || '',
      html_code: game.version_code?.html_code || '',
      cover_url: game.cover_url || '',
      thumbnail_url: game.thumbnail_url || '',
      category: game.category,
      tags: game.tags || [],
      show_in_banner: game.show_in_banner,
      weight: game.weight,
    });
    setShowEditModal(true);
  };

  const handleSubmit = async () => {
    if (!formData.title || !formData.cover_url || !formData.category) {
      toast.warning('请填写必填字段');
      return;
    }

    if (formData.source_type === 'url' && !formData.game_url) {
      toast.warning('URL 类型游戏需要填写游戏 URL');
      return;
    }

    if (formData.source_type === 'code' && !formData.html_code) {
      toast.warning('代码类型游戏需要填写 HTML 代码');
      return;
    }

    try {
      setSubmitting(true);

      // 根据 source_type 过滤提交数据
      let submitData: any;
      if (formData.source_type === 'url') {
        // URL 类型游戏不需要 html_code 字段
        const { html_code, ...rest } = formData;
        submitData = rest;
      } else {
        // 代码类型游戏不需要 game_url 字段
        const { game_url, ...rest } = formData;
        submitData = rest;
      }

      if (editingGame) {
        await indexGameApi.updateIndexGame(editingGame.id, submitData);
        toast.success('更新成功');
      } else {
        await indexGameApi.createIndexGame(submitData);
        toast.success('创建成功');
      }
      setShowEditModal(false);
      loadGames();
    } catch (err) {
      console.error('Failed to submit:', err);
      toast.error('操作失败');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (gameId: string) => {
    if (!confirm('确定要删除这个游戏吗?')) return;

    try {
      setDeleting(gameId);
      await indexGameApi.deleteIndexGame(gameId);
      toast.success('删除成功');
      loadGames();
    } catch (err) {
      console.error('Failed to delete:', err);
      toast.error('删除失败');
    } finally {
      setDeleting(null);
    }
  };

  const handleToggleBanner = async (gameId: string) => {
    try {
      setToggling(gameId);
      await indexGameApi.toggleBanner(gameId);
      loadGames();
    } catch (err) {
      console.error('Failed to toggle banner:', err);
      toast.error('操作失败');
    } finally {
      setToggling(null);
    }
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 验证文件类型
    if (!file.type.startsWith('image/')) {
      toast.warning('请选择图片文件');
      return;
    }

    // 验证文件大小（最大 5MB）
    if (file.size > 5 * 1024 * 1024) {
      toast.warning('图片大小不能超过 5MB');
      return;
    }

    try {
      setUploadingCover(true);
      const response = await indexGameApi.uploadGameCover(file);
      setFormData(prev => ({ ...prev, cover_url: response.data.url }));
      setImageLoadError(false);
      toast.success('上传成功');
    } catch (err) {
      console.error('Failed to upload cover:', err);
      toast.error('上传失败');
    } finally {
      setUploadingCover(false);
    }
  };

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold text-gray-900">首页游戏库</h1>
          <p className="mt-1 text-sm text-gray-600">管理首页展示的游戏和轮播图</p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-smooth cursor-pointer"
        >
          <PlusIcon className="w-5 h-5 mr-2" />
          创建游戏
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">分类</label>
            <select
              value={category}
              onChange={(e) => {
                setCategory(e.target.value);
                setPage(1);
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent cursor-pointer"
            >
              <option value="">全部</option>
              <option value="mini_game">小游戏</option>
              <option value="h5_page">H5页面</option>
              <option value="interactive_card">互动卡片</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">来源类型</label>
            <select
              value={sourceType}
              onChange={(e) => {
                setSourceType(e.target.value);
                setPage(1);
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent cursor-pointer"
            >
              <option value="">全部</option>
              <option value="url">URL</option>
              <option value="code">代码</option>
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">搜索</label>
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={keyword}
                onChange={(e) => {
                  setKeyword(e.target.value);
                  setPage(1);
                }}
                placeholder="搜索标题或描述..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
          </div>
        </div>
        <div className="mt-4 text-sm text-gray-600">共 {total} 个游戏</div>
      </div>

      {/* Games Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {loading ? (
          <div className="col-span-full bg-white rounded-xl shadow-sm border border-gray-200 p-16">
            <div className="flex flex-col items-center justify-center space-y-4">
              <div className="relative w-16 h-16">
                <div className="absolute inset-0 rounded-full border-4 border-purple-200"></div>
                <div className="absolute inset-0 rounded-full border-4 border-purple-600 border-t-transparent animate-spin"></div>
              </div>
              <p className="text-gray-600 font-medium">加载游戏库中...</p>
            </div>
          </div>
        ) : games.length === 0 ? (
          <div className="col-span-full bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border-2 border-dashed border-gray-300 p-16">
            <div className="text-center">
              <div className="mx-auto w-20 h-20 mb-6 text-gray-400">
                <svg className="w-full h-full" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
              </div>
              <h3 className="text-xl font-heading font-bold text-gray-900 mb-2">暂无游戏</h3>
              <p className="text-gray-600 mb-6">当前筛选条件下没有找到游戏</p>
              <button
                onClick={openCreateModal}
                className="inline-flex items-center px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors duration-200 cursor-pointer font-medium shadow-sm"
              >
                <PlusIcon className="w-5 h-5 mr-2" />
                创建第一个游戏
              </button>
            </div>
          </div>
        ) : (
          games.map((game) => (
            <div
              key={game.id}
              className="group bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-xl hover:border-purple-300 hover:-translate-y-1 transition-all duration-300 cursor-pointer"
            >
              {/* Cover Image */}
              <div className="aspect-video bg-gradient-to-br from-purple-100 via-pink-50 to-blue-100 relative overflow-hidden">
                {game.cover_url ? (
                  <img
                    src={game.cover_url}
                    alt={game.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                    <svg className="w-16 h-16 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className="text-sm font-medium">无封面</span>
                  </div>
                )}

                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                {/* Top Badges */}
                <div className="absolute top-3 left-3 right-3 flex items-start justify-between gap-2">
                  <span
                    className={`px-3 py-1.5 text-xs font-bold rounded-full backdrop-blur-md shadow-lg ${
                      game.source_type === 'url'
                        ? 'bg-purple-500/90 text-white'
                        : 'bg-amber-500/90 text-white'
                    }`}
                  >
                    {game.source_type === 'url' ? '🔗 URL' : '💻 代码'}
                  </span>
                  <div className="flex flex-col gap-2">
                    {game.show_in_banner && (
                      <span className="px-3 py-1.5 text-xs font-bold rounded-full bg-green-500/90 text-white backdrop-blur-md shadow-lg">
                        ⭐ 轮播图
                      </span>
                    )}
                    <span className="px-3 py-1.5 text-xs font-bold rounded-full bg-blue-500/90 text-white backdrop-blur-md shadow-lg">
                      ⚡ {game.weight}
                    </span>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="p-5">
                <h3 className="text-lg font-heading font-bold text-gray-900 mb-2 line-clamp-1 group-hover:text-purple-600 transition-colors duration-200">
                  {game.title}
                </h3>
                <p className="text-sm text-gray-600 mb-4 line-clamp-2 min-h-[2.5rem]">
                  {game.description || '暂无描述'}
                </p>

                {/* Meta Info */}
                <div className="flex items-center justify-between text-xs mb-4 pb-4 border-b border-gray-100">
                  <div className="flex items-center gap-1.5 text-gray-600">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                    <span className="font-medium">
                      {game.category === 'mini_game'
                        ? '小游戏'
                        : game.category === 'h5_page'
                        ? 'H5页面'
                        : '互动卡片'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-purple-600 font-semibold">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>{game.play_count}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleToggleBanner(game.id)}
                      disabled={toggling === game.id}
                      className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg font-medium transition-all duration-200 cursor-pointer ${
                        game.show_in_banner
                          ? 'bg-gradient-to-r from-green-600 to-green-500 text-white hover:from-green-700 hover:to-green-600 shadow-md hover:shadow-lg'
                          : 'border-2 border-gray-300 text-gray-700 hover:border-purple-400 hover:text-purple-600 hover:bg-purple-50'
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      {game.show_in_banner ? (
                        <StarIconSolid className="w-4 h-4" />
                      ) : (
                        <StarIcon className="w-4 h-4" />
                      )}
                      <span className="text-sm">{toggling === game.id ? '处理中...' : '轮播'}</span>
                    </button>
                    <button
                      onClick={() => openEditModal(game)}
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 border-2 border-gray-300 text-gray-700 rounded-lg hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-all duration-200 cursor-pointer font-medium"
                    >
                      <PencilIcon className="w-4 h-4" />
                      <span className="text-sm">编辑</span>
                    </button>
                  </div>
                  <button
                    onClick={() => handleDelete(game.id)}
                    disabled={deleting === game.id}
                    className="w-full flex items-center justify-center gap-1.5 px-3 py-2.5 bg-gradient-to-r from-red-600 to-red-500 text-white rounded-lg hover:from-red-700 hover:to-red-600 transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-md hover:shadow-lg"
                  >
                    <TrashIcon className="w-4 h-4" />
                    <span className="text-sm">{deleting === game.id ? '删除中...' : '删除'}</span>
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 px-6 py-4 flex items-center justify-between">
          <div className="text-sm text-gray-700">
            第 {page} / {totalPages} 页
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-smooth"
            >
              上一页
            </button>
            <button
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page === totalPages}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-smooth"
            >
              下一页
            </button>
          </div>
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title={editingGame ? '编辑游戏' : '创建游戏'}
        maxWidth="2xl"
        footer={
          <div className="flex gap-3">
            <button
              onClick={() => setShowEditModal(false)}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-smooth cursor-pointer"
            >
              取消
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-smooth cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? '提交中...' : editingGame ? '更新' : '创建'}
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          {/* Source Type Tabs */}
          <div className="flex gap-2 border-b border-gray-200">
            <button
              onClick={() => setFormData({ ...formData, source_type: 'url' })}
              className={`px-4 py-2 font-medium transition-smooth ${
                formData.source_type === 'url'
                  ? 'text-primary border-b-2 border-primary'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              URL 类型
            </button>
            <button
              onClick={() => setFormData({ ...formData, source_type: 'code' })}
              className={`px-4 py-2 font-medium transition-smooth ${
                formData.source_type === 'code'
                  ? 'text-primary border-b-2 border-primary'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              代码类型
            </button>
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              游戏标题 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="输入游戏标题"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">游戏描述</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="输入游戏描述"
            />
          </div>

          {/* Game URL or HTML Code */}
          {formData.source_type === 'url' ? (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                游戏 URL <span className="text-red-500">*</span>
              </label>
              <input
                type="url"
                value={formData.game_url}
                onChange={(e) => setFormData({ ...formData, game_url: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="https://example.com/game"
              />
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                HTML 代码 <span className="text-red-500">*</span>
              </label>
              <textarea
                value={formData.html_code}
                onChange={(e) => setFormData({ ...formData, html_code: e.target.value })}
                rows={8}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent font-mono text-sm"
                placeholder="<!DOCTYPE html>..."
              />
            </div>
          )}

          {/* Cover URL */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              封面图 <span className="text-red-500">*</span>
            </label>

            {/* Upload Button */}
            <div className="mb-3">
              <label className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors duration-200 cursor-pointer font-medium shadow-sm">
                <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                {uploadingCover ? '上传中...' : '上传封面图片'}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleCoverUpload}
                  disabled={uploadingCover}
                  className="hidden"
                />
              </label>
              <p className="mt-1 text-xs text-gray-500">支持 JPG、PNG、GIF 格式，最大 5MB</p>
            </div>

            {/* URL Input */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">或输入图片 URL</label>
              <input
                type="url"
                value={formData.cover_url}
                onChange={(e) => setFormData({ ...formData, cover_url: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="https://example.com/cover.jpg"
              />
            </div>

            {/* Preview */}
            {formData.cover_url && (
              <div className="mt-3">
                <p className="text-xs font-medium text-gray-600 mb-2">预览</p>
                <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
                  {imageLoadError ? (
                    <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">
                      图片加载失败
                    </div>
                  ) : (
                    <img
                      key={formData.cover_url}
                      src={formData.cover_url}
                      alt="封面预览"
                      className="w-full h-full object-cover"
                      onError={() => setImageLoadError(true)}
                    />
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              分类 <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent cursor-pointer"
            >
              <option value="mini_game">小游戏</option>
              <option value="h5_page">H5页面</option>
              <option value="interactive_card">互动卡片</option>
            </select>
          </div>

          {/* Weight */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">权重</label>
            <input
              type="number"
              value={formData.weight}
              onChange={(e) => setFormData({ ...formData, weight: parseInt(e.target.value) || 0 })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="0"
              min="0"
            />
          </div>

          {/* Show in Banner */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="show_in_banner"
              checked={formData.show_in_banner}
              onChange={(e) => setFormData({ ...formData, show_in_banner: e.target.checked })}
              className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary cursor-pointer"
            />
            <label htmlFor="show_in_banner" className="ml-2 text-sm text-gray-700 cursor-pointer">
              显示在轮播图
            </label>
          </div>
        </div>
      </Modal>
    </div>
  );
}
