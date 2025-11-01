/**
 * NestJS 应用程序入口点 (Main Entry Point)
 *
 * 这个文件是整个后端应用程序的启动文件。它做以下工作：
 * 1. 创建 NestJS 应用程序实例
 * 2. 配置 CORS（跨域资源共享）
 * 3. 设置数据验证管道
 * 4. 启动服务器并监听指定端口
 */

import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

/**
 * bootstrap 函数 - 应用程序启动函数
 *
 * 这是一个异步函数，负责初始化和配置整个 NestJS 应用程序。
 * 为什么是异步？因为创建应用程序、连接数据库等操作都需要时间。
 */
async function bootstrap() {
  // 步骤 1: 使用 NestFactory 创建 NestJS 应用程序实例
  // AppModule 是我们的根模块，包含所有的配置和功能模块
  const app = await NestFactory.create(AppModule);

  // 步骤 2: 启用 CORS (跨域资源共享)
  // 这允许前端应用从不同的端口访问后端 API
  // origin: 允许来自这些地址的请求
  // credentials: true 允许携带认证信息（如 cookies、JWT 令牌）
  app.enableCors({
    // 允许的来源地址（前端应用的 URL）
    origin: [
      process.env.FRONTEND_URL || 'http://localhost:3000',  // 主前端应用
      'http://localhost:3001',  // 备用前端地址
      'http://localhost:3002',  // 第三个备用地址
    ],
    credentials: true,  // 允许发送凭据（如 JWT Token）
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],  // 允许的 HTTP 方法
    // 允许的请求头，包括用于身份认证的 Authorization 头
    allowedHeaders: ['Content-Type', 'Authorization', 'apollo-require-preflight'],
  });

  // 步骤 3: 使用全局数据验证管道 (Global Validation Pipe)
  // 这个管道会自动验证所有进入的 DTO (数据传输对象)
  // 就像对所有请求进行"质量检查"，确保数据格式正确
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,  // 移除未声明的属性（安全特性）
      transform: true,  // 自动转换数据类型（如字符串 "123" 转为数字 123）
    }),
  );

  // 步骤 4: 获取服务器端口，从环境变量读取，默认 4000
  const port = process.env.PORT || 4000;

  // 步骤 5: 启动服务器并监听指定端口
  await app.listen(port);

  // 打印启动成功信息，帮助开发者知道服务器在哪里运行
  console.log(`🚀 Server is running on http://localhost:${port}/graphql`);
}

// 调用 bootstrap 函数启动应用程序
// 如果启动失败会输出错误信息
bootstrap();
