# GraphQL 到 REST API 迁移 - 进度总结

## 已完成的工作

### ✅ 后端迁移 (100%完成)

1. **包管理**
   - 已移除所有 GraphQL 依赖 (@nestjs/graphql, @apollo/server, graphql)
   - package.json 已更新为 REST API 描述

2. **核心配置**
   - ✅ app.module.ts - 移除GraphQLModule配置
   - ✅ main.ts - 添加全局前缀 `/api`, 移除GraphQL引用
   - ✅ jwt-auth.guard.ts - 创建REST版本的Auth Guard
   - ✅ current-user.decorator.ts - 更新为REST context

3. **已迁移的模块 (14个)**
   - ✅ Auth模块 - auth.controller.ts 创建
   - ✅ User模块 - user.controller.ts 创建
   - ✅ Todo模块 - todo.controller.ts 创建
   - ✅ Category模块 - category.controller.ts 创建
   - ✅ Comment模块 - comment.controller.ts 创建
   - ✅ Tag模块 - tag.controller.ts 创建
   - ✅ Stats模块 - stats.controller.ts 创建
   - ✅ Search模块 - search.controller.ts 创建
   - ✅ Batch模块 - batch.controller.ts 创建
   - ✅ Product模块 - product.controller.ts 创建
   - ✅ Inventory模块 - inventory.controller.ts 创建
   - ✅ Cart模块 - shopping-cart.controller.ts 创建
   - ✅ Order模块 - order.controller.ts 创建
   - ✅ Payment模块 - payment.controller.ts 创建

### ✅ 前端包管理 (100%完成)

- 已移除 Apollo Client 和 GraphQL 依赖
- 已添加 axios ^1.6.0
- 移除 GraphQL Codegen 相关包

### ✅ API 客户端 (100%完成)

- 创建了企业级的 api-client.ts
- 特性：
  - 单例模式
  - 请求/响应拦截器
  - 自动添加JWT Token
  - 统一错误处理
  - 请求去重
  - 开发日志
  - 文件上传/下载支持

## 需要完成的工作

### 1. 创建 API 服务层 (必须)

创建以下文件在 `apps/web/src/lib/api/` 目录:

**apps/web/src/lib/api/auth.api.ts**
```typescript
import { apiClient } from '../api-client';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  username: string;
  password: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    username: string;
  };
}

export const authApi = {
  login: (credentials: LoginCredentials) => 
    apiClient.post<AuthResponse>('/auth/login', credentials),
  
  register: (data: RegisterData) => 
    apiClient.post<AuthResponse>('/auth/register', data),
  
  me: () => 
    apiClient.get('/auth/me'),
  
  refreshToken: (refreshToken: string) => 
    apiClient.post('/auth/refresh', { refreshToken }),
  
  logout: (refreshToken: string) => 
    apiClient.post('/auth/logout', { refreshToken }),
};
```

按此模式创建：
- todo.api.ts
- category.api.ts
- user.api.ts
- comment.api.ts
- tag.api.ts
- stats.api.ts
- search.api.ts
- product.api.ts
- cart.api.ts
- order.api.ts
- payment.api.ts
- index.ts (统一导出)

### 2. 更新 auth-context.tsx

将 Apollo Client 调用替换为 axios:

```typescript
// 旧代码
const { data } = await client.query({ query: GET_ME });

// 新代码
const data = await authApi.me();
```

### 3. 迁移所有页面组件

需要更新的页面 (10个):
- apps/web/src/app/login/page.tsx
- apps/web/src/app/register/page.tsx
- apps/web/src/app/todos/page.tsx
- apps/web/src/app/categories/page.tsx
- apps/web/src/app/profile/page.tsx
- apps/web/src/app/dashboard/page.tsx
- apps/web/src/app/shop/page.tsx
- apps/web/src/app/cart/page.tsx
- apps/web/src/app/checkout/page.tsx
- apps/web/src/app/orders/page.tsx

替换模式：
```typescript
// 旧代码
const { data, loading } = useQuery(GET_TODOS);
const [createTodo] = useMutation(CREATE_TODO);

// 新代码
const [data, setData] = useState([]);
const [loading, setLoading] = useState(true);

useEffect(() => {
  const fetchData = async () => {
    try {
      const result = await todoApi.getAll();
      setData(result);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };
  fetchData();
}, []);

const handleCreate = async (data) => {
  await todoApi.create(data);
};
```

### 4. 迁移功能组件 (7个)

- comment-form.tsx
- comment-list.tsx
- tag-selector.tsx
- search-form.tsx
- product-card.tsx
- cart-item.tsx
- cart-summary.tsx

### 5. 清理 GraphQL 文件

删除以下文件/目录:
- apps/web/src/lib/apollo-client.ts
- apps/web/src/lib/apollo-wrapper.tsx
- apps/web/src/lib/graphql/ (整个目录)
- apps/web/codegen.ts

