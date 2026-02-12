import ReactDOM from 'react-dom/client';

console.log('🚀 测试页面开始加载...');

function TestApp() {
  console.log('✅ TestApp 组件正在渲染');
  return (
    <div style={{
      padding: '40px',
      fontFamily: 'sans-serif',
      backgroundColor: '#f0f0f0',
      minHeight: '100vh'
    }}>
      <h1 style={{ color: '#1E40AF', marginBottom: '20px' }}>
        ✅ React 测试成功！
      </h1>
      <p style={{ fontSize: '18px', marginBottom: '10px' }}>
        如果您能看到这段文字，说明 React 正常工作。
      </p>
      <button
        onClick={() => alert('按钮点击成功！')}
        style={{
          padding: '10px 20px',
          fontSize: '16px',
          backgroundColor: '#1E40AF',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
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
    ReactDOM.createRoot(root).render(<TestApp />);
    console.log('✅ React 渲染完成');
  } catch (error) {
    console.error('❌ React 渲染失败:', error);
    document.body.innerHTML = `<h1 style="color: red; padding: 20px;">渲染错误：${error}</h1>`;
  }
}
