# Cookie 配置管理

## 概述

Cookie 配置已从环境变量迁移到数据库表，提供更安全和灵活的管理方式。

## 数据库表结构

表名：`jd_cookie_config`

字段：
- `id`: UUID 主键
- `account`: 账号标识（唯一，如 pt_pin 值）
- `cookie`: 完整的 Cookie 字符串
- `status`: Cookie 状态（active/inactive/expired）
- `remark`: 备注信息
- `lastVerifiedAt`: 最后验证时间
- `createdAt`: 创建时间
- `updatedAt`: 更新时间

## API 接口

### 1. 获取所有 Cookie 配置

```http
GET /api/jd-sign/cookies
```

响应示例：
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "account": "jd_7c83fb0af113c",
      "status": "active",
      "remark": "主账号",
      "lastVerifiedAt": "2026-01-12T10:00:00.000Z",
      "cookiePreview": "shshshfpa=4ac7cc4b-0fa1-1aa6-a6c1-59415be0a76e..."
    }
  ]
}
```

### 2. 创建或更新 Cookie 配置

```http
PUT /api/jd-sign/cookies
Content-Type: application/json

{
  "account": "jd_7c83fb0af113c",
  "cookie": "完整的 Cookie 字符串",
  "remark": "主账号（可选）"
}
```

响应示例：
```json
{
  "success": true,
  "message": "Cookie 配置已保存",
  "data": {
    "id": "uuid",
    "account": "jd_7c83fb0af113c",
    "status": "active"
  }
}
```

### 3. 删除 Cookie 配置

```http
DELETE /api/jd-sign/cookies/:account
```

示例：
```http
DELETE /api/jd-sign/cookies/jd_7c83fb0af113c
```

## 使用示例

### 使用 curl 设置 Cookie

```bash
curl -X PUT http://localhost:4000/api/jd-sign/cookies \
  -H "Content-Type: application/json" \
  -d '{
    "account": "jd_7c83fb0af113c",
    "cookie": "shshshfpa=...; pt_key=...; pt_pin=...",
    "remark": "主账号"
  }'
```

### 查看所有 Cookie 配置

```bash
curl http://localhost:4000/api/jd-sign/cookies
```

### 删除 Cookie 配置

```bash
curl -X DELETE http://localhost:4000/api/jd-sign/cookies/jd_7c83fb0af113c
```

## 工作原理

1. **优先级**：签到服务优先从数据库读取 Cookie，如果数据库没有配置，则从环境变量读取（向后兼容）
2. **自动选择**：如果有多个 Cookie 配置，自动选择状态为 `active` 的配置
3. **验证更新**：签到成功后，自动更新 Cookie 的最后验证时间

## 迁移说明

### 从环境变量迁移到数据库

如果你之前使用环境变量 `JD_FULL_COOKIE`，可以通过以下方式迁移：

1. 获取环境变量中的 Cookie 值
2. 使用 API 接口将 Cookie 保存到数据库：

```bash
# 从环境变量读取 Cookie（示例）
COOKIE="你的 Cookie 值"
ACCOUNT="jd_7c83fb0af113c"  # 从 Cookie 中提取 pt_pin

curl -X PUT http://localhost:4000/api/jd-sign/cookies \
  -H "Content-Type: application/json" \
  -d "{
    \"account\": \"$ACCOUNT\",
    \"cookie\": \"$COOKIE\",
    \"remark\": \"从环境变量迁移\"
  }"
```

迁移后，可以删除环境变量中的 `JD_FULL_COOKIE`（可选，保留作为备用）。

## 注意事项

1. **安全性**：Cookie 包含敏感信息，请确保 API 接口有适当的认证保护
2. **唯一性**：`account` 字段必须唯一，如果已存在会更新而不是创建
3. **状态管理**：只有 `status` 为 `active` 的 Cookie 会被使用
4. **向后兼容**：如果数据库没有配置，仍会从环境变量读取（向后兼容）
