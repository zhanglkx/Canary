# CSS Module 迁移快速参考

## 什么被改变了？

### 1️⃣ 全局设计系统（新增）
- **文件**: `apps/web/src/styles/components.less`
- **内容**: 40+ 可复用组件类（按钮、卡片、表单、表格等）
- **导入**: 自动在 `globals.less` 中导入

### 2️⃣ 页面样式迁移
从 Tailwind inline className 迁移到 CSS Module：

```tsx
// ❌ 之前 (Tailwind)
<div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">

// ✅ 之后 (CSS Module)
import styles from './page.module.less'
<div className={styles.container}>
```

### 3️⃣ 已改进的页面

| 页面 | 改进内容 |
|------|--------|
| `/login` | ✅ CSS Module + 完整验证 |
| `/register` | ✅ CSS Module + 密码检查 |
| `/checkout` | ✅ 添加地址表单 + 支付方式选择 |
| `/orders` | ✅ 交互式订单详情 + 状态徽章 |
| `/shop/[id]` | ✅ 新增产品详情页 |
| `error.tsx` | ✅ 新增全局错误处理 |
| `not-found.tsx` | ✅ 新增 404 页面 |

## 使用现有组件类

### 按钮
```tsx
<button className={styles.btn + ' ' + styles.primary}>按钮</button>
// 或使用全局组件库
<button className="btn primary">按钮</button>
```

### 表单
```tsx
<label className={styles.label}>标签文本</label>
<input className={styles.input} type="text" />
<input className={`${styles.input} ${styles.error}`} />
```

### 卡片
```tsx
<div className={styles.card}>
  <div className={styles.cardHeader}>标题</div>
  <div className={styles.cardBody}>内容</div>
  <div className={styles.cardFooter}>页脚</div>
</div>
```

### 网格布局
```tsx
<div className={styles.grid}>
  <div>网格项1</div>
  <div>网格项2</div>
</div>
```

## 创建新页面（模板）

### 1. 创建 TypeScript 页面
```tsx
'use client';

import styles from './page.module.less'

export default function MyPage() {
  return (
    <div className={styles.container}>
      <div className={styles.wrapper}>
        <h1 className={styles.title}>标题</h1>
        {/* 内容 */}
      </div>
    </div>
  )
}
```

### 2. 创建 CSS Module 文件
```less
@import '@/styles/variables.less';
@import '@/styles/mixins.less';

.container {
  min-height: 100vh;
  background-color: @gray-50;

  :global(.dark) & {
    background-color: @gray-900;
  }
}

.wrapper {
  max-width: 80rem;
  margin: 0 auto;
  padding: @spacing-lg;
}

.title {
  font-size: @font-size-3xl;
  font-weight: 700;
  color: @gray-900;

  :global(.dark) & {
    color: white;
  }
}
```

## 设计令牌速查表

### 颜色
```less
@primary-color: #3b82f6;      // 蓝色
@secondary-color: #8b5cf6;    // 紫色
@success-color: #10b981;      // 绿色
@warning-color: #f59e0b;      // 橙色
@error-color: #ef4444;        // 红色
@info-color: #06b6d4;         // 青色

// 灰度色
@gray-50 ~ @gray-900
```

### 间距
```less
@spacing-xs: 4px;
@spacing-sm: 8px;
@spacing-md: 16px;
@spacing-lg: 24px;
@spacing-xl: 32px;
@spacing-2xl: 48px;
@spacing-3xl: 64px;
@spacing-4xl: 96px;
```

### 字体大小
```less
@font-size-xs: 0.75rem;
@font-size-sm: 0.875rem;
@font-size-base: 1rem;
@font-size-lg: 1.125rem;
// ... 到 @font-size-6xl
```

### 圆角
```less
@border-radius: 8px;
@border-radius-sm: 4px;
@border-radius-lg: 12px;
@border-radius-xl: 16px;
@border-radius-2xl: 24px;
@border-radius-full: 9999px;
```

