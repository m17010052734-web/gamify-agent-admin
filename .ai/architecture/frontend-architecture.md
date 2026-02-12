# 前端架构设计

## 优先级：P0

本文档定义 GamifyAgent Admin 前端项目的整体架构设计。

---

## 一、技术栈

### 1.1 核心技术

| 技术 | 版本 | 说明 |
|------|------|------|
| **React** | 18.2.0 | UI 框架 |
| **TypeScript** | 5.3.3 | 类型系统 |
| **Vite** | 5.0.11 | 构建工具 |
| **Tailwind CSS** | 3.4.1 | 样式框架 |
| **React Router** | 6.21.3 | 路由管理 |
| **Axios** | 1.6.5 | HTTP 客户端 |

### 1.2 设计系统

- **主色调**：蓝色系 (#1E40AF, #3B82F6)
- **强调色**：琥珀色 (#F59E0B)
- **字体**：Fira Code (标题) + Fira Sans (正文)
- **风格**：数据密集型仪表盘，专业简洁

---

## 二、架构设计

### 2.1 分层架构

```
┌─────────────────────────────────────────┐
│         Presentation Layer              │
│    (pages/ + components/)               │
│  - 页面组件（路由级别）                  │
│  - UI 组件（可复用）                     │
└─────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│         Service Layer                   │
│         (services/)                     │
│  - API 调用封装                          │
│  - 业务逻辑处理                          │
└─────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│         Infrastructure Layer            │
│         (utils/ + types/)               │
│  - 工具函数                              │
│  - 类型定义                              │
│  - 常量配置                              │
└─────────────────────────────────────────┘
```

### 2.2 目录结构

```
src/
├── components/          # 公共组件
│   ├── Layout.tsx       # 主布局（侧边栏 + 导航）
│   └── Modal.tsx        # 模态框
│
├── pages/               # 页面组件（路由级别）
│   ├── Login.tsx        # 登录页
│   ├── Dashboard.tsx    # 仪表盘
│   ├── Users.tsx        # 用户管理
│   ├── Games.tsx        # 游戏审核
│   └── Credits.tsx      # 积分配置
│
├── services/            # API 服务层
│   └── api.ts           # API 客户端和接口
│
├── types/               # TypeScript 类型定义
│   └── index.ts         # 全局类型
│
├── utils/               # 工具函数
│
├── App.tsx              # 应用根组件
├── main.tsx             # 应用入口
└── index.css            # 全局样式
```

---

## 三、核心模块

### 3.1 认证模块

**职责**：用户登录、Token 管理、权限验证

**实现**：
- 登录页面：`pages/Login.tsx`
- Token 存储：`localStorage.getItem('admin_token')`
- 路由守卫：`ProtectedRoute` 组件

**流程**：
```
用户输入邮箱密码 → 调用登录 API → 获取 Token → 存储到 localStorage
                                              ↓
                                    后续请求自动携带 Token
                                              ↓
                                    Token 过期 → 跳转登录页
```

### 3.2 用户管理模块

**职责**：用户列表、积分调整、状态管理

**页面**：`pages/Users.tsx`

**API**：
- `userApi.getUsers()` - 获取用户列表
- `userApi.adjustCredit()` - 调整用户积分
- `userApi.getCreditFlow()` - 获取积分流水
- `userApi.updateStatus()` - 更新用户状态

### 3.3 游戏审核模块

**职责**：游戏列表、审核操作

**页面**：`pages/Games.tsx`

**API**：
- `gameApi.getReviewList()` - 获取待审核游戏列表
- `gameApi.reviewGame()` - 审核游戏（通过/拒绝）

### 3.4 积分配置模块

**职责**：积分配置管理

**页面**：`pages/Credits.tsx`

**API**：
- `creditApi.getConfigs()` - 获取积分配置列表
- `creditApi.updateConfig()` - 更新单个配置
- `creditApi.batchUpdateConfigs()` - 批量更新配置

### 3.5 仪表盘模块

**职责**：平台数据概览

**页面**：`pages/Dashboard.tsx`

**API**：
- `statsApi.getPlatformStats()` - 获取平台统计数据

---

## 四、API 集成

### 4.1 API 客户端配置

```typescript
// services/api.ts
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8088',
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor - 自动添加 Token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('admin_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Response interceptor - 统一错误处理
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('admin_token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)
```

### 4.2 API 调用规范

**所有 API 调用都必须通过 services 层**：

```typescript
// ✅ 正确：通过 services 层
export const userApi = {
  getUsers: (params) => api.get<UserListResponse>('/admin/list-users', { params }),
  adjustCredit: (data) => api.post('/admin/adjust-user-credit', data),
}

// 在组件中使用
function UserList() {
  const [users, setUsers] = useState([])

  useEffect(() => {
    userApi.getUsers({ page: 1, page_size: 20 })
      .then(res => setUsers(res.data.items))
      .catch(err => console.error(err))
  }, [])
}
```

---

## 五、状态管理

### 5.1 本地状态

使用 React Hooks 管理组件内部状态：

```typescript
function UserList() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // ...
}
```

### 5.2 全局状态

当前项目规模较小，暂不引入全局状态管理库（Redux/Zustand）。

如果需要跨组件共享状态，使用 Context API：

```typescript
// contexts/AuthContext.tsx
const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState<User | null>(null)

  return (
    <AuthContext.Provider value={{ user, setUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
```

---

## 六、路由设计

### 6.1 路由配置

```typescript
// App.tsx
<Routes>
  <Route path="/login" element={<Login />} />
  <Route
    path="/"
    element={
      <ProtectedRoute>
        <Layout />
      </ProtectedRoute>
    }
  >
    <Route index element={<Dashboard />} />
    <Route path="users" element={<Users />} />
    <Route path="games" element={<Games />} />
    <Route path="credits" element={<Credits />} />
  </Route>
</Routes>
```

### 6.2 路由守卫

```typescript
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = !!localStorage.getItem('admin_token')

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}
```

---

## 七、性能优化

### 7.1 代码分割

使用 React.lazy 和 Suspense 实现路由级别的代码分割：

```typescript
const Dashboard = lazy(() => import('./pages/Dashboard'))
const Users = lazy(() => import('./pages/Users'))

<Suspense fallback={<Loading />}>
  <Routes>
    <Route path="/" element={<Dashboard />} />
    <Route path="/users" element={<Users />} />
  </Routes>
</Suspense>
```

### 7.2 缓存策略

- API 响应缓存（使用 React Query 或 SWR）
- 静态资源缓存（Vite 自动处理）

### 7.3 懒加载

- 图片懒加载
- 组件懒加载
- 路由懒加载

---

## 八、错误处理

### 8.1 API 错误处理

```typescript
async function fetchUsers() {
  try {
    const response = await userApi.getUsers()
    return response.data
  } catch (error) {
    console.error('Failed to fetch users:', error)
    throw new Error('获取用户列表失败，请稍后重试')
  }
}
```

### 8.2 组件错误边界

```typescript
class ErrorBoundary extends React.Component {
  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return <div>Something went wrong.</div>
    }

    return this.props.children
  }
}
```

---

## 九、相关文档

- **AI 约束**：`.ai/standards/ai-constraints.md`
- **React 规范**：`.ai/standards/react-style.md`
- **TypeScript 规范**：`.ai/standards/typescript-style.md`
- **API 集成**：`.ai/standards/api-integration.md`
