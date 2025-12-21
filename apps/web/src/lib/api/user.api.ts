/**
 * User API Service
 * 用户相关的所有 API 调用
 */

import { apiClient } from '../api-client';
import { User } from './auth.api';

export interface UpdateUserDto {
  username?: string;
  email?: string;
  oldPassword?: string;
  newPassword?: string;
}

export const userApi = {
  /**
   * 获取当前用户
   */
  me: () =>
    apiClient.get<User>('/users/me'),

  /**
   * 获取指定用户
   */
  getById: (id: string) =>
    apiClient.get<User>(`/users/${id}`),

  /**
   * 更新用户信息
   */
  update: (id: string, data: UpdateUserDto) =>
    apiClient.put<User>(`/users/${id}`, data),

  /**
   * 获取用户统计
   */
  getStats: () =>
    apiClient.get('/users/stats'),
};