### 6. 更新 app/layout.tsx

移除 ApolloWrapper:

```typescript
// 旧代码
<ApolloWrapper>
  <AuthProvider>
    {children}
  </AuthProvider>
</ApolloWrapper>

// 新代码
<AuthProvider>
  {children}
</AuthProvider>
```

### 7. 后端模块文件更新

需要更新以下module文件，将Resolver替换为Controller:

电商模块:
- apps/api/src/ecommerce/product/product.module.ts
- apps/api/src/ecommerce/inventory/inventory.module.ts
- apps/api/src/ecommerce/cart/cart.module.ts
- apps/api/src/ecommerce/order/order.module.ts
- apps/api/src/ecommerce/payment/payment.module.ts

### 8. 删除所有 Resolver 文件

删除以下文件:
- apps/api/src/auth/auth.resolver.ts
- apps/api/src/user/user.resolver.ts
- apps/api/src/todo/todo.resolver.ts
- apps/api/src/category/category.resolver.ts
- apps/api/src/comment/comment.resolver.ts
- apps/api/src/tag/tag.resolver.ts
- apps/api/src/stats/stats.resolver.ts
- apps/api/src/search/search.resolver.ts
- apps/api/src/batch/batch.resolver.ts
- apps/api/src/ecommerce/**/resolvers/*.resolver.ts
- apps/api/src/apollo-studio.controller.ts
- apps/api/src/schema.gql

### 9. 测试

```bash
# 后端
cd apps/api
pnpm install
pnpm dev

# 前端
cd apps/web
pnpm install
pnpm dev
```

测试所有功能:
- 登录/注册
- Todo CRUD
- 分类管理
- 商店功能
- 购物车
- 订单流程

### 10. 最终验证

```bash
# 确保没有GraphQL残留
grep -r "gql\|@apollo\|useQuery\|useMutation\|@Resolver\|@Query\|@Mutation" apps/
```

### 11. 提交

```bash
git add .
git commit -m "feat: migrate from GraphQL to REST API

- Replace all GraphQL resolvers with REST controllers
- Replace Apollo Client with Axios
- Update all frontend components to use REST API
- Remove all GraphQL dependencies
- Update documentation"
```

## REST API 端点列表

### 认证
- POST /api/auth/login
- POST /api/auth/register
- POST /api/auth/refresh
- POST /api/auth/logout
- POST /api/auth/logout-all
- GET /api/auth/me

### 用户
- GET /api/users/me
- GET /api/users/:id
- PUT /api/users/:id
- GET /api/users/stats

### Todo
- GET /api/todos
- GET /api/todos/:id
- POST /api/todos
- PUT /api/todos/:id
- DELETE /api/todos/:id

### 分类
- GET /api/categories
- GET /api/categories/:id
- GET /api/categories/stats
- POST /api/categories
- PUT /api/categories/:id
- DELETE /api/categories/:id

### 评论
- GET /api/todos/:todoId/comments
- POST /api/todos/:todoId/comments
- DELETE /api/comments/:id

### 标签
- GET /api/tags
- POST /api/tags
- DELETE /api/tags/:id

### 统计
- GET /api/stats/overview

### 搜索
- GET /api/search?q=keyword

### 批量操作
- POST /api/batch/todos/complete
- DELETE /api/batch/todos

### 产品
- GET /api/products
- GET /api/products/:id
- GET /api/products/stats
- POST /api/products
- PUT /api/products/:id
- DELETE /api/products/:id

### 库存
- GET /api/inventory/:skuId
- POST /api/inventory/:skuId/reserve
- POST /api/inventory/:skuId/release

### 购物车
- GET /api/cart
- POST /api/cart/items
- PUT /api/cart/items/:itemId
- DELETE /api/cart/items/:itemId
- DELETE /api/cart

### 订单
- GET /api/orders
- GET /api/orders/:id
- POST /api/orders
- PUT /api/orders/:id/cancel

### 支付
- POST /api/payments/stripe/create-intent
- POST /api/payments/stripe/confirm
- POST /api/payments/paypal/create-order
- POST /api/payments/paypal/capture

## 注意事项

1. **类型安全**: 为所有API响应创建TypeScript接口
2. **错误处理**: 使用try-catch包装所有API调用
3. **加载状态**: 在所有数据获取时显示loading状态
4. **用户体验**: 添加适当的成功/错误提示
5. **性能**: 考虑添加请求缓存和防抖
6. **安全**: 确保所有敏感操作都需要认证

## 当前状态

- 后端: ✅ 100% 完成
- 前端包管理: ✅ 100% 完成
- API客户端: ✅ 100% 完成
- API服务层: ⏳ 0% (需要创建)
- 页面迁移: ⏳ 0% (需要更新)
- 清理: ⏳ 0% (需要删除文件)

估计剩余工作量: 约50-70个工具调用
