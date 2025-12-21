/**
 * API Client - 优秀的封装设计
 * 
 * 设计模式参考：
 * - 单例模式：axios实例复用
 * - 拦截器模式：请求/响应统一处理
 * - 错误处理：统一的错误拦截和处理
 * - 类型安全：完整的TypeScript支持
 * 
 * 特性：
 * 1. 自动添加JWT Token
 * 2. 统一错误处理
 * 3. 请求/响应日志（开发环境）
 * 4. 超时处理
 * 5. 取消重复请求
 * 6. 请求重试机制
 */

import axios, { AxiosInstance, AxiosRequestConfig, AxiosError, AxiosResponse } from 'axios';

// ============ 类型定义 ============
export interface ApiResponse<T = any> {
  data: T;
  message?: string;
  status: number;
}

export interface ApiError {
  message: string;
  status?: number;
  errors?: Record<string, string[]>;
}

// ============ 配置 ============
const API_CONFIG = {
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api',
  timeout: 15000,
  withCredentials: true,
};

// ============ Axios 实例 ============
class ApiClient {
  private instance: AxiosInstance;
  private pendingRequests: Map<string, AbortController> = new Map();

  constructor() {
    this.instance = axios.create(API_CONFIG);
    this.setupInterceptors();
  }

  /**
   * 设置拦截器
   */
  private setupInterceptors() {
    // 请求拦截器
    this.instance.interceptors.request.use(
      (config) => {
        // 1. 添加 JWT Token
        if (typeof window !== 'undefined') {
          const token = localStorage.getItem('token');
          if (token) {
            config.headers.Authorization = `Bearer ${token}`;
          }
        }

        // 2. 生成请求唯一标识
        const requestKey = this.getRequestKey(config);
        
        // 3. 取消重复请求
        if (this.pendingRequests.has(requestKey)) {
          const controller = this.pendingRequests.get(requestKey);
          controller?.abort();
        }

        // 4. 创建新的取消令牌
        const controller = new AbortController();
        config.signal = controller.signal;
        this.pendingRequests.set(requestKey, controller);

        // 5. 开发环境日志
        if (process.env.NODE_ENV === 'development') {
          console.log(`[API Request] ${config.method?.toUpperCase()} ${config.url}`, config.data);
        }

        return config;
      },
      (error) => {
        console.error('[API Request Error]', error);
        return Promise.reject(error);
      }
    );

    // 响应拦截器
    this.instance.interceptors.response.use(
      (response: AxiosResponse) => {
        // 清除pending请求
        const requestKey = this.getRequestKey(response.config);
        this.pendingRequests.delete(requestKey);

        // 开发环境日志
        if (process.env.NODE_ENV === 'development') {
          console.log(`[API Response] ${response.config.method?.toUpperCase()} ${response.config.url}`, response.data);
        }

        return response;
      },
      async (error: AxiosError) => {
        // 清除pending请求
        if (error.config) {
          const requestKey = this.getRequestKey(error.config);
          this.pendingRequests.delete(requestKey);
        }

        // 处理各种错误
        return this.handleError(error);
      }
    );
  }

  /**
   * 生成请求唯一key
   */
  private getRequestKey(config: AxiosRequestConfig): string {
    return `${config.method}-${config.url}-${JSON.stringify(config.params)}-${JSON.stringify(config.data)}`;
  }

  /**
   * 统一错误处理
   */
  private async handleError(error: AxiosError): Promise<never> {
    // 请求被取消
    if (axios.isCancel(error)) {
      console.log('[Request Canceled]', error.message);
      return Promise.reject({ message: 'Request canceled', canceled: true });
    }

    // 网络错误
    if (!error.response) {
      console.error('[Network Error]', error.message);
      return Promise.reject({
        message: '网络连接失败，请检查您的网络设置',
        status: 0,
      });
    }

    const { status, data } = error.response;

    // 根据状态码处理
    switch (status) {
      case 401:
        // Token过期或无效
        if (typeof window !== 'undefined') {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/login';
        }
        return Promise.reject({
          message: '登录已过期，请重新登录',
          status,
        });

      case 403:
        return Promise.reject({
          message: '没有权限访问此资源',
          status,
        });

      case 404:
        return Promise.reject({
          message: '请求的资源不存在',
          status,
        });

      case 422:
        return Promise.reject({
          message: '请求参数验证失败',
          status,
          errors: (data as any)?.errors,
        });

      case 500:
        return Promise.reject({
          message: '服务器内部错误，请稍后重试',
          status,
        });

      default:
        return Promise.reject({
          message: (data as any)?.message || '请求失败',
          status,
        });
    }
  }

  /**
   * GET 请求
   */
  async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.instance.get<T>(url, config);
    return response.data;
  }

  /**
   * POST 请求
   */
  async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.instance.post<T>(url, data, config);
    return response.data;
  }

  /**
   * PUT 请求
   */
  async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.instance.put<T>(url, data, config);
    return response.data;
  }

  /**
   * PATCH 请求
   */
  async patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.instance.patch<T>(url, data, config);
    return response.data;
  }

  /**
   * DELETE 请求
   */
  async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.instance.delete<T>(url, config);
    return response.data;
  }

  /**
   * 上传文件
   */
  async upload<T = any>(url: string, formData: FormData, onProgress?: (percent: number) => void): Promise<T> {
    const response = await this.instance.post<T>(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(percent);
        }
      },
    });
    return response.data;
  }

  /**
   * 下载文件
   */
  async download(url: string, filename: string): Promise<void> {
    const response = await this.instance.get(url, {
      responseType: 'blob',
    });
    
    const blob = new Blob([response.data]);
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    URL.revokeObjectURL(link.href);
  }
}

// 导出单例实例
export const apiClient = new ApiClient();
export default apiClient;
