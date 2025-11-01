'use client';

/**
 * 认证上下文模块 (Auth Context)
 *
 * @description
 * 这个模块负责管理应用程序的全局认证状态。
 * 它使用 React Context API 来存储用户信息、JWT token 和认证状态。
 *
 * 关键特性:
 * - 使用 localStorage 持久化存储 token 和用户信息
 * - 初始化时从 localStorage 恢复已存储的身份信息
 * - 提供 login 和 logout 方法来管理认证状态
 * - 支持防止页面刷新时丢失认证信息
 * - 使用 isLoading 标志解决 hydration 问题（SSR/CSR 不一致）
 *
 * 工作流程:
 * 1. 组件首次挂载时，useEffect 从 localStorage 读取存储的 token 和 user
 * 2. 异步加载这些信息到 React state
 * 3. 在加载完成前，isLoading = true，保护的路由显示加载状态
 * 4. 加载完成后，根据 token 和 user 判断是否已认证
 * 5. 用户登录时，同时更新 state 和 localStorage
 * 6. 用户登出时，清除两处的信息
 */

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

/**
 * 用户数据接口
 * 定义了用户信息的数据结构
 */
interface User {
  id: string;
  email: string;
  username: string;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * 认证上下文类型接口
 * 定义了 AuthContext 提供的所有值和方法
 *
 * @property user - 当前登录的用户对象，未登录时为 null
 * @property token - JWT 认证 token，未登录时为 null
 * @property login - 登录方法，接收 token 和 user 对象
 * @property logout - 登出方法，清除所有认证信息
 * @property isAuthenticated - 计算属性，判断用户是否已认证
 * @property isLoading - 加载状态，用于处理从 localStorage 初始化数据时的等待期
 */
interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (token: string, user: User) => void;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
}

