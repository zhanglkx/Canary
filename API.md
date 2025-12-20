# API Documentation

## Base URL
```
http://localhost:4000/api
```

## Authentication

All protected endpoints require a Bearer token in the Authorization header:
```
Authorization: Bearer <jwt_token>
```

## Health Check

### Check API Health
```http
GET /api/health
```

**Response (200 OK)**
```json
{
  "status": "ok",
  "timestamp": "2025-12-20T10:30:00.000Z"
}
```

---

## Authentication Endpoints

### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "name": "John Doe",
  "password": "SecurePass123!"
}
```

**Response (201 Created)**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "name": "John Doe"
  }
}
```

**Error Responses**
```json
// 409 Conflict - User already exists
{
  "statusCode": 409,
  "message": "User with this email already exists",
  "error": "Conflict"
}

// 400 Bad Request - Validation failed
{
  "statusCode": 400,
  "message": "Validation failed",
  "error": "Bad Request"
}
```

### Login User
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**Response (200 OK)**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "name": "John Doe"
  }
}
```

**Error Responses**
```json
// 401 Unauthorized - Invalid credentials
{
  "statusCode": 401,
  "message": "Invalid credentials",
  "error": "Unauthorized"
}
```

---

## User Management Endpoints

### Get All Users
```http
GET /api/users
Authorization: Bearer <token>
```

**Query Parameters**
```
?page=1&limit=10&search=john
```

**Response (200 OK)**
```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "name": "John Doe",
    "isActive": true,
    "createdAt": "2025-12-20T10:00:00.000Z",
    "updatedAt": "2025-12-20T10:00:00.000Z"
  }
]
```

### Get User by ID
```http
GET /api/users/{id}
Authorization: Bearer <token>
```

**Path Parameters**
- `id` (string, required) - User UUID

**Response (200 OK)**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "user@example.com",
  "name": "John Doe",
  "isActive": true,
  "createdAt": "2025-12-20T10:00:00.000Z",
  "updatedAt": "2025-12-20T10:00:00.000Z"
}
```

**Error Responses**
```json
// 404 Not Found
{
  "statusCode": 404,
  "message": "User with ID 550e8400-e29b-41d4-a716-446655440000 not found",
  "error": "Not Found"
}
```

### Create User
```http
POST /api/users
Authorization: Bearer <token>
Content-Type: application/json

{
  "email": "newuser@example.com",
  "name": "Jane Smith",
  "password": "SecurePass123!"
}
```

**Request Body**
- `email` (string, required) - Valid email address
- `name` (string, required) - User's full name
- `password` (string, required) - Minimum 8 characters

**Response (201 Created)**
```json
{
  "id": "660e8400-e29b-41d4-a716-446655440001",
  "email": "newuser@example.com",
  "name": "Jane Smith",
  "isActive": true,
  "createdAt": "2025-12-20T11:00:00.000Z",
  "updatedAt": "2025-12-20T11:00:00.000Z"
}
```

### Update User
```http
PATCH /api/users/{id}
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Jane Doe Smith",
  "email": "jane.smith@example.com"
}
```

**Path Parameters**
- `id` (string, required) - User UUID

**Request Body** (all optional)
- `name` (string) - User's full name
- `email` (string) - Valid email address

**Response (200 OK)**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "jane.smith@example.com",
  "name": "Jane Doe Smith",
  "isActive": true,
  "createdAt": "2025-12-20T10:00:00.000Z",
  "updatedAt": "2025-12-20T11:30:00.000Z"
}
```

### Delete User
```http
DELETE /api/users/{id}
Authorization: Bearer <token>
```

**Path Parameters**
- `id` (string, required) - User UUID

**Response (204 No Content)**
```
(empty body)
```

**Error Responses**
```json
// 404 Not Found
{
  "statusCode": 404,
  "message": "User with ID 550e8400-e29b-41d4-a716-446655440000 not found",
  "error": "Not Found"
}
```

---

## Error Handling

All errors follow a consistent format:

```json
{
  "statusCode": 400,
  "message": "Error description",
  "error": "Error Type"
}
```

### HTTP Status Codes

| Code | Meaning | Example |
|------|---------|---------|
| 200 | OK | Successful GET, PATCH |
| 201 | Created | Successful POST |
| 204 | No Content | Successful DELETE |
| 400 | Bad Request | Invalid input |
| 401 | Unauthorized | Missing/invalid token |
| 404 | Not Found | Resource doesn't exist |
| 409 | Conflict | Duplicate email |
| 500 | Server Error | Internal error |

---

## Response Types

### User Response Object
```typescript
{
  id: string;                  // UUID
  email: string;              // Email address
  name: string;               // Full name
  isActive: boolean;          // Account status
  createdAt: Date;            // ISO timestamp
  updatedAt: Date;            // ISO timestamp
}
```

### Auth Response Object
```typescript
{
  accessToken: string;        // JWT token
  user: {
    id: string;              // UUID
    email: string;           // Email address
    name: string;            // Full name
  }
}
```

---

## JWT Token

The JWT token includes:
```json
{
  "sub": "550e8400-e29b-41d4-a716-446655440000",
  "email": "user@example.com",
  "iat": 1703079600,
  "exp": 1703166000
}
```

**Token Expiration**: 24 hours from issuance

**Secret**: Configured via `JWT_SECRET` environment variable

---

## Rate Limiting

Currently not implemented. Recommended for production:
```
Max 100 requests per 15 minutes per IP
```

---

## CORS Configuration

```
Allowed Origins: http://localhost:3000
Allowed Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS
Allowed Headers: Content-Type, Authorization
Credentials: true
```

---

## API Testing

### Using cURL

```bash
# Health check
curl http://localhost:4000/api/health

# Register
curl -X POST http://localhost:4000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","name":"John","password":"Pass123!"}'

# Login
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"Pass123!"}'

# Get users (replace TOKEN)
curl http://localhost:4000/api/users \
  -H "Authorization: Bearer TOKEN"
```

### Using REST Client (VS Code)

Create `.vscode/rest-client.env`:
```
@baseUrl = http://localhost:4000/api
@token = your-jwt-token
```

Create `requests.http`:
```http
### Health Check
GET @baseUrl/health

### Register
POST @baseUrl/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "name": "John Doe",
  "password": "SecurePass123!"
}

### Get Users
GET @baseUrl/users
Authorization: Bearer @token
```

### Using Thunder Client or Postman

Import collection from Swagger:
```
http://localhost:4000/api/docs
```

---

## OpenAPI/Swagger

Full interactive API documentation available at:
```
http://localhost:4000/api/docs
```

Access raw OpenAPI spec:
```
http://localhost:4000/api/docs-json
```

---

## Example Workflows

### Complete Authentication Flow

1. **Register**
```bash
curl -X POST http://localhost:4000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","name":"John Doe","password":"SecurePass123!"}'
# Returns: accessToken and user data
```

2. **Use Token**
```bash
TOKEN="<accessToken from register>"
curl http://localhost:4000/api/users \
  -H "Authorization: Bearer $TOKEN"
```

3. **Create Another User**
```bash
curl -X POST http://localhost:4000/api/users \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"email":"another@example.com","name":"Jane Doe","password":"SecurePass123!"}'
```

---

## Environment Variables

Required for API operation:

```env
PORT=4000
JWT_SECRET=your-secret-key
FRONTEND_URL=http://localhost:3000
DATABASE_URL=sqlite:./db.sqlite
```

---

**API Version**: 1.0.0
**Last Updated**: December 2025
**Documentation**: OpenAPI 3.0
