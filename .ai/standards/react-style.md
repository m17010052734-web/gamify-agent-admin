# React 代码规范

## 优先级：P0

本文档定义 React 组件开发的代码规范。

---

## 一、组件设计原则

### 1.1 函数式组件

**所有组件都使用函数式组件**，不使用类组件。

```typescript
// ✅ 正确：函数式组件
function UserCard({ user }: UserCardProps) {
  return <div>{user.name}</div>
}

// ❌ 错误：类组件
class UserCard extends React.Component {
  render() {
    return <div>{this.props.user.name}</div>
  }
}
```

### 1.2 组件职责单一

每个组件只负责一个功能，保持组件简洁。

```typescript
// ✅ 正确：职责单一
function UserAvatar({ url }: { url: string }) {
  return <img src={url} alt="avatar" />
}

function UserName({ name }: { name: string }) {
  return <h3>{name}</h3>
}

function UserCard({ user }: { user: User }) {
  return (
    <div>
      <UserAvatar url={user.avatar_url} />
      <UserName name={user.name} />
    </div>
  )
}

// ❌ 错误：职责过多
function UserCard({ user }: { user: User }) {
  return (
    <div>
      <img src={user.avatar_url} alt="avatar" />
      <h3>{user.name}</h3>
      <p>{user.email}</p>
      <button onClick={handleEdit}>编辑</button>
      <button onClick={handleDelete}>删除</button>
      {/* 太多功能混在一起 */}
    </div>
  )
}
```

---

## 二、Props 设计

### 2.1 Props 类型定义

**所有 Props 都必须有完整的 TypeScript 类型定义**。

```typescript
// ✅ 正确：完整的类型定义
interface UserCardProps {
  user: User
  onEdit: (user: User) => void
  onDelete: (userId: string) => void
}

function UserCard({ user, onEdit, onDelete }: UserCardProps) {
  return <div>...</div>
}

// ❌ 错误：没有类型定义
function UserCard({ user, onEdit, onDelete }) {
  return <div>...</div>
}
```

### 2.2 Props 解构

优先使用 Props 解构，提高代码可读性。

```typescript
// ✅ 正确：Props 解构
function UserCard({ user, onEdit }: UserCardProps) {
  return <div onClick={() => onEdit(user)}>{user.name}</div>
}

// ❌ 错误：不解构
function UserCard(props: UserCardProps) {
  return <div onClick={() => props.onEdit(props.user)}>{props.user.name}</div>
}
```

### 2.3 默认 Props

使用 ES6 默认参数语法设置默认值。

```typescript
// ✅ 正确：ES6 默认参数
function Button({ text = '提交', onClick }: ButtonProps) {
  return <button onClick={onClick}>{text}</button>
}

// ❌ 错误：使用 defaultProps
Button.defaultProps = {
  text: '提交'
}
```

---

## 三、Hooks 使用规范

### 3.1 Hooks 调用顺序

**Hooks 必须在组件顶层调用**，不能在条件语句、循环或嵌套函数中调用。

```typescript
// ✅ 正确：Hooks 在顶层
function UserList() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchUsers()
  }, [])

  return <div>...</div>
}

// ❌ 错误：Hooks 在条件语句中
function UserList() {
  if (condition) {
    const [users, setUsers] = useState<User[]>([])  // 错误！
  }

  return <div>...</div>
}
```

### 3.2 useState

使用 `useState` 管理组件内部状态。

```typescript
// ✅ 正确：完整的类型定义
const [users, setUsers] = useState<User[]>([])
const [loading, setLoading] = useState(false)
const [error, setError] = useState<string | null>(null)

// ❌ 错误：没有类型定义
const [users, setUsers] = useState([])
```

### 3.3 useEffect

使用 `useEffect` 处理副作用（API 调用、订阅等）。

```typescript
// ✅ 正确：完整的依赖数组
useEffect(() => {
  fetchUsers(page, pageSize)
}, [page, pageSize])

// ❌ 错误：缺少依赖
useEffect(() => {
  fetchUsers(page, pageSize)
}, [])  // 缺少 page 和 pageSize
```

### 3.4 自定义 Hooks

将可复用的逻辑抽取为自定义 Hooks。

```typescript
// ✅ 正确：自定义 Hook
function useUsers(page: number, pageSize: number) {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    userApi.getUsers({ page, page_size: pageSize })
      .then(res => setUsers(res.data.items))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [page, pageSize])

  return { users, loading, error }
}

// 在组件中使用
function UserList() {
  const { users, loading, error } = useUsers(1, 20)

  if (loading) return <div>加载中...</div>
  if (error) return <div>错误：{error}</div>

  return <div>{users.map(u => <UserCard key={u.id} user={u} />)}</div>
}
```

---

## 四、事件处理

### 4.1 事件处理函数命名

事件处理函数使用 `handle` 前缀。

```typescript
// ✅ 正确：handle 前缀
function UserCard({ user, onEdit }: UserCardProps) {
  const handleEdit = () => {
    onEdit(user)
  }

  const handleDelete = () => {
    if (confirm('确定删除？')) {
      deleteUser(user.id)
    }
  }

  return (
    <div>
      <button onClick={handleEdit}>编辑</button>
      <button onClick={handleDelete}>删除</button>
    </div>
  )
}

// ❌ 错误：没有 handle 前缀
function UserCard({ user, onEdit }: UserCardProps) {
  const edit = () => { ... }
  const delete = () => { ... }

  return <div>...</div>
}
```

