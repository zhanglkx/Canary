/**
 * GraphQL Mutation 定义文件
 *
 * 这个文件包含所有修改数据的 GraphQL 操作（Mutation）。
 *
 * Mutation vs Query 的区别：
 * - Query：只读操作，获取数据
 * - Mutation：写操作，创建/更新/删除数据
 *
 * GraphQL 最佳实践：
 * - 所有修改操作都应该用 Mutation 表示
 * - Mutation 总是有副作用（修改数据库）
 * - 应该返回修改后的对象，便于前端更新 UI
 *
 * Apollo Client 集成：
 * - 使用 useMutation hook 执行 Mutation
 * - 支持缓存更新
 * - 支持乐观更新
 * - 支持错误处理
 */

import { gql } from '@apollo/client';

/**
 * 登录 Mutation
 *
 * @description 使用邮箱和密码进行登录
 *
 * 前端流程：
 * 1. 用户填写登录表单（邮箱、密码）
 * 2. 调用 LOGIN mutation，传递凭证
 * 3. 后端验证凭证并生成 JWT Token
 * 4. 前端存储 Token 到 localStorage
 * 5. 前端更新 Auth Context（设置 isAuthenticated = true）
 * 6. 前端重定向到 dashboard
 *
 * 错误处理：
 * - 邮箱或密码错误 → UnauthorizedException
 * - 用户不存在 → UnauthorizedException
 * - 前端显示错误消息
 *
 * 使用示例：
 * ```
 * const [login] = useMutation(LOGIN);
 *
 * const handleLogin = async (email, password) => {
 *   try {
 *     const { data } = await login({
 *       variables: { email, password }
 *     });
 *     // 保存 Token
 *     localStorage.setItem('token', data.login.accessToken);
 *     // 更新 Auth Context
 *     setAuthState(data.login.user);
 *     // 重定向
 *     router.push('/dashboard');
 *   } catch (error) {
 *     console.error('登录失败:', error.message);
 *   }
 * };
 * ```
 *
 * 对应后端：
 * @Mutation(() => AuthResponse)
 * async login(@Args('loginInput') loginInput: LoginInput): Promise<AuthResponse>
 */
export const LOGIN = gql`
  mutation Login($email: String!, $password: String!) {
    login(loginInput: { email: $email, password: $password }) {
      accessToken
      user {
        id
        email
        username
      }
    }
  }
`;

export const REGISTER = gql`
  mutation Register($email: String!, $username: String!, $password: String!) {
    register(registerInput: { email: $email, username: $username, password: $password }) {
      accessToken
      user {
        id
        email
        username
      }
    }
  }
`;

export const CREATE_TODO = gql`
  mutation CreateTodo(
    $title: String!
    $description: String
    $categoryId: ID
    $priority: Priority
    $dueDate: String
  ) {
    createTodo(
      createTodoInput: {
        title: $title
        description: $description
        categoryId: $categoryId
        priority: $priority
        dueDate: $dueDate
      }
    ) {
      id
      title
      description
      completed
      priority
      dueDate
      createdAt
      category {
        id
        name
        color
        icon
      }
    }
  }
`;

export const UPDATE_TODO = gql`
  mutation UpdateTodo(
    $id: ID!
    $title: String
    $description: String
    $completed: Boolean
    $categoryId: ID
    $priority: Priority
    $dueDate: String
  ) {
    updateTodo(
      id: $id
      updateTodoInput: {
        title: $title
        description: $description
        completed: $completed
        categoryId: $categoryId
        priority: $priority
        dueDate: $dueDate
      }
    ) {
      id
      title
      description
      completed
      priority
      dueDate
      updatedAt
      category {
        id
        name
        color
        icon
      }
    }
  }
`;

export const REMOVE_TODO = gql`
  mutation RemoveTodo($id: ID!) {
    removeTodo(id: $id)
  }
`;

export const CREATE_CATEGORY = gql`
  mutation CreateCategory($name: String!, $description: String, $color: String, $icon: String) {
    createCategory(
      createCategoryInput: { name: $name, description: $description, color: $color, icon: $icon }
    ) {
      id
      name
      description
      color
      icon
      createdAt
    }
  }
`;

export const UPDATE_CATEGORY = gql`
  mutation UpdateCategory(
    $id: ID!
    $name: String
    $description: String
    $color: String
    $icon: String
  ) {
    updateCategory(
      id: $id
      updateCategoryInput: { name: $name, description: $description, color: $color, icon: $icon }
    ) {
      id
      name
      description
      color
      icon
      updatedAt
    }
  }
`;

export const REMOVE_CATEGORY = gql`
  mutation RemoveCategory($id: ID!) {
    removeCategory(id: $id)
  }
`;
