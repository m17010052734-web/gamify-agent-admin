import { useEffect, useState } from 'react';
import { gameApi } from '../services/api';
import type { Game, GameDetail } from '../types';
import { CheckCircleIcon, XCircleIcon, EyeIcon } from '@heroicons/react/24/outline';
import Modal from '../components/Modal';

export default function Games() {
  const [games, setGames] = useState<Game[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(24);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');

  // Review modal
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [reviewAction, setReviewAction] = useState<'approve' | 'reject'>('approve');
  const [reviewMessage, setReviewMessage] = useState('');

  // Detail modal
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [gameDetail, setGameDetail] = useState<GameDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Loading state
  const [reviewing, setReviewing] = useState(false);

  useEffect(() => {
    loadGames();
  }, [page, status]);

  const loadGames = async () => {
    try {
      setLoading(true);
      const response = await gameApi.getReviewList({
        page,
        page_size: pageSize,
        status: status,
      });
      setGames(response.data.items);
      setTotal(response.data.total);
    } catch (err) {
      console.error('Failed to load games:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async () => {
    if (!selectedGame || reviewing) return;

    try {
      setReviewing(true);
      await gameApi.reviewGame({
        game_id: selectedGame.id,
        action: reviewAction,
        message: reviewMessage || undefined,
      });
      setShowReviewModal(false);
      setReviewMessage('');
      loadGames();
      alert(`游戏${reviewAction === 'approve' ? '通过' : '拒绝'}审核成功`);
    } catch (err) {
      console.error('Failed to review game:', err);
      alert('审核失败');
    } finally {
      setReviewing(false);
    }
  };

  const openReviewModal = (game: Game, action: 'approve' | 'reject') => {
    setSelectedGame(game);
    setReviewAction(action);
    setShowReviewModal(true);
  };

  const openDetailModal = async (game: Game) => {
    setShowDetailModal(true);
    setLoadingDetail(true);
    try {
      const response = await gameApi.getGameDetail(game.id);
      setGameDetail(response.data);
    } catch (err) {
      console.error('Failed to load game detail:', err);
      alert('加载游戏详情失败');
      setShowDetailModal(false);
    } finally {
      setLoadingDetail(false);
    }
  };

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold text-gray-900">游戏审核</h1>
          <p className="mt-1 text-sm text-gray-600">审核用户提交的游戏内容</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-gray-700">状态筛选</label>
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent cursor-pointer transition-colors duration-200 hover:border-gray-400"
            >
              <option value="">全部状态</option>
              <option value="pending">待审核</option>
              <option value="shared">已共享</option>
              <option value="rejected">已拒绝</option>
              <option value="private">私有</option>
            </select>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-gray-600">共</span>
            <span className="font-semibold text-gray-900">{total}</span>
            <span className="text-gray-600">个游戏</span>
          </div>
        </div>
      </div>

      {/* Games Grid */}
      {loading ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12">
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            <p className="text-gray-500">加载中...</p>
          </div>
        </div>
      ) : games.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12">
          <div className="text-center">
            <div className="mx-auto h-12 w-12 text-gray-400 mb-4">
              <svg className="w-full h-full" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-1">暂无游戏</h3>
            <p className="text-sm text-gray-500">当前筛选条件下没有找到游戏</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {games.map((game) => (
            <div
              key={game.id}
              className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg hover:border-gray-300 transition-all duration-200 cursor-pointer group"
            >
              {/* Cover Image */}
              <div className="aspect-video bg-gradient-to-br from-gray-100 to-gray-200 relative overflow-hidden">
                {game.cover_url ? (
                  <img
                    src={game.cover_url}
                    alt={game.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                    <svg className="w-16 h-16 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className="text-sm">无封面</span>
                  </div>
                )}
                {/* Status Badge */}
                <div className="absolute top-3 right-3">
                  <span
                    className={`inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full shadow-sm backdrop-blur-sm ${
                      game.status === 'pending'
                        ? 'bg-amber-500/90 text-white'
                        : game.status === 'shared'
                        ? 'bg-green-500/90 text-white'
                        : game.status === 'rejected'
                        ? 'bg-red-500/90 text-white'
                        : game.status === 'private'
                        ? 'bg-gray-500/90 text-white'
                        : game.status === 'archived'
                        ? 'bg-blue-500/90 text-white'
                        : 'bg-gray-500/90 text-white'
                    }`}
                  >
                    {game.status === 'pending'
                      ? '⏳ 待审核'
                      : game.status === 'shared'
                      ? '✓ 已共享'
                      : game.status === 'rejected'
                      ? '✗ 已拒绝'
                      : game.status === 'private'
                      ? '🔒 私有'
                      : game.status === 'archived'
                      ? '📦 已归档'
                      : game.status}
                  </span>
                </div>
              </div>

              {/* Content */}
              <div className="p-5">
                <h3 className="text-lg font-heading font-semibold text-gray-900 mb-2 line-clamp-1 group-hover:text-primary transition-colors">
                  {game.title}
                </h3>
                <p className="text-sm text-gray-600 mb-4 line-clamp-2 min-h-[2.5rem]">
                  {game.description || '暂无描述'}
                </p>

                {/* Meta Info */}
                <div className="flex items-center justify-between text-xs text-gray-500 mb-4 pb-4 border-b border-gray-100">
                  <div className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <span className="font-medium">{game.author_nickname}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span>{new Date(game.created_at).toLocaleDateString('zh-CN')}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="space-y-2">
                  <button
                    onClick={() => openDetailModal(game)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-colors duration-200 cursor-pointer font-medium"
                  >
                    <EyeIcon className="w-4 h-4" />
                    查看详情
                  </button>
                  {game.status === 'pending' && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => openReviewModal(game, 'approve')}
                        disabled={reviewing}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-sm"
                      >
                        <CheckCircleIcon className="w-4 h-4" />
                        通过
                      </button>
                      <button
                        onClick={() => openReviewModal(game, 'reject')}
                        disabled={reviewing}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-sm"
                      >
                        <XCircleIcon className="w-4 h-4" />
                        拒绝
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

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

      {/* Review Modal */}
      <Modal
        isOpen={showReviewModal && !!selectedGame}
        onClose={() => setShowReviewModal(false)}
        title={reviewAction === 'approve' ? '通过审核' : '拒绝审核'}
        maxWidth="md"
      >
        <div className="space-y-4">
          <div>
            <p className="text-sm text-gray-600 mb-2">游戏名称</p>
            <p className="font-medium text-gray-900">{selectedGame?.title}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              审核备注（可选）
            </label>
            <textarea
              value={reviewMessage}
              onChange={(e) => setReviewMessage(e.target.value)}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder={
                reviewAction === 'approve'
                  ? '输入通过原因（可选）'
                  : '输入拒绝原因（建议填写）'
              }
            />
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setShowReviewModal(false)}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-smooth cursor-pointer"
            >
              取消
            </button>
            <button
              onClick={handleReview}
              disabled={reviewing}
              className={`flex-1 px-4 py-2 text-white rounded-lg transition-smooth cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                reviewAction === 'approve'
                  ? 'bg-green-600 hover:bg-green-700'
                  : 'bg-red-600 hover:bg-red-700'
              }`}
            >
              {reviewing ? '处理中...' : `确认${reviewAction === 'approve' ? '通过' : '拒绝'}`}
            </button>
          </div>
        </div>
      </Modal>

      {/* Detail Modal */}
      <Modal
        isOpen={showDetailModal}
        onClose={() => {
          setShowDetailModal(false);
          setGameDetail(null);
        }}
        title="游戏详情"
        maxWidth="2xl"
      >
        {loadingDetail ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
            <p className="text-gray-500">加载中...</p>
          </div>
        ) : gameDetail ? (
          <div className="space-y-6">
            {/* Cover Image */}
            {gameDetail.cover_url && (
              <div className="aspect-video bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg overflow-hidden">
                <img
                  src={gameDetail.cover_url}
                  alt={gameDetail.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            {/* Basic Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-1">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">游戏名称</p>
                <p className="text-base font-semibold text-gray-900">{gameDetail.title}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">作者</p>
                <p className="text-base font-semibold text-gray-900">{gameDetail.author_nickname}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">项目类型</p>
                <p className="text-base text-gray-900">
                  {gameDetail.project_type === 'mini_game'
                    ? '🎮 小游戏'
                    : gameDetail.project_type === 'h5_page'
                    ? '📱 H5页面'
                    : '🎴 互动卡片'}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">生成模式</p>
                <p className="text-base text-gray-900">
                  {gameDetail.generation_mode === 'fast' ? '⚡ 快速模式' : '💎 质量模式'}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">技术栈</p>
                <p className="text-base text-gray-900">
                  {gameDetail.tech_stack === 'html_canvas'
                    ? 'HTML Canvas'
                    : gameDetail.tech_stack === 'html_css'
                    ? 'HTML CSS'
                    : 'HTML Tailwind'}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">产物类型</p>
                <p className="text-base text-gray-900">
                  {gameDetail.artifact_type === 'html_single' ? '📄 单文件' : '📁 多文件'}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">版本数量</p>
                <p className="text-base text-gray-900">{gameDetail.version_count} 个版本</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">状态</p>
                <span
                  className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${
                    gameDetail.status === 'pending'
                      ? 'bg-amber-100 text-amber-800'
                      : gameDetail.status === 'shared'
                      ? 'bg-green-100 text-green-800'
                      : gameDetail.status === 'rejected'
                      ? 'bg-red-100 text-red-800'
                      : gameDetail.status === 'private'
                      ? 'bg-gray-100 text-gray-800'
                      : gameDetail.status === 'archived'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {gameDetail.status === 'pending'
                    ? '⏳ 待审核'
                    : gameDetail.status === 'shared'
                    ? '✓ 已共享'
                    : gameDetail.status === 'rejected'
                    ? '✗ 已拒绝'
                    : gameDetail.status === 'private'
                    ? '🔒 私有'
                    : gameDetail.status === 'archived'
                    ? '📦 已归档'
                    : gameDetail.status}
                </span>
              </div>
            </div>

            {/* Description */}
            {gameDetail.description && (
              <div className="pt-4 border-t border-gray-200">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">游戏描述</p>
                <p className="text-gray-900 whitespace-pre-wrap leading-relaxed">{gameDetail.description}</p>
              </div>
            )}

            {/* Timestamps */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-gray-200">
              <div className="space-y-1">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">创建时间</p>
                <p className="text-sm text-gray-900">
                  {new Date(gameDetail.created_at).toLocaleString('zh-CN', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">更新时间</p>
                <p className="text-sm text-gray-900">
                  {new Date(gameDetail.updated_at).toLocaleString('zh-CN', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="mx-auto h-12 w-12 text-red-400 mb-4">
              <svg className="w-full h-full" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-gray-500">加载失败，请重试</p>
          </div>
        )}
      </Modal>
    </div>
  );
}
