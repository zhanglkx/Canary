# VS Code Go to Definition - 最终完美解决方案 ✅

## 问题的根本原因理解

TypeScript/VS Code 的模块导入优先级：

1. **`src/` 目录中的 `.d.ts` 文件** - 最高优先级（会阻止跳转到源文件）❌
2. **`global.d.ts`** - 高优先级（会阻止跳转）❌
3. **`typeRoots` 中的外部 types** - 中优先级（如果在 `types/` 目录，不会直接影响源文件导航）✅
4. **实际的源文件** - 最低优先级（没有声明时才会被识别）

## 完美的解决方案

### 1️⃣ 清空 `src/global.d.ts`
```typescript
// 保持完全空白！
```

**原因**: 任何在这里的 CSS/LESS 声明都会被优先级更高的文件（如果存在的话）优先调用，或阻止源文件的直接导航。

### 2️⃣ 在 `types/index.d.ts` 中放置声明
```typescript
// types/index.d.ts
declare module '*.module.css' {
  const content: Record<string, string>;
  export default content;
}

declare module '*.module.less' {
  const content: Record<string, string>;
  export default content;
}
```

**原因**: 这个位置的声明只用于类型检查，不会干扰 VS Code 的导航。

### 3️⃣ 在 `tsconfig.json` 中配置
```json
{
  "compilerOptions": {
    "typeRoots": ["./types", "./node_modules/@types"]
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx"]
}
```

**关键点**:
- `typeRoots` 优先级低于 `src/` 中的声明
- 不要在 `include` 中加入 `**/*.d.ts` - 这样会让 TS 把所有 `.d.ts` 文件都当作源文件

### 4️⃣ 保持 `src/` 中干净
- ❌ 不要在 `src/` 中有 `.d.ts` 文件
- ❌ 不要在 `src/global.d.ts` 中有模块声明
- ✅ 只让 `.ts`, `.tsx`, `.css`, `.less` 文件在 `src/` 中

## 现在的流程

```
Ctrl+Click 在: import styles from './auth.module.less'
    ↓
VS Code 查询 TypeScript
    ↓
检查 src/ 中是否有 .d.ts 文件
    ↓ NO ✅
检查 global.d.ts
    ↓ 空的 ✅
查看实际的源文件 auth.module.less
    ↓ 找到了！
Go to Definition → 正确跳转到 auth.module.less ✅
```

## 验证检查清单

```
✅ src/global.d.ts - 完全空白
✅ types/index.d.ts - 包含 CSS/LESS 模块声明
✅ tsconfig.json - typeRoots 指向 ./types
✅ tsconfig.json - include 不包含 **/*.d.ts
✅ 没有其他 .d.ts 文件在 src/ 目录中
```

## 如何验证 VS Code 现在工作正确

1. **重启 VS Code** 或 `Ctrl+Shift+P` → "Reload Window"
2. 打开 `src/app/dashboard/page.tsx`
3. Ctrl+Click 在导入行：`import styles from '@/app/auth/login/auth.module.less';`
4. 应该正确跳转到：`src/app/auth/login/auth.module.less`

## 如果还是不行

1. 关闭所有 VS Code 窗口
2. 删除 `.vscode` 中的缓存：`rm -rf .vscode/.typescript`
3. 重新打开项目

## 最重要的理解

**关键洞察**: 声明文件不应该在源代码树中（`src/`）。只应该在专门的 `types/` 目录中。这样 TypeScript 用它们做类型检查，但 VS Code 的导航知道要找到真实的源文件。
