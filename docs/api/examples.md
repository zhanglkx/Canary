# API 调用示例

本文档展示如何在不同的工具中调用 API 端点。

---

## 🔧 cURL 示例

### 健康检查
```bash
curl -X GET http://localhost:4000/api/health
```

### 注册新用户
```bash
curl -X POST http://localhost:4000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "name": "John Doe",
    "password": "SecurePass123!"
  }'
```

### 保存返回的 Token
```bash
# 执行上面的注册命令，然后设置 token 变量
TOKEN="<从响应中复制的 accessToken>"

# 或者一步完成
TOKEN=$(curl -s -X POST http://localhost:4000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "name": "John Doe",
    "password": "SecurePass123!"
  }' | jq -r '.accessToken')

echo "Token: $TOKEN"
```

### 用已保存的 Token 获取用户列表
```bash
curl -X GET http://localhost:4000/api/users \
  -H "Authorization: Bearer $TOKEN"
```

### 获取单个用户
```bash
curl -X GET http://localhost:4000/api/users/550e8400-e29b-41d4-a716-446655440000 \
  -H "Authorization: Bearer $TOKEN"
```

### 创建新用户
```bash
curl -X POST http://localhost:4000/api/users \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "email": "jane@example.com",
    "name": "Jane Smith",
    "password": "SecurePass456!"
  }'
```

### 更新用户信息
```bash
curl -X PATCH http://localhost:4000/api/users/550e8400-e29b-41d4-a716-446655440000 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name": "John Doe Updated",
    "email": "john.updated@example.com"
  }'
```

### 删除用户
```bash
curl -X DELETE http://localhost:4000/api/users/550e8400-e29b-41d4-a716-446655440000 \
  -H "Authorization: Bearer $TOKEN"
```

---

## 📝 REST Client (VS Code 扩展)

### 创建文件 `requests.http`

```http
### 配置
@baseUrl = http://localhost:4000/api
@token =

### 1. 健康检查
GET @baseUrl/health

### 2. 注册用户（不需要 token）
POST @baseUrl/auth/register
Content-Type: application/json

{
  "email": "user1@example.com",
  "name": "User One",
  "password": "SecurePass123!"
}

### 3. 登录用户
POST @baseUrl/auth/login
Content-Type: application/json

{
  "email": "user1@example.com",
  "password": "SecurePass123!"
}

### 4. 复制上面响应中的 accessToken，粘贴到 @token

### 5. 获取所有用户
GET @baseUrl/users
Authorization: Bearer @token

### 6. 获取单个用户
GET @baseUrl/users/550e8400-e29b-41d4-a716-446655440000
Authorization: Bearer @token

### 7. 创建用户
POST @baseUrl/users
Content-Type: application/json
Authorization: Bearer @token

{
  "email": "newuser@example.com",
  "name": "New User",
  "password": "SecurePass456!"
}

### 8. 更新用户
PATCH @baseUrl/users/550e8400-e29b-41d4-a716-446655440000
Content-Type: application/json
Authorization: Bearer @token

{
  "name": "Updated Name",
  "email": "updated@example.com"
}

### 9. 删除用户
DELETE @baseUrl/users/550e8400-e29b-41d4-a716-446655440000
Authorization: Bearer @token
```

**使用方法**:
1. 安装 "REST Client" VS Code 扩展
2. 打开 `requests.http` 文件
3. 点击每个请求上方的 "Send Request" 链接
4. 响应会显示在右侧面板

---

## 🧪 Postman

### 导入 Swagger 文档

1. 打开 Postman
2. 点击 "Import" 按钮
3. 选择 "Link" 标签
4. 输入: `http://localhost:4000/api/docs-json`
5. 点击 "Import"

Postman 会自动导入所有端点。

### 手动创建请求

#### 注册
```
方法: POST
URL: http://localhost:4000/api/auth/register
Body (JSON):
{
  "email": "user@example.com",
  "name": "John Doe",
  "password": "SecurePass123!"
}
```

