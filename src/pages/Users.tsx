import { useEffect, useState } from 'react';
import { userApi } from '../services/api';
import type { User, CreditFlowItem } from '../types';
import {
  MagnifyingGlassIcon,
  PlusIcon,
  MinusIcon,
  CreditCardIcon,
  ArrowPathIcon,
  UserIcon,
  ShieldCheckIcon,
  ShieldExclamationIcon,
} from '@heroicons/react/24/outline';
import Modal from '../components/Modal';
import ConfirmModal from '../components/ConfirmModal';
import { useToast } from '../contexts/ToastContext';

export default function Users() {
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [loading, setLoading] = useState(true);
  const [keyword, setKeyword] = useState('');
  const [status, setStatus] = useState<string>('');
  const [userType, setUserType] = useState<string>('');

  // Modal states
  const [showCreditModal, setShowCreditModal] = useState(false);
  const [showFlowModal, setShowFlowModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [creditAmount, setCreditAmount] = useState('');
  const [creditReason, setCreditReason] = useState('');
  const [creditFlow, setCreditFlow] = useState<CreditFlowItem[]>([]);
  const [pendingStatusChange, setPendingStatusChange] = useState<{ user: User; newStatus: string } | null>(null);

  // Loading states
  const [adjustingCredit, setAdjustingCredit] = useState(false);
  const [loadingFlow, setLoadingFlow] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);

  const toast = useToast();

  useEffect(() => {
    loadUsers();
  }, [page, status, userType]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await userApi.getUsers({
        page,
        page_size: pageSize,
        status: status || undefined,
        keyword: keyword || undefined,
        user_type: userType || undefined,
      });
      setUsers(response.data.items);
      setTotal(response.data.total);
    } catch (err) {
      console.error('Failed to load users:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setPage(1);
    loadUsers();
  };

  const handleAdjustCredit = async () => {
    if (!selectedUser || !creditAmount || !creditReason || adjustingCredit) return;

    try {
      setAdjustingCredit(true);
      await userApi.adjustCredit({
        user_id: selectedUser.id,
        amount: parseInt(creditAmount),
        reason: creditReason,
      });
      setShowCreditModal(false);
      setCreditAmount('');
      setCreditReason('');
      loadUsers();
      toast.success('积分调整成功');
    } catch (err) {
      console.error('Failed to adjust credit:', err);
      toast.error('积分调整失败');
    } finally {
      setAdjustingCredit(false);
    }
  };

  const handleViewCreditFlow = async (user: User) => {
    if (loadingFlow) return;

    setSelectedUser(user);
    try {
      setLoadingFlow(true);
      const response = await userApi.getCreditFlow({ user_id: user.id });
      setCreditFlow(response.data.items);
      setShowFlowModal(true);
    } catch (err) {
      console.error('Failed to load credit flow:', err);
      toast.error('加载积分流水失败');
    } finally {
      setLoadingFlow(false);
    }
  };

  const handleUpdateStatus = async (user: User, newStatus: string) => {
    if (updatingStatus === user.id) return;

    setPendingStatusChange({ user, newStatus });
    setShowConfirmModal(true);
  };

  const confirmUpdateStatus = async () => {
    if (!pendingStatusChange) return;

    const { user, newStatus } = pendingStatusChange;

    try {
      setUpdatingStatus(user.id);
      await userApi.updateStatus({
        user_id: user.id,
        status: newStatus,
        reason: `管理员操作：${newStatus === 'banned' ? '封禁' : '解封'}用户`,
      });
      loadUsers();
      toast.success('状态更新成功');
      setShowConfirmModal(false);
      setPendingStatusChange(null);
    } catch (err) {
      console.error('Failed to update status:', err);
      toast.error('状态更新失败');
    } finally {
      setUpdatingStatus(null);
    }
  };

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-heading font-bold text-gray-900">用户管理</h1>
        <p className="mt-1 text-sm text-gray-600">管理平台用户和积分</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 sm:p-4">
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="搜索用户昵称或邮箱..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm sm:text-base"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={userType}
              onChange={(e) => setUserType(e.target.value)}
              className="flex-1 sm:flex-none px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent cursor-pointer text-sm"
            >
              <option value="">全部类型</option>
              <option value="user">普通用户</option>
              <option value="admin">管理员</option>
            </select>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="flex-1 sm:flex-none px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent cursor-pointer text-sm"
            >
              <option value="">全部状态</option>
              <option value="active">活跃</option>
              <option value="banned">封禁</option>
            </select>
            <button
              onClick={handleSearch}
              className="flex items-center px-4 sm:px-6 py-2 bg-primary text-white rounded-lg hover:bg-blue-800 transition-smooth cursor-pointer"
            >
              <MagnifyingGlassIcon className="w-5 h-5 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">搜索</span>
            </button>
          </div>
        </div>
      </div>

      {/* Users Table - Desktop */}
      <div className="hidden md:block bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-[900px] w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[180px]">
                  用户
                </th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[160px]">
                  邮箱
                </th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[80px]">
                  类型
                </th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[70px]">
                  状态
                </th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[70px]">
                  作品
                </th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[70px]">
                  粉丝
                </th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[80px]">
                  积分
                </th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[100px]">
                  注册时间
                </th>
                <th className="px-3 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-[140px]">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={9} className="px-3 sm:px-6 py-8 text-center text-gray-500">
                    加载中...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-3 sm:px-6 py-8 text-center text-gray-500">
                    暂无数据
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50 transition-smooth">
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-medium text-sm sm:text-base shrink-0">
                          {user.nickname?.[0] || '?'}
                        </div>
                        <div className="ml-2 sm:ml-4 min-w-0">
                          <div className="text-sm font-medium text-gray-900 truncate max-w-[100px]">
                            {user.nickname || '未设置昵称'}
                          </div>
                          <div className="text-xs sm:text-sm text-gray-500">{user.id.slice(0, 6)}...</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                      <div className="text-xs sm:text-sm text-gray-900 truncate max-w-[140px]">
                        {user.email || '-'}
                      </div>
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-0.5 sm:py-1 text-xs font-medium rounded-full ${
                          user.user_type === 'admin'
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {user.user_type === 'admin' ? '管理' : '用户'}
                      </span>
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-0.5 sm:py-1 text-xs font-medium rounded-full ${
                          user.status === 'active'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {user.status === 'active' ? '活跃' : '封禁'}
                      </span>
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900">
                      {user.work_count}
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900">
                      {user.follower_count}
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm font-medium text-gray-900">
                      {user.credit_balance}
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500">
                      {new Date(user.created_at).toLocaleDateString('zh-CN', {
                        month: '2-digit',
                        day: '2-digit'
                      })}
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-right text-xs sm:text-sm font-medium">
                      <div className="flex flex-col sm:flex-row gap-1 sm:gap-2 sm:justify-end">
                        <button
                          onClick={() => {
                            setSelectedUser(user);
                            setShowCreditModal(true);
                          }}
                          disabled={adjustingCredit}
                          className="text-primary hover:text-blue-800 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {adjustingCredit ? '处理中...' : '调分'}
                        </button>
                        <button
                          onClick={() => handleViewCreditFlow(user)}
                          disabled={loadingFlow}
                          className="text-secondary hover:text-blue-600 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {loadingFlow ? '加载中...' : '流水'}
                        </button>
                        <button
                          onClick={() =>
                            handleUpdateStatus(user, user.status === 'active' ? 'banned' : 'active')
                          }
                          disabled={updatingStatus === user.id}
                          className={`${
                            user.status === 'active'
                              ? 'text-red-600 hover:text-red-800'
                              : 'text-green-600 hover:text-green-800'
                          } cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                          {updatingStatus === user.id ? '处理中...' : user.status === 'active' ? '封禁' : '解封'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-4 sm:px-6 py-4 border-t border-gray-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="text-sm text-gray-700 text-center sm:text-left">
              共 {total} 条记录，第 {page} / {totalPages} 页
            </div>
            <div className="flex gap-2 justify-center">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="flex-1 sm:flex-none px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-smooth"
              >
                上一页
              </button>
              <button
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
                className="flex-1 sm:flex-none px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-smooth"
              >
                下一页
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Users Cards - Mobile */}
      <div className="md:hidden space-y-4 px-4">
        {loading ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
            <div className="flex flex-col items-center justify-center space-y-4">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
              <p className="text-gray-500">加载中...</p>
            </div>
          </div>
        ) : users.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
            <div className="text-center">
              <div className="mx-auto h-12 w-12 text-gray-400 mb-4">
                <UserIcon className="w-full h-full" />
              </div>
              <h3 className="text-base font-medium text-gray-900 mb-1">暂无用户</h3>
              <p className="text-sm text-gray-500">当前筛选条件下没有找到用户</p>
            </div>
          </div>
        ) : (
          users.map((user) => (
            <div
              key={user.id}
              className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
            >
              {/* Header */}
              <div className="p-4 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-blue-500 flex items-center justify-center text-white font-bold text-lg shrink-0">
                      {user.nickname?.[0] || '?'}
                    </div>
                    <div className="min-w-0">
                      <div className="font-semibold text-gray-900 truncate">
                        {user.nickname || '未设置昵称'}
                      </div>
                      <div className="text-xs text-gray-500 font-mono">{user.id.slice(0, 8)}...</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${
                        user.user_type === 'admin'
                          ? 'bg-purple-100 text-purple-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {user.user_type === 'admin' ? '管理' : '用户'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Info */}
              <div className="px-4 py-3 border-b border-gray-100">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <span className="text-gray-400">📧</span>
                  <span className="truncate">{user.email || '-'}</span>
                </div>
              </div>

              {/* Stats */}
              <div className="px-4 py-3 border-b border-gray-100">
                <div className="flex items-center justify-between text-sm">
                  <div className="text-center">
                    <div className="font-semibold text-gray-900">{user.work_count}</div>
                    <div className="text-xs text-gray-500">作品</div>
                  </div>
                  <div className="text-center">
                    <div className="font-semibold text-gray-900">{user.follower_count}</div>
                    <div className="text-xs text-gray-500">粉丝</div>
                  </div>
                  <div className="text-center">
                    <div className="font-semibold text-purple-600">{user.credit_balance}</div>
                    <div className="text-xs text-gray-500">积分</div>
                  </div>
                  <div className="text-center">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${
                        user.status === 'active'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {user.status === 'active' ? '活跃' : '封禁'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="p-3 bg-gray-50">
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setSelectedUser(user);
                      setShowCreditModal(true);
                    }}
                    disabled={adjustingCredit}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg hover:from-purple-600 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer font-medium text-sm shadow-sm"
                  >
                    <CreditCardIcon className="w-4 h-4" />
                    调分
                  </button>
                  <button
                    onClick={() => handleViewCreditFlow(user)}
                    disabled={loadingFlow}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer font-medium text-sm"
                  >
                    <ArrowPathIcon className="w-4 h-4" />
                    流水
                  </button>
                  <button
                    onClick={() =>
                      handleUpdateStatus(user, user.status === 'active' ? 'banned' : 'active')
                    }
                    disabled={updatingStatus === user.id}
                    className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer font-medium text-sm ${
                      user.status === 'active'
                        ? 'bg-white border border-gray-300 text-red-600 hover:bg-red-50'
                        : 'bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700'
                    }`}
                  >
                    {user.status === 'active' ? (
                      <>
                        <ShieldExclamationIcon className="w-4 h-4" />
                        封禁
                      </>
                    ) : (
                      <>
                        <ShieldCheckIcon className="w-4 h-4" />
                        解封
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))
        )}

        {/* Mobile Pagination */}
        {totalPages > 1 && (
          <div className="flex gap-2 justify-center pt-2">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="flex-1 max-w-[120px] px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-smooth text-sm"
            >
              上一页
            </button>
            <span className="flex items-center px-3 text-sm text-gray-600">
              {page}/{totalPages}
            </span>
            <button
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page === totalPages}
              className="flex-1 max-w-[120px] px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-smooth text-sm"
            >
              下一页
            </button>
          </div>
        )}
      </div>

      {/* Credit Adjustment Modal */}
      <Modal
        isOpen={showCreditModal && !!selectedUser}
        onClose={() => setShowCreditModal(false)}
        title={`调整积分 - ${selectedUser?.nickname || ''}`}
        maxWidth="md"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              当前余额
            </label>
            <div className="text-2xl font-heading font-bold text-gray-900">
              {selectedUser?.credit_balance}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              调整金额（正数增加，负数减少）
            </label>
            <input
              type="number"
              value={creditAmount}
              onChange={(e) => setCreditAmount(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="输入调整金额"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              调整原因
            </label>
            <textarea
              value={creditReason}
              onChange={(e) => setCreditReason(e.target.value)}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="输入调整原因"
            />
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowCreditModal(false)}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-smooth cursor-pointer"
            >
              取消
            </button>
            <button
              onClick={handleAdjustCredit}
              disabled={!creditAmount || !creditReason || adjustingCredit}
              className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-smooth"
            >
              {adjustingCredit ? '处理中...' : '确认调整'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Credit Flow Modal */}
      <Modal
        isOpen={showFlowModal && !!selectedUser}
        onClose={() => setShowFlowModal(false)}
        title={`积分流水 - ${selectedUser?.nickname || ''}`}
        maxWidth="2xl"
        maxHeight="max-h-[80vh]"
      >
        <div className="space-y-3">
          {creditFlow.length === 0 ? (
            <div className="text-center text-gray-500 py-8">暂无流水记录</div>
          ) : (
            creditFlow.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      item.change_type === 'income'
                        ? 'bg-green-100 text-green-600'
                        : 'bg-red-100 text-red-600'
                    }`}
                  >
                    {item.change_type === 'income' ? (
                      <PlusIcon className="w-5 h-5" />
                    ) : (
                      <MinusIcon className="w-5 h-5" />
                    )}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {item.source_type}
                    </div>
                    <div className="text-xs text-gray-500">
                      {item.description || '无描述'}
                    </div>
                    <div className="text-xs text-gray-400">
                      {new Date(item.created_at).toLocaleString('zh-CN')}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div
                    className={`text-lg font-heading font-bold ${
                      item.change_type === 'income' ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    {item.change_type === 'income' ? '+' : '-'}
                    {item.amount}
                  </div>
                  <div className="text-xs text-gray-500">余额: {item.balance_after}</div>
                </div>
              </div>
            ))
          )}
        </div>
      </Modal>

      {/* Confirm Status Change Modal */}
      <ConfirmModal
        isOpen={showConfirmModal}
        onClose={() => {
          setShowConfirmModal(false);
          setPendingStatusChange(null);
        }}
        onConfirm={confirmUpdateStatus}
        title={pendingStatusChange?.newStatus === 'banned' ? '确认封禁用户' : '确认解封用户'}
        message={
          <div>
            <p className="mb-2">
              确定要{pendingStatusChange?.newStatus === 'banned' ? '封禁' : '解封'}用户{' '}
              <span className="font-semibold">{pendingStatusChange?.user.nickname || '未设置昵称'}</span> 吗？
            </p>
            {pendingStatusChange?.newStatus === 'banned' && (
              <p className="text-sm text-gray-500">
                封禁后，该用户将无法登录和使用平台功能。
              </p>
            )}
          </div>
        }
        confirmText={pendingStatusChange?.newStatus === 'banned' ? '确认封禁' : '确认解封'}
        type={pendingStatusChange?.newStatus === 'banned' ? 'danger' : 'info'}
        loading={updatingStatus !== null}
      />
    </div>
  );
}
