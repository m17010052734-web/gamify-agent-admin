# 组件模式

## 优先级：P0

本文档描述前端项目中常用的组件设计模式和最佳实践。

---

## 一、组件分类

### 1.1 页面组件（Pages）

**定义**：路由级别的组件，对应一个完整的页面。

**特点**：
- 位于 `pages/` 目录
- 与路由一一对应
- 负责数据获取和状态管理
- 组合多个子组件

**示例**：
```typescript
// pages/Users.tsx
function Users() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchUsers()
  }, [])

  return (
    <div>
      <UserFilters />
      <UserTable users={users} loading={loading} />
      <Pagination />
    </div>
  )
}
```

### 1.2 布局组件（Layouts）

**定义**：提供页面结构和导航的组件。

**特点**：
- 位于 `components/` 目录
- 包含侧边栏、导航栏、页脚等
- 使用 React Router 的 Outlet

**示例**：
```typescript
// components/Layout.tsx
function Layout() {
  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-1">
        <Header />
        <main className="p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
```

### 1.3 UI 组件（Components）

**定义**：可复用的 UI 组件。

**特点**：
- 位于 `components/` 目录
- 无状态或只有 UI 状态
- 通过 Props 接收数据
- 高度可复用

**示例**：
```typescript
// components/Button.tsx
interface ButtonProps {
  text: string
  onClick: () => void
  variant?: 'primary' | 'secondary'
  disabled?: boolean
}

function Button({ text, onClick, variant = 'primary', disabled = false }: ButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`px-4 py-2 rounded ${variant === 'primary' ? 'bg-blue-600' : 'bg-gray-600'}`}
    >
      {text}
    </button>
  )
}
```

---

## 二、组件设计模式

### 2.1 容器组件 vs 展示组件

**容器组件**（Smart Components）：
- 负责数据获取和状态管理
- 包含业务逻辑
- 调用 API

**展示组件**（Dumb Components）：
- 只负责 UI 展示
- 通过 Props 接收数据
- 无状态或只有 UI 状态

**示例**：
```typescript
// 容器组件
function UserListContainer() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    userApi.getUsers().then(res => setUsers(res.data.items))
  }, [])

  return <UserList users={users} loading={loading} />
}

// 展示组件
interface UserListProps {
  users: User[]
  loading: boolean
}

function UserList({ users, loading }: UserListProps) {
  if (loading) return <div>加载中...</div>

  return (
    <div>
      {users.map(user => (
        <UserCard key={user.id} user={user} />
      ))}
    </div>
  )
}
```

### 2.2 复合组件模式

**定义**：将多个相关组件组合在一起，提供更灵活的 API。

**示例**：
```typescript
// Modal 复合组件
function Modal({ children, isOpen, onClose }: ModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50">
      <div className="bg-white rounded p-6">
        {children}
      </div>
    </div>
  )
}

Modal.Header = function ModalHeader({ children }: { children: React.ReactNode }) {
  return <div className="text-xl font-bold mb-4">{children}</div>
}

Modal.Body = function ModalBody({ children }: { children: React.ReactNode }) {
  return <div className="mb-4">{children}</div>
}

Modal.Footer = function ModalFooter({ children }: { children: React.ReactNode }) {
  return <div className="flex justify-end gap-2">{children}</div>
}

// 使用
<Modal isOpen={isOpen} onClose={handleClose}>
  <Modal.Header>标题</Modal.Header>
  <Modal.Body>内容</Modal.Body>
  <Modal.Footer>
    <Button text="取消" onClick={handleClose} />
    <Button text="确定" onClick={handleSubmit} />
  </Modal.Footer>
</Modal>
```

### 2.3 Render Props 模式

**定义**：通过函数 Props 传递渲染逻辑。

**示例**：
```typescript
interface DataFetcherProps<T> {
  url: string
  render: (data: T, loading: boolean, error: string | null) => React.ReactNode
}

function DataFetcher<T>({ url, render }: DataFetcherProps<T>) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    fetch(url)
      .then(res => res.json())
      .then(setData)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [url])

  return <>{render(data, loading, error)}</>
}

// 使用
<DataFetcher
  url="/api/users"
  render={(data, loading, error) => {
    if (loading) return <div>加载中...</div>
    if (error) return <div>错误：{error}</div>
    return <UserList users={data} />
  }}
/>
```

---

## 三、自定义 Hooks

### 3.1 数据获取 Hook

```typescript
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
      } finally {
        setLoading(false)
      }
    }

    fetchUsers()
  }, [page, pageSize])

  return { users, loading, error }
}
```

### 3.2 表单处理 Hook

```typescript
function useForm<T>(initialValues: T) {
  const [values, setValues] = useState<T>(initialValues)
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({})

  const handleChange = (name: keyof T, value: any) => {
    setValues(prev => ({ ...prev, [name]: value }))
    setErrors(prev => ({ ...prev, [name]: undefined }))
  }

  const validate = (rules: Partial<Record<keyof T, (value: any) => string | undefined>>) => {
    const newErrors: Partial<Record<keyof T, string>> = {}
    let isValid = true

    Object.keys(rules).forEach(key => {
      const error = rules[key as keyof T]?.(values[key as keyof T])
      if (error) {
        newErrors[key as keyof T] = error
        isValid = false
      }
    })

    setErrors(newErrors)
    return isValid
  }

  return { values, errors, handleChange, validate }
}
```

### 3.3 模态框 Hook

```typescript
function useModal() {
  const [isOpen, setIsOpen] = useState(false)

  const open = () => setIsOpen(true)
  const close = () => setIsOpen(false)
  const toggle = () => setIsOpen(prev => !prev)

  return { isOpen, open, close, toggle }
}
```

---

## 四、相关文档

- **React 规范**：`.ai/standards/react-style.md`
- **TypeScript 规范**：`.ai/standards/typescript-style.md`
- **前端架构**：`.ai/architecture/frontend-architecture.md`
