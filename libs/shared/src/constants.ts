export const API_ROUTES = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    ME: '/auth/me',
  },
  USERS: '/users',
  TODOS: '/todos',
} as const;

export const ERROR_MESSAGES = {
  UNAUTHORIZED: 'Unauthorized access',
  NOT_FOUND: 'Resource not found',
  INVALID_CREDENTIALS: 'Invalid email or password',
  EMAIL_EXISTS: 'Email already exists',
  INTERNAL_ERROR: 'Internal server error',
} as const;

export const SUCCESS_MESSAGES = {
  LOGIN: 'Login successful',
  REGISTER: 'Registration successful',
  TODO_CREATED: 'Todo created successfully',
  TODO_UPDATED: 'Todo updated successfully',
  TODO_DELETED: 'Todo deleted successfully',
} as const;
