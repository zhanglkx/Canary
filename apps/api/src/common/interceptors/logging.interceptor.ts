/**
 * 日志拦截器
 * 
 * 记录所有 HTTP 请求和响应的详细信息，方便调试
 * 
 * 功能：
 * 1. 记录请求信息（方法、URL、参数、Body、Headers）
 * 2. 记录响应信息（状态码、响应时间、响应数据）
 * 3. 记录错误信息（错误类型、错误消息、堆栈）
 * 4. 性能监控（请求耗时）
 */

import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    // 测试日志 - 确保拦截器被调用
    console.log('🔍 [LoggingInterceptor] 拦截器被调用！');
    this.logger.log('🔍 [LoggingInterceptor] 拦截器被调用！');
    
    const request = context.switchToHttp().getRequest();
    const { method, url, body, query, params, headers } = request;
    const userAgent = headers['user-agent'] || '';
    const ip = request.ip || request.connection?.remoteAddress || 'unknown';
    const startTime = Date.now();

    // 记录请求信息
    console.log(`➡️  [HTTP] [${method}] ${url} | IP: ${ip}`);
    this.logger.log(
      `➡️  [${method}] ${url} | IP: ${ip} | User-Agent: ${userAgent.substring(0, 50)}`,
    );

    // 记录请求详情（开发环境）
    if (process.env.NODE_ENV === 'development') {
      const requestInfo: any = {
        method,
        url,
        query: Object.keys(query).length > 0 ? query : undefined,
        params: Object.keys(params).length > 0 ? params : undefined,
        body: body && Object.keys(body).length > 0 ? this.sanitizeBody(body) : undefined,
        headers: {
          authorization: headers.authorization ? 'Bearer ***' : undefined,
          'content-type': headers['content-type'],
        },
      };

      // 移除 undefined 字段
      Object.keys(requestInfo).forEach(
        (key) => requestInfo[key] === undefined && delete requestInfo[key],
      );

      if (Object.keys(requestInfo).length > 2) {
        this.logger.log(`📥 Request Details: ${JSON.stringify(requestInfo, null, 2)}`);
      }
    }

    return next.handle().pipe(
      tap({
        next: (data) => {
          const responseTime = Date.now() - startTime;
          const response = context.switchToHttp().getResponse();
          const statusCode = response.statusCode;

          // 记录成功响应
          this.logger.log(
            `✅ [${method}] ${url} | ${statusCode} | ${responseTime}ms`,
          );

          // 开发环境记录响应数据（限制大小）
          if (process.env.NODE_ENV === 'development' && data) {
            const responseData = this.sanitizeResponse(data);
            if (responseData) {
              this.logger.log(`📤 Response: ${JSON.stringify(responseData).substring(0, 500)}`);
            }
          }
        },
        error: (error) => {
          const responseTime = Date.now() - startTime;
          const statusCode = error?.status || error?.statusCode || 500;

          // 记录错误响应
          this.logger.error(
            `❌ [${method}] ${url} | ${statusCode} | ${responseTime}ms | ${error?.message || 'Unknown error'}`,
          );

          // 开发环境记录详细错误信息
          if (process.env.NODE_ENV === 'development') {
            this.logger.error(`💥 Error Details:`, {
              message: error?.message,
              status: statusCode,
              stack: error?.stack?.split('\n').slice(0, 5).join('\n'),
            });
          }
        },
      }),
      catchError((error) => {
        const responseTime = Date.now() - startTime;
        this.logger.error(
          `💥 [${method}] ${url} | Error after ${responseTime}ms: ${error?.message}`,
        );
        return throwError(() => error);
      }),
    );
  }

  /**
   * 清理敏感信息（密码、token等）
   */
  private sanitizeBody(body: any): any {
    if (!body || typeof body !== 'object') {
      return body;
    }

    const sanitized = { ...body };
    const sensitiveFields = ['password', 'token', 'secret', 'authorization', 'apiKey'];

    for (const field of sensitiveFields) {
      if (sanitized[field]) {
        sanitized[field] = '***';
      }
    }

    return sanitized;
  }

  /**
   * 清理响应数据（限制大小和敏感信息）
   */
  private sanitizeResponse(data: any): any {
    if (!data) {
      return null;
    }

    // 如果是字符串，直接返回（截断）
    if (typeof data === 'string') {
      return data.substring(0, 500);
    }

    // 如果是对象，清理敏感字段
    if (typeof data === 'object') {
      const sanitized = { ...data };
      const sensitiveFields = ['password', 'token', 'secret', 'refreshToken'];

      for (const field of sensitiveFields) {
        if (sanitized[field]) {
          sanitized[field] = '***';
        }
      }

      // 限制对象大小
      const jsonString = JSON.stringify(sanitized);
      if (jsonString.length > 1000) {
        return { ...sanitized, _truncated: true };
      }

      return sanitized;
    }

    return data;
  }
}
