/**
 * NestJS 应用程序入口点 (Main Entry Point)
 *
 * 这个文件是整个后端应用程序的启动文件。它做以下工作：
 * 1. 创建 NestJS 应用程序实例
 * 2. 配置 CORS（跨域资源共享）
 * 3. 设置数据验证管道
 * 4. 配置全局 API 前缀
 * 5. 启动服务器并监听指定端口
 */

import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { AppModule } from './app.module';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

/**
 * bootstrap 函数 - 应用程序启动函数
 *
 * 这是一个异步函数，负责初始化和配置整个 NestJS 应用程序。
 * 为什么是异步？因为创建应用程序、连接数据库等操作都需要时间。
 */
async function bootstrap() {
  const logger = new Logger('Bootstrap');

  // 步骤 1: 使用 NestFactory 创建 NestJS 应用程序实例
  // AppModule 是我们的根模块，包含所有的配置和功能模块
  const app = await NestFactory.create(AppModule, {
    logger:
      process.env.NODE_ENV === 'development'
        ? ['log', 'error', 'warn', 'debug', 'verbose']
        : ['log', 'error', 'warn'],
  });

  // 步骤 2: 设置全局 API 前缀
  // 所有 API 端点都会以 /api 开头，例如: /api/auth/login
  app.setGlobalPrefix('api');
  logger.log('✅ 全局 API 前缀已设置: /api');

  // 步骤 3: 启用 CORS (跨域资源共享)
  // 这允许前端应用从不同的端口访问后端 API
  // origin: 允许来自这些地址的请求
  // credentials: true 允许携带认证信息（如 cookies、JWT 令牌）
  app.enableCors({
    // 允许的来源地址（前端应用的 URL）
    origin: [
      process.env.FRONTEND_URL || 'http://localhost:3000', // 主前端应用
      'http://localhost:3000', // 本地开发
      'http://localhost:3001', // 备用前端地址
      'http://localhost:3002', // 第三个备用地址
      'http://8.159.144.140', // 阿里云服务器公网 IP
    ],
    credentials: true, // 允许发送凭据（如 JWT Token）
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'], // 允许的 HTTP 方法
    // 允许的请求头，包括用于身份认证的 Authorization 头
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // 步骤 4: 注册全局拦截器
  // 注意：拦截器的执行顺序是从后往前，所以先注册的会最后执行
  // 1. TransformInterceptor - 转换响应格式（最后执行，包装响应）
  // 2. LoggingInterceptor - 记录日志（先执行，记录原始响应）
  app.useGlobalInterceptors(
    new TransformInterceptor(), // 响应格式转换
    new LoggingInterceptor(), // 日志记录
  );
  console.log('✅ [Bootstrap] 全局拦截器已注册 (console.log)');
  logger.log('✅ 全局拦截器已注册（响应转换 + 日志记录）');

  // 步骤 5: 注册全局异常过滤器 - 统一处理异常
  app.useGlobalFilters(new HttpExceptionFilter());
  logger.log('✅ 全局异常过滤器已注册');

  // 步骤 6: 使用全局数据验证管道 (Global Validation Pipe)
  // 这个管道会自动验证所有进入的 DTO (数据传输对象)
  // 就像对所有请求进行"质量检查"，确保数据格式正确
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // 移除未声明的属性（安全特性）
      transform: true, // 自动转换数据类型（如字符串 "123" 转为数字 123）
      transformOptions: {
        enableImplicitConversion: true, // 启用隐式类型转换
      },
      forbidNonWhitelisted: true, // 禁止非白名单属性
      disableErrorMessages: process.env.NODE_ENV === 'production', // 生产环境禁用详细错误信息
    }),
  );
  logger.log('✅ 全局验证管道已注册');

  // 步骤 7: 获取服务器端口，从环境变量读取，默认 4000
  const port = process.env.PORT || 4000;

  // 步骤 8: 启动服务器并监听指定端口
  await app.listen(port);

  // 打印启动成功信息，帮助开发者知道服务器在哪里运行
  logger.log(`🚀 Server is running on http://localhost:${port}/api`);
  logger.log(`📚 API documentation available at http://localhost:${port}/api`);
  logger.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.log(
    `📝 Logging level: ${process.env.NODE_ENV === 'development' ? 'DEBUG' : 'PRODUCTION'}`,
  );
}

// 调用 bootstrap 函数启动应用程序
// 如果启动失败会输出错误信息
bootstrap();