#### 登录
```
方法: POST
URL: http://localhost:4000/api/auth/login
Body (JSON):
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

#### 获取用户列表
```
方法: GET
URL: http://localhost:4000/api/users
Headers:
  Authorization: Bearer <token>
```

#### 创建用户
```
方法: POST
URL: http://localhost:4000/api/users
Headers:
  Authorization: Bearer <token>
Body (JSON):
{
  "email": "newuser@example.com",
  "name": "New User",
  "password": "SecurePass456!"
}
```

---

## 🌐 JavaScript Fetch API

### 注册用户
```javascript
async function registerUser() {
  const response = await fetch('http://localhost:4000/api/auth/register', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      email: 'user@example.com',
      name: 'John Doe',
      password: 'SecurePass123!'
    })
  });

  const data = await response.json();
  console.log('Response:', data);

  // 保存 token
  localStorage.setItem('token', data.accessToken);
  return data;
}
```

### 获取用户列表（需要 Token）
```javascript
async function getUsers() {
  const token = localStorage.getItem('token');

  const response = await fetch('http://localhost:4000/api/users', {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  const data = await response.json();
  console.log('Users:', data);
  return data;
}
```

### 创建用户
```javascript
async function createUser(email, name, password) {
  const token = localStorage.getItem('token');

  const response = await fetch('http://localhost:4000/api/users', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      email,
      name,
      password
    })
  });

  const data = await response.json();
  console.log('Created user:', data);
  return data;
}
```

### 更新用户
```javascript
async function updateUser(userId, updates) {
  const token = localStorage.getItem('token');

  const response = await fetch(`http://localhost:4000/api/users/${userId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(updates)
  });

  const data = await response.json();
  console.log('Updated user:', data);
  return data;
}
```

### 删除用户
```javascript
async function deleteUser(userId) {
  const token = localStorage.getItem('token');

  const response = await fetch(`http://localhost:4000/api/users/${userId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (response.status === 204) {
    console.log('User deleted successfully');
  } else {
    const data = await response.json();
    console.error('Error:', data);
  }
}
```

---

## 🎯 完整的工作流示例

### 使用 cURL 的完整流程

```bash
# 1. 注册用户
RESPONSE=$(curl -s -X POST http://localhost:4000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "workflow@example.com",
    "name": "Workflow User",
    "password": "SecurePass789!"
  }')

echo "Register response:"
echo $RESPONSE | jq

# 2. 提取 token
TOKEN=$(echo $RESPONSE | jq -r '.accessToken')
USER_ID=$(echo $RESPONSE | jq -r '.user.id')

echo "Token: $TOKEN"
echo "User ID: $USER_ID"

# 3. 获取所有用户
echo -e "\n获取用户列表:"
curl -s -X GET http://localhost:4000/api/users \
  -H "Authorization: Bearer $TOKEN" | jq

# 4. 获取单个用户
echo -e "\n获取单个用户:"
curl -s -X GET http://localhost:4000/api/users/$USER_ID \
  -H "Authorization: Bearer $TOKEN" | jq

# 5. 创建另一个用户
echo -e "\n创建新用户:"
NEW_USER=$(curl -s -X POST http://localhost:4000/api/users \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "email": "another@example.com",
    "name": "Another User",
    "password": "SecurePass999!"
  }')

echo $NEW_USER | jq
NEW_USER_ID=$(echo $NEW_USER | jq -r '.id')

# 6. 更新用户
echo -e "\n更新用户:"
curl -s -X PATCH http://localhost:4000/api/users/$NEW_USER_ID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name": "Updated Another User"
  }' | jq

# 7. 删除用户
echo -e "\n删除用户:"
curl -s -X DELETE http://localhost:4000/api/users/$NEW_USER_ID \
  -H "Authorization: Bearer $TOKEN"

echo -e "\n删除完成"
```

---

## 📚 导出为其他工具

### 导出为 Postman Collection

访问: `http://localhost:4000/api/docs`
- 右上角找到 "Download" 按钮
- 选择 "Postman"
- 导入到 Postman

---

**最后更新**: 2025-12-20
