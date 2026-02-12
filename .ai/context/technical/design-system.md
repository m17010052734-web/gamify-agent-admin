# 设计系统

## 优先级：P0

本文档描述 GamifyAgent Admin 的设计系统规范。

---

## 一、设计理念

### 1.1 核心原则

- **专业简洁**：数据密集型仪表盘风格
- **一致性**：统一的颜色、字体、间距
- **可访问性**：符合 WCAG AA 标准
- **响应式**：支持多种屏幕尺寸

### 1.2 设计风格

基于 ui-ux-pro-max 生成的专业简洁风格设计系统。

---

## 二、颜色系统

### 2.1 主色调

```css
/* 蓝色系 */
--primary-900: #1E40AF;  /* 深蓝 */
--primary-600: #3B82F6;  /* 主蓝 */
--primary-400: #60A5FA;  /* 浅蓝 */
--primary-200: #BFDBFE;  /* 极浅蓝 */
```

### 2.2 强调色

```css
/* 琥珀色 */
--accent-600: #F59E0B;   /* 主琥珀 */
--accent-400: #FBBF24;   /* 浅琥珀 */
```

### 2.3 中性色

```css
/* 灰色系 */
--gray-900: #111827;     /* 深灰 */
--gray-700: #374151;     /* 中灰 */
--gray-500: #6B7280;     /* 浅灰 */
--gray-300: #D1D5DB;     /* 极浅灰 */
--gray-100: #F3F4F6;     /* 背景灰 */
```

### 2.4 语义色

```css
/* 成功 */
--success-600: #10B981;  /* 绿色 */

/* 警告 */
--warning-600: #F59E0B;  /* 琥珀色 */

/* 错误 */
--error-600: #EF4444;    /* 红色 */

/* 信息 */
--info-600: #3B82F6;     /* 蓝色 */
```

---

## 三、字体系统

### 3.1 字体家族

```css
/* 标题字体 */
--font-heading: 'Fira Code', monospace;

/* 正文字体 */
--font-body: 'Fira Sans', sans-serif;
```

### 3.2 字体大小

```css
--text-xs: 0.75rem;    /* 12px */
--text-sm: 0.875rem;   /* 14px */
--text-base: 1rem;     /* 16px */
--text-lg: 1.125rem;   /* 18px */
--text-xl: 1.25rem;    /* 20px */
--text-2xl: 1.5rem;    /* 24px */
--text-3xl: 1.875rem;  /* 30px */
--text-4xl: 2.25rem;   /* 36px */
```

### 3.3 字体粗细

```css
--font-normal: 400;
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;
```

---

## 四、间距系统

### 4.1 间距单位

```css
--spacing-1: 0.25rem;  /* 4px */
--spacing-2: 0.5rem;   /* 8px */
--spacing-3: 0.75rem;  /* 12px */
--spacing-4: 1rem;     /* 16px */
--spacing-5: 1.25rem;  /* 20px */
--spacing-6: 1.5rem;   /* 24px */
--spacing-8: 2rem;     /* 32px */
--spacing-10: 2.5rem;  /* 40px */
--spacing-12: 3rem;    /* 48px */
```

---

## 五、组件样式

### 5.1 按钮

```typescript
// 主按钮
<button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
  主按钮
</button>

// 次按钮
<button className="px-4 py-2 bg-gray-200 text-gray-900 rounded hover:bg-gray-300">
  次按钮
</button>

// 危险按钮
<button className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700">
  危险按钮
</button>
```

### 5.2 输入框

```typescript
<input
  type="text"
  className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-600"
  placeholder="请输入..."
/>
```

### 5.3 卡片

```typescript
<div className="bg-white rounded-lg shadow p-6">
  <h3 className="text-xl font-semibold mb-4">卡片标题</h3>
  <p className="text-gray-600">卡片内容</p>
</div>
```

### 5.4 表格

```typescript
<table className="w-full">
  <thead className="bg-gray-100">
    <tr>
      <th className="px-4 py-2 text-left">列 1</th>
      <th className="px-4 py-2 text-left">列 2</th>
    </tr>
  </thead>
  <tbody>
    <tr className="border-b hover:bg-gray-50">
      <td className="px-4 py-2">数据 1</td>
      <td className="px-4 py-2">数据 2</td>
    </tr>
  </tbody>
</table>
```

---

## 六、响应式设计

### 6.1 断点

```css
/* 移动端 */
@media (min-width: 375px) { ... }

/* 平板 */
@media (min-width: 768px) { ... }

/* 桌面 */
@media (min-width: 1024px) { ... }

/* 大屏 */
@media (min-width: 1440px) { ... }
```

### 6.2 响应式布局

```typescript
// 移动端：单列
// 平板：双列
// 桌面：三列
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  <div>卡片 1</div>
  <div>卡片 2</div>
  <div>卡片 3</div>
</div>
```

---

## 七、动画和过渡

### 7.1 过渡时间

```css
--transition-fast: 150ms;
--transition-base: 200ms;
--transition-slow: 300ms;
```

### 7.2 常用过渡

```typescript
// 按钮悬停
<button className="transition-colors duration-200 hover:bg-blue-700">
  按钮
</button>

// 模态框淡入
<div className="transition-opacity duration-300 opacity-0 data-[open]:opacity-100">
  模态框
</div>
```

---

## 八、无障碍性

### 8.1 颜色对比度

- 所有文本与背景的对比度符合 WCAG AA 标准（至少 4.5:1）
- 大文本（18px 以上）对比度至少 3:1

### 8.2 键盘导航

- 所有可交互元素支持键盘导航
- 使用 Tab 键切换焦点
- 使用 Enter/Space 键激活

### 8.3 屏幕阅读器

- 所有图片有 alt 文本
- 所有表单输入有对应的 label
- 按钮有明确的文本或 aria-label

---

## 九、相关文档

- **前端架构**：`.ai/architecture/frontend-architecture.md`
- **React 规范**：`.ai/standards/react-style.md`
- **组件模式**：`.ai/context/technical/component-patterns.md`
