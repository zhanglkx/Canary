/**
 * Comment API Service
 * 评论相关的所有 API 调用
 */

import { apiClient } from '../api-client';

export interface Comment {
  id: string;
  content: string;
  todoId: string;
  authorId: string;
  author: {
    id: string;
    username: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CreateCommentDto {
  content: string;
  todoId: string;
}

export interface UpdateCommentDto {
  content: string;
}

export const commentApi = {
  /**
   * 获取所有评论
   */
  getAll: () =>
    apiClient.get<Comment[]>('/comments'),

  /**
   * 获取指定 Todo 的评论
   */
  getByTodoId: (todoId: string) =>
    apiClient.get<Comment[]>(`/comments/todo/${todoId}`),

  /**
   * 获取单个评论
   */
  getById: (id: string) =>
    apiClient.get<Comment>(`/comments/${id}`),

  /**
   * 创建评论
   */
  create: (data: CreateCommentDto) =>
    apiClient.post<Comment>('/comments', data),

  /**
   * 更新评论
   */
  update: (id: string, data: UpdateCommentDto) =>
    apiClient.put<Comment>(`/comments/${id}`, data),

  /**
   * 删除评论
   */
  delete: (id: string) =>
    apiClient.delete<{ success: boolean }>(`/comments/${id}`),
};

