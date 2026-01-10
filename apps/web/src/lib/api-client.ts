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

import axios, { AxiosInstance, AxiosRequestConfig, AxiosError, AxiosResponse, InternalAxiosRequestConfig } from 'axios';

// ============ 类型定义 ============

// 扩展 InternalAxiosRequestConfig 类型，添加 _retry 属性
interface ExtendedInternalAxiosRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}
export interface ApiResponse<T = any> {
  code: number;
  message: string;
  data: T;
  timestamp: string;
}

export interface ApiError {
  code: number;
  message: string;
  data?: null;
  timestamp: string;
  errors?: Record<string, string[]>;
}

// ============ 配置 ============
const API_CONFIG = {
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api',
  timeout: 15000,
  withCredentials: true,
};

// 开发环境：打印实际使用的 API URL
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  console.log('[API Client] Base URL:', API_CONFIG.baseURL);
  console.log(
    '[API Client] NEXT_PUBLIC_API_URL:',
    process.env.NEXT_PUBLIC_API_URL || '未设置（使用默认值）',
  );
}

// ============ Axios 实例 ============
class ApiClient {
  private instance: AxiosInstance;
  private pendingRequests: Map<string, AbortController> = new Map();
  private isRefreshing = false;
  private failedQueue: Array<{
    resolve: (value?: any) => void;
    reject: (error?: any) => void;
  }> = [];

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
          } else if (process.env.NODE_ENV === 'development') {
            console.warn('[API Client] 未找到 token，请求可能被拒绝');
          }
        }

        // 2. 生成请求唯一标识
        const requestKey = this.getRequestKey(config);

        // 3. 取消重复请求
        // if (this.pendingRequests.has(requestKey)) {
        //   const controller = this.pendingRequests.get(requestKey);
        //   controller?.abort();
        // }

        // 4. 创建新的取消令牌
        const controller = new AbortController();
        config.signal = controller.signal;
        this.pendingRequests.set(requestKey, controller);

        // 5. 开发环境日志
        if (process.env.NODE_ENV === 'development') {
          const fullUrl = config.baseURL ? `${config.baseURL}${config.url}` : config.url;
          const hasToken = !!config.headers.Authorization;
          console.log(`[API Request] ${config.method?.toUpperCase()} ${fullUrl}`, {
            baseURL: config.baseURL,
            url: config.url,
            fullUrl,
            hasToken,
            headers: {
              Authorization: hasToken ? 'Bearer ***' : '未设置',
            },
            data: config.data,
          });
        }

        return config;
      },
      (error) => {
        console.error('[API Request Error]', error);
        return Promise.reject(error);
      },
    );

    // 响应拦截器
    this.instance.interceptors.response.use(
      (response: AxiosResponse) => {
        // 清除pending请求
        const requestKey = this.getRequestKey(response.config);
        this.pendingRequests.delete(requestKey);

        // 统一响应格式处理：从 {code, message, data} 中提取 data
        if (
          response.data &&
          typeof response.data === 'object' &&
          'code' in response.data &&
          'data' in response.data
        ) {
          // 如果已经是统一格式，提取 data 字段
          const unifiedResponse = response.data as ApiResponse;
          response.data = unifiedResponse.data;
        }

        // 开发环境日志
        if (process.env.NODE_ENV === 'development') {
          console.log(
            `[API Response] ${response.config.method?.toUpperCase()} ${response.config.url}`,
            response.data,
          );
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
      },
    );
  }

  /**
   * 生成请求唯一key
   */
  private getRequestKey(config: AxiosRequestConfig): string {
    return `${config.method}-${config.url}-${JSON.stringify(config.params)}-${JSON.stringify(config.data)}`;
  }

  /**
   * 处理token刷新
   */
  private async handleTokenRefresh(
    error: AxiosError,
    refreshToken: string,
  ): Promise<any> {
    const originalRequest = error.config as ExtendedInternalAxiosRequestConfig | undefined;
    
    if (!originalRequest) {
      return Promise.reject(error);
    }

    // 如果正在刷新，将请求加入队列
    if (this.isRefreshing) {
      return new Promise((resolve, reject) => {
        this.failedQueue.push({ resolve, reject });
      })
        .then(() => {
          // 刷新完成后，使用新token重试原请求
          const newToken = localStorage.getItem('token');
          if (newToken) {
            originalRequest.headers = originalRequest.headers || {};
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
          }
          return this.instance(originalRequest);
        })
        .catch((err) => {
          return Promise.reject(err);
        });
    }

    // 标记正在刷新
    this.isRefreshing = true;
    originalRequest._retry = true;

    try {
      // 调用刷新token接口（不需要Authorization header）
      // 使用axios直接调用，避免触发拦截器
      const response = await axios.post(
        `${API_CONFIG.baseURL}/auth/refresh`,
        { refreshToken },
        {
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: API_CONFIG.timeout,
        },
      );

      const { accessToken } = response.data;

      // 更新localStorage中的token
      localStorage.setItem('token', accessToken);

      // 更新所有等待中的请求的Authorization header
      originalRequest.headers = originalRequest.headers || {};
      originalRequest.headers.Authorization = `Bearer ${accessToken}`;

      // 处理队列中的请求
      this.processQueue(null);

      // 重试原始请求
      return this.instance(originalRequest);
    } catch (refreshError) {
      // 刷新失败，处理队列并清除认证信息
      this.processQueue(refreshError);
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
      
      return Promise.reject(refreshError);
    } finally {
      this.isRefreshing = false;
    }
  }

  /**
   * 处理刷新token时的请求队列
   */
  private processQueue(error: any) {
    this.failedQueue.forEach((prom) => {
      if (error) {
        prom.reject(error);
      } else {
        prom.resolve();
      }
    });
    this.failedQueue = [];
  }

  /**
   * 统一错误处理
   */
  private async handleError(error: AxiosError): Promise<never> {
    // 请求被取消 - 检查多种取消情况
    if (
      axios.isCancel(error) ||
      error.code === 'ERR_CANCELED' ||
      error.message === 'canceled' ||
      (error as any).name === 'CanceledError'
    ) {
      // 静默处理取消的请求，不显示错误
      if (process.env.NODE_ENV === 'development') {
        console.log('[Request Canceled]', error.message || 'Request was canceled');
      }
      // 返回一个特殊的错误对象，让调用方可以判断是否是取消
      return Promise.reject({
        message: 'Request canceled',
        canceled: true,
        isCanceled: true,
      });
    }

    // 网络错误
    if (!error.response) {
      console.error('[Network Error]', error.message);
      const requestUrl = error.config?.url
        ? `${error.config.baseURL || ''}${error.config.url}`
        : '未知 URL';
      console.error('[Network Error] 请求 URL:', requestUrl);
      return Promise.reject({
        message: '网络连接失败，请检查您的网络设置',
        status: 0,
      });
    }

    const { status, data } = error.response;

    // 统一错误响应格式处理
    let errorMessage = '请求失败';
    let errorErrors: Record<string, string[]> | undefined = undefined;

    if (data && typeof data === 'object' && 'code' in data && 'message' in data) {
      // 统一格式的错误响应 {code, message, data, timestamp}
      const errorData = data as ApiError;
      errorMessage = errorData.message || '请求失败';
      errorErrors = errorData.errors;
    } else if (data && typeof data === 'object' && 'message' in data) {
      // 旧格式或非统一格式的错误响应
      errorMessage = (data as any).message || '请求失败';
      errorErrors = (data as any).errors;
    }

    // 开发环境：打印详细错误信息
    if (process.env.NODE_ENV === 'development') {
      const requestUrl = error.config?.url
        ? `${error.config.baseURL || ''}${error.config.url}`
        : '未知 URL';
      console.error(`[API Error] ${status} ${requestUrl}`, {
        status,
        statusText: error.response.statusText,
        data,
        config: {
          method: error.config?.method,
          url: error.config?.url,
          baseURL: error.config?.baseURL,
        },
      });
    }

    // 根据状态码处理
    switch (status) {
      case 401:
        // Token过期或无效，尝试刷新token
        if (typeof window !== 'undefined') {
          const refreshToken = localStorage.getItem('refreshToken');
          const requestConfig = error.config as ExtendedInternalAxiosRequestConfig | undefined;
          
          // 如果有refreshToken，尝试刷新
          if (refreshToken && requestConfig && !requestConfig._retry) {
            return this.handleTokenRefresh(error, refreshToken);
          }
          
          // 没有refreshToken或刷新失败，清除所有认证信息并跳转登录
          localStorage.removeItem('token');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('user');
          window.location.href = '/login';
        }
        return Promise.reject({
          code: status,
          message: errorMessage || '登录已过期，请重新登录',
          errors: errorErrors,
        });

      case 403:
        return Promise.reject({
          code: status,
          message: errorMessage || '没有权限访问此资源',
          errors: errorErrors,
        });

      case 404:
        return Promise.reject({
          code: status,
          message: errorMessage || '请求的资源不存在',
          errors: errorErrors,
        });

      case 422:
        return Promise.reject({
          code: status,
          message: errorMessage || '请求参数验证失败',
          errors: errorErrors,
        });

      case 500:
        return Promise.reject({
          code: status,
          message: errorMessage || '服务器内部错误，请稍后重试',
          errors: errorErrors,
        });

      default:
        return Promise.reject({
          code: status,
          message: errorMessage,
          errors: errorErrors,
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
  async upload<T = any>(
    url: string,
    formData: FormData,
    onProgress?: (percent: number) => void,
  ): Promise<T> {
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
