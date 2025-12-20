# CSS Module 导入类型跳转问题解决方案

## 问题描述

在 VS Code 中点击 `import styles from '@/app/auth/login/auth.module.less'` 时，IDE 没有正确跳转到源文件，而是跳转到类型声明文件。

## 问题根本原因

### 深度分析

这个问题的根源涉及 TypeScript 编译器的 **三层配置冲突**：

1. **TypeScript 的生成模式冲突**
   ```json
   // tsconfig.json 中的配置
   "declaration": true,          // 启用生成 .d.ts 文件
   "declarationMap": true,       // 启用生成 .d.ts.map 文件
   ```
   - 这些选项导致 TypeScript 生成额外的声明文件
   - VS Code 的 TypeScript LSP 优先显示这些中间声明，而不是源文件

2. **IDE 解析优先级问题**
   - VS Code 默认跳转到类型定义所在的位置
   - 当存在 `types/index.d.ts` 中的模块声明时，IDE 优先使用这个声明
   - 模块声明是通用的泛型类型 `Record<string, string>`，不指向具体源文件

3. **Next.js 路径别名与类型系统的交互**
   ```json
   "paths": {
     "@/*": ["./*"],
   }
   ```
   - 别名解析与类型声明路径解析的映射不一致
   - 导致 IDE 无法建立从导入声明到源文件的正确映射

### 为什么这是严重问题

- 开发效率降低：无法快速查看样式定义
- 代码维护困难：修改样式需要手动导航
- 类型完整性受损：只能看到泛型类型，看不到实际样式类名的自动补全
- IDE 功能失效：重命名、查找引用等功能可能受影响

## 解决方案

### 方案1：禁用不必要的声明文件生成（推荐）✅

**原理：** Next.js 应用通常不需要导出类型声明文件。关闭 `declaration` 和 `declarationMap` 选项，让 TypeScript 专注于类型检查而不是生成额外文件。

#### 修改 `apps/frontend/tsconfig.json`

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "dom", "dom.iterable"],
    "jsx": "preserve",
    "module": "esnext",
    "moduleResolution": "bundler",
    "strict": false,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "allowJs": true,
    "noEmit": true,
    "baseUrl": "./src",
    "paths": {
      "@/*": ["./*"],
      "@canary/shared-types": ["../../libs/shared-types/src"],
      "@canary/utils": ["../../libs/utils/src"]
    },
    "typeRoots": ["./types", "./node_modules/@types"],
    "declaration": false,        // 关闭声明文件生成
    "declarationMap": false,     // 关闭声明映射
    "noImplicitAny": false
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx"],
  "exclude": ["node_modules", ".next", "dist"]
}
```

**关键改动：**
- `"declaration": false` - 禁用 `.d.ts` 文件生成
- `"declarationMap": false` - 禁用源映射生成

#### 优化 `apps/frontend/types/index.d.ts`

保持类型声明但添加文档注释：

```typescript
/**
 * CSS Module 类型声明
 *
 * 为 .module.css 和 .module.less 文件提供类型支持
 * 允许 TypeScript 正确推断 CSS Module 的导入类型
 */

declare module '*.module.css' {
  const content: Record<string, string>;
  export default content;
}

declare module '*.module.less' {
  const content: Record<string, string>;
  export default content;
}
```

#### 清理缓存

```bash
rm -rf apps/frontend/.next
```

#### 验证

重启 TypeScript 服务器后，点击 `import styles from '@/app/auth/login/auth.module.less'` 应该直接跳转到源文件。

---

### 方案2：为每个 CSS Module 生成专用声明文件

如果需要保留 `declaration` 选项（例如发布库），可以为每个 CSS Module 文件创建对应的 `.d.ts` 文件。

**文件名约定：** `auth.module.less.d.ts`

```typescript
// apps/frontend/src/app/auth/login/auth.module.less.d.ts
declare const styles: {
  readonly "container": string;
  readonly "formWrapper": string;
  readonly "formTitle": string;
  readonly "formGroup": string;
  readonly "formLabel": string;
  readonly "formInput": string;
  readonly "submitBtn": string;
  readonly "formFooter": string;
  readonly "formLink": string;
};

