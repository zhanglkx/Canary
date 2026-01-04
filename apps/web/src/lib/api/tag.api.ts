/**
 * Tag API Service
 * 标签相关的所有 API 调用
 */

import { apiClient } from '../api-client';

export interface Tag {
  id: string;
  name: string;
  color?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTagDto {
  name: string;
  color?: string;
}

export interface UpdateTagDto {
  name?: string;
  color?: string;
}

export const tagApi = {
  /**
   * 获取所有标签
   */
  getAll: () =>
    apiClient.get<Tag[]>('/tags'),

  /**
   * 获取单个标签
   */
  getById: (id: string) =>
    apiClient.get<Tag>(`/tags/${id}`),

  /**
   * 创建标签
   */
  create: (data: CreateTagDto) =>
    apiClient.post<Tag>('/tags', data),

  /**
   * 更新标签
   */
  update: (id: string, data: UpdateTagDto) =>
    apiClient.put<Tag>(`/tags/${id}`, data),

  /**
   * 删除标签
   */
  delete: (id: string) =>
    apiClient.delete<{ success: boolean }>(`/tags/${id}`),
};
