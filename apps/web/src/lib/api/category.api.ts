/**
 * Category API Service
 * 分类相关的所有 API 调用
 */

import { apiClient } from '../api-client';

export interface Category {
  id: string;
  name: string;
  description?: string;
  color: string;
  icon: string;
  createdAt: string;
  updatedAt: string;
}

export interface CategoryStats {
  id: string;
  name: string;
  color: string;
  icon: string;
  todoCount: number;
  completedCount: number;
}

export interface CreateCategoryDto {
  name: string;
  description?: string;
  color?: string;
  icon?: string;
}

export interface UpdateCategoryDto {
  name?: string;
  description?: string;
  color?: string;
  icon?: string;
}

export const categoryApi = {
  /**
   * 获取所有分类
   */
  getAll: () =>
    apiClient.get<Category[]>('/categories'),

  /**
   * 获取单个分类
   */
  getById: (id: string) =>
    apiClient.get<Category>(`/categories/${id}`),

  /**
   * 获取分类统计
   */
  getStats: () =>
    apiClient.get<CategoryStats[]>('/categories/stats'),

  /**
   * 创建分类
   */
  create: (data: CreateCategoryDto) =>
    apiClient.post<Category>('/categories', data),

  /**
   * 更新分类
   */
  update: (id: string, data: UpdateCategoryDto) =>
    apiClient.put<Category>(`/categories/${id}`, data),

  /**
   * 删除分类
   */
  delete: (id: string) =>
    apiClient.delete<{ success: boolean }>(`/categories/${id}`),
};

