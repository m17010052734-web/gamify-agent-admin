# TypeScript 代码规范

## 优先级：P0

本文档定义 TypeScript 代码的编写规范。

---

## 一、类型定义

### 1.1 显式类型注解

**所有函数参数、返回值、变量都必须有显式的类型注解**。

```typescript
// ✅ 正确：显式类型注解
function getUser(userId: string): Promise<User> {
  return userApi.getUser(userId)
}

const users: User[] = []
const loading: boolean = false

// ❌ 错误：没有类型注解
function getUser(userId) {
  return userApi.getUser(userId)
}

const users = []
const loading = false
```

### 1.2 接口 vs 类型别名

- **接口（Interface）**：用于定义对象的形状
- **类型别名（Type）**：用于定义联合类型、交叉类型、基本类型别名

```typescript
// ✅ 正确：使用接口定义对象
interface User {
  id: string
  name: string
  email: string
}

// ✅ 正确：使用类型别名定义联合类型
type Status = 'active' | 'banned' | 'pending'

// ✅ 正确：使用类型别名定义交叉类型
type UserWithStatus = User & { status: Status }
```

### 1.3 避免使用 any

**禁止使用 `any` 类型**，使用 `unknown` 或具体类型。

```typescript
// ✅ 正确：使用 unknown
function processData(data: unknown) {
  if (typeof data === 'string') {
    return data.toUpperCase()
  }
  return data
}

// ❌ 错误：使用 any
function processData(data: any) {
  return data.toUpperCase()
}
```

---

## 二、类型推断

### 2.1 利用类型推断

简单的类型可以利用 TypeScript 的类型推断。

```typescript
// ✅ 正确：利用类型推断
const name = 'John'  // 推断为 string
const age = 30       // 推断为 number
const isActive = true // 推断为 boolean

// ❌ 错误：不必要的类型注解
const name: string = 'John'
const age: number = 30
const isActive: boolean = true
```

### 2.2 复杂类型需要显式注解

复杂的类型需要显式注解，不能依赖推断。

```typescript
// ✅ 正确：显式注解
const users: User[] = []
const userMap: Map<string, User> = new Map()
const config: Config = { ... }

// ❌ 错误：依赖推断
const users = []  // 推断为 any[]
const userMap = new Map()  // 推断为 Map<any, any>
```

---

## 三、泛型

### 3.1 使用泛型

使用泛型提高代码的复用性和类型安全性。

```typescript
// ✅ 正确：使用泛型
function getFirstItem<T>(items: T[]): T | undefined {
  return items[0]
}

const firstUser = getFirstItem<User>(users)  // 类型为 User | undefined
const firstName = getFirstItem<string>(names)  // 类型为 string | undefined

// ❌ 错误：不使用泛型
function getFirstItem(items: any[]): any {
  return items[0]
}
```

### 3.2 泛型约束

使用泛型约束限制泛型的类型。

```typescript
// ✅ 正确：泛型约束
interface HasId {
  id: string
}

function findById<T extends HasId>(items: T[], id: string): T | undefined {
  return items.find(item => item.id === id)
}

// ❌ 错误：没有约束
function findById<T>(items: T[], id: string): T | undefined {
  return items.find(item => item.id === id)  // 错误：T 没有 id 属性
}
```

---

## 四、联合类型和交叉类型

### 4.1 联合类型

使用联合类型表示多种可能的类型。

```typescript
// ✅ 正确：联合类型
type Status = 'active' | 'banned' | 'pending'

function updateStatus(userId: string, status: Status) {
  // ...
}

updateStatus('123', 'active')  // ✅
updateStatus('123', 'invalid')  // ❌ 类型错误
```

### 4.2 交叉类型

使用交叉类型组合多个类型。

```typescript
// ✅ 正确：交叉类型
interface User {
  id: string
  name: string
}

interface WithTimestamps {
  created_at: string
  updated_at: string
}

type UserWithTimestamps = User & WithTimestamps

const user: UserWithTimestamps = {
  id: '123',
  name: 'John',
  created_at: '2024-01-01',
  updated_at: '2024-01-02'
}
```

