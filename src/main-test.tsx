import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';

function TestApp() {
  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <h1>React 测试页面</h1>
      <p>如果您能看到这段文字，说明 React 正常工作。</p>
      <button onClick={() => alert('按钮点击成功！')}>
        点击测试
      </button>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <TestApp />
  </React.StrictMode>
);
