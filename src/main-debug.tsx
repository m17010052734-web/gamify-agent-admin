import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';

console.log('🚀 应用开始加载...');

// 超级简单的测试组件
function SimpleApp() {
  console.log('✅ SimpleApp 正在渲染');

  return (
    <div style={{
      padding: '40px',
      fontFamily: 'sans-serif',
      backgroundColor: '#f0f0f0',
      minHeight: '100vh'
    }}>
      <h1 style={{ color: '#1E40AF', marginBottom: '20px' }}>
        GamifyAgent Admin - 调试模式
      </h1>
      <p style={{ fontSize: '18px', marginBottom: '20px' }}>
        如果您能看到这段文字，说明 React 基础渲染正常。
      </p>
      <div style={{
        padding: '20px',
        backgroundColor: 'white',
        borderRadius: '8px',
        marginBottom: '20px'
      }}>
        <h2 style={{ marginBottom: '10px' }}>调试信息：</h2>
        <ul>
          <li>React 版本: {React.version}</li>
          <li>当前路径: {window.location.pathname}</li>
          <li>当前时间: {new Date().toLocaleString('zh-CN')}</li>
        </ul>
      </div>
      <button
        onClick={() => {
          console.log('按钮被点击');
          alert('按钮点击成功！');
        }}
        style={{
          padding: '12px 24px',
          fontSize: '16px',
          backgroundColor: '#1E40AF',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer'
        }}
      >
        点击测试
      </button>
    </div>
  );
}

const root = document.getElementById('root');
console.log('📍 Root 元素:', root);

if (!root) {
  console.error('❌ 找不到 root 元素！');
  document.body.innerHTML = '<h1 style="color: red; padding: 20px;">错误：找不到 root 元素</h1>';
} else {
  console.log('✅ 找到 root 元素，开始渲染...');
  try {
    ReactDOM.createRoot(root).render(
      <React.StrictMode>
        <SimpleApp />
      </React.StrictMode>
    );
    console.log('✅ React 渲染完成');
  } catch (error) {
    console.error('❌ React 渲染失败:', error);
    document.body.innerHTML = `<h1 style="color: red; padding: 20px;">渲染错误：${error}</h1>`;
  }
}