---

## 五、可选属性和空值处理

### 5.1 可选属性

使用 `?` 标记可选属性。

```typescript
// ✅ 正确：可选属性
interface User {
  id: string
  name: string
  email?: string  // 可选
  avatar_url?: string  // 可选
}
```

### 5.2 空值处理

使用 `null` 或 `undefined` 表示空值。

```typescript
// ✅ 正确：使用 null
function getUser(userId: string): User | null {
  const user = users.find(u => u.id === userId)
  return user || null
}

// ✅ 正确：使用 undefined
function getUser(userId: string): User | undefined {
  return users.find(u => u.id === userId)
}
```

### 5.3 可选链和空值合并

使用可选链 `?.` 和空值合并 `??` 简化代码。

```typescript
// ✅ 正确：可选链
const email = user?.email
const avatarUrl = user?.profile?.avatar_url

// ✅ 正确：空值合并
const name = user?.name ?? 'Anonymous'
const count = user?.follower_count ?? 0
```

---

## 六、类型守卫

### 6.1 使用类型守卫

使用类型守卫缩小类型范围。

```typescript
// ✅ 正确：类型守卫
function isUser(value: unknown): value is User {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    'name' in value
  )
}

function processData(data: unknown) {
  if (isUser(data)) {
    console.log(data.name)  // 类型为 User
  }
}
```

### 6.2 使用 typeof 和 instanceof

使用 `typeof` 和 `instanceof` 进行类型检查。

```typescript
// ✅ 正确：typeof
function processValue(value: string | number) {
  if (typeof value === 'string') {
    return value.toUpperCase()
  } else {
    return value.toFixed(2)
  }
}

// ✅ 正确：instanceof
function processError(error: unknown) {
  if (error instanceof Error) {
    console.error(error.message)
  }
}
```

---

## 七、枚举

### 7.1 使用字符串枚举

优先使用字符串枚举，而不是数字枚举。

```typescript
// ✅ 正确：字符串枚举
enum Status {
  Active = 'active',
  Banned = 'banned',
  Pending = 'pending'
}

// ❌ 错误：数字枚举
enum Status {
  Active,
  Banned,
  Pending
}
```

### 7.2 使用联合类型替代枚举

对于简单的枚举，使用联合类型更简洁。

```typescript
// ✅ 正确：联合类型
type Status = 'active' | 'banned' | 'pending'

// ❌ 错误：枚举（过度设计）
enum Status {
  Active = 'active',
  Banned = 'banned',
  Pending = 'pending'
}
```

---

## 八、类型断言

### 8.1 避免类型断言

尽量避免使用类型断言（`as`），使用类型守卫。

```typescript
// ✅ 正确：使用类型守卫
function processData(data: unknown) {
  if (isUser(data)) {
    console.log(data.name)
  }
}

// ❌ 错误：使用类型断言
function processData(data: unknown) {
  const user = data as User
  console.log(user.name)  // 不安全
}
```

### 8.2 必要时使用类型断言

在确定类型的情况下，可以使用类型断言。

```typescript
// ✅ 正确：必要的类型断言
const input = document.getElementById('email') as HTMLInputElement
const value = input.value
```

---

## 九、工具类型

### 9.1 使用内置工具类型

使用 TypeScript 内置的工具类型。

```typescript
// ✅ 正确：Partial
type PartialUser = Partial<User>  // 所有属性可选

// ✅ 正确：Pick
type UserBasicInfo = Pick<User, 'id' | 'name'>  // 只选择部分属性

// ✅ 正确：Omit
type UserWithoutEmail = Omit<User, 'email'>  // 排除某些属性

// ✅ 正确：Record
type UserMap = Record<string, User>  // 键值对类型
```

---

## 十、相关文档

- **AI 约束**：`.ai/standards/ai-constraints.md`
- **React 规范**：`.ai/standards/react-style.md`
- **前端架构**：`.ai/architecture/frontend-architecture.md`
