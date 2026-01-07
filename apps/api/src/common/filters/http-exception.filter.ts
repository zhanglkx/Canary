/**
 * HTTP 异常过滤器
 * 
 * 捕获并记录所有 HTTP 异常，提供统一的错误响应格式
 * 
 * 功能：
 * 1. 记录异常详情（类型、消息、堆栈）
 * 2. 统一错误响应格式
 * 3. 开发环境显示详细错误信息
 * 4. 生产环境隐藏敏感信息
 */

import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger('ExceptionFilter');

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = '服务器内部错误';
    let errors: any = undefined;
    let stack: string | undefined = undefined;

    // 处理 HTTP 异常
    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (typeof exceptionResponse === 'object') {
        const responseObj = exceptionResponse as any;
        message = responseObj.message || message;
        errors = responseObj.errors;
      }
    } else if (exception instanceof Error) {
      // 处理普通错误
      message = exception.message;
      stack = exception.stack;
    }

    // 记录错误日志
    const errorLog = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      message,
      errors,
      ...(process.env.NODE_ENV === 'development' && { stack }),
    };

    // 根据状态码选择日志级别
    if (status >= 500) {
      this.logger.error(`💥 [${request.method}] ${request.url}`, errorLog);
    } else if (status >= 400) {
      this.logger.warn(`⚠️  [${request.method}] ${request.url}`, errorLog);
    } else {
      this.logger.debug(`ℹ️  [${request.method}] ${request.url}`, errorLog);
    }

    // 构建响应
    const errorResponse: any = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message,
    };

    // 添加错误详情（如果有）
    if (errors) {
      errorResponse.errors = errors;
    }

    // 开发环境添加堆栈信息
    if (process.env.NODE_ENV === 'development' && stack) {
      errorResponse.stack = stack.split('\n').slice(0, 10);
    }

    response.status(status).json(errorResponse);
  }
}
