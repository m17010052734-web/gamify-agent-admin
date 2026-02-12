# AI 编码约束

## 优先级：P0

本文档定义 AI 在编码过程中必须遵守的约束，防止代码屎山。

---

## 一、禁止事项（NEVER）

### 1.1 禁止创建无意义的抽象

❌ **禁止创建 Manager、Helper、Util 类**（除非确实需要）

```typescript
// ❌ 错误：过度抽象
class UserManager {
  static getUser() { ... }
  static updateUser() { ... }
}

// ✅ 正确：直接使用 service
export const userService = {
  getUser: () => { ... },
  updateUser: () => { ... }
}
```

### 1.2 禁止在错误的层写代码

❌ **禁止在组件中写业务逻辑**

```typescript
// ❌ 错误：业务逻辑在组件中
function UserList() {
  const [users, setUsers] = useState([])

  const fetchUsers = async () => {
    const response = await axios.get('/api/users')
    const filtered = response.data.filter(u => u.status === 'active')
    setUsers(filtered)
  }

  return <div>...</div>
}

// ✅ 正确：业务逻辑在 service 层
// services/userService.ts
export const userService = {
  getActiveUsers: async () => {
    const response = await userApi.getUsers()
    return response.data.filter(u => u.status === 'active')
  }
}

// UserList.tsx
function UserList() {
  const [users, setUsers] = useState([])

  useEffect(() => {
    userService.getActiveUsers().then(setUsers)
  }, [])

  return <div>...</div>
}
```

### 1.3 禁止直接操作 DOM

❌ **禁止使用 document.getElementById 等 DOM 操作**

```typescript
// ❌ 错误：直接操作 DOM
function Modal() {
  const handleOpen = () => {
    document.getElementById('modal').style.display = 'block'
  }

  return <div id="modal">...</div>
}

// ✅ 正确：使用 React 状态管理
function Modal() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className={isOpen ? 'block' : 'hidden'}>...</div>
  )
}
```

### 1.4 禁止使用缩写变量名

❌ **禁止使用缩写**（除了 i、j、k）

```typescript
// ❌ 错误：缩写变量名
const usr = getUser()
const gc = getGameCount()
const cfg = getConfig()

// ✅ 正确：完整变量名
const user = getUser()
const gameCount = getGameCount()
const config = getConfig()
```

### 1.5 禁止重复代码

❌ **禁止复制粘贴代码**

```typescript
// ❌ 错误：重复代码
function UserCard({ user }) {
  return (
    <div className="p-4 border rounded">
      <h3>{user.name}</h3>
      <p>{user.email}</p>
    </div>
  )
}

function GameCard({ game }) {
  return (
    <div className="p-4 border rounded">
      <h3>{game.title}</h3>
      <p>{game.description}</p>
    </div>
  )
}

// ✅ 正确：抽取公共组件
function Card({ title, description }) {
  return (
    <div className="p-4 border rounded">
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  )
}

function UserCard({ user }) {
  return <Card title={user.name} description={user.email} />
}

function GameCard({ game }) {
  return <Card title={game.title} description={game.description} />
}
```

---

## 二、必须事项（MUST）

### 2.1 必须使用 TypeScript 类型定义

✅ **所有组件、函数、API 都必须有完整的类型定义**

```typescript
// ✅ 正确：完整的类型定义
interface User {
  id: string
  name: string
  email: string
}

interface UserCardProps {
  user: User
  onEdit: (user: User) => void
}

function UserCard({ user, onEdit }: UserCardProps) {
  return <div onClick={() => onEdit(user)}>...</div>
}
```

### 2.2 必须处理错误

✅ **所有 API 调用都必须有错误处理**

```typescript
// ✅ 正确：完整的错误处理
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

### 2.3 必须验证用户输入

✅ **所有表单输入都必须验证**

```typescript
// ✅ 正确：输入验证
function LoginForm() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = () => {
    if (!email.includes('@')) {
      setError('请输入有效的邮箱地址')
      return
    }

    // 提交表单
  }

  return <form onSubmit={handleSubmit}>...</form>
}
```

### 2.4 必须使用统一的 API 调用方式

✅ **所有 API 调用都必须通过 services 层**

```typescript
// ✅ 正确：通过 services 层调用 API
// services/api.ts
export const userApi = {
  getUsers: () => api.get<UserListResponse>('/admin/list-users'),
  updateUser: (data) => api.post('/admin/update-user', data)
}

// UserList.tsx
function UserList() {
  const [users, setUsers] = useState([])

  useEffect(() => {
    userApi.getUsers().then(res => setUsers(res.data.items))
  }, [])

  return <div>...</div>
}
```

---

## 三、命名规范

### 3.1 组件命名

- **大驼峰**：`UserList`、`GameReviewCard`、`CreditConfigForm`
- **文件名与组件名一致**：`UserList.tsx`

### 3.2 函数命名

- **小驼峰**：`fetchUsers`、`handleSubmit`、`validateEmail`
- **动词开头**：`get`、`set`、`handle`、`validate`、`fetch`

### 3.3 变量命名

- **小驼峰**：`userId`、`gameList`、`isLoading`
- **布尔值用 is/has 开头**：`isOpen`、`hasError`、`isLoading`

### 3.4 常量命名

- **大写下划线**：`API_BASE_URL`、`MAX_PAGE_SIZE`、`DEFAULT_TIMEOUT`

### 3.5 CSS 类名

- **kebab-case**：`user-list`、`game-card`、`credit-form`

---

## 四、代码质量检查清单

在提交代码前，确认：

- [ ] 所有组件都有完整的 TypeScript 类型定义
- [ ] 所有 API 调用都有错误处理
- [ ] 所有表单输入都有验证
- [ ] 没有直接操作 DOM
- [ ] 没有在组件中写业务逻辑
- [ ] 没有使用缩写变量名
- [ ] 没有重复代码
- [ ] 遵循命名规范

---

## 五、改完代码后必须验证功能

**重要**：每次修改代码后，必须验证功能是否正常。

### 验证步骤

1. **启动开发服务器**：`npm run dev`
2. **访问相关页面**：在浏览器中打开修改的页面
3. **测试功能**：手动测试修改的功能是否正常
4. **检查控制台**：查看是否有错误或警告
5. **确认无误**：确保功能正常后才能认为任务完成

### 示例

```bash
# 1. 启动服务
npm run dev

# 2. 在浏览器中访问 http://localhost:3001

# 3. 测试修改的功能
# - 如果修改了用户列表，访问 /users 页面
# - 如果修改了登录功能，访问 /login 页面
# - 如果修改了 API 调用，检查网络请求是否正常

# 4. 检查浏览器控制台是否有错误

# 5. 确认功能正常后才能认为任务完成
```

---

## 六、相关文档

- **前端架构**：`.ai/architecture/frontend-architecture.md`
- **React 规范**：`.ai/standards/react-style.md`
- **TypeScript 规范**：`.ai/standards/typescript-style.md`
