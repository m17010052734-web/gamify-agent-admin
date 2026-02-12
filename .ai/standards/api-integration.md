# API 集成规范

## 优先级：P0

本文档定义前端与后端 API 集成的规范。

---

## 一、API 客户端配置

### 1.1 基础配置

使用 Axios 作为 HTTP 客户端，统一配置在 `services/api.ts`。

```typescript
// services/api.ts
import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8088',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,  // 30 秒超时
})
```

### 1.2 请求拦截器

自动添加认证 Token。

```typescript
// Request interceptor - 自动添加 Token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('admin_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})
```

### 1.3 响应拦截器

统一处理错误。

```typescript
// Response interceptor - 统一错误处理
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // 401 未授权 - 跳转登录页
    if (error.response?.status === 401) {
      localStorage.removeItem('admin_token')
      window.location.href = '/login'
    }

    // 其他错误 - 抛出异常
    return Promise.reject(error)
  }
)
```

---

## 二、API 调用规范

### 2.1 API 分组

按业务模块分组 API 调用。

```typescript
// services/api.ts

// 用户管理 API
export const userApi = {
  getUsers: (params: GetUsersParams) =>
    api.get<UserListResponse>('/admin/list-users', { params }),

  adjustCredit: (data: AdjustCreditData) =>
    api.post('/admin/adjust-user-credit', data),

  getCreditFlow: (params: GetCreditFlowParams) =>
    api.get<CreditFlowResponse>('/admin/get-user-credit-flow', { params }),

  updateStatus: (data: UpdateStatusData) =>
    api.post('/admin/update-user-status', data),
}

// 游戏审核 API
export const gameApi = {
  getReviewList: (params: GetReviewListParams) =>
    api.get<GameReviewListResponse>('/admin/list-review-games', { params }),

  reviewGame: (data: ReviewGameData) =>
    api.post('/admin/review-game', data),
}

// 积分配置 API
export const creditApi = {
  getConfigs: () =>
    api.get<CreditConfigListResponse>('/admin/list-credit-configs'),

  updateConfig: (data: UpdateConfigData) =>
    api.put('/admin/update-credit-config', data),

  batchUpdateConfigs: (data: BatchUpdateConfigsData) =>
    api.put('/admin/batch-update-credit-configs', data),
}

// 统计数据 API
export const statsApi = {
  getPlatformStats: () =>
    api.get<PlatformStats>('/admin/get-platform-stats'),
}

// 认证 API
export const authApi = {
  login: (data: LoginData) =>
    api.post('/admin/auth/login', data),

  logout: () =>
    api.post('/admin/auth/logout'),

  refresh: (data: RefreshData) =>
    api.post('/admin/auth/refresh', data),
}
```

### 2.2 类型定义

所有 API 的请求参数和响应数据都必须有完整的类型定义。

```typescript
// types/index.ts

// 请求参数类型
interface GetUsersParams {
  page?: number
  page_size?: number
  status?: string
  keyword?: string
}

interface AdjustCreditData {
  user_id: string
  amount: number
  reason: string
}

// 响应数据类型
interface UserListResponse {
  items: User[]
  total: number
  page: number
  page_size: number
  total_pages: number
}

interface User {
  id: string
  nickname: string | null
  avatar_url: string | null
  status: 'active' | 'banned'
  work_count: number
  follower_count: number
  credit_balance: number
  last_login_at: string | null
  created_at: string
}
```

---

## 三、在组件中使用 API

### 3.1 基本用法

在组件中通过 services 层调用 API。

```typescript
// pages/Users.tsx
import { userApi } from '../services/api'

function UserList() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await userApi.getUsers({ page: 1, page_size: 20 })
      setUsers(response.data.items)
    } catch (err) {
      setError('获取用户列表失败')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div>加载中...</div>
  if (error) return <div>错误：{error}</div>

  return (
    <div>
      {users.map(user => (
        <UserCard key={user.id} user={user} />
      ))}
    </div>
  )
}
```

### 3.2 使用自定义 Hook

将 API 调用逻辑抽取为自定义 Hook。