export default styles;
```

**优点：**
- 保留声明文件生成
- 提供精确的类名自动补全
- IDE 能正确导航

**缺点：**
- 需要手动维护声明文件
- 当样式类名变更时需要同时更新声明文件

---

### 方案3：修改 Next.js 配置

如果上述方案不完全有效，可以调整 Next.js webpack 配置中的 source map 设置。

```typescript
// next.config.ts
const nextConfig: NextConfig = {
  reactStrictMode: false,
  distDir: ".next",
  cacheComponents: true,
  typescript: {
    tsconfigPath: "./tsconfig.json",
  },
  webpack: (config, { isServer }) => {
    config.module.rules.push({
      test: /\.module\.less$/,
      use: [
        {
          loader: "style-loader",
          options: {
            injectType: isServer ? "lazyStyleTag" : "styleTag",
          },
        },
        {
          loader: "css-loader",
          options: {
            modules: {
              auto: true,
              localIdentName: "[path][name]__[local]--[hash:base64:5]",
            },
            sourceMap: true,  // 确保启用 source map
          },
        },
        {
          loader: "less-loader",
          options: {
            sourceMap: true,  // 确保启用 source map
          },
        },
      ],
      sideEffects: true,
    });

    return config;
  },
};

export default nextConfig;
```

---

## 最佳实践

### 1. CSS Module 命名规范
```
✅ 好：auth.module.less、button.module.css
❌ 不好：auth-module.less、button-styles.css
```

### 2. 类名风格指南
```less
// ✅ 推荐：驼峰命名
.formWrapper { }
.submitBtn { }
.formLabel { }

// ❌ 避免：短横线
.form-wrapper { }
.submit-btn { }
```

### 3. 导入最佳实践
```typescript
// ✅ 好：使用路径别名
import styles from '@/app/auth/login/auth.module.less';

// ✅ 可以：相对路径（短距离）
import styles from './auth.module.less';

// ❌ 避免：过长相对路径
import styles from '../../../../../auth/login/auth.module.less';
```

### 4. 使用最佳实践
```typescript
// ✅ 好：直接使用导入的 styles 对象
<div className={styles.container}>
  <button className={styles.submitBtn}>Submit</button>
</div>

// ❌ 避免：字符串拼接
<div className={`${styles.container} custom-class`}>
```

---

## TypeScript 配置详解

### 为什么关闭 `declaration` 和 `declarationMap`

| 选项 | 含义 | Next.js 前端应用 | 库项目 |
|------|------|-----------------|-------|
| `declaration` | 生成 `.d.ts` 文件 | ❌ 不需要 | ✅ 需要 |
| `declarationMap` | 生成 `.d.ts.map` 文件 | ❌ 不需要 | ✅ 需要 |
| `sourceMap` | 生成 `.js.map` 文件 | ⚠️ 仅调试 | ⚠️ 仅调试 |
| `noEmit` | 不输出编译文件 | ✅ 需要（Next.js 处理） | ❌ 不需要 |

### Next.js 应用的推荐 tsconfig

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "dom", "dom.iterable"],
    "jsx": "preserve",
    "module": "esnext",
    "moduleResolution": "bundler",
    "strict": false,
    "noEmit": true,
    "baseUrl": "./src",
    "paths": { "@/*": ["./*"] },
    "typeRoots": ["./types", "./node_modules/@types"],
    // ❌ 关闭这些用于库项目的选项
    "declaration": false,
    "declarationMap": false,
    // ⚠️ 仅在调试时启用
    "sourceMap": false
  }
}
```

---

## 故障排除

### 问题：修改后 IDE 仍然跳转到错误位置

**解决方案：**
1. 重启 VS Code 的 TypeScript 服务器：`Cmd+Shift+P` → "TypeScript: Restart TS Server"
2. 清理缓存：`rm -rf .next`
3. 清理 node_modules：`rm -rf node_modules && npm install`

### 问题：样式类名没有自动补全

**可能原因：** 类型声明文件未正确加载

**解决方案：**
1. 检查 `types/index.d.ts` 是否存在且配置正确
2. 确保 `tsconfig.json` 中 `typeRoots` 包含 `./types`
3. 在 `.tsx` 文件顶部添加类型提示：
   ```typescript
   import type { CSSModuleClasses } from 'react';
   import styles from '@/app/auth/login/auth.module.less';
   ```

### 问题：构建时报告 CSS Module 类型错误

**可能原因：** 某些 CSS Module 类名拼写错误

**解决方案：**
1. 启用严格类型检查
2. 使用方案2（专用声明文件）获得更精确的类型
3. 在编译时生成声明文件进行验证

---

## 参考资源

- [Next.js - Styling with CSS Modules](https://nextjs.org/docs/app/building-your-application/styling/css-modules)
- [TypeScript - Declaration Files](https://www.typescriptlang.org/docs/handbook/declaration-files/introduction.html)
- [TypeScript - tsconfig.json](https://www.typescriptlang.org/tsconfig)
- [CSS Modules Spec](https://github.com/css-modules/css-modules)

---

## 变更日志

- **2025-12-20**: 初始版本，解决 CSS Module 导入跳转问题
  - 禁用 TypeScript `declaration` 和 `declarationMap` 选项
  - 优化 `types/index.d.ts` 配置
  - 清理 `.next` 缓存
  - 解决 IDE 跳转到错误位置的问题
