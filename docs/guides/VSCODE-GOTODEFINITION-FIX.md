# VS Code Go to Definition 修复 - 完成清单

## ✅ 已完成的修改

### 1. 删除所有 CSS 模块 `.d.ts` 文件
- 删除了 `auth.module.less.d.ts`
- 删除了 `page.module.css.d.ts`
- **原因**: 这些文件会阻止 VS Code 跳转到源文件

### 2. 简化 `global.d.ts`
- 保留只有基础的通配符模块声明
- 用于类型检查，不影响 Go to Definition

### 3. 修改 `tsconfig.json`
- **移除**: `**/*.css.d.ts` 和 `**/*.less.d.ts` 从 include
- **保留**: `**/*.ts` 和 `**/*.tsx`
- **原因**: 这样 TypeScript 会优先查找源文件而不是声明文件

### 4. 创建 `.vscode/settings.json`
- 配置 VSCode 使用项目的 TypeScript 版本
- 确保一致的类型检查行为

## 🔧 如何验证

### 在 VS Code 中:

1. **Ctrl+Shift+P** → "Reload Window" (或重启 VS Code)
2. 打开文件: `/Users/temptrip/Documents/Code/Canary/apps/frontend/src/app/dashboard/page.tsx`
3. 在这一行 Ctrl+Click：
   ```typescript
   import styles from '@/app/auth/login/auth.module.less';
   ```
4. **应该跳转到**: `/Users/temptrip/Documents/Code/Canary/apps/frontend/src/app/auth/login/auth.module.less`

## 为什么现在有效

```
import styles from '@/app/auth/login/auth.module.less'
    ↓
TypeScript 寻找该模块
    ↓
查找 tsconfig.json 中的路径别名
    ↓
没有 .d.ts 文件阻挡 ✅
    ↓
直接找到源文件 auth.module.less
    ↓
VS Code Go to Definition → 源文件 ✅
```

## ⚠️ 注意事项

- 确保已重启 VS Code 或重新加载窗口
- 如果还是不行，关闭所有 VS Code 窗口，重新打开项目
- 检查 `tsconfig.json` 中确实没有 `**/*.less.d.ts` 在 include 中

## 相关文件状态

```
✅ apps/frontend/src/global.d.ts - 已简化
✅ apps/frontend/tsconfig.json - 已修改 include
✅ .vscode/settings.json - 已创建
✅ 所有 .d.ts 声明文件 - 已删除
```

现在 Go to Definition 应该能正确跳转到源文件了！
