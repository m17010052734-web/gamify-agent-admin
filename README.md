# GamifyAgent Admin Frontend

GamifyAgent 后台管理系统前端，使用 React + TypeScript + Tailwind CSS 构建。

## 技术栈

- **框架**: React 18 + TypeScript
- **构建工具**: Vite
- **样式**: Tailwind CSS
- **路由**: React Router v6
- **HTTP 客户端**: Axios
- **图标**: Heroicons
- **图表**: Recharts

## 设计系统

基于 ui-ux-pro-max 生成的专业简洁风格设计系统：

- **主色调**: 蓝色系 (#1E40AF, #3B82F6)
- **强调色**: 琥珀色 (#F59E0B)
- **字体**: Fira Code (标题) + Fira Sans (正文)
- **风格**: 数据密集型仪表盘，专业简洁

## 功能模块

### 1. 登录页面 (`/login`)
- 管理员邮箱密码登录
- JWT Token 认证
- 演示账号：admin@gamifyagent.com / admin123

### 2. 仪表盘 (`/`)
- 平台数据概览
- 用户统计（总数、活跃、封禁）
- 游戏统计（总数、已发布、待审核）
- 积分统计（已发放、已消耗）
- 快捷操作入口

### 3. 用户管理 (`/users`)
- 用户列表（分页、搜索、筛选）
- 调整用户积分
- 查看积分流水
- 更新用户状态（封禁/解封）

### 4. 游戏审核 (`/games`)
- 待审核游戏列表
- 游戏详情展示
- 审核操作（通过/拒绝）
- 审核备注

### 5. 积分配置 (`/credits`)
- 消费成本配置
- 奖励配置
- 在线编辑配置值

## 快速开始

### 安装依赖

```bash
cd admin-frontend
npm install
```

### 开发模式

```bash
npm run dev
```

访问 http://localhost:3001

### 生产构建

```bash
npm run build
```

构建产物在 `dist/` 目录。

### 预览生产构建

```bash
npm run preview
```

## 项目结构

```
admin-frontend/
├── src/
│   ├── components/          # 公共组件
│   │   └── Layout.tsx       # 主布局（侧边栏 + 导航）
│   ├── pages/               # 页面组件
│   │   ├── Login.tsx        # 登录页
│   │   ├── Dashboard.tsx    # 仪表盘
│   │   ├── Users.tsx        # 用户管理
│   │   ├── Games.tsx        # 游戏审核
│   │   └── Credits.tsx      # 积分配置
│   ├── services/            # API 服务
│   │   └── api.ts           # API 客户端和接口
│   ├── types/               # TypeScript 类型定义
│   │   └── index.ts         # 全局类型
│   ├── utils/               # 工具函数
│   ├── App.tsx              # 应用根组件
│   ├── main.tsx             # 应用入口
│   └── index.css            # 全局样式
├── index.html               # HTML 模板
├── package.json             # 项目配置
├── vite.config.ts           # Vite 配置
├── tailwind.config.js       # Tailwind 配置
└── tsconfig.json            # TypeScript 配置
```

## API 配置

开发环境下，Vite 会自动代理 `/api` 请求到后端服务器（默认 `http://localhost:8000`）。

修改代理配置：编辑 `vite.config.ts` 中的 `server.proxy` 配置。

## 认证流程

1. 用户在登录页输入邮箱和密码
2. 前端调用后端登录接口（TODO: 需要实现）
3. 后端返回 JWT Token
4. 前端将 Token 存储在 localStorage
5. 后续请求自动在 Header 中携带 Token
6. Token 过期或无效时自动跳转到登录页

## 环境变量

创建 `.env.local` 文件配置环境变量：

```env
VITE_API_BASE_URL=http://localhost:8000
```

## 浏览器支持

- Chrome (最新版)
- Firefox (最新版)
- Safari (最新版)
- Edge (最新版)

## 开发规范

### 代码风格
- 使用 TypeScript 严格模式
- 遵循 React Hooks 最佳实践
- 使用函数式组件
- Props 使用 TypeScript 接口定义

### 样式规范
- 使用 Tailwind CSS 工具类
- 遵循设计系统的颜色和字体规范
- 响应式设计（支持 375px, 768px, 1024px, 1440px）
- 所有可点击元素添加 `cursor-pointer`
- 过渡动画使用 `transition-smooth` (200ms)

### 无障碍性
- 所有表单输入有对应的 label
- 图片有 alt 文本
- 按钮有明确的文本或 aria-label
- 键盘导航支持
- 颜色对比度符合 WCAG AA 标准

## 待办事项

- [ ] 实现真实的登录 API 调用
- [ ] 添加 Token 刷新机制
- [ ] 添加错误边界组件
- [ ] 添加加载状态骨架屏
- [ ] 添加数据可视化图表
- [ ] 添加导出功能
- [ ] 添加批量操作
- [ ] 添加操作日志查看
- [ ] 添加单元测试
- [ ] 添加 E2E 测试

## License

MIT