### 阴影
```less
@shadow-sm    // 轻微阴影
@shadow       // 默认阴影
@shadow-md    // 中等阴影
@shadow-lg    // 大阴影
@shadow-xl    // 特大阴影
```

### 断点
```less
@breakpoint-sm: 640px;
@breakpoint-md: 768px;
@breakpoint-lg: 1024px;
@breakpoint-xl: 1280px;
@breakpoint-2xl: 1536px;
```

## 常用 Mixins

```less
// Flexbox 布局
.flex-center();      // 水平和垂直居中
.flex-between();     // 两端对齐
.flex-col();         // 列布局

// 文本
.text-ellipsis();           // 单行省略
.text-ellipsis-lines(@lines); // 多行省略（如 @lines: 2）

// 按钮
.button-base();      // 按钮基础样式

// 卡片
.card();             // 卡片样式

// 渐变
.gradient-primary(); // 主色渐变
.gradient-success(); // 成功色渐变

// 动画
.animate-fade-in();  // 淡入动画
```

## 暗色模式

所有样式都通过 `:global(.dark)` 支持暗色模式：

```less
.myClass {
  background-color: white;
  color: @gray-900;

  :global(.dark) & {
    background-color: @gray-800;
    color: white;
  }
}
```

## 响应式设计

```less
// 小于 md 断点
@media (max-width: @breakpoint-md) {
  flex-direction: column;
  grid-template-columns: 1fr;
}

// 大于等于 lg 断点
@media (min-width: @breakpoint-lg) {
  display: grid;
  grid-template-columns: 2fr 1fr;
}
```

## 文件位置

```
apps/web/src/
├── styles/
│   ├── variables.less    # 设计令牌
│   ├── mixins.less       # Less 函数
│   ├── components.less   # 组件库 ⭐ 新增
│   └── globals.less      # 全局样式
├── app/
│   ├── page.module.less                  # 各页面样式
│   ├── login/page.module.less
│   ├── register/page.module.less
│   ├── checkout/page.module.less
│   └── orders/page.module.less
```

## 常见错误

### ❌ 错误 1: 忘记导入样式
```tsx
// ❌ 错误
<div className={styles.container}>

// ✅ 正确
import styles from './page.module.less'
<div className={styles.container}>
```

### ❌ 错误 2: 混合使用 Tailwind 和 CSS Module
```tsx
// ❌ 错误
<div className={`${styles.container} flex items-center`}>

// ✅ 正确
<div className={styles.container}>
  {/* 使用 CSS Module 中的 flexCenter 或创建对应类 */}
</div>
```

### ❌ 错误 3: 忘记暗色模式
```less
// ❌ 错误
.myClass {
  color: @gray-900;
}

// ✅ 正确
.myClass {
  color: @gray-900;

  :global(.dark) & {
    color: white;
  }
}
```

### ❌ 错误 4: 使用硬编码颜色
```less
// ❌ 错误
.button {
  background-color: #3b82f6;
}

// ✅ 正确
.button {
  background-color: @primary-color;
}
```

## 测试命令

```bash
# 开发
pnpm dev

# 构建
pnpm build

# 检查 CSS 文件大小
ls -lh apps/web/.next/static/css/

# 页面测试列表
# 直接访问以下 URL：
# http://localhost:3000/               (首页)
# http://localhost:3000/login          (登录)
# http://localhost:3000/register       (注册)
# http://localhost:3000/checkout       (结账 - 需要登录)
# http://localhost:3000/orders         (订单 - 需要登录)
# http://localhost:3000/shop/1         (产品详情)
# http://localhost:3000/invalid        (404 页面)
```

## 下一步

1. **迁移剩余页面** - dashboard, todos, categories, cart, profile, shop
2. **创建组件文档** - Storybook 或类似工具
3. **性能审计** - 检查 CSS bundle 大小
4. **无障碍检查** - WCAG 2.1 AA 标准
5. **浏览器测试** - 跨浏览器兼容性

---

**版本**: CSS Module 迁移 v1.0
**最后更新**: 2024-12-21
