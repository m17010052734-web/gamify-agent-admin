# 状态管理

## 优先级：P0

本文档描述前端项目的状态管理策略和最佳实践。

---

## 一、状态分类

### 1.1 本地状态（Local State）

**定义**：组件内部的状态，不需要跨组件共享。

**使用场景**：
- 表单输入值
- UI 状态（展开/收起、显示/隐藏）
- 临时数据

**实现方式**：使用 `useState`

**示例**：
```typescript
function UserForm() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  return (
    <form>
      <input value={name} onChange={e => setName(e.target.value)} />
      <input value={email} onChange={e => setEmail(e.target.value)} />
      <button disabled={isSubmitting}>提交</button>
    </form>
  )
}
```

### 1.2 服务器状态（Server State）

**定义**：从服务器获取的数据。

**使用场景**：
- API 响应数据
- 用户列表、游戏列表等

**实现方式**：使用 `useState` + `useEffect`

**示例**：
```typescript
function UserList() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true)
        const response = await userApi.getUsers()
        setUsers(response.data.items)
      } catch (err) {
        setError('获取用户列表失败')
      } finally {
        setLoading(false)
      }
    }

    fetchUsers()
  }, [])

  return <div>...</div>
}
```

### 1.3 全局状态（Global State）

**定义**：需要跨组件共享的状态。

**使用场景**：
- 用户认证信息
- 主题设置
- 语言设置

**实现方式**：使用 Context API

**示例**：
```typescript
// contexts/AuthContext.tsx
interface AuthContextType {
  user: User | null
  login: (email: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)

  const login = async (email: string, password: string) => {
    const response = await authApi.login({ email, password })
    setUser(response.data.user)
    localStorage.setItem('admin_token', response.data.token)
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('admin_token')
  }

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
```

---

## 二、状态管理策略

### 2.1 状态提升（Lifting State Up）

**定义**：将状态提升到最近的公共父组件。

**使用场景**：
- 多个子组件需要共享状态
- 子组件需要修改父组件的状态

**示例**：
```typescript
// 父组件
function UserManagement() {
  const [selectedUser, setSelectedUser] = useState<User | null>(null)

  return (
    <div>
      <UserList onSelectUser={setSelectedUser} />
      <UserDetail user={selectedUser} />
    </div>
  )
}

// 子组件 1
function UserList({ onSelectUser }: { onSelectUser: (user: User) => void }) {
  return (
    <div>
      {users.map(user => (
        <div key={user.id} onClick={() => onSelectUser(user)}>
          {user.name}
        </div>
      ))}
    </div>
  )
}

// 子组件 2
function UserDetail({ user }: { user: User | null }) {
  if (!user) return <div>请选择用户</div>
  return <div>{user.name}</div>
}
```

### 2.2 状态下钻（Props Drilling）

**问题**：状态需要通过多层组件传递。

**解决方案**：使用 Context API 避免 Props Drilling。

**示例**：
```typescript
// ❌ 错误：Props Drilling
function App() {
  const [user, setUser] = useState<User | null>(null)
  return <Layout user={user} />
}

function Layout({ user }: { user: User | null }) {
  return <Sidebar user={user} />
}

function Sidebar({ user }: { user: User | null }) {
  return <UserAvatar user={user} />
}

// ✅ 正确：使用 Context
function App() {
  return (
    <AuthProvider>
      <Layout />
    </AuthProvider>
  )
}

function Layout() {
  return <Sidebar />
}

function Sidebar() {
  return <UserAvatar />
}

function UserAvatar() {
  const { user } = useAuth()
  return <img src={user?.avatar_url} />
}
```

---

## 三、Context API 使用规范

### 3.1 创建 Context

```typescript
// contexts/ThemeContext.tsx
interface ThemeContextType {
  theme: 'light' | 'dark'
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextType | null>(null)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<'light' | 'dark'>('light')

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light')
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider')
  }
  return context
}
```

### 3.2 使用 Context

```typescript
// 在根组件中提供 Context
function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <Routes>...</Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  )
}

// 在子组件中使用 Context
function Header() {
  const { theme, toggleTheme } = useTheme()
  const { user } = useAuth()

  return (
    <header className={theme === 'dark' ? 'bg-gray-900' : 'bg-white'}>
      <button onClick={toggleTheme}>切换主题</button>
      <div>{user?.name}</div>
    </header>
  )
}
```

---

## 四、状态持久化

### 4.1 localStorage

**使用场景**：
- 用户认证 Token
- 用户偏好设置
- 表单草稿

**示例**：
```typescript
function useLocalStorage<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(() => {
    const stored = localStorage.getItem(key)
    return stored ? JSON.parse(stored) : initialValue
  })

  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(value))
  }, [key, value])

  return [value, setValue] as const
}

// 使用
function App() {
  const [theme, setTheme] = useLocalStorage<'light' | 'dark'>('theme', 'light')

  return <div className={theme}>...</div>
}
```

---

## 五、相关文档

- **React 规范**：`.ai/standards/react-style.md`
- **前端架构**：`.ai/architecture/frontend-architecture.md`
- **组件模式**：`.ai/context/technical/component-patterns.md`
