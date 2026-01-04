/**
 * Auth API Service
 * 认证相关的所有 API 调用
 */

import { apiClient } from '../api-client';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  username: string;
  password: string;
}

export interface User {
  id: string;
  email: string;
  username: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: string;
  user: User;
}

export interface TokenResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: string;
}

export const authApi = {
  /**
   * 用户登录
   */
  login: (credentials: LoginCredentials) =>
    apiClient.post<AuthResponse>('/auth/login', credentials),

  /**
   * 用户注册
   */
  register: (data: RegisterData) =>
    apiClient.post<AuthResponse>('/auth/register', data),

  /**
   * 获取当前用户信息
   */
  me: () =>
    apiClient.get<User>('/auth/me'),

  /**
   * 刷新访问令牌
   */
  refreshToken: (refreshToken: string) =>
    apiClient.post<TokenResponse>('/auth/refresh', { refreshToken }),

  /**
   * 登出（撤销刷新令牌）
   */
  logout: (refreshToken: string) =>
    apiClient.post<{ success: boolean }>('/auth/logout', { refreshToken }),

  /**
   * 登出所有设备
   */
  logoutAll: () =>
    apiClient.post<{ success: boolean }>('/auth/logout-all'),
};
