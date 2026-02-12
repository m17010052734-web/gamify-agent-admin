import { useState } from 'react';
import { LockClosedIcon } from '@heroicons/react/24/solid';
import { authApi } from '../services/api';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await authApi.login({ email, password });

      // 保存 Token（响应拦截器已经处理了 response.data.data -> response.data）
      localStorage.setItem('admin_token', response.data.token);
      if (response.data.refresh_token) {
        localStorage.setItem('refresh_token', response.data.refresh_token);
      }

      // 强制刷新页面以确保认证状态更新
      window.location.href = '/';
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.response?.data?.detail || '登录失败，请重试';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-heading font-bold text-primary">
            GamifyAgent Admin
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            管理后台登录
          </p>
        </div>

        {/* Login Form */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                邮箱地址
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-smooth"
                placeholder="admin@gamifyagent.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                密码
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-smooth"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center px-4 py-3 bg-primary text-white font-medium rounded-lg hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 transition-smooth cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <LockClosedIcon className="w-5 h-5 mr-2" />
              {loading ? '登录中...' : '登录'}
            </button>
          </form>

          {/* Demo Credentials */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-xs text-gray-600 font-medium mb-2">演示账号：</p>
            <p className="text-xs text-gray-500">邮箱：admin@gamifyagent.com</p>
            <p className="text-xs text-gray-500">密码：admin123</p>
          </div>
        </div>
      </div>
    </div>
  );
}
