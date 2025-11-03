# 🎓 Canary 项目学习指南

欢迎使用 Canary 项目！这是一个为学习者设计的全栈应用，用于深入理解 NestJS、Next.js、GraphQL 和现代 Web 开发。

---

## 📖 学习路径

### 第一阶段：理解架构（1-2 小时）

1. 阅读 `docs/BACKEND_ARCHITECTURE_GUIDE.md`
   - 了解 NestJS 核心概念
   - 理解分层架构

2. 查看 `CLAUDE.md`
   - 了解项目结构
   - 掌握快速命令

### 第二阶段：学习功能（2-3 小时）

选择学习一个功能模块：

- **Comment 系统**（初学者）- 一对多关系
- **Tag 系统**（中级）- 多对多关系
- **Search 系统**（高级）- 复杂查询和防抖

---

## 🎯 快速命令

```bash
# 开发
pnpm dev

# 分别启动
pnpm dev:api      # NestJS
pnpm dev:web      # Next.js

# 构建
pnpm build
```

---

## 💡 核心模块

| 模块 | 类型 | 难度 | 描述 |
|------|------|------|------|
| Auth | 认证 | ⭐⭐ | JWT 认证 |
| Todo | 功能 | ⭐⭐⭐ | 核心功能 |
| Comment | 新增 | ⭐⭐⭐ | 评论系统 |
| Tag | 新增 | ⭐⭐⭐⭐ | 标签管理 |
| Search | 新增 | ⭐⭐⭐⭐ | 搜索系统 |

---

## 📚 重点文档

- `docs/BACKEND_ARCHITECTURE_GUIDE.md` - 架构学习
- `docs/FRONTEND_BACKEND_COMPATIBILITY.md` - 功能对应
- `TEST_AND_VALIDATION_REPORT.md` - 验证报告

---

**开始学习**：阅读 `docs/BACKEND_ARCHITECTURE_GUIDE.md`

祝你学习愉快！🎉
