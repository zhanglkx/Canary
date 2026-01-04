# 🐛 Canary 调试快速启动

## 3 步开始调试

### 第 1 步：启动数据库
```bash
docker-compose up -d postgres
```

### 第 2 步：在 VS Code 中按 F5
选择：**🎯 完整全栈调试 (后端 + 前端 + 浏览器)**

### 第 3 步：设置断点并开始调试！

---

## 📍 推荐的断点位置

### 后端断点
```typescript
// apps/api/src/main.ts (第 62 行)
console.log(`🚀 Server is running...`);

// apps/api/src/auth/auth.resolver.ts
@Mutation(() => AuthPayload)
async register(@Args('registerInput') registerInput: RegisterInput) {
  // 👈 断点：接收注册请求
  return this.authService.register(registerInput);
}

// apps/api/src/auth/auth.service.ts
async register(registerInput: RegisterInput) {
  // 👈 断点：处理注册逻辑
  const hashedPassword = await bcrypt.hash(registerInput.password, 10);
}
```

### 前端断点
```typescript
// apps/web/src/app/register/page.tsx
const handleSubmit = async (e: React.FormEvent) => {
  // 👈 断点：表单提交
  const { data } = await register({ variables: formData });
};

// apps/web/src/lib/apollo-client.ts
const authLink = setContext((_, { headers }) => {
  // 👈 断点：添加认证头
  const token = localStorage.getItem('token');
});
```

---

## 🎯 可用的调试配置

| 配置 | 用途 | 快捷键 |
|-----|------|--------|
| 🎯 完整全栈调试 | 同时调试后端+前端+浏览器 | F5 → 选择 |
| 🔴 调试后端 | 只调试 NestJS API | F5 → 选择 |
| 🟢 调试前端 | 只调试 Next.js SSR | F5 → 选择 |
| 🔵 调试浏览器 | 只调试 React 客户端 | F5 → 选择 |

---

## 🔧 调试快捷键

| 快捷键 | 功能 |
|-------|------|
| `F5` | 开始/继续 |
| `F9` | 切换断点 |
| `F10` | 单步跳过 |
| `F11` | 单步进入 |
| `Shift+F11` | 单步跳出 |
| `Shift+F5` | 停止调试 |

---

## 🧪 测试你的调试配置

运行验证脚本：
```bash
./scripts/verify-debug-config.sh
```

---

## 📚 完整文档

- **详细调试指南**: `docs/DEBUG_SETUP.md`
- **测试验证指南**: `docs/DEBUG_TEST_GUIDE.md`
- **项目架构文档**: `docs/架构原理与运行机制.md`

---

## ❓ 遇到问题？

### 调试器无法连接
```bash
# 检查端口
lsof -i :4000
lsof -i :9229

# 重新构建
pnpm --filter api build
```

### 断点不工作
- 确保 `tsconfig.json` 中 `sourceMap: true`
- 重新构建项目
- 重启调试器

### 数据库连接失败
```bash
docker-compose up -d postgres
docker ps | grep postgres
```

---

**开始调试！** 🚀

按 `F5` 并选择 `🎯 完整全栈调试` 即可开始！
