/**
 * Order API Service
 * 订单相关的所有 API 调用
 */

import { apiClient } from '../api-client';

export interface Order {
  id: string;
  orderNumber: string;
  status: string;
  totalAmount: number;
  items: any[];
  createdAt: string;
  updatedAt: string;
}

export const orderApi = {
  /**
   * 获取订单列表
   */
  getAll: () =>
    apiClient.get<Order[]>('/orders'),

  /**
   * 获取单个订单
   */
  getById: (id: string) =>
    apiClient.get<Order>(`/orders/${id}`),

  /**
   * 创建订单
   */
  create: (data: any) =>
    apiClient.post<Order>('/orders', data),

  /**
   * 取消订单
   */
  cancel: (id: string) =>
    apiClient.put<Order>(`/orders/${id}/cancel`),
};
