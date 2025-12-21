/**
 * Product API Service
 * 产品相关的所有 API 调用
 */

import { apiClient } from '../api-client';

export interface Product {
  id: string;
  name: string;
  description?: string;
  basePrice: number;
  images: Array<{ url: string }>;
  isAvailable: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProductFilter {
  keyword?: string;
  categoryId?: string;
  minPrice?: number;
  maxPrice?: number;
  page?: number;
  limit?: number;
}

export const productApi = {
  /**
   * 获取产品列表
   */
  getAll: (filter?: ProductFilter) =>
    apiClient.get<{ data: Product[]; total: number; page: number; pages: number }>('/products', { params: filter }),

  /**
   * 获取单个产品
   */
  getById: (id: string) =>
    apiClient.get<Product>(`/products/${id}`),

  /**
   * 获取产品统计
   */
  getStats: () =>
    apiClient.get('/products/stats'),

  /**
   * 创建产品（需要管理员权限）
   */
  create: (data: any) =>
    apiClient.post<Product>('/products', data),

  /**
   * 更新产品（需要管理员权限）
   */
  update: (id: string, data: any) =>
    apiClient.put<Product>(`/products/${id}`, data),

  /**
   * 删除产品（需要管理员权限）
   */
  delete: (id: string) =>
    apiClient.delete<{ success: boolean }>(`/products/${id}`),
};

