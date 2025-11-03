# 电商模块实现路线图

## 📊 项目状态

### 已完成

#### ✅ 架构设计与规划
- [x] 完整的电商系统架构设计 (`docs/ECOMMERCE_ARCHITECTURE.md`)
- [x] 系统分层设计
- [x] DDD领域驱动设计
- [x] 设计模式应用

#### ✅ 产品管理模块 - 数据模型
已创建以下核心实体：
- [x] `ProductCategory` - 产品分类（支持无限级分类）
- [x] `ProductAttribute` - 产品属性定义
- [x] `ProductAttributeValue` - 属性值选项
- [x] `Product` - 产品主记录
- [x] `ProductSku` - 产品SKU（库存单位）
- [x] `ProductImage` - 产品图片

#### ✅ DTO层
- [x] `CreateProductInput` - 创建产品输入

### 待实现

#### Phase 1: 产品管理服务层 (下一步)
```
优先级: 高
预计工作量: 2-3 天

任务：
1. ProductService - 产品业务逻辑
   - 查询产品列表（分页、排序、筛选）
   - 获取产品详情
   - 创建/更新/删除产品
   - 搜索功能

2. ProductCategoryService - 分类管理
   - 创建分类
   - 构建分类树
   - 获取分类路径

3. ProductSkuService - SKU管理
   - SKU创建
   - 库存查询
   - SKU更新

4. ProductRepository - 仓储层
   - 自定义查询方法
   - 性能优化（索引使用）
```

#### Phase 2: 库存管理模块
```
优先级: 高（依赖Phase 1）
预计工作量: 3-4 天

任务：
1. InventoryService
   - 库存查询
   - 库存预留（下单时）
   - 库存确认（支付时）
   - 库存释放（取消时）

2. 乐观锁实现
   - ProductSku.version 并发控制
   - 重试机制

3. InventoryLock实体
   - 库存锁记录表
   - 时间戳和过期处理

4. 并发测试
   - 多线程库存扣减测试
   - 超卖防护验证
```

#### Phase 3: 购物车模块
```
优先级: 中
预计工作量: 2-3 天

任务：
1. 实体创建
   - ShoppingCart
   - ShoppingCartItem

2. ShoppingCartService
   - 添加到购物车
   - 获取购物车
   - 更新数量
   - 删除项目
   - 清空购物车
   - 价格计算

3. Resolver
   - GraphQL查询/变更
   - 实时库存检查
```

#### Phase 4: 订单模块
```
优先级: 高（核心业务）
预计工作量: 4-5 天

任务：
1. 实体创建
   - Order
   - OrderItem
   - OrderLog

2. OrderService
   - 创建订单（事务）
   - 订单查询
   - 订单取消
   - 订单状态流转

3. OrderResolver
   - GraphQL操作

4. 订单日志系统
   - 操作记录
   - 审计跟踪
```

#### Phase 5: 支付模块
```
优先级: 高（核心流程）
预计工作量: 3-4 天

任务：
1. 支付策略模式实现
   - PaymentStrategy 接口
   - AlipayStrategy
   - WechatStrategy
   - StripeStrategy

2. PaymentService
   - 支付处理
   - 退款处理
   - 支付回调

3. 支付网关集成
   - 模拟支付接口
   - 异步回调处理
```

#### Phase 6: 评价模块
```
优先级: 低
预计工作量: 1-2 天

任务：
1. Review实体
2. ReviewService
3. ReviewResolver
```

#### Phase 7: 前端实现
```
优先级: 中
预计工作量: 5-7 天

任务：
1. 产品展示页面
   - 产品列表
   - 产品详情
   - SKU选择

2. 购物车页面
   - 购物车项目列表
   - 数量调整
   - 价格展示

3. 结算页面
   - 订单确认
   - 收货地址选择
   - 支付方式选择
   - 价格汇总

4. 用户中心
   - 订单列表
   - 订单详情
   - 订单跟踪
```

#### Phase 8: 测试与优化
```
优先级: 高
预计工作量: 3-4 天

任务：
1. 单元测试
   - Service层测试
   - 业务逻辑验证

2. 集成测试
   - GraphQL端到端测试
   - 数据库事务验证

3. 并发测试
   - 库存并发扣减
   - 订单并发创建

4. 性能测试
   - 列表查询性能
   - 搜索性能
```

