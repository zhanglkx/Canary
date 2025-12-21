/**
 * Search API Service
 * 搜索相关的所有 API 调用
 */

import { apiClient } from '../api-client';

export interface SearchResult {
  type: 'todo' | 'category' | 'comment';
  id: string;
  title?: string;
  name?: string;
  content?: string;
  relevance: number;
}

export interface SearchParams {
  query: string;
  types?: Array<'todo' | 'category' | 'comment'>;
  limit?: number;
}

export const searchApi = {
  /**
   * 全局搜索
   */
  search: (params: SearchParams) =>
    apiClient.get<SearchResult[]>('/search', { params }),

  /**
   * 搜索 Todos
   */
  searchTodos: (query: string) =>
    apiClient.get('/search/todos', { params: { query } }),

  /**
   * 搜索分类
   */
  searchCategories: (query: string) =>
    apiClient.get('/search/categories', { params: { query } }),
};
