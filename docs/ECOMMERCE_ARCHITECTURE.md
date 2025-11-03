# 电商模块完整架构设计

## 📋 目录

1. [系统设计](#系统设计)
2. [核心业务模块](#核心业务模块)
3. [数据库设计](#数据库设计)
4. [代码架构](#代码架构)
5. [实现规范](#实现规范)
6. [并发控制](#并发控制)
7. [集成指南](#集成指南)

---

## 系统设计

### 架构概述

```
┌─────────────────────────────────────────────────────┐
│                  Frontend (React/Next.js)            │
│  - Product Listing/Detail Pages                      │
│  - Shopping Cart                                     │
│  - Checkout & Order Tracking                        │
└──────────────┬──────────────────────────────────────┘
               │ GraphQL + Apollo Client
┌──────────────▼──────────────────────────────────────┐
│            GraphQL API Layer (NestJS)                │
│  ┌────────────────────────────────────────────────┐ │
│  │  Product Resolver | Order Resolver             │ │
│  │  Cart Resolver    | Payment Resolver           │ │
│  │  Search Resolver  | Review Resolver            │ │
│  └────────────────────────────────────────────────┘ │
└──────────────┬──────────────────────────────────────┘
               │ Service Layer
┌──────────────▼──────────────────────────────────────┐
│              Business Logic Layer                    │
│  ┌────────────────────────────────────────────────┐ │
│  │ ProductService | InventoryService              │ │
│  │ OrderService   | PaymentService                │ │
│  │ CartService    | ReviewService                 │ │
│  └────────────────────────────────────────────────┘ │
└──────────────┬──────────────────────────────────────┘
               │ TypeORM Repository Pattern
┌──────────────▼──────────────────────────────────────┐
│            Data Access Layer                         │
│  ┌────────────────────────────────────────────────┐ │
│  │ Product Repository | Order Repository          │ │
│  │ Inventory Repository                            │ │
│  └────────────────────────────────────────────────┘ │
└──────────────┬──────────────────────────────────────┘
               │ TypeORM + PostgreSQL
┌──────────────▼──────────────────────────────────────┐
│               PostgreSQL Database                    │
│  - Products, SKUs, Inventory                        │
│  - Orders, Order Items, Payments                    │
│  - Shopping Carts, Reviews                          │
└─────────────────────────────────────────────────────┘
```

### 关键设计原则

1. **DDD（Domain-Driven Design）**
   - 按业务域划分模块
   - 每个模块有清晰的职责

2. **分层架构**
   - 控制层 (Resolver) → 服务层 → 仓储层
   - 清晰的关注点分离

3. **设计模式应用**
   - 工厂模式：创建复杂对象
   - 策略模式：灵活的业务规则
   - 仓储模式：数据访问封装
   - 装饰器模式：权限和缓存

4. **数据一致性**
   - 事务保证一致性
   - 乐观锁处理并发
   - 业务规则验证

---

## 核心业务模块

### 1. 产品管理模块 (Product Module)

#### 关键实体

```
ProductCategory (产品分类)
├── 无限级分类
├── 物化路径优化查询
└── 排序和状态管理

ProductAttribute (产品属性)
├── 颜色、尺寸等规格
├── 支持多种输入类型
└── SKU识别标志

ProductAttributeValue (属性值)
├── 具体的属性取值
├── 显示名称和颜色代码
└── 排序和展示控制

Product (产品)
├── 产品基本信息
├── 价格和库存概况
├── 多图管理
└── SEO优化

ProductSku (库存单位)
├── 具体的产品变体
├── 属性组合JSON
├── 库存和预留
└── 乐观锁并发控制

ProductImage (产品图片)
├── 多用途图片
├── 主图/相册/细节
└── 缩略图和SEO
```

#### 核心功能

**查询功能**
```graphql
query {
  # 获取产品列表（带分页、排序、筛选）
  products(
    categoryId: "xxx"
    priceRange: { min: 100, max: 1000 }
    attributes: { color: "red", size: "M" }
    sortBy: POPULARITY
    page: 1
    limit: 20
  ) {
    id
    name
    basePrice
    skus { id skuCode price stock }
    images { url thumbnailUrl }
  }

  # 获取产品详情
  product(id: "xxx") {
    id
    name
    description
    category { id name }
    basePrice
    skus {
      id
      skuName
      attributeValues
      price
      availableStock
    }
    images { url purpose }
  }

  # 分类树形结构
  productCategories(parentId: null) {
    id name children { id name children { id name } }
  }
}
```

**创建/更新产品**
```graphql
mutation {
  createProduct(input: {
    name: "红色T恤"
    description: "..."
    categoryId: "xxx"
    basePrice: 99.99
    sku: "TSHIRT-RED"
  }) {
    id
  }

  createProductSku(input: {
    productId: "xxx"
    skuName: "T恤-红色-M"
    skuCode: "TSH-RED-M"
    attributeValues: { "颜色": "红色", "尺寸": "M" }
    price: 99
    stock: 100
  }) {
    id
    availableStock
  }

  updateProductStock(skuId: "xxx", quantity: 50) {
    id
    stock
    availableStock
  }
}
```

### 2. 库存管理模块 (Inventory Module)

#### 核心概念

- **库存(Stock)**：产品可用的总数量
- **预留库存(Reserved)**：已下单但未支付的数量
- **可用库存(Available)**：库存 - 预留 = 可用
- **乐观锁**：并发修改的版本控制

#### 库存流程

```
用户浏览产品 (查询可用库存)
    ↓
加入购物车 (库存不变)
    ↓
下单 (预留库存)
    ↓
支付成功 (扣减库存，取消预留)
    ↓
发货 (库存已正式出库)
    ↓
订单完成

---

订单取消或支付失败
    ↓
释放预留库存 (恢复)
```

#### 并发控制原理

```typescript
// 使用乐观锁处理并发

// 读取时：
const sku = await skuRepository.findOne(skuId);
// sku.version = 1

// 修改时：
sku.stock -= quantity;

// 保存时：
// TypeORM会执行：
// UPDATE product_skus
// SET stock = stock - quantity, version = version + 1
// WHERE id = skuId AND version = 1
//
// 如果版本号不匹配（被其他请求修改过），保存失败
// 需要重试或返回错误

await skuRepository.save(sku);
```

### 3. 购物车模块 (Shopping Cart Module)

#### 关键实体

```
ShoppingCart (购物车)
├── 用户ID
├── 创建和更新时间
└── 是否已转化为订单

ShoppingCartItem (购物车项)
├── SKU ID
├── 数量
├── 价格快照
└── 属性组合
```

#### 核心逻辑

```typescript
// 添加到购物车
addToCart(userId, skuId, quantity) {
  1. 检查SKU是否存在且启用
  2. 检查库存是否充足
  3. 查询购物车是否已有该SKU
     - 有：更新数量
     - 无：新增项目
  4. 保存当前SKU的价格和属性（价格可能变化）
  5. 返回更新后的购物车
}

// 获取购物车
getCart(userId) {
  1. 查询购物车和所有项
  2. 加载SKU和产品信息
  3. 重新计算是否有价格/库存变化
  4. 计算总价、优惠、税费
  5. 返回购物车摘要
}

// 清空购物车
clearCart(userId) {
  1. 删除用户的所有购物车项
  2. 删除购物车记录
}
```

### 4. 订单模块 (Order Module)

#### 订单状态流转

```
PENDING (待支付)
    ↓
PAID (已支付) ─→ CANCELLED (已取消)
    ↓
PROCESSING (处理中) ─→ CANCELLED (已取消)
    ↓
SHIPPED (已发货) ─→ RETURNED (已退货)
    ↓
DELIVERED (已收货)
    ↓
COMPLETED (已完成)
```

#### 关键实体

```
Order (订单)
├── 用户ID
├── 总价、税费、运费
├── 订单状态
├── 收货地址
├── 支付信息
└── 时间戳

OrderItem (订单项)
├── SKU ID
├── 数量
├── 单价（快照）
└── 属性组合

OrderLog (订单日志)
├── 订单ID
├── 操作类型（创建/支付/发货等）
├── 操作说明
└── 时间戳
```

#### 核心流程

```typescript
// 创建订单（事务）
createOrder(userId, input) {
  transaction {
    1. 查询用户的购物车
    2. 验证所有SKU库存充足
    3. 为每个SKU预留库存
    4. 创建订单记录
    5. 复制购物车项到订单项
    6. 清空购物车
    7. 返回订单ID
  }
}

// 支付订单（事务）
payOrder(orderId, paymentMethod) {
  transaction {
    1. 查询订单
    2. 验证订单状态为PENDING
    3. 调用支付网关
    4. 如果支付成功：
       a. 更新订单状态为PAID
       b. 扣减SKU库存（确认预留）
       c. 记录支付信息
    5. 如果支付失败：
       a. 释放预留库存
       b. 保持订单为PENDING
    6. 返回支付结果
  }
}

// 取消订单（事务）
cancelOrder(orderId, reason) {
  transaction {
    1. 查询订单
    2. 验证订单可被取消（未发货）
    3. 如果订单已支付：
       a. 处理退款
    4. 释放所有预留库存
    5. 更新订单状态为CANCELLED
    6. 记录取消日志
  }
}
```

### 5. 支付模块 (Payment Module)

#### 支付流程

```
用户选择支付方式
    ↓
调用支付网关API
    ↓
支付网关返回支付链接/结果
    ↓
用户完成支付
    ↓
回调通知系统
    ↓
更新订单状态
    ↓
扣减库存
```

#### 策略模式应用

```typescript
// 支付策略接口
interface PaymentStrategy {
  processPayment(order: Order, amount: number): Promise<PaymentResult>
  refund(payment: Payment, amount: number): Promise<RefundResult>
}

// 具体实现
class AlipayPaymentStrategy implements PaymentStrategy {
  // 支付宝支付实现
}

class WechatPaymentStrategy implements PaymentStrategy {
  // 微信支付实现
}

class StripePaymentStrategy implements PaymentStrategy {
  // Stripe支付实现
}

// 使用
const strategy = PaymentStrategyFactory.create(paymentMethod)
const result = await strategy.processPayment(order, amount)
```

### 6. 评价模块 (Review Module)

#### 关键实体

```
Review (评价)
├── 用户ID
├── 产品ID
├── SKU信息
├── 评分 (1-5)
├── 标题和内容
├── 图片
├── 有用数/无用数
└── 时间戳
```

#### 功能

```graphql
query {
  productReviews(productId: "xxx", sortBy: RECENT) {
    id
    rating
    title
    content
    images { url }
    author { username avatar }
    helpful
    unhelpful
    createdAt
  }
}

mutation {
  createReview(input: {
    productId: "xxx"
    rating: 5
    title: "质量不错"
    content: "..."
    images: ["url1", "url2"]
  }) {
    id
  }

  markReviewHelpful(reviewId: "xxx", helpful: true) {
    helpful
    unhelpful
  }
}
```

---

## 数据库设计

### 表结构设计原则

1. **规范化**：避免数据冗余
2. **性能优化**：合理的索引
3. **扩展性**：为未来功能预留字段
4. **一致性**：外键约束和级联删除

### 关键索引

| 表 | 索引 | 目的 |
|---|---|---|
| products | (categoryId, status) | 查询分类下的产品 |
| products | (name) | 产品名称搜索 |
| products | (status, createdAt) | 新上架产品排序 |
| product_skus | (productId, skuCode) | 快速找到产品的SKU |
| product_skus | (stock) | 库存为0的产品查询 |
| shopping_cart_items | (userId, skuId) | 快速查找购物车项 |
| orders | (userId, status) | 用户订单查询 |
| orders | (createdAt) | 订单日期范围查询 |

### 并发处理

```sql
-- 产品SKU表中的版本字段（乐观锁）
ALTER TABLE product_skus ADD COLUMN version INT DEFAULT 1;

-- 库存预留表
CREATE TABLE inventory_locks (
  id UUID PRIMARY KEY,
  sku_id UUID NOT NULL,
  order_id UUID,
  quantity INT NOT NULL,
  locked_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP,
  FOREIGN KEY (sku_id) REFERENCES product_skus(id)
);

-- 索引加速预留查询
CREATE INDEX idx_inventory_locks_sku ON inventory_locks(sku_id);
```

---

## 代码架构

### 文件结构

```
apps/api/src/ecommerce/
├── product/
│   ├── entities/
│   │   ├── product.entity.ts
│   │   ├── product-category.entity.ts
│   │   ├── product-sku.entity.ts
│   │   ├── product-attribute.entity.ts
│   │   ├── product-attribute-value.entity.ts
│   │   └── product-image.entity.ts
│   ├── dto/
│   │   ├── create-product.input.ts
│   │   ├── update-product.input.ts
│   │   ├── product.response.ts
│   │   └── ...
│   ├── services/
│   │   ├── product.service.ts
│   │   └── product-search.service.ts
│   ├── resolvers/
│   │   ├── product.resolver.ts
│   │   └── product-category.resolver.ts
│   ├── repositories/
│   │   ├── product.repository.ts
│   │   └── product-sku.repository.ts
│   └── product.module.ts
│
├── inventory/
│   ├── entities/
│   │   ├── inventory.entity.ts
│   │   └── inventory-lock.entity.ts
│   ├── services/
│   │   └── inventory.service.ts
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
│   └── shopping-cart.module.ts
│
├── order/
│   ├── entities/
│   │   ├── order.entity.ts
│   │   ├── order-item.entity.ts
│   │   └── order-log.entity.ts
│   ├── services/
│   │   ├── order.service.ts
│   │   └── order-payment.service.ts
│   ├── resolvers/
│   │   └── order.resolver.ts
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
│   │   └── require-auth.decorator.ts
│   ├── exceptions/
│   │   ├── insufficient-stock.exception.ts
│   │   ├── invalid-order-status.exception.ts
│   │   └── payment-failed.exception.ts
│   └── utils/
│       ├── price-calculator.ts
│       └── order-validator.ts
│
└── ecommerce.module.ts
```

### 服务层设计

```typescript
/**
 * ProductService - 产品业务逻辑
 *
 * 职责：
 * - 产品CRUD
 * - 产品搜索和筛选
 * - 产品发布/下架
 * - SKU管理
 */
@Injectable()
export class ProductService {
  constructor(
    private productRepository: Repository<Product>,
    private productSkuRepository: Repository<ProductSku>,
    private cacheManager: Cache,
  ) {}

  /**
   * 获取产品列表
   * 实现高效的分页、排序、筛选
   */
  async findProducts(
    filter: ProductFilterInput,
    pagination: PaginationInput,
  ): Promise<PaginatedResult<Product>> {
    // 使用QueryBuilder构建复杂查询
    // 应用缓存优化
  }

  /**
   * 获取产品详情及所有SKU
   */
  async findProductDetail(id: string): Promise<Product> {
    // 包括图片、SKU、属性等
  }

  /**
   * 创建产品
   * 事务：确保产品和默认SKU一起创建
   */
  async createProduct(input: CreateProductInput): Promise<Product> {
    // 事务处理
  }

  /**
   * 检查库存
   */
  async checkInventory(skuId: string, quantity: number): Promise<boolean> {
    // 检查是否有足够库存
  }
}

/**
 * InventoryService - 库存管理
 *
 * 职责：
 * - 库存查询
 * - 库存预留（下单时）
 * - 库存扣减（支付时）
 * - 库存释放（取消时）
 * - 并发控制
 */
@Injectable()
export class InventoryService {
  constructor(
    private productSkuRepository: Repository<ProductSku>,
    private inventoryLockRepository: Repository<InventoryLock>,
  ) {}

  /**
   * 获取可用库存（库存 - 预留）
   */
  async getAvailableStock(skuId: string): Promise<number> {
    // 查询并计算
  }

  /**
   * 预留库存（使用事务）
   * 当用户下单时调用，防止超卖
   */
  async reserveStock(
    orderId: string,
    items: Array<{ skuId: string; quantity: number }>,
  ): Promise<void> {
    // 事务处理
    // 使用乐观锁检测并发修改
  }

  /**
   * 确认库存扣减（使用事务）
   * 当订单支付时调用
   */
  async confirmStockDeduction(orderId: string): Promise<void> {
    // 从预留转为已出库
    // 更新销售计数
  }

  /**
   * 释放预留库存（使用事务）
   * 当订单取消或支付失败时调用
   */
  async releaseReservedStock(orderId: string): Promise<void> {
    // 恢复预留库存
  }
}

/**
 * OrderService - 订单管理
 *
 * 职责：
 * - 订单创建
 * - 订单状态管理
 * - 订单查询
 * - 与其他服务的编排
 */
@Injectable()
export class OrderService {
  constructor(
    private orderRepository: Repository<Order>,
    private cartService: ShoppingCartService,
    private inventoryService: InventoryService,
    private paymentService: PaymentService,
  ) {}

  /**
   * 创建订单（复杂的事务逻辑）
   */
  async createOrder(userId: string, input: CreateOrderInput): Promise<Order> {
    // 1. 获取购物车
    // 2. 验证库存
    // 3. 创建订单
    // 4. 预留库存
    // 5. 清空购物车
  }

  /**
   * 支付订单
   */
  async payOrder(
    orderId: string,
    paymentMethod: PaymentMethod,
  ): Promise<Order> {
    // 1. 获取订单
    // 2. 调用支付服务
    // 3. 扣减库存
    // 4. 更新订单状态
  }

  /**
   * 取消订单
   */
  async cancelOrder(orderId: string, reason: string): Promise<Order> {
    // 1. 验证订单状态
    // 2. 处理退款
    // 3. 释放库存
    // 4. 更新订单状态
  }
}
```

---

## 实现规范

### 代码注释规范

```typescript
/**
 * 获取产品列表
 *
 * 使用场景：
 * - 产品浏览页面
 * - 分类页面
 * - 搜索结果页
 *
 * 性能考虑：
 * - 使用PostgreSQL全文搜索
 * - Redis缓存热门分类
 * - 避免N+1查询（预加载关联）
 *
 * @param filter 筛选条件（分类、价格范围、属性）
 * @param pagination 分页信息（页码、每页数量、排序）
 * @returns 分页后的产品列表
 * @throws NotFoundException 如果分类不存在
 * @throws BadRequestException 如果筛选参数无效
 *
 * @example
 * ```typescript
 * const result = await productService.findProducts(
 *   { categoryId: 'cat-001', priceRange: { min: 100, max: 1000 } },
 *   { page: 1, limit: 20, sortBy: 'POPULARITY' }
 * );
 * ```
 */
async findProducts(
  filter: ProductFilterInput,
  pagination: PaginationInput,
): Promise<PaginatedResult<Product>> {
  // 实现...
}
```

### 错误处理规范

```typescript
// ✅ 好的实践
try {
  const sku = await this.skuRepository.findOne(skuId);
  if (!sku) {
    throw new NotFoundException(`产品SKU ${skuId} 不存在`);
  }

  if (!sku.hasEnoughStock(quantity)) {
    throw new InsufficientStockException(
      `库存不足。需要${quantity}件，只有${sku.availableStock}件可用`
    );
  }

  // 业务逻辑...
} catch (error) {
  this.logger.error(`预留库存失败: ${error.message}`);
  throw error;
}

// ❌ 避免
try {
  // ...
} catch (error) {
  console.log(error); // 不要用console
  throw error; // 泛泛的错误信息
}
```

### 事务处理规范

```typescript
/**
 * 创建订单 - 关键业务流程，必须用事务保证一致性
 */
@Transactional()
async createOrder(userId: string, input: CreateOrderInput): Promise<Order> {
  // 1. 所有读操作
  const cart = await this.cartService.getCart(userId);
  const items = await this.validateCartItems(cart);

  // 2. 所有写操作（在事务内）
  const order = new Order();
  order.userId = userId;
  order.totalPrice = this.calculateTotal(items);

  // 3. 预留库存（核心操作，需要乐观锁）
  await this.inventoryService.reserveStock(order.id, items);

  // 4. 保存订单
  await this.orderRepository.save(order);

  // 5. 清空购物车
  await this.cartService.clearCart(userId);

  // 如果任何操作失败，整个事务回滚，库存预留也被撤销
  return order;
}
```

### 缓存策略

```typescript
@Injectable()
export class ProductService {
  /**
   * 获取产品分类（缓存热数据）
   * 缓存时间：1小时
   * 缓存键：product:categories
   */
  async getCategories(): Promise<ProductCategory[]> {
    const cached = await this.cacheManager.get('product:categories');
    if (cached) return cached;

    const categories = await this.categoryRepository.find({
      where: { isActive: true },
    });

    await this.cacheManager.set('product:categories', categories, 3600000);
    return categories;
  }

  /**
   * 创建产品时，清除相关缓存
   */
  async createProduct(input: CreateProductInput): Promise<Product> {
    const product = await this.productRepository.save(input);

    // 清除缓存
    await this.cacheManager.del('product:categories');

    return product;
  }
}
```

---

## 并发控制

### 乐观锁实现

```typescript
/**
 * 库存扣减 - 使用乐观锁处理高并发
 *
 * 原理：
 * 1. 读取SKU时获取version字段
 * 2. 修改SKU后，保存时检查version是否未变
 * 3. 如果version已变，说明有其他请求修改过，需要重试
 */
async deductStock(
  skuId: string,
  quantity: number,
  maxRetries: number = 3,
): Promise<void> {
  for (let i = 0; i < maxRetries; i++) {
    const sku = await this.skuRepository.findOne(skuId);

    if (sku.stock < quantity) {
      throw new InsufficientStockException('库存不足');
    }

    sku.stock -= quantity;

    try {
      // TypeORM自动检查version，如果不匹配会抛异常
      await this.skuRepository.save(sku);
      return; // 成功，退出
    } catch (error) {
      if (i === maxRetries - 1) {
        throw new Error('库存扣减失败，请重试');
      }
      // 重试
    }
  }
}
```

### 分布式锁（可选）

```typescript
/**
 * 使用Redis分布式锁处理分布式系统中的并发
 */
async reserveStockWithLock(
  skuId: string,
  quantity: number,
): Promise<void> {
  const lockKey = `inventory:lock:${skuId}`;
  const lockValue = uuidv4();

  try {
    // 尝试获得锁（30秒超时）
    const locked = await this.redis.set(
      lockKey,
      lockValue,
      'PX',
      30000,
      'NX',
    );

    if (!locked) {
      throw new Error('无法获取锁，请重试');
    }

    // 持有锁的情况下执行操作
    const sku = await this.skuRepository.findOne(skuId);
    sku.reserveStock(quantity);
    await this.skuRepository.save(sku);

  } finally {
    // 释放锁
    const current = await this.redis.get(lockKey);
    if (current === lockValue) {
      await this.redis.del(lockKey);
    }
  }
}
```

---

## 集成指南

### 注册电商模块

```typescript
// app.module.ts
import { EcommerceModule } from './ecommerce/ecommerce.module';

@Module({
  imports: [
    // ... 其他模块
    EcommerceModule,
  ],
})
export class AppModule {}
```

### 使用GraphQL API

```graphql
# 查询产品列表
query {
  products(
    filter: {
      categoryId: "cat-001"
      priceRange: { min: 100, max: 1000 }
      search: "T恤"
    }
    pagination: { page: 1, limit: 20, sortBy: POPULARITY }
  ) {
    totalCount
    items {
      id
      name
      basePrice
      category { name }
      images { url }
      skus {
        id
        skuCode
        attributeValues
        price
        availableStock
      }
    }
  }
}

# 创建订单
mutation {
  createOrder(input: {
    items: [
      { skuId: "sku-001", quantity: 2 }
      { skuId: "sku-002", quantity: 1 }
    ]
    shippingAddress: { ... }
  }) {
    id
    orderNumber
    totalPrice
    status
  }
}
```

---

## 性能优化建议

1. **数据库**
   - 合理的索引
   - 避免JOIN过多表
   - 使用JSONB字段存储灵活数据

2. **缓存**
   - Redis缓存热数据（分类、热门产品）
   - 缓存产品详情页
   - 缓存聚合数据（销量排名等）

3. **查询优化**
   - 使用DataLoader防止N+1查询
   - 预加载关联数据
   - 分页查询大数据集

4. **并发**
   - 乐观锁处理库存并发
   - 异步处理非关键操作（发送通知、日志）
   - 考虑使用消息队列

5. **监控**
   - 监控库存预留失败率
   - 监控支付成功率
   - 监控订单创建延迟

---

## 总结

这个电商模块设计体现了：
- ✅ 清晰的领域划分
- ✅ 良好的分层架构
- ✅ 设计模式的应用
- ✅ 并发控制机制
- ✅ 数据一致性保证
- ✅ 完整的错误处理
- ✅ 性能优化考虑
- ✅ 生产级代码质量
