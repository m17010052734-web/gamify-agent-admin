import { useEffect, useState } from 'react';
import { gameApi } from '../services/api';
import type { Game } from '../types';
import { CheckCircleIcon, XCircleIcon, ClockIcon } from '@heroicons/react/24/outline';

export default function Games() {
  const [games, setGames] = useState<Game[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('pending');

  // Review modal
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [reviewAction, setReviewAction] = useState<'approve' | 'reject'>('approve');
  const [reviewMessage, setReviewMessage] = useState('');

  useEffect(() => {
    loadGames();
  }, [page, status]);

  const loadGames = async () => {
    try {
      setLoading(true);
      const response = await gameApi.getReviewList({
        page,
        page_size: pageSize,
        status: status || undefined,
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
    if (!selectedGame) return;

    try {
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
    }
  };

  const openReviewModal = (game: Game, action: 'approve' | 'reject') => {
    setSelectedGame(game);
    setReviewAction(action);
    setShowReviewModal(true);
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
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex gap-4">
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent cursor-pointer"
          >
            <option value="pending">待审核</option>
            <option value="published">已通过</option>
            <option value="rejected">已拒绝</option>
          </select>
          <div className="flex-1 flex items-center justify-end text-sm text-gray-600">
            共 {total} 个游戏
          </div>
        </div>
      </div>

      {/* Games Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full text-center py-12 text-gray-500">加载中...</div>
        ) : games.length === 0 ? (
          <div className="col-span-full text-center py-12 text-gray-500">暂无数据</div>
        ) : (
          games.map((game) => (
            <div
              key={game.id}
              className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-smooth"
            >
              {/* Cover Image */}
              <div className="aspect-video bg-gray-100 relative">
                {game.cover_url ? (
                  <img
                    src={game.cover_url}
                    alt={game.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    无封面
                  </div>
                )}
                <div className="absolute top-2 right-2">
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded-full ${
                      game.status === 'pending'
                        ? 'bg-amber-100 text-amber-800'
                        : game.status === 'published'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {game.status === 'pending'
                      ? '待审核'
                      : game.status === 'published'
                      ? '已通过'
                      : '已拒绝'}
                  </span>
                </div>
              </div>

              {/* Content */}
              <div className="p-4">
                <h3 className="text-lg font-heading font-semibold text-gray-900 mb-2 line-clamp-1">
                  {game.title}
                </h3>
                <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                  {game.description || '无描述'}
                </p>

                <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                  <span>作者: {game.author_nickname}</span>
                  <span>{new Date(game.created_at).toLocaleDateString('zh-CN')}</span>
                </div>

                {/* Actions */}
                {game.status === 'pending' && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => openReviewModal(game, 'approve')}
                      className="flex-1 flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-smooth cursor-pointer"
                    >
                      <CheckCircleIcon className="w-4 h-4 mr-1" />
                      通过
                    </button>
                    <button
                      onClick={() => openReviewModal(game, 'reject')}
                      className="flex-1 flex items-center justify-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-smooth cursor-pointer"
                    >
                      <XCircleIcon className="w-4 h-4 mr-1" />
                      拒绝
                    </button>
                  </div>
                )}
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

      {/* Review Modal */}
      {showReviewModal && selectedGame && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-heading font-semibold text-gray-900">
                {reviewAction === 'approve' ? '通过审核' : '拒绝审核'}
              </h3>
              <button
                onClick={() => setShowReviewModal(false)}
                className="text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <XCircleIcon className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600 mb-2">游戏名称</p>
                <p className="font-medium text-gray-900">{selectedGame.title}</p>
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
                  className={`flex-1 px-4 py-2 text-white rounded-lg transition-smooth cursor-pointer ${
                    reviewAction === 'approve'
                      ? 'bg-green-600 hover:bg-green-700'
                      : 'bg-red-600 hover:bg-red-700'
                  }`}
                >
                  确认{reviewAction === 'approve' ? '通过' : '拒绝'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
