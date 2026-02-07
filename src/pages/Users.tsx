import { useEffect, useState } from 'react';
import { userApi } from '../services/api';
import type { User, CreditFlowItem } from '../types';
import {
  MagnifyingGlassIcon,
  PlusIcon,
  MinusIcon,
  BanknotesIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

export default function Users() {
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [loading, setLoading] = useState(true);
  const [keyword, setKeyword] = useState('');
  const [status, setStatus] = useState<string>('');

  // Modal states
  const [showCreditModal, setShowCreditModal] = useState(false);
  const [showFlowModal, setShowFlowModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [creditAmount, setCreditAmount] = useState('');
  const [creditReason, setCreditReason] = useState('');
  const [creditFlow, setCreditFlow] = useState<CreditFlowItem[]>([]);

  useEffect(() => {
    loadUsers();
  }, [page, status]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await userApi.getUsers({
        page,
        page_size: pageSize,
        status: status || undefined,
        keyword: keyword || undefined,
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
    if (!selectedUser || !creditAmount || !creditReason) return;

    try {
      await userApi.adjustCredit({
        user_id: selectedUser.id,
        amount: parseInt(creditAmount),
        reason: creditReason,
      });
      setShowCreditModal(false);
      setCreditAmount('');
      setCreditReason('');
      loadUsers();
      alert('积分调整成功');
    } catch (err) {
      console.error('Failed to adjust credit:', err);
      alert('积分调整失败');
    }
  };

  const handleViewCreditFlow = async (user: User) => {
    setSelectedUser(user);
    try {
      const response = await userApi.getCreditFlow({ user_id: user.id });
      setCreditFlow(response.data.items);
      setShowFlowModal(true);
    } catch (err) {
      console.error('Failed to load credit flow:', err);
      alert('加载积分流水失败');
    }
  };

  const handleUpdateStatus = async (user: User, newStatus: string) => {
    if (!confirm(`确定要${newStatus === 'banned' ? '封禁' : '解封'}该用户吗？`)) return;

    try {
      await userApi.updateStatus({
        user_id: user.id,
        status: newStatus,
        reason: `管理员操作：${newStatus === 'banned' ? '封禁' : '解封'}用户`,
      });
      loadUsers();
      alert('状态更新成功');
    } catch (err) {
      console.error('Failed to update status:', err);
      alert('状态更新失败');
    }
  };

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold text-gray-900">用户管理</h1>
          <p className="mt-1 text-sm text-gray-600">管理平台用户和积分</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="搜索用户昵称..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent cursor-pointer"
          >
            <option value="">全部状态</option>
            <option value="active">活跃</option>
            <option value="banned">封禁</option>
          </select>
          <button
            onClick={handleSearch}
            className="flex items-center px-6 py-2 bg-primary text-white rounded-lg hover:bg-blue-800 transition-smooth cursor-pointer"
          >
            <MagnifyingGlassIcon className="w-5 h-5 mr-2" />
            搜索
          </button>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  用户
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  状态
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  作品数
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  粉丝数
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  积分余额
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  注册时间
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                    加载中...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                    暂无数据
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50 transition-smooth">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-medium">
                          {user.nickname?.[0] || '?'}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {user.nickname || '未设置昵称'}
                          </div>
                          <div className="text-sm text-gray-500">{user.id.slice(0, 8)}...</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${
                          user.status === 'active'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {user.status === 'active' ? '活跃' : '封禁'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {user.work_count}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {user.follower_count}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {user.credit_balance}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(user.created_at).toLocaleDateString('zh-CN')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                      <button
                        onClick={() => {
                          setSelectedUser(user);
                          setShowCreditModal(true);
                        }}
                        className="text-primary hover:text-blue-800 cursor-pointer"
                      >
                        调整积分
                      </button>
                      <button
                        onClick={() => handleViewCreditFlow(user)}
                        className="text-secondary hover:text-blue-600 cursor-pointer"
                      >
                        积分流水
                      </button>
                      <button
                        onClick={() =>
                          handleUpdateStatus(user, user.status === 'active' ? 'banned' : 'active')
                        }
                        className={`${
                          user.status === 'active'
                            ? 'text-red-600 hover:text-red-800'
                            : 'text-green-600 hover:text-green-800'
                        } cursor-pointer`}
                      >
                        {user.status === 'active' ? '封禁' : '解封'}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-700">
              共 {total} 条记录，第 {page} / {totalPages} 页
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
      </div>

      {/* Credit Adjustment Modal */}
      {showCreditModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-heading font-semibold text-gray-900">
                调整积分 - {selectedUser.nickname}
              </h3>
              <button
                onClick={() => setShowCreditModal(false)}
                className="text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  当前余额
                </label>
                <div className="text-2xl font-heading font-bold text-gray-900">
                  {selectedUser.credit_balance}
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
                  disabled={!creditAmount || !creditReason}
                  className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-smooth"
                >
                  确认调整
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Credit Flow Modal */}
      {showFlowModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-heading font-semibold text-gray-900">
                积分流水 - {selectedUser.nickname}
              </h3>
              <button
                onClick={() => setShowFlowModal(false)}
                className="text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>
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
          </div>
        </div>
      )}
    </div>
  );
}
