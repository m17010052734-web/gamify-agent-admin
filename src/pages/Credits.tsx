import { useEffect, useState } from 'react';
import { creditApi } from '../services/api';
import type { CreditConfig } from '../types';
import { PencilIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';

export default function Credits() {
  const [configs, setConfigs] = useState<CreditConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  useEffect(() => {
    loadConfigs();
  }, []);

  const loadConfigs = async () => {
    try {
      setLoading(true);
      const response = await creditApi.getConfigs();
      setConfigs(response.data.items);
    } catch (err) {
      console.error('Failed to load configs:', err);
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (config: CreditConfig) => {
    setEditingKey(config.config_key);
    setEditValue(config.config_value.toString());
  };

  const cancelEdit = () => {
    setEditingKey(null);
    setEditValue('');
  };

  const saveEdit = async (configKey: string) => {
    const value = parseInt(editValue);
    if (isNaN(value) || value < 0) {
      alert('请输入有效的非负整数');
      return;
    }

    try {
      await creditApi.updateConfig({
        config_key: configKey,
        config_value: value,
      });
      setEditingKey(null);
      setEditValue('');
      loadConfigs();
      alert('配置更新成功');
    } catch (err) {
      console.error('Failed to update config:', err);
      alert('配置更新失败');
    }
  };

  // Group configs by category
  const costConfigs = configs.filter((c) => c.config_key.startsWith('cost_'));
  const rewardConfigs = configs.filter((c) => c.config_key.startsWith('reward_'));
  const otherConfigs = configs.filter(
    (c) => !c.config_key.startsWith('cost_') && !c.config_key.startsWith('reward_')
  );

  const renderConfigGroup = (title: string, items: CreditConfig[]) => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200 bg-gray-50">
        <h2 className="text-base sm:text-lg font-heading font-semibold text-gray-900">{title}</h2>
      </div>
      <div className="divide-y divide-gray-200">
        {items.map((config) => (
          <div key={config.config_key} className="px-4 sm:px-6 py-4 hover:bg-gray-50 transition-smooth">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-sm font-medium text-gray-900">{config.config_key}</h3>
                  <span
                    className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                      config.is_active
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {config.is_active ? '启用' : '禁用'}
                  </span>
                </div>
                <p className="mt-1 text-sm text-gray-600">{config.description}</p>
                <p className="mt-1 text-xs text-gray-400 truncate">
                  更新: {new Date(config.updated_at).toLocaleString('zh-CN')}
                </p>
              </div>

              <div className="flex items-center gap-2 sm:gap-3 sm:ml-4">
                {editingKey === config.config_key ? (
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <input
                      type="number"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      className="flex-1 sm:w-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      min="0"
                    />
                    <button
                      onClick={() => saveEdit(config.config_key)}
                      className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-smooth cursor-pointer shrink-0"
                      title="保存"
                    >
                      <CheckIcon className="w-5 h-5" />
                    </button>
                    <button
                      onClick={cancelEdit}
                      className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-smooth cursor-pointer shrink-0"
                      title="取消"
                    >
                      <XMarkIcon className="w-5 h-5" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
                    <div className="text-2xl font-heading font-bold text-gray-900">
                      {config.config_value}
                    </div>
                    <button
                      onClick={() => startEdit(config)}
                      className="p-2 text-primary hover:bg-blue-50 rounded-lg transition-smooth cursor-pointer shrink-0"
                      title="编辑"
                    >
                      <PencilIcon className="w-5 h-5" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">加载中...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-heading font-bold text-gray-900">积分配置</h1>
        <p className="mt-1 text-sm text-gray-600">管理系统积分相关配置</p>
      </div>

      {/* Cost Configs */}
      {costConfigs.length > 0 && renderConfigGroup('消费成本配置', costConfigs)}

      {/* Reward Configs */}
      {rewardConfigs.length > 0 && renderConfigGroup('奖励配置', rewardConfigs)}

      {/* Other Configs */}
      {otherConfigs.length > 0 && renderConfigGroup('其他配置', otherConfigs)}

      {/* Help Text */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4">
        <h3 className="text-sm font-medium text-blue-900 mb-2">配置说明</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• 消费成本：用户使用功能时消耗的积分数量</li>
          <li>• 奖励配置：用户完成特定操作获得的积分奖励</li>
          <li>• 配置修改后立即生效，请谨慎操作</li>
        </ul>
      </div>
    </div>
  );
}
