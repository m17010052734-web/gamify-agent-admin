# API 路径命名规范

## 路径结构

本系统采用清晰的路径前缀来区分不同类型的接口:

- **业务接口**: `/api/*` - 给普通用户使用的业务功能接口
- **管理接口**: `/admin/*` - 给管理员使用的后台管理接口

## 命名规范

所有接口端点必须使用**动宾短语(verb-object)**命名方式,便于快速识别接口的作用。

### 正确示例 ✅

```
GET  /api/get-plaza-games          # 获取广场游戏列表
POST /api/like-plaza-game          # 点赞广场游戏
POST /api/claim-daily-reward       # 领取每日奖励
GET  /api/get-balance              # 获取余额

GET  /admin/list-users             # 获取用户列表
POST /admin/adjust-user-credit     # 调整用户积分
GET  /admin/get-user-credit-flow   # 获取用户积分流水
POST /admin/update-user-status     # 更新用户状态
GET  /admin/list-review-games      # 获取待审核游戏列表
POST /admin/review-game            # 审核游戏
GET  /admin/list-credit-configs    # 获取积分配置列表
PUT  /admin/update-credit-config   # 更新积分配置
GET  /admin/get-platform-stats     # 获取平台统计数据
```

### 错误示例 ❌

```
GET  /api/plaza/games              # 不符合动宾短语规范
POST /api/games/like               # 不符合动宾短语规范
GET  /admin/users/list             # 不符合动宾短语规范
POST /admin/users/adjust-credit    # 不符合动宾短语规范
GET  /admin/stats/platform         # 不符合动宾短语规范
```

## 动词选择指南

### 查询操作
- `get-*` - 获取单个资源或详情
- `list-*` - 获取列表或集合
- `search-*` - 搜索资源

### 修改操作
- `create-*` - 创建新资源
- `update-*` - 更新现有资源
- `delete-*` - 删除资源
- `adjust-*` - 调整数值(如积分)

### 业务操作
- `like-*` - 点赞
- `claim-*` - 领取
- `review-*` - 审核
- `publish-*` - 发布
- `submit-*` - 提交

## 完整的管理接口列表

### 认证接口
```
POST /admin/auth/login             # 管理员登录
POST /admin/auth/logout            # 管理员登出
POST /admin/auth/refresh           # 刷新 Token
```

### 用户管理
```
GET  /admin/list-users             # 获取用户列表
POST /admin/adjust-user-credit     # 调整用户积分
GET  /admin/get-user-credit-flow   # 获取用户积分流水
POST /admin/update-user-status     # 更新用户状态
```

### 游戏审核
```
GET  /admin/list-review-games      # 获取待审核游戏列表
POST /admin/review-game            # 审核游戏
```

### 积分配置
```
GET  /admin/list-credit-configs    # 获取积分配置列表
PUT  /admin/update-credit-config   # 更新单项积分配置
PUT  /admin/batch-update-credit-configs  # 批量更新积分配置
```

### 数据统计
```
GET  /admin/get-platform-stats     # 获取平台统计数据
```

## 实施要点

1. **前后端一致**: 前端 API 调用路径必须与后端路由完全匹配
2. **语义清晰**: 接口名称应该清楚表达其功能,无需查看文档即可理解
3. **动词在前**: 始终将动词放在最前面,后跟操作对象
4. **使用连字符**: 单词之间使用连字符 `-` 分隔,不使用下划线或驼峰命名
5. **避免嵌套**: 不使用多层嵌套路径(如 `/admin/users/credit/flow`),而是使用扁平的动宾短语(如 `/admin/get-user-credit-flow`)

## 迁移指南

如果需要重构现有接口路径:

1. 识别所有不符合规范的路径
2. 将路径转换为动宾短语格式
3. 同时更新后端路由和前端 API 调用
4. 更新相关文档和测试用例
5. 考虑保留旧路径一段时间以保证向后兼容(可选)