// 创建认证上下文
const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * 认证提供者组件
 *
 * 这个组件包装整个应用程序，提供全局的认证状态管理。
 *
 * 工作流程:
 * 1. 组件挂载时，使用 useEffect 从 localStorage 异步读取数据
 * 2. 在数据加载过程中，isLoading 保持为 true
 * 3. 数据加载完成后，isLoading 设置为 false
 * 4. 这样可以防止受保护的页面在初始化完成前就进行重定向
 *
 * 使用示例:
 * ```tsx
 * <AuthProvider>
 *   <App />
 * </AuthProvider>
 * ```
 *
 * @param children - React 组件树中的子节点
 * @returns 包装了认证上下文的 JSX 元素
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  // 用户状态：存储当前登录的用户对象
  const [user, setUser] = useState<User | null>(null);

  // Token 状态：存储 JWT 认证 token
  const [token, setToken] = useState<string | null>(null);

  // 加载状态：用于处理从 localStorage 初始化的异步过程
  // 这是解决 SSR/CSR hydration 问题的关键
  // 初始值为 true，因为需要从 localStorage 读取数据
  const [isLoading, setIsLoading] = useState(true);

  /**
   * 初始化效果 - 从 localStorage 恢复已保存的认证信息
   *
   * 这个 useEffect 在组件挂载时运行一次（依赖数组为空）。
   * 它从浏览器的 localStorage 读取之前保存的 token 和 user 信息。
   *
   * 为什么需要这个步骤？
   * - 页面刷新时，React state 会重置为初始值
   * - 但 localStorage 中的数据是持久化的
   * - 通过从 localStorage 恢复数据，用户不会被意外登出
   *
   * 流程说明:
   * 1. 组件首次渲染时，isLoading 为 true
   * 2. useEffect 运行，尝试从 localStorage 读取数据
   * 3. 如果找到有效的数据，更新 state
   * 4. 最后将 isLoading 设置为 false，表示初始化完成
   * 5. 受保护的路由会根据 isLoading 和 isAuthenticated 决定渲染内容
   */
  useEffect(() => {
    // 从浏览器 localStorage 读取之前保存的 token
    const storedToken = localStorage.getItem('token');

    // 从浏览器 localStorage 读取之前保存的用户信息（JSON 字符串格式）
    const storedUser = localStorage.getItem('user');

    // 如果两者都存在，则恢复到 state 中
    if (storedToken && storedUser) {
      setToken(storedToken);
      // JSON.parse 将存储的 JSON 字符串转换回 User 对象
      setUser(JSON.parse(storedUser));
    }

    // 初始化完成，设置加载状态为 false
    // 这允许受保护的页面现在可以进行适当的重定向检查
    setIsLoading(false);
  }, []);

  /**
   * 登录方法
   *
   * 这个方法在用户成功认证后由登录页面调用。
   * 它同时更新 React state 和浏览器 localStorage。
   *
   * 为什么需要同时更新两个地方？
   * - React state: 用于即时更新 UI
   * - localStorage: 用于持久化存储，页面刷新后仍然有效
   *
   * 使用示例:
   * ```tsx
   * const { login } = useAuth();
   * const token = "jwt.token.here";
   * const user = { id: "123", email: "user@example.com", username: "john" };
   * login(token, user);
   * ```
   *
   * @param newToken - 从后端返回的 JWT 认证 token
   * @param newUser - 用户对象，包含 id、email、username 等信息
   */
  const login = (newToken: string, newUser: User) => {
    // 更新 React state，立即触发组件重新渲染
    setToken(newToken);
    setUser(newUser);

    // 将 token 字符串直接存储到 localStorage
    localStorage.setItem('token', newToken);

    // 将用户对象转换为 JSON 字符串后存储到 localStorage
    // JSON.stringify 将对象转换为字符串格式
    localStorage.setItem('user', JSON.stringify(newUser));
  };

  /**
   * 登出方法
   *
   * 这个方法在用户点击登出按钮时被调用。
   * 它清除 React state 和 localStorage 中的所有认证信息。
   *
   * 工作流程:
   * 1. 清除 token 和 user 的 state
   * 2. 删除 localStorage 中的 token 和 user
   * 3. 组件会自动重新渲染，受保护的路由会重定向到登录页
   *
   * 使用示例:
   * ```tsx
   * const { logout } = useAuth();
   * logout(); // 用户被登出
   * ```
   */
  const logout = () => {
    // 清除 React state，触发重新渲染
    setToken(null);
    setUser(null);

    // 删除浏览器 localStorage 中的认证信息
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  /**
   * 返回认证上下文提供者
   *
   * Provider 提供的值:
   * - user: 当前登录的用户对象
   * - token: JWT 认证 token
   * - login: 登录方法
   * - logout: 登出方法
   * - isAuthenticated: 布尔值，表示用户是否已认证
   * - isLoading: 布尔值，表示是否正在从 localStorage 加载数据
   *
   * 这些值可以被所有后代组件通过 useAuth hook 访问
   */
  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        logout,
        // 只有当 token 和 user 都存在时，才认为用户已认证
        isAuthenticated: !!token && !!user,
        // 标志是否正在初始化认证状态
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

/**
 * 使用认证上下文的 Hook
 *
 * 这个 hook 允许任何组件访问全局的认证状态和方法。
 *
 * 使用示例:
 * ```tsx
 * import { useAuth } from '@/lib/auth-context';
 *
 * function MyComponent() {
 *   const { user, isAuthenticated, login, logout } = useAuth();
 *
 *   if (!isAuthenticated) {
 *     return <div>Please log in</div>;
 *   }
 *
 *   return <div>Welcome, {user?.username}!</div>;
 * }
 * ```
 *
 * @throws 错误: 如果在 AuthProvider 外部调用此 hook，会抛出错误
 * @returns AuthContext 的值对象，包含认证相关的状态和方法
 */
export function useAuth() {
  // 从 React Context 中获取认证上下文
  const context = useContext(AuthContext);

  // 如果上下文未定义，说明该 hook 被在 AuthProvider 外部使用
  // 这是一个编程错误，需要提醒开发者
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
}