### 4.2 避免内联函数

避免在 JSX 中使用内联函数，影响性能。

```typescript
// ✅ 正确：提取为函数
function UserList({ users }: { users: User[] }) {
  const handleEdit = (user: User) => {
    console.log('Edit user:', user)
  }

  return (
    <div>
      {users.map(user => (
        <UserCard key={user.id} user={user} onEdit={handleEdit} />
      ))}
    </div>
  )
}

// ❌ 错误：内联函数
function UserList({ users }: { users: User[] }) {
  return (
    <div>
      {users.map(user => (
        <UserCard
          key={user.id}
          user={user}
          onEdit={() => console.log('Edit user:', user)}
        />
      ))}
    </div>
  )
}
```

---

## 五、条件渲染

### 5.1 使用三元运算符

简单的条件渲染使用三元运算符。

```typescript
// ✅ 正确：三元运算符
function UserStatus({ status }: { status: string }) {
  return (
    <span className={status === 'active' ? 'text-green-600' : 'text-red-600'}>
      {status === 'active' ? '活跃' : '封禁'}
    </span>
  )
}
```

### 5.2 使用 && 运算符

条件渲染某个元素时使用 `&&` 运算符。

```typescript
// ✅ 正确：&& 运算符
function UserCard({ user, showActions }: UserCardProps) {
  return (
    <div>
      <h3>{user.name}</h3>
      {showActions && (
        <div>
          <button>编辑</button>
          <button>删除</button>
        </div>
      )}
    </div>
  )
}
```

### 5.3 提前返回

复杂的条件渲染使用提前返回。

```typescript
// ✅ 正确：提前返回
function UserList({ users, loading, error }: UserListProps) {
  if (loading) return <div>加载中...</div>
  if (error) return <div>错误：{error}</div>
  if (users.length === 0) return <div>暂无数据</div>

  return (
    <div>
      {users.map(user => <UserCard key={user.id} user={user} />)}
    </div>
  )
}

// ❌ 错误：嵌套条件
function UserList({ users, loading, error }: UserListProps) {
  return (
    <div>
      {loading ? (
        <div>加载中...</div>
      ) : error ? (
        <div>错误：{error}</div>
      ) : users.length === 0 ? (
        <div>暂无数据</div>
      ) : (
        users.map(user => <UserCard key={user.id} user={user} />)
      )}
    </div>
  )
}
```

---

## 六、列表渲染

### 6.1 使用 key

列表渲染必须使用唯一的 `key`。

```typescript
// ✅ 正确：使用唯一的 key
function UserList({ users }: { users: User[] }) {
  return (
    <div>
      {users.map(user => (
        <UserCard key={user.id} user={user} />
      ))}
    </div>
  )
}

// ❌ 错误：使用 index 作为 key
function UserList({ users }: { users: User[] }) {
  return (
    <div>
      {users.map((user, index) => (
        <UserCard key={index} user={user} />
      ))}
    </div>
  )
}
```

---

## 七、性能优化

### 7.1 使用 React.memo

对于纯展示组件，使用 `React.memo` 避免不必要的重新渲染。

```typescript
// ✅ 正确：使用 React.memo
const UserCard = React.memo(({ user }: { user: User }) => {
  return <div>{user.name}</div>
})
```

### 7.2 使用 useMemo

对于计算密集型操作，使用 `useMemo` 缓存结果。

```typescript
// ✅ 正确：使用 useMemo
function UserList({ users }: { users: User[] }) {
  const activeUsers = useMemo(
    () => users.filter(u => u.status === 'active'),
    [users]
  )

  return <div>{activeUsers.map(u => <UserCard key={u.id} user={u} />)}</div>
}
```

### 7.3 使用 useCallback

对于传递给子组件的回调函数，使用 `useCallback` 避免不必要的重新渲染。

```typescript
// ✅ 正确：使用 useCallback
function UserList({ users }: { users: User[] }) {
  const handleEdit = useCallback((user: User) => {
    console.log('Edit user:', user)
  }, [])

  return (
    <div>
      {users.map(user => (
        <UserCard key={user.id} user={user} onEdit={handleEdit} />
      ))}
    </div>
  )
}
```

---

## 八、用户交互规范

### 8.1 禁止使用 alert

**严禁使用浏览器原生 alert、confirm、prompt**，必须使用公共的 Toast 组件。

```typescript
// ❌ 错误：使用 alert
function handleSubmit() {
  if (!data) {
    alert('请填写数据')
    return
  }
  alert('提交成功')
}

// ✅ 正确：使用 Toast
import { useToast } from '../contexts/ToastContext'

function handleSubmit() {
  const toast = useToast()

  if (!data) {
    toast.warning('请填写数据')
    return
  }
  toast.success('提交成功')
}
```

### 8.2 Toast 使用规范

Toast 组件提供四种类型的提示：

```typescript
const toast = useToast()

// 成功提示
toast.success('操作成功')

// 错误提示
toast.error('操作失败')

// 警告提示
toast.warning('请填写必填字段')

// 信息提示
toast.info('正在处理中')
```

---

## 九、相关文档

- **AI 约束**：`.ai/standards/ai-constraints.md`
- **TypeScript 规范**：`.ai/standards/typescript-style.md`
- **前端架构**：`.ai/architecture/frontend-architecture.md`
