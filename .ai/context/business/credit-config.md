# 积分配置模块

## 优先级：P0

本文档描述积分配置模块的功能设计和实现细节。

---

## 一、模块概述

### 1.1 功能职责

积分配置模块负责管理平台的积分消费成本和奖励配置。

**核心功能**：
- 积分配置列表查询
- 单个配置更新
- 批量配置更新

### 1.2 页面路由

- **路由路径**：`/credits`
- **页面组件**：`pages/Credits.tsx`

---

## 二、数据模型

### 2.1 积分配置数据结构

```typescript
interface CreditConfig {
  config_key: string      // 配置键
  config_value: number    // 配置值
  description: string     // 配置描述
  is_active: boolean      // 是否启用
  created_at: string      // 创建时间
  updated_at: string      // 更新时间
}
```

### 2.2 积分配置列表响应

```typescript
interface CreditConfigListResponse {
  items: CreditConfig[]   // 配置列表
  total: number           // 总数量
}
```

---

## 三、API 接口

### 3.1 获取积分配置列表

**接口**：`GET /admin/list-credit-configs`

**响应**：`CreditConfigListResponse`

**调用方式**：
```typescript
const response = await creditApi.getConfigs()
```

### 3.2 更新单个配置

**接口**：`PUT /admin/update-credit-config`

**请求参数**：
```typescript
interface UpdateConfigData {
  config_key: string      // 配置键
  config_value: number    // 新配置值
}
```

**调用方式**：
```typescript
await creditApi.updateConfig({
  config_key: 'cost_generate_fast',
  config_value: 15
})
```

### 3.3 批量更新配置

**接口**：`PUT /admin/batch-update-credit-configs`

**请求参数**：
```typescript
interface BatchUpdateConfigsData {
  configs: Array<{
    config_key: string
    config_value: number
  }>
}
```

**调用方式**：
```typescript
await creditApi.batchUpdateConfigs({
  configs: [
    { config_key: 'cost_generate_fast', config_value: 15 },
    { config_key: 'cost_generate_quality', config_value: 35 },
    { config_key: 'reward_register', config_value: 150 }
  ]
})
```

---

## 四、配置分类

### 4.1 消费成本配置

| 配置键 | 默认值 | 说明 |
|--------|--------|------|
| `cost_generate_fast` | 10 | 快速生成消耗 |
| `cost_generate_quality` | 30 | 高质量生成消耗 |
| `cost_image_use` | 20 | 使用图片额外消耗 |
| `cost_video_generate` | 100 | 视频生成消耗 |

### 4.2 奖励配置

| 配置键 | 默认值 | 说明 |
|--------|--------|------|
| `reward_register` | 100 | 注册奖励 |
| `reward_daily_checkin` | 5 | 每日签到奖励 |
| `reward_share_content` | 2 | 分享内容奖励 |

---

## 五、页面功能

### 5.1 配置列表

**功能**：
- 显示所有积分配置（表格形式）
- 按类型分组显示（消费成本/奖励）
- 在线编辑配置值

**表格列**：
- 配置名称（描述）
- 配置键
- 当前值
- 是否启用
- 更新时间
- 操作按钮

### 5.2 单个配置编辑

**功能**：
- 点击"编辑"按钮进入编辑模式
- 输入新的配置值
- 点击"保存"提交更新
- 点击"取消"放弃更新

**验证规则**：
- 配置值必须为正整数
- 配置值不能为 0

### 5.3 批量配置更新

**功能**：
- 点击"批量编辑"按钮进入批量编辑模式
- 修改多个配置值
- 点击"保存全部"提交所有更新
- 点击"取消"放弃所有更新

---

## 六、组件结构

### 6.1 主组件

```typescript
// pages/Credits.tsx
function Credits() {
  // 状态管理
  const [configs, setConfigs] = useState<CreditConfig[]>([])
  const [loading, setLoading] = useState(false)
  const [editingKey, setEditingKey] = useState<string | null>(null)
  const [editingValue, setEditingValue] = useState<number>(0)
  const [batchEditMode, setBatchEditMode] = useState(false)
  const [batchEditValues, setBatchEditValues] = useState<Record<string, number>>({})

  // 获取配置列表
  const fetchConfigs = async () => {
    // ...
  }

  // 更新单个配置
  const handleUpdateConfig = async (configKey: string, configValue: number) => {
    // ...
  }

  // 批量更新配置
  const handleBatchUpdate = async () => {
    // ...
  }

  return (
    <div>
      {/* 操作按钮 */}
      {/* 配置列表表格 */}
    </div>
  )
}
```

### 6.2 子组件

- `ConfigTable` - 配置列表表格
- `ConfigEditRow` - 配置编辑行
- `BatchEditPanel` - 批量编辑面板

---

## 七、状态管理

### 7.1 本地状态

使用 `useState` 管理组件内部状态：

```typescript
const [configs, setConfigs] = useState<CreditConfig[]>([])  // 配置列表
const [loading, setLoading] = useState(false)               // 加载状态
const [error, setError] = useState<string | null>(null)     // 错误信息
const [editingKey, setEditingKey] = useState<string | null>(null)  // 正在编辑的配置键
const [editingValue, setEditingValue] = useState<number>(0)        // 正在编辑的配置值
const [batchEditMode, setBatchEditMode] = useState(false)          // 批量编辑模式
const [batchEditValues, setBatchEditValues] = useState<Record<string, number>>({})  // 批量编辑值
```

### 7.2 副作用

使用 `useEffect` 在组件挂载时加载数据：

```typescript
useEffect(() => {
  fetchConfigs()
}, [])
```

---

## 八、错误处理

### 8.1 API 错误

```typescript
try {
  const response = await creditApi.getConfigs()
  setConfigs(response.data.items)
} catch (error) {
  console.error('Failed to fetch configs:', error)
  setError('获取配置列表失败，请稍后重试')
}
```

### 8.2 表单验证

```typescript
const handleUpdateConfig = async (configKey: string, configValue: number) => {
  if (configValue <= 0) {
    setError('配置值必须为正整数')
    return
  }

  if (!Number.isInteger(configValue)) {
    setError('配置值必须为整数')
    return
  }

  // 提交
}
```

---

## 九、配置更新流程

### 9.1 单个配置更新

```
用户点击"编辑"按钮
  ↓
进入编辑模式
  ↓
输入新的配置值
  ↓
点击"保存"
  ↓
验证配置值
  ↓
调用 API：creditApi.updateConfig({ config_key, config_value })
  ↓
刷新配置列表
  ↓
显示成功提示
```

### 9.2 批量配置更新

```
用户点击"批量编辑"按钮
  ↓
进入批量编辑模式
  ↓
修改多个配置值
  ↓
点击"保存全部"
  ↓
验证所有配置值
  ↓
调用 API：creditApi.batchUpdateConfigs({ configs })
  ↓
刷新配置列表
  ↓
显示成功提示
```

---

## 十、相关文档

- **前端架构**：`.ai/architecture/frontend-architecture.md`
- **API 集成**：`.ai/standards/api-integration.md`
- **React 规范**：`.ai/standards/react-style.md`
