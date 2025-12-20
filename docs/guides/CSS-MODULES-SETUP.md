# CSS/LESS Modules 导航问题解决方案

## 问题描述

当在 VS Code 中使用 "Go to Definition" (Ctrl+Click 或 F12) 点击 CSS/LESS 模块导入时：

```typescript
import styles from '@/app/auth/login/auth.module.less';
```

**错误行为**: 跳转到 Next.js 的全局类型声明文件 (`node_modules/next/types/global.d.ts`)

**正确行为**: 直接跳转到实际的源文件 (`apps/frontend/src/app/auth/login/auth.module.less`)

## 根本原因分析

TypeScript 的模块解析有以下优先级：

1. **具体的 `.d.ts` 文件** (例如 `auth.module.less.d.ts`) - 优先级最高
2. **全局的模块声明** (例如 `declare module '*.module.less'`) - 优先级次之
3. **实际的源文件** - 最后才看源文件

如果只在 `global.d.ts` 中使用通配符声明 `declare module '*.module.less'`，TypeScript 会将所有 `.less` 模块映射到这个声明，导致 VS Code 无法找到具体的源文件。

## 解决方案

### 1️⃣ 为每个 CSS/LESS 模块创建对应的 `.d.ts` 文件

例如，如果有 `auth.module.less` 文件，创建 `auth.module.less.d.ts`：

```typescript
// src/app/auth/login/auth.module.less.d.ts
declare const styles: {
  readonly container: string;
  readonly formWrapper: string;
  readonly formTitle: string;
  readonly formGroup: string;
  readonly formLabel: string;
  readonly formInput: string;
  readonly submitBtn: string;
  readonly formFooter: string;
  readonly formLink: string;
};
export default styles;
```

**关键点**:
- 文件名必须是 `[名称].module.less.d.ts` (或 `.css.d.ts`)
- 必须与源文件在同一目录
- 包含所有实际的类名定义
- 使用 `readonly` 确保类型安全

### 2️⃣ 更新 tsconfig.json

确保 TypeScript 能找到这些 `.d.ts` 文件：

```json
{
  "compilerOptions": {
    "baseUrl": "./src",
    "paths": {
      "@/*": ["./*"],
      "@canary/shared-types": ["../../libs/shared-types/src"],
      "@canary/utils": ["../../libs/utils/src"]
    },
    "declaration": true,
    "declarationMap": true
  },
  "include": [
    "next-env.d.ts",
    "**/*.ts",
    "**/*.tsx",
    "**/*.css.d.ts",
    "**/*.less.d.ts"
  ]
}
```

**关键配置**:
- `baseUrl: "./src"` - 设置路径解析的根目录
- `paths` - 定义路径别名 (`@/*`)
- `include` - **重要**: 包含 `**/*.css.d.ts` 和 `**/*.less.d.ts`

### 3️⃣ 保留全局声明作为备用

在 `global.d.ts` 中保留通配符声明，但作为备用（用于任何没有具体 `.d.ts` 文件的模块）：

```typescript
// src/global.d.ts
/**
 * CSS/LESS Modules 全局类型声明
 *
 * 注意：为了让 VS Code 的 "Go to Definition" 功能能够正确跳转到实际的 CSS/LESS 文件，
 * 我们需要为每个模块创建对应的 .d.ts 文件（例如 auth.module.less.d.ts）
 * 而不是在这里使用通配符声明。通配符会导致跳转到类型声明文件而不是源文件。
 */

declare module '*.module.css' {
  const styles: { [key: string]: string };
  export default styles;
}

declare module '*.module.less' {
  const styles: { [key: string]: string };
  export default styles;
}
```

### 4️⃣ 正确的导入路径

在组件中导入时，使用完整的路径别名：

```typescript
// ✅ 正确 - 完整路径，可正确导航
import styles from '@/app/auth/login/auth.module.less';

// ✅ 正确 - 相对路径（同一目录）
import styles from './auth.module.less';

// ❌ 错误 - 路径不完整
import styles from '@/login/auth.module.less';
```

## 现在如何工作

1. **TypeScript 优先查找** `auth.module.less.d.ts`
2. **找到后** 立即返回该文件作为模块定义
3. **VS Code 理解** 这个 `.d.ts` 文件直接对应源文件
4. **Go to Definition** 能够准确地跳转到源文件

## 工作流程总结

```
import styles from '@/app/auth/login/auth.module.less'
         ↓
TypeScript 查找模块定义
         ↓
找到 auth.module.less.d.ts (同目录)
         ↓
VS Code 识别对应源文件
         ↓
Go to Definition → 正确跳转到 auth.module.less ✅
```

## 检查清单

- [ ] 为每个 `.module.css` 或 `.module.less` 文件创建对应的 `.d.ts` 文件
- [ ] 在 `tsconfig.json` 的 `include` 中添加 `**/*.css.d.ts` 和 `**/*.less.d.ts`
- [ ] 在 `tsconfig.json` 中设置正确的 `baseUrl` 和 `paths`
- [ ] 在 `global.d.ts` 中保留通配符声明作为备用
- [ ] 验证导入路径完整性 (`@/app/auth/login/auth.module.less`)

## 预期效果

现在在 VS Code 中 Ctrl+Click 或 F12 应该能够直接跳转到实际的 CSS/LESS 文件，而不是类型声明文件。🎯
