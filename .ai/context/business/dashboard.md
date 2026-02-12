# 仪表盘模块

## 优先级：P0

本文档描述仪表盘模块的功能设计和实现细节。

---

## 一、模块概述

### 1.1 功能职责

仪表盘模块负责展示平台的核心数据统计和快捷操作入口。

**核心功能**：
- 平台数据概览
- 用户统计（总数、活跃、封禁）
- 游戏统计（总数、已发布、待审核）
- 积分统计（已发放、已消耗）
- 快捷操作入口

### 1.2 页面路由

- **路由路径**：`/`（首页）
- **页面组件**：`pages/Dashboard.tsx`

---

## 二、数据模型

### 2.1 平台统计数据结构

```typescript
interface PlatformStats {
  total_users: number          // 总用户数
  active_users: number         // 活跃用户数
  banned_users: number         // 封禁用户数
  total_games: number          // 总游戏数
  published_games: number      // 已发布游戏数
  pending_games: number        // 待审核游戏数
  total_credits_issued: number // 已发放积分总数
  total_credits_consumed: number // 已消耗积分总数
}
```

---

## 三、API 接口

### 3.1 获取平台统计数据

**接口**：`GET /admin/get-platform-stats`

**响应**：`PlatformStats`

**调用方式**：
```typescript
const response = await statsApi.getPlatformStats()
```

---

## 四、页面功能

### 4.1 数据卡片

**功能**：
- 显示核心数据指标（卡片形式）
- 数据分类展示（用户/游戏/积分）

**用户统计卡片**：
- 总用户数
- 活跃用户数
- 封禁用户数

**游戏统计卡片**：
- 总游戏数
- 已发布游戏数
- 待审核游戏数

**积分统计卡片**：
- 已发放积分总数
- 已消耗积分总数

### 4.2 快捷操作

**功能**：
- 快捷跳转到各个管理页面
- 常用操作入口

**快捷入口**：
- 用户管理
- 游戏审核
- 积分配置

---

## 五、组件结构

### 5.1 主组件

```typescript
// pages/Dashboard.tsx
function Dashboard() {
  // 状态管理
  const [stats, setStats] = useState<PlatformStats | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 获取平台统计数据
  const fetchStats = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await statsApi.getPlatformStats()
      setStats(response.data)
    } catch (err) {
      console.error('Failed to fetch stats:', err)
      setError('获取统计数据失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStats()
  }, [])

  if (loading) return <div>加载中...</div>
  if (error) return <div>错误：{error}</div>
  if (!stats) return null

  return (
    <div>
      {/* 数据卡片 */}
      {/* 快捷操作 */}
    </div>
  )
}
```

### 5.2 子组件

- `StatCard` - 统计数据卡片
- `QuickActions` - 快捷操作面板

---

## 六、状态管理

### 6.1 本地状态

使用 `useState` 管理组件内部状态：

```typescript
const [stats, setStats] = useState<PlatformStats | null>(null)  // 统计数据
const [loading, setLoading] = useState(false)                   // 加载状态
const [error, setError] = useState<string | null>(null)         // 错误信息
```

### 6.2 副作用

使用 `useEffect` 在组件挂载时加载数据：

```typescript
useEffect(() => {
  fetchStats()
}, [])
```

---

## 七、错误处理

### 7.1 API 错误

```typescript
try {
  const response = await statsApi.getPlatformStats()
  setStats(response.data)
} catch (error) {
  console.error('Failed to fetch stats:', error)
  setError('获取统计数据失败，请稍后重试')
}
```

---

## 八、相关文档

- **前端架构**：`.ai/architecture/frontend-architecture.md`
- **API 集成**：`.ai/standards/api-integration.md`
- **React 规范**：`.ai/standards/react-style.md`
