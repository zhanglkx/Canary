/**
 * 响应转换拦截器
 * 
 * 统一所有 API 响应的格式，确保前端可以统一处理
 * 
 * 响应格式：
 * {
 *   code: number,      // HTTP 状态码
 *   message: string,    // 响应消息
 *   data: any,         // 响应数据
 *   timestamp: string  // 时间戳
 * }
 */

import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface Response<T> {
  code: number;
  message: string;
  data: T;
  timestamp: string;
}

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, Response<T>> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<Response<T>> {
    const response = context.switchToHttp().getResponse();
    const statusCode = response.statusCode;

    return next.handle().pipe(
      map((data) => {
        // 如果数据已经是统一格式，直接返回
        if (data && typeof data === 'object' && 'code' in data && 'data' in data) {
          return data as Response<T>;
        }

        // 统一响应格式
        return {
          code: statusCode,
          message: this.getSuccessMessage(statusCode),
          data: data,
          timestamp: new Date().toISOString(),
        };
      }),
    );
  }

  /**
   * 根据状态码获取成功消息
   */
  private getSuccessMessage(statusCode: number): string {
    const messages: Record<number, string> = {
      200: '操作成功',
      201: '创建成功',
      204: '删除成功',
    };
    return messages[statusCode] || '请求成功';
  }
}
