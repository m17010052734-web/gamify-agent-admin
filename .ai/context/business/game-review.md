# 游戏审核模块

## 优先级：P0

本文档描述游戏审核模块的功能设计和实现细节。

---

## 一、模块概述

### 1.1 功能职责

游戏审核模块负责管理平台上用户提交的游戏内容，进行审核操作。

**核心功能**：
- 待审核游戏列表查询
- 游戏详情展示
- 审核操作（通过/拒绝）
- 审核备注

### 1.2 页面路由

- **路由路径**：`/games`
- **页面组件**：`pages/Games.tsx`

---

## 二、数据模型

### 2.1 游戏数据结构

```typescript
interface Game {
  id: string                  // 游戏 ID
  title: string               // 游戏标题
  description: string | null  // 游戏描述
  cover_url: string | null    // 封面图 URL
  project_type: string        // 项目类型
  author_id: string           // 作者 ID
  author_nickname: string     // 作者昵称
  status: string              // 状态（pending/approved/rejected）
  created_at: string          // 创建时间
  updated_at: string          // 更新时间
}
```

### 2.2 游戏列表响应

```typescript
interface GameReviewListResponse {
  items: Game[]           // 游戏列表
  total: number           // 总数量
  page: number            // 当前页码
  page_size: number       // 每页数量
  total_pages: number     // 总页数
}
```

---

## 三、API 接口

### 3.1 获取待审核游戏列表

**接口**：`GET /admin/list-review-games`

**请求参数**：
```typescript
interface GetReviewListParams {
  page?: number        // 页码（默认 1）
  page_size?: number   // 每页数量（默认 20）
  status?: string      // 状态筛选（pending/approved/rejected）
}
```

**响应**：`GameReviewListResponse`

**调用方式**：
```typescript
const response = await gameApi.getReviewList({
  page: 1,
  page_size: 20,
  status: 'pending'
})
```

### 3.2 审核游戏

**接口**：`POST /admin/review-game`

**请求参数**：
```typescript
interface ReviewGameData {
  game_id: string                  // 游戏 ID
  action: 'approve' | 'reject'     // 审核操作
  message?: string                 // 审核备注
}
```

**调用方式**：
```typescript
// 通过审核
await gameApi.reviewGame({
  game_id: '123',
  action: 'approve',
  message: '内容优质，通过审核'
})

// 拒绝审核
await gameApi.reviewGame({
  game_id: '123',
  action: 'reject',
  message: '内容违规，拒绝审核'
})
```

---

## 四、页面功能

### 4.1 游戏列表

**功能**：
- 显示待审核游戏列表（卡片形式）
- 分页导航
- 状态筛选（全部/待审核/已通过/已拒绝）

**卡片信息**：
- 游戏封面
- 游戏标题
- 游戏描述
- 作者信息
- 项目类型
- 创建时间
- 审核状态
- 操作按钮

### 4.2 游戏详情

**功能**：
- 点击游戏卡片查看详情
- 显示完整的游戏信息
- 显示游戏预览（如果有）

**详情信息**：
- 游戏标题
- 游戏描述
- 游戏封面
- 作者信息
- 项目类型
- 创建时间
- 更新时间

### 4.3 审核操作

**功能**：
- 点击"通过"按钮通过审核
- 点击"拒绝"按钮拒绝审核
- 输入审核备注（可选）
- 提交后刷新游戏列表

**验证规则**：
- 拒绝审核时，备注不能为空

---

## 五、组件结构

### 5.1 主组件

```typescript
// pages/Games.tsx
function Games() {
  // 状态管理
  const [games, setGames] = useState<Game[]>([])
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [statusFilter, setStatusFilter] = useState<string>('pending')

  // 获取游戏列表
  const fetchGames = async () => {
    // ...
  }

  // 审核游戏
  const handleReview = async (gameId: string, action: 'approve' | 'reject', message?: string) => {
    // ...
  }

  return (
    <div>
      {/* 状态筛选 */}
      {/* 游戏列表（卡片） */}
      {/* 分页器 */}
      {/* 审核模态框 */}
    </div>
  )
}
```

### 5.2 子组件

- `GameCard` - 游戏卡片
- `GameDetailModal` - 游戏详情模态框
- `ReviewModal` - 审核操作模态框

---

## 六、状态管理

### 6.1 本地状态

使用 `useState` 管理组件内部状态：

```typescript
const [games, setGames] = useState<Game[]>([])           // 游戏列表
const [loading, setLoading] = useState(false)            // 加载状态
const [error, setError] = useState<string | null>(null)  // 错误信息
const [page, setPage] = useState(1)                      // 当前页码
const [total, setTotal] = useState(0)                    // 总数量
const [statusFilter, setStatusFilter] = useState('pending') // 状态筛选
const [selectedGame, setSelectedGame] = useState<Game | null>(null) // 选中的游戏
```

### 6.2 副作用

使用 `useEffect` 监听状态变化，自动刷新数据：

```typescript
useEffect(() => {
  fetchGames()
}, [page, statusFilter])
```

---

## 七、错误处理

### 7.1 API 错误

```typescript
try {
  const response = await gameApi.getReviewList(params)
  setGames(response.data.items)
} catch (error) {
  console.error('Failed to fetch games:', error)
  setError('获取游戏列表失败，请稍后重试')
}
```

### 7.2 表单验证

```typescript
const handleReview = async (action: 'approve' | 'reject', message?: string) => {
  if (action === 'reject' && !message?.trim()) {
    setError('拒绝审核时，请输入拒绝原因')
    return
  }

  // 提交
}
```

---

## 八、审核流程

### 8.1 通过审核

```
用户点击"通过"按钮
  ↓
打开审核模态框
  ↓
输入审核备注（可选）
  ↓
提交审核
  ↓
调用 API：gameApi.reviewGame({ game_id, action: 'approve', message })
  ↓
刷新游戏列表
  ↓
显示成功提示
```

### 8.2 拒绝审核

```
用户点击"拒绝"按钮
  ↓
打开审核模态框
  ↓
输入拒绝原因（必填）
  ↓
提交审核
  ↓
调用 API：gameApi.reviewGame({ game_id, action: 'reject', message })
  ↓
刷新游戏列表
  ↓
显示成功提示
```

---

## 九、相关文档

- **前端架构**：`.ai/architecture/frontend-architecture.md`
- **API 集成**：`.ai/standards/api-integration.md`
- **React 规范**：`.ai/standards/react-style.md`
