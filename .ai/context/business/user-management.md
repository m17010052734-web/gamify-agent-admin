# 用户管理模块

## 优先级：P0

本文档描述用户管理模块的功能设计和实现细节。

---

## 一、模块概述

### 1.1 功能职责

用户管理模块负责管理平台用户的基本信息、积分余额、状态管理等功能。

**核心功能**：
- 用户列表查询（分页、搜索、筛选）
- 用户积分调整
- 用户积分流水查询
- 用户状态管理（封禁/解封）

### 1.2 页面路由

- **路由路径**：`/users`
- **页面组件**：`pages/Users.tsx`

---

## 二、数据模型

### 2.1 用户数据结构

```typescript
interface User {
  id: string                    // 用户 ID
  nickname: string | null       // 用户昵称
  avatar_url: string | null     // 头像 URL
  status: 'active' | 'banned'   // 用户状态
  work_count: number            // 作品数量
  follower_count: number        // 粉丝数量
  credit_balance: number        // 积分余额
  last_login_at: string | null  // 最后登录时间
  created_at: string            // 创建时间
}
```

### 2.2 用户列表响应

```typescript
interface UserListResponse {
  items: User[]           // 用户列表
  total: number           // 总数量
  page: number            // 当前页码
  page_size: number       // 每页数量
  total_pages: number     // 总页数
}
```

### 2.3 积分流水数据结构

```typescript
interface CreditFlowItem {
  id: string                          // 流水 ID
  change_type: 'income' | 'expense'   // 变动类型
  amount: number                      // 变动金额
  balance_after: number               // 变动后余额
  source_type: string                 // 来源类型
  description: string | null          // 描述
  created_at: string                  // 创建时间
}

interface CreditFlowResponse {
  items: CreditFlowItem[]
  total: number
  page: number
  page_size: number
  total_pages: number
}
```

---

## 三、API 接口

### 3.1 获取用户列表

**接口**：`GET /admin/list-users`

**请求参数**：
```typescript
interface GetUsersParams {
  page?: number        // 页码（默认 1）
  page_size?: number   // 每页数量（默认 20）
  status?: string      // 状态筛选（active/banned）
  keyword?: string     // 搜索关键词（昵称/ID）
}
```

**响应**：`UserListResponse`

**调用方式**：
```typescript
const response = await userApi.getUsers({
  page: 1,
  page_size: 20,
  status: 'active',
  keyword: 'John'
})
```

### 3.2 调整用户积分

**接口**：`POST /admin/adjust-user-credit`

**请求参数**：
```typescript
interface AdjustCreditData {
  user_id: string   // 用户 ID
  amount: number    // 调整金额（正数为增加，负数为减少）
  reason: string    // 调整原因
}
```

**调用方式**：
```typescript
await userApi.adjustCredit({
  user_id: '123',
  amount: 100,
  reason: '活动奖励'
})
```

### 3.3 获取积分流水

**接口**：`GET /admin/get-user-credit-flow`

**请求参数**：
```typescript
interface GetCreditFlowParams {
  user_id: string      // 用户 ID
  page?: number        // 页码
  page_size?: number   // 每页数量
}
```

**响应**：`CreditFlowResponse`

**调用方式**：
```typescript
const response = await userApi.getCreditFlow({
  user_id: '123',
  page: 1,
  page_size: 20
})
```

### 3.4 更新用户状态

**接口**：`POST /admin/update-user-status`

**请求参数**：
```typescript
interface UpdateStatusData {
  user_id: string     // 用户 ID
  status: string      // 新状态（active/banned）
  reason?: string     // 操作原因
}
```

**调用方式**：
```typescript
await userApi.updateStatus({
  user_id: '123',
  status: 'banned',
  reason: '违规操作'
})
```

---

## 四、页面功能

### 4.1 用户列表

**功能**：
- 显示用户列表（表格形式）
- 分页导航
- 状态筛选（全部/活跃/封禁）
- 关键词搜索

**表格列**：
- 用户信息（头像、昵称、ID）
- 作品数量
- 粉丝数量
- 积分余额
- 状态
- 最后登录时间
- 操作按钮

### 4.2 积分调整

**功能**：
- 点击"调整积分"按钮打开模态框
- 输入调整金额（正数为增加，负数为减少）
- 输入调整原因
- 提交后刷新用户列表

**验证规则**：
- 金额不能为 0
- 原因不能为空

### 4.3 积分流水

**功能**：
- 点击"查看流水"按钮打开模态框
- 显示用户的积分流水记录
- 分页显示

**流水信息**：
- 变动类型（收入/支出）
- 变动金额
- 变动后余额
- 来源类型
- 描述
- 时间

### 4.4 状态管理

**功能**：
- 点击"封禁"按钮封禁用户
- 点击"解封"按钮解封用户
- 输入操作原因
- 提交后刷新用户列表

---

## 五、组件结构

### 5.1 主组件

```typescript
// pages/Users.tsx
function Users() {
  // 状态管理
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [keyword, setKeyword] = useState('')

  // 获取用户列表
  const fetchUsers = async () => {
    // ...
  }

  // 调整积分
  const handleAdjustCredit = async (userId: string, amount: number, reason: string) => {
    // ...
  }

  // 更新状态
  const handleUpdateStatus = async (userId: string, status: string, reason: string) => {
    // ...
  }

  return (
    <div>
      {/* 搜索和筛选 */}
      {/* 用户列表表格 */}
      {/* 分页器 */}
      {/* 模态框 */}
    </div>
  )
}
```

### 5.2 子组件

- `UserTable` - 用户列表表格
- `AdjustCreditModal` - 积分调整模态框
- `CreditFlowModal` - 积分流水模态框
- `UpdateStatusModal` - 状态管理模态框

---

## 六、状态管理

### 6.1 本地状态

使用 `useState` 管理组件内部状态：

```typescript
const [users, setUsers] = useState<User[]>([])           // 用户列表
const [loading, setLoading] = useState(false)            // 加载状态
const [error, setError] = useState<string | null>(null)  // 错误信息
const [page, setPage] = useState(1)                      // 当前页码
const [total, setTotal] = useState(0)                    // 总数量
const [statusFilter, setStatusFilter] = useState('')     // 状态筛选
const [keyword, setKeyword] = useState('')               // 搜索关键词
```

### 6.2 副作用

使用 `useEffect` 监听状态变化，自动刷新数据：

```typescript
useEffect(() => {
  fetchUsers()
}, [page, statusFilter, keyword])
```

---

## 七、错误处理

### 7.1 API 错误

```typescript
try {
  const response = await userApi.getUsers(params)
  setUsers(response.data.items)
} catch (error) {
  console.error('Failed to fetch users:', error)
  setError('获取用户列表失败，请稍后重试')
}
```

### 7.2 表单验证

```typescript
const handleAdjustCredit = async () => {
  if (amount === 0) {
    setError('金额不能为 0')
    return
  }

  if (!reason.trim()) {
    setError('请输入调整原因')
    return
  }

  // 提交
}
```

---

## 八、相关文档

- **前端架构**：`.ai/architecture/frontend-architecture.md`
- **API 集成**：`.ai/standards/api-integration.md`
- **React 规范**：`.ai/standards/react-style.md`