---

## 🔧 当前代码基础

### 已创建的核心实体 (6个)

```
apps/api/src/ecommerce/product/entities/
├── product-category.entity.ts      ✅ (无限级分类，物化路径优化)
├── product-attribute.entity.ts     ✅ (属性定义：颜色、尺寸等)
├── product-attribute-value.entity.ts ✅ (具体属性值)
├── product.entity.ts               ✅ (产品主表)
├── product-sku.entity.ts          ✅ (库存单位，乐观锁)
└── product-image.entity.ts        ✅ (产品图片)
```

### 已创建的DTO

```
apps/api/src/ecommerce/product/dto/
├── create-product.input.ts        ✅ (创建产品输入)
└── [其他DTO待创建]
```

### 待创建的核心文件

```
apps/api/src/ecommerce/
├── product/
│   ├── services/
│   │   ├── product.service.ts              (优先)
│   │   ├── product-category.service.ts
│   │   └── product-search.service.ts
│   ├── resolvers/
│   │   ├── product.resolver.ts
│   │   └── product-category.resolver.ts
│   ├── repositories/
│   │   ├── product.repository.ts
│   │   └── product-sku.repository.ts
│   ├── dto/
│   │   ├── update-product.input.ts
│   │   ├── product-filter.input.ts
│   │   ├── create-product-sku.input.ts
│   │   └── product.response.ts
│   └── product.module.ts
│
├── inventory/
│   ├── entities/
│   │   ├── inventory.entity.ts
│   │   └── inventory-lock.entity.ts
│   ├── services/
│   │   └── inventory.service.ts
│   ├── exceptions/
│   │   └── insufficient-stock.exception.ts
│   └── inventory.module.ts
│
├── shopping-cart/
│   ├── entities/
│   │   ├── shopping-cart.entity.ts
│   │   └── shopping-cart-item.entity.ts
│   ├── services/
│   │   └── shopping-cart.service.ts
│   ├── resolvers/
│   │   └── shopping-cart.resolver.ts
│   ├── dto/
│   │   ├── add-to-cart.input.ts
│   │   └── shopping-cart.response.ts
│   └── shopping-cart.module.ts
│
├── order/
│   ├── entities/
│   │   ├── order.entity.ts
│   │   ├── order-item.entity.ts
│   │   └── order-log.entity.ts
│   ├── services/
│   │   ├── order.service.ts
│   │   └── order-validator.service.ts
│   ├── resolvers/
│   │   └── order.resolver.ts
│   ├── enums/
│   │   └── order-status.enum.ts
│   ├── dto/
│   │   ├── create-order.input.ts
│   │   └── order.response.ts
│   └── order.module.ts
│
├── payment/
│   ├── strategies/
│   │   ├── payment.strategy.ts
│   │   ├── alipay.strategy.ts
│   │   ├── wechat.strategy.ts
│   │   └── stripe.strategy.ts
│   ├── services/
│   │   └── payment.service.ts
│   ├── resolvers/
│   │   └── payment.resolver.ts
│   ├── dto/
│   │   └── process-payment.input.ts
│   └── payment.module.ts
│
├── review/
│   ├── entities/
│   │   └── review.entity.ts
│   ├── services/
│   │   └── review.service.ts
│   ├── resolvers/
│   │   └── review.resolver.ts
│   └── review.module.ts
│
├── common/
│   ├── decorators/
│   ├── exceptions/
│   ├── utils/
│   └── types/
│
└── ecommerce.module.ts

# 前端文件
apps/web/src/app/ecommerce/
├── products/
│   ├── page.tsx               (产品列表)
│   ├── [id]/page.tsx         (产品详情)
│   └── [id]/components/      (产品详情组件)
├── cart/
│   └── page.tsx              (购物车)
├── checkout/
│   └── page.tsx              (结算)
└── orders/
    ├── page.tsx              (订单列表)
    └── [id]/page.tsx         (订单详情)

apps/web/src/lib/graphql/ecommerce/
├── queries.ts                (GraphQL查询)
├── mutations.ts              (GraphQL变更)
└── fragments.ts              (GraphQL片段)

apps/web/src/components/ecommerce/
├── ProductCard.tsx           (产品卡片)
├── ProductFilter.tsx         (筛选组件)
├── SkuSelector.tsx          (SKU选择)
├── ShoppingCart.tsx         (购物车组件)
└── OrderList.tsx            (订单列表)
```

