/**
 * Todo API Service
 * Todo 相关的所有 API 调用
 */

import { apiClient } from '../api-client';

export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

// 从 category.api.ts 导入 Category 接口，避免重复定义
import type { Category } from './category.api';

export interface Todo {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  priority: Priority;
  dueDate?: string;
  createdAt: string;
  updatedAt: string;
  category?: Category;
}

export interface CreateTodoDto {
  title: string;
  description?: string;
  priority?: Priority;
  dueDate?: string;
  categoryId?: string;
}

export interface UpdateTodoDto {
  title?: string;
  description?: string;
  completed?: boolean;
  priority?: Priority;
  dueDate?: string;
  categoryId?: string;
}

export const todoApi = {
  /**
   * 获取所有 Todo
   */
  getAll: () =>
    apiClient.get<Todo[]>('/todos'),

  /**
   * 获取单个 Todo
   */
  getById: (id: string) =>
    apiClient.get<Todo>(`/todos/${id}`),

  /**
   * 创建 Todo
   */
  create: (data: CreateTodoDto) =>
    apiClient.post<Todo>('/todos', data),

  /**
   * 更新 Todo
   */
  update: (id: string, data: UpdateTodoDto) =>
    apiClient.put<Todo>(`/todos/${id}`, data),

  /**
   * 删除 Todo
   */
  delete: (id: string) =>
    apiClient.delete<{ success: boolean }>(`/todos/${id}`),
};
