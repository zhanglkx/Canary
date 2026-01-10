# 京东签到模块

## 功能说明

本模块提供京东自动签到功能，包括：

1. **定时任务**：每天上午10点自动执行签到
2. **手动触发**：通过 HTTP 接口手动触发签到
3. **签到历史**：记录每次签到的结果和状态
4. **统计信息**：查看签到成功率和历史记录

## 配置说明

### 环境变量

在 `.env` 或 `.env.local` 文件中配置以下环境变量：

#### 必填参数

- `JD_PT_PIN`: 京东账号的 pt_pin 参数
- `JD_PT_KEY`: 京东账号的 pt_key 参数

#### 可选参数

- `JD_REF_CLS`: 京东引用分类（默认: `MYL_Display_Init`）
- `JD_MBA_MUID`: MBA MUID 参数
- `JD_MBA_SID`: MBA SID 参数
- `JD_COOKIE`: 完整的 Cookie 字符串（如果提供了这个，上面的参数可以不填）
- `JD_FULL_COOKIE`: 完整的 Cookie 字符串（用于提取其他参数）

### 配置示例

```env
# 必填参数
JD_PT_PIN=jd_7c83fb0af113c
JD_PT_KEY=AAJpYlhsADA7zNbERRDEeoLpjp6S_ZrSVv8J8rq4oSxZ99EXmVnQtDrZCScabxYTCAe15n-d9es

# 可选参数
JD_REF_CLS=MYL_Display_Init
JD_MBA_MUID=17640310833502057694414
JD_MBA_SID=17680526550331202567291.27

# 或者直接提供完整 Cookie
JD_COOKIE=__jd_ref_cls=MYL_Display_Init; mba_muid=17640310833502057694414; ...
```

## API 接口

### 1. 手动触发签到

```http
POST /api/jd-sign/trigger
```

**响应示例：**

```json
{
  "success": true,
  "message": "签到请求已提交"
}
```

### 2. 获取签到历史

```http
GET /api/jd-sign/history
```

**响应示例：**

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "status": "success",
      "responseData": "{...}",
      "errorMessage": null,
      "signTime": "2024-01-10T10:00:00.000Z",
      "createdAt": "2024-01-10T10:00:00.000Z",
      "updatedAt": "2024-01-10T10:00:00.000Z"
    }
  ]
}
```

### 3. 获取签到统计

```http
GET /api/jd-sign/statistics
```

**响应示例：**

```json
{
  "success": true,
  "data": {
    "total": 30,
    "success": 28,
    "failed": 2,
    "successRate": 93.33
  }
}
```

## 定时任务

定时任务配置在 `jd-sign.scheduler.ts` 中，使用 Cron 表达式：

- **执行时间**：每天上午10点（北京时间）
- **Cron 表达式**：`0 10 * * *`
- **时区**：`Asia/Shanghai`

## 数据库表

### jd_sign_history

签到历史记录表，包含以下字段：

- `id`: UUID 主键
- `status`: 签到状态（`success` | `failed` | `pending`）
- `responseData`: 响应数据（JSON 格式）
- `errorMessage`: 错误信息（如果失败）
- `signTime`: 签到时间
- `createdAt`: 创建时间
- `updatedAt`: 更新时间

## 设计模式

### 1. 服务层模式（Service Layer Pattern）

- `JdSignService`: 负责业务逻辑处理
- 封装 HTTP 请求、响应处理、错误处理等

### 2. 调度器模式（Scheduler Pattern）

- `JdSignScheduler`: 负责定时任务调度
- 使用 `@nestjs/schedule` 实现定时任务

### 3. 仓储模式（Repository Pattern）

- 使用 TypeORM Repository 进行数据访问
- 封装数据库操作逻辑

### 4. 配置模式（Configuration Pattern）

- 使用 `@nestjs/config` 管理环境变量
- 支持多环境配置（开发、生产）

## 错误处理

1. **配置错误**：如果必填参数未配置，会抛出错误
2. **网络错误**：请求超时或网络异常会被捕获并记录
3. **业务错误**：签到失败会记录错误信息到数据库

## 日志记录

所有操作都会记录日志：

- ✅ 成功操作：使用 `logger.log()`
- ⚠️ 警告信息：使用 `logger.warn()`
- ❌ 错误信息：使用 `logger.error()`

## 使用示例

### 1. 配置环境变量

在 `.env` 文件中添加配置：

```env
JD_PT_PIN=your_pt_pin
JD_PT_KEY=your_pt_key
```

### 2. 启动服务

服务启动后，定时任务会自动运行。

### 3. 手动触发签到

```bash
curl -X POST http://localhost:4000/api/jd-sign/trigger
```

### 4. 查看签到历史

```bash
curl http://localhost:4000/api/jd-sign/history
```

### 5. 查看统计信息

```bash
curl http://localhost:4000/api/jd-sign/statistics
```

## 注意事项

1. **Cookie 有效期**：京东 Cookie 可能会过期，需要定期更新
2. **请求频率**：避免频繁请求，遵守京东 API 的使用规范
3. **错误处理**：如果连续多次失败，建议检查 Cookie 是否有效
4. **时区设置**：定时任务使用中国时区（Asia/Shanghai）

## 扩展功能

可以扩展以下功能：

1. **多账号支持**：支持多个京东账号同时签到
2. **重试机制**：失败后自动重试
3. **通知功能**：签到成功/失败后发送通知（邮件、短信等）
4. **数据分析**：分析签到成功率、失败原因等