---

## 🚀 快速开始

### 下一步行动项

#### 1️⃣ 完成产品管理服务层（最优先）

开发清单：
```
[ ] 创建 ProductService (product.service.ts)
    - 产品列表查询 + 高级筛选
    - 产品详情查询 + 预加载SKU
    - 产品创建 + 事务管理
    - 产品搜索功能

[ ] 创建 ProductRepository (product.repository.ts)
    - 自定义查询方法
    - 分页查询优化
    - 搜索查询实现

[ ] 创建必要的DTO
    - ProductFilterInput
    - ProductResponse
    - UpdateProductInput
    - CreateProductSkuInput

[ ] 创建 ProductResolver (product.resolver.ts)
    - GraphQL查询操作
    - GraphQL变更操作
    - DataLoader集成

[ ] 创建 ProductCategoryService
    - 分类树构建
    - 物化路径维护

[ ] 创建 Product Module
    - 模块注册
    - 依赖注入配置

[ ] 集成到 AppModule
    - 导入EcommerceModule

[ ] 编写单元测试
    - Service测试
    - 业务逻辑验证
```

#### 2️⃣ 库存并发控制实现

```
[ ] InventoryService 实现
[ ] 乐观锁测试
[ ] 高并发场景验证
```

#### 3️⃣ 核心流程验证

```
[ ] 下单 → 支付 → 发货完整流程
[ ] GraphQL端到端测试
[ ] 前后端集成测试
```

---

## 📋 代码质量标准

所有新代码都应遵循：

### ✅ 必须做

- [ ] 完整的TypeDoc注释（中文）
- [ ] 业务逻辑说明和使用场景
- [ ] 参数和返回值文档
- [ ] 异常处理和抛出说明
- [ ] 代码示例（@example）

### ✅ 应该做

- [ ] 单元测试覆盖率 > 80%
- [ ] 接口类型定义完整
- [ ] 错误处理全面
- [ ] 日志记录适当

### ❌ 不应该做

- [ ] 没有注释的复杂逻辑
- [ ] 魔法数字（硬编码值）
- [ ] 过度复杂的嵌套逻辑
- [ ] SQL注入风险
- [ ] N+1查询问题

---

## 🔄 迭代计划

### Sprint 1 (Week 1)
- ProductService 完整实现
- 基础GraphQL查询
- 单元测试

### Sprint 2 (Week 2)
- 库存管理系统
- 购物车系统
- 并发测试

### Sprint 3 (Week 3)
- 订单系统
- 支付模块
- 前端集成

### Sprint 4 (Week 4)
- 性能优化
- 完整端到端测试
- 文档完善

---

## 📚 文档

- [x] `docs/ECOMMERCE_ARCHITECTURE.md` - 完整架构设计
- [ ] `docs/ECOMMERCE_API_SPEC.md` - API规范（待创建）
- [ ] `docs/ECOMMERCE_DATABASE_SCHEMA.md` - 数据库设计（待创建）
- [ ] `docs/ECOMMERCE_TESTING_GUIDE.md` - 测试指南（待创建）

---

## ⚠️ 重要提醒

### 关键依赖

- ✅ TypeORM已安装
- ✅ PostgreSQL已配置
- ✅ NestJS已搭建
- ✅ GraphQL已集成
- ✅ Apollo已配置

### 性能考虑

- 使用QueryBuilder避免N+1查询
- 使用DataLoader加载关联数据
- 适当使用缓存（Redis）
- 合理的数据库索引
- 事务隔离级别考虑

### 安全考虑

- 验证所有输入
- SQL参数化（TypeORM自动处理）
- 权限检查（@UseGuards）
- 敏感数据加密
- 审计日志记录

---

## 总结

**电商模块是一个完整的、生产级别的系统，包含：**

✅ 6个核心产品实体（已完成）
✅ 完整的架构设计文档
✅ 清晰的实现路线图
✅ 代码质量标准
✅ 性能优化建议
✅ 并发控制方案

**下一步：** 实现产品管理服务层，为整个电商系统建立坚实基础。

