import { useEffect, useState } from 'react';
import { statsApi } from '../services/api';
import type { PlatformStats } from '../types';
import {
  UsersIcon,
  PuzzlePieceIcon,
  CreditCardIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';

export default function Dashboard() {
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      const response = await statsApi.getPlatformStats();
      setStats(response.data);
    } catch (err) {
      setError('加载数据失败');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">加载中...</div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
        {error || '加载失败'}
      </div>
    );
  }

  const statCards = [
    {
      title: '总用户数',
      value: stats.total_users,
      icon: UsersIcon,
      color: 'bg-blue-500',
      subStats: [
        { label: '活跃用户', value: stats.active_users },
        { label: '封禁用户', value: stats.banned_users },
      ],
    },
    {
      title: '总游戏数',
      value: stats.total_games,
      icon: PuzzlePieceIcon,
      color: 'bg-green-500',
      subStats: [
        { label: '已发布', value: stats.published_games },
        { label: '待审核', value: stats.pending_games },
      ],
    },
    {
      title: '积分统计',
      value: stats.total_credits_issued,
      icon: CreditCardIcon,
      color: 'bg-amber-500',
      subStats: [
        { label: '已发放', value: stats.total_credits_issued },
        { label: '已消耗', value: stats.total_credits_consumed },
      ],
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-heading font-bold text-gray-900">
          数据概览
        </h1>
        <p className="mt-1 text-sm text-gray-600">
          平台核心数据统计
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {statCards.map((card) => (
          <div
            key={card.title}
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`${card.color} p-3 rounded-lg`}>
                <card.icon className="w-6 h-6 text-white" />
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">{card.title}</p>
                <p className="text-2xl font-heading font-bold text-gray-900">
                  {card.value.toLocaleString()}
                </p>
              </div>
            </div>
            <div className="space-y-2 pt-4 border-t border-gray-100">
              {card.subStats.map((subStat) => (
                <div key={subStat.label} className="flex justify-between text-sm">
                  <span className="text-gray-600">{subStat.label}</span>
                  <span className="font-medium text-gray-900">
                    {subStat.value.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-heading font-semibold text-gray-900 mb-4">
          快捷操作
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <a
            href="/users"
            className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-smooth cursor-pointer"
          >
            <UsersIcon className="w-5 h-5 text-primary mr-3" />
            <span className="text-sm font-medium text-gray-700">用户管理</span>
          </a>
          <a
            href="/games"
            className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-smooth cursor-pointer"
          >
            <ClockIcon className="w-5 h-5 text-amber-500 mr-3" />
            <span className="text-sm font-medium text-gray-700">
              待审核游戏 ({stats.pending_games})
            </span>
          </a>
          <a
            href="/credits"
            className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-smooth cursor-pointer"
          >
            <CreditCardIcon className="w-5 h-5 text-green-500 mr-3" />
            <span className="text-sm font-medium text-gray-700">积分配置</span>
          </a>
        </div>
      </div>
    </div>
  );
}
