# API 响应数据解析规范

## 优先级：P0

本文档定义前端统一的 API 响应数据解析规范。

---

## 一、后端响应结构（标准）

后端所有 API 返回的数据结构都是统一的：

```json
{
  "success": true,
  "data": {...},
  "message": "操作成功"
}
```

---

## 二、Axios 响应结构

Axios 的响应对象结构：

```javascript
response = {
  data: {...},      // 这是后端返回的数据
  status: 200,
  statusText: 'OK',
  headers: {...},
  config: {...}
}
```

所以：
- `response.data` = 后端返回的 `{success, data, message}`
- `response.data.data` = 实际的业务数据

---

## 三、响应拦截器统一处理

在 `src/services/api.ts` 中，响应拦截器已经统一处理了嵌套结构：

```typescript
api.interceptors.response.use(
  (response) => {
    // 统一处理后端响应结构：{success, data, message}
    // 将 response.data.data 提升到 response.data，简化访问
    if (response.data && typeof response.data === 'object' && 'data' in response.data) {
      response.data = response.data.data;
    }
    return response;
  },
  async (error) => {
    // 错误处理...
  }
);
```

---

## 四、前端统一访问规范

**重要**：所有前端页面必须统一使用以下方式访问 API 响应数据：

### ✅ 正确的访问方式

```typescript
// 列表数据
const response = await userApi.getUsers({ page: 1, page_size: 20 });
setUsers(response.data.items);
setTotal(response.data.total);

// 单个对象
const response = await userApi.getUser(userId);
setUser(response.data);

// 登录响应
const response = await authApi.login({ email, password });
localStorage.setItem('admin_token', response.data.token);
```

### ❌ 错误的访问方式

```typescript
// ❌ 错误：使用 response.data.data
setUsers(response.data.data.items);  // 错误！

// ❌ 错误：使用 response.data.data
setUser(response.data.data);  // 错误！

// ❌ 错误：使用 response.data.data
localStorage.setItem('admin_token', response.data.data.token);  // 错误！
```

---

## 五、检查清单

在编写或修改 API 调用代码时，必须确认：

- [ ] 所有 API 调用都使用 `response.data` 访问数据
- [ ] 没有任何地方使用 `response.data.data`
- [ ] 错误处理使用 `err.response?.data?.message`
- [ ] 所有页面的 API 访问方式一致

---

## 六、常见错误示例

### 错误 1：登录页面

```typescript
// ❌ 错误
localStorage.setItem('admin_token', response.data.data.token);

// ✅ 正确
localStorage.setItem('admin_token', response.data.token);
```

### 错误 2：列表页面

```typescript
// ❌ 错误
setGames(response.data.data.items);
setTotal(response.data.data.total);

// ✅ 正确
setGames(response.data.items);
setTotal(response.data.total);
```

### 错误 3：详情页面

```typescript
// ❌ 错误
setGameDetail(response.data.data);

// ✅ 正确
setGameDetail(response.data);
```

---

## 七、相关文档

- **API 集成规范**：`.ai/standards/api-integration.md`
- **前端架构**：`.ai/architecture/frontend-architecture.md`
