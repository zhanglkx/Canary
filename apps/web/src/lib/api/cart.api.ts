/**
 * Cart API Service
 * 购物车相关的所有 API 调用
 */

import { apiClient } from '../api-client';

export interface CartItem {
  id: string;
  skuId: string;
  quantity: number;
  productName: string;
  price: number;
}

export interface Cart {
  id: string;
  items: CartItem[];
  totalAmount: number;
}

export const cartApi = {
  /**
   * 获取购物车
   */
  get: () =>
    apiClient.get<Cart>('/cart'),

  /**
   * 添加商品到购物车
   */
  addItem: (skuId: string, quantity: number) =>
    apiClient.post<Cart>('/cart/items', { skuId, quantity }),

  /**
   * 更新购物车商品数量
   */
  updateItem: (itemId: string, quantity: number) =>
    apiClient.put<Cart>(`/cart/items/${itemId}`, { quantity }),

  /**
   * 从购物车移除商品
   */
  removeItem: (itemId: string) =>
    apiClient.delete<Cart>(`/cart/items/${itemId}`),

  /**
   * 清空购物车
   */
  clear: () =>
    apiClient.delete<{ success: boolean }>('/cart'),
};