```typescript
// hooks/useUsers.ts
function useUsers(page: number, pageSize: number) {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true)
        setError(null)
        const response = await userApi.getUsers({ page, page_size: pageSize })
        setUsers(response.data.items)
      } catch (err) {
        setError('获取用户列表失败')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchUsers()
  }, [page, pageSize])

  return { users, loading, error }
}

// 在组件中使用
function UserList() {
  const { users, loading, error } = useUsers(1, 20)

  if (loading) return <div>加载中...</div>
  if (error) return <div>错误：{error}</div>

  return (
    <div>
      {users.map(user => (
        <UserCard key={user.id} user={user} />
      ))}
    </div>
  )
}
```

---

## 四、错误处理

### 4.1 统一错误处理

在响应拦截器中统一处理常见错误。

```typescript
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // 401 未授权
    if (error.response?.status === 401) {
      localStorage.removeItem('admin_token')
      window.location.href = '/login'
      return Promise.reject(new Error('未授权，请重新登录'))
    }

    // 403 禁止访问
    if (error.response?.status === 403) {
      return Promise.reject(new Error('没有权限访问'))
    }

    // 404 未找到
    if (error.response?.status === 404) {
      return Promise.reject(new Error('请求的资源不存在'))
    }

    // 500 服务器错误
    if (error.response?.status === 500) {
      return Promise.reject(new Error('服务器错误，请稍后重试'))
    }

    // 网络错误
    if (!error.response) {
      return Promise.reject(new Error('网络错误，请检查网络连接'))
    }

    // 其他错误
    return Promise.reject(error)
  }
)
```

### 4.2 组件级错误处理

在组件中捕获并显示错误。

```typescript
function UserList() {
  const [error, setError] = useState<string | null>(null)

  const fetchUsers = async () => {
    try {
      const response = await userApi.getUsers()
      setUsers(response.data.items)
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError('未知错误')
      }
    }
  }

  if (error) {
    return (
      <div className="text-red-600">
        错误：{error}
      </div>
    )
  }

  return <div>...</div>
}
```

---

## 五、加载状态

### 5.1 显示加载状态

在 API 调用期间显示加载状态。

```typescript
function UserList() {
  const [loading, setLoading] = useState(false)

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const response = await userApi.getUsers()
      setUsers(response.data.items)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return <div>...</div>
}
```

---

## 六、分页处理

### 6.1 分页参数

使用统一的分页参数。

```typescript
interface PaginationParams {
  page: number        // 页码（从 1 开始）
  page_size: number   // 每页数量
}

interface PaginationResponse<T> {
  items: T[]          // 数据列表
  total: number       // 总数量
  page: number        // 当前页码
  page_size: number   // 每页数量
  total_pages: number // 总页数
}
```

### 6.2 分页组件

```typescript
function UserList() {
  const [page, setPage] = useState(1)
  const [pageSize] = useState(20)
  const { users, loading, error, total, totalPages } = useUsers(page, pageSize)

  const handlePageChange = (newPage: number) => {
    setPage(newPage)
  }

  return (
    <div>
      {/* 用户列表 */}
      <div>
        {users.map(user => (
          <UserCard key={user.id} user={user} />
        ))}
      </div>

      {/* 分页器 */}
      <div className="flex items-center justify-between mt-4">
        <div>共 {total} 条记录</div>
        <div className="flex gap-2">
          <button
            onClick={() => handlePageChange(page - 1)}
            disabled={page === 1}
          >
            上一页
          </button>
          <span>第 {page} / {totalPages} 页</span>
          <button
            onClick={() => handlePageChange(page + 1)}
            disabled={page === totalPages}
          >
            下一页
          </button>
        </div>
      </div>
    </div>
  )
}
```

---

## 七、环境变量

### 7.1 配置环境变量

在 `.env` 文件中配置 API 地址。

```bash
# .env
VITE_API_BASE_URL=http://localhost:8088
```

### 7.2 使用环境变量

在代码中使用环境变量。

```typescript
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8088',
})
```

---

## 八、相关文档

- **AI 约束**：`.ai/standards/ai-constraints.md`
- **前端架构**：`.ai/architecture/frontend-architecture.md`
- **TypeScript 规范**：`.ai/standards/typescript-style.md`
