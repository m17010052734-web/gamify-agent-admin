# AI Session Bootstrap

## 快速启动清单（每次会话必读）

### 1. 项目基本信息
- **项目名称**：GamifyAgent Admin（后台管理系统前端）
- **核心定位**：UGC 内容互动平台的管理后台
- **技术栈**：React 18 + TypeScript + Vite + Tailwind CSS
- **架构**：单页应用（SPA）+ 组件化架构
- **路径**：`/Users/yanan/WeChatProjects/gamifyagent-admin`

### 2. 必读规范（按顺序）
1. `.ai/standards/ai-constraints.md` - **AI 编码约束（防止代码屎山）**
2. `.ai/architecture/frontend-architecture.md` - **前端架构设计（核心）**
3. `.ai/standards/react-style.md` - React 代码规范
4. `.ai/standards/typescript-style.md` - TypeScript 代码规范
5. `.ai/standards/api-integration.md` - API 集成规范

### 3. 按需加载

根据任务类型，加载相关模块文档：

| 场景 | 读取内容 |
|------|---------|
| **前端架构设计** | `.ai/architecture/frontend-architecture.md` |
| **组件开发** | `.ai/context/technical/component-patterns.md` |
| **API 集成** | `.ai/context/technical/api-integration.md` |
| **状态管理** | `.ai/context/technical/state-management.md` |
| **样式系统** | `.ai/context/technical/design-system.md` |
| **用户管理模块** | `.ai/context/business/user-management.md` |
| **游戏审核模块** | `.ai/context/business/game-review.md` |
| **积分配置模块** | `.ai/context/business/credit-config.md` |

### 4. 核心原则（时刻牢记）

**前端架构原则**：
- **组件化**：按功能模块划分组件（pages/components/layouts）
- **类型安全**：所有组件、函数、API 都有完整的 TypeScript 类型定义
- **响应式设计**：支持多种屏幕尺寸（375px, 768px, 1024px, 1440px）
- **性能优化**：懒加载、代码分割、缓存策略
- **可维护性**：清晰的目录结构、统一的命名规范

**禁止事项**（防止代码屎山）：
- ❌ 不要创建 Manager、Helper、Util 类（除非确实需要）
- ❌ 不要过度抽象（一次性代码不要抽象）
- ❌ 不要在组件中写业务逻辑（应在 services 层）
- ❌ 不要直接操作 DOM（使用 React 状态管理）
- ❌ 不要使用缩写变量名（除了 i、j、k）
- ❌ 不要重复代码（相似逻辑要复用）
- ❌ 不要在组件中直接调用 API（使用 services 层）

**命名规范**：
- 组件名：大驼峰（`UserList`、`GameReviewCard`）
- 函数名：小驼峰（`fetchUsers`、`handleSubmit`）
- 变量名：小驼峰（`userId`、`gameList`）
- 常量名：大写下划线（`API_BASE_URL`、`MAX_PAGE_SIZE`）
- 文件名：组件用大驼峰（`UserList.tsx`），其他用小驼峰（`api.ts`）
- CSS 类名：kebab-case（`user-list`、`game-card`）

**错误处理**：
- 使用统一的错误处理机制
- API 错误要有友好的用户提示
- 记录详细日志（开发环境）

### 5. 快速参考

**目录结构**：
```
src/
├── components/          # 公共组件
│   ├── Layout.tsx       # 主布局
│   └── Modal.tsx        # 模态框
├── pages/               # 页面组件
│   ├── Login.tsx        # 登录页
│   ├── Dashboard.tsx    # 仪表盘
│   ├── Users.tsx        # 用户管理
│   ├── Games.tsx        # 游戏审核
│   └── Credits.tsx      # 积分配置
├── services/            # API 服务
│   └── api.ts           # API 客户端
├── types/               # TypeScript 类型
│   └── index.ts         # 全局类型
├── utils/               # 工具函数
├── App.tsx              # 应用根组件
└── main.tsx             # 应用入口
```

**常用命令**：
```bash
# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 预览生产构建
npm run preview
```

## 检查清单

在开始编码前，确认：
- [ ] 已读 `ai-constraints.md`
- [ ] 理解前端架构原则
- [ ] 清楚组件化设计思路
- [ ] 知道 TypeScript 类型定义规范
- [ ] 理解 API 集成方式
- [ ] 了解命名规范
- [ ] 清楚错误处理方式

**关键检查**：
- [ ] 组件是否有完整的 TypeScript 类型定义？
- [ ] 业务逻辑是否在 services 层？
- [ ] API 调用是否通过统一的 api.ts？
- [ ] 是否有适当的错误处理？
- [ ] 是否遵循命名规范？
- [ ] 是否有必要的注释？
