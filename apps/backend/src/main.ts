/**
 * ============================================
 * Canary Backend - Application Entry Point
 * ============================================
 *
 * 这是后端应用的入口文件。它负责：
 * 1. 创建 NestJS 应用实例
 * 2. 配置全局中间件（CORS、验证等）
 * 3. 设置 Swagger API 文档
 * 4. 启动 HTTP 服务器
 *
 * 学习点：
 * - 如何引导 NestJS 应用
 * - 如何配置跨域（CORS）
 * - 如何设置全局验证管道
 * - 如何自动生成 API 文档
 */

import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

/**
 * Bootstrap 函数 - 应用启动入口
 *
 * 做的事情：
 * 1. 创建 NestJS 应用
 * 2. 配置基础信息（端口、前缀等）
 * 3. 启动 HTTP 服务器
 *
 * 为什么要 async？
 * - 启动应用需要等待数据库连接等异步操作
 * - await 确保所有初始化完成后才启动
 */
async function bootstrap() {
  // 创建 NestJS 应用实例
  // AppModule 是主模块，包含所有子模块和配置
  const app = await NestFactory.create(AppModule);

  /**
   * 设置全局路由前缀
   *
   * 效果：
   * /health → /api/health
   * /auth/login → /api/auth/login
   * /users → /api/users
   *
   * 好处：
   * - 所有 API 都有统一的 /api 前缀
   * - 便于管理和理解
   * - 可以在一个地方修改
   */
  app.setGlobalPrefix('api');

  /**
   * 启用 CORS（跨域资源共享）
   *
   * 为什么需要？
   * - 前端运行在 http://localhost:3000
   * - 后端运行在 http://localhost:4000
   * - 不同端口的请求被浏览器拦截
   * - CORS 允许来自指定源的请求
   *
   * 配置说明：
   * - origin: 允许哪些源发送请求
   * - credentials: 是否允许发送身份信息（Cookie、Token）
   */
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  });

  /**
   * 全局验证管道（Global Validation Pipe）
   *
   * 作用：
   * - 自动验证所有传入的数据
   * - 检查数据类型
   * - 执行 DTO 中定义的验证规则
   * - 如果验证失败，自动返回错误响应
   *
   * 配置说明：
   * - whitelist: 只允许 DTO 中定义的字段（拒绝未定义的字段）
   * - forbidNonWhitelisted: 如果请求包含未定义的字段，返回错误
   * - transform: 自动转换数据类型（字符串转数字等）
   *
   * 示例：
   * 如果 CreateUserDto 定义了 email, name, password 三个字段
   * 而请求中包含了额外的字段，验证管道会拒绝这个请求
   */
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,              // 只允许在 DTO 中定义的字段
      forbidNonWhitelisted: true,   // 拒绝未定义的字段
      transform: true,              // 自动转换数据类型
    }),
  );

  /**
   * Swagger API 文档配置
   *
   * Swagger 是什么？
   * - 一个自动生成 API 文档的工具
   * - 从代码中提取信息（路由、参数、响应等）
   * - 生成可交互的 API 测试界面
   *
   * 访问地址：http://localhost:4000/api/docs
   *
   * DocumentBuilder 的作用：
   * - 设置 API 的元信息（标题、版本、描述等）
   * - 配置认证方式（Bearer Token）
   * - 定义服务器地址
   * - 添加标签分类
   */
  const config = new DocumentBuilder()
    .setTitle('Canary API')                                    // API 标题
    .setDescription('Full-Stack Application API')              // API 描述
    .setVersion('1.0.0')                                       // API 版本
    .addBearerAuth()                                           // 支持 Bearer Token 认证
    .addServer('http://localhost:4000', 'Development')         // 开发环境服务器
    .addServer('https://api.canary.dev', 'Production')         // 生产环境服务器
    .addTag('Health', 'System health checks')                  // 标签：健康检查
    .addTag('Users', 'User management')                        // 标签：用户管理
    .addTag('Auth', 'Authentication')                          // 标签：认证
    .build();

  /**
   * 创建 Swagger 文档
   *
   * createDocument 做的事情：
   * - 扫描所有 Controller
   * - 从代码注释和装饰器中提取信息
   * - 生成 OpenAPI 3.0 文档
   */
  const document = SwaggerModule.createDocument(app, config);

  /**
   * 设置 Swagger UI
   *
   * 参数说明：
   * - 'api/docs': 文档访问路径
   * - app: NestJS 应用实例
   * - document: 生成的 OpenAPI 文档
   *
   * 结果：
   * - 访问 http://localhost:4000/api/docs 可以看到可交互的 API 文档
   * - 可以在浏览器中直接测试 API
   */
  SwaggerModule.setup('api/docs', app, document);

  /**
   * 获取服务器端口
   *
   * 优先级：
   * 1. 环境变量 PORT（如果设置了）
   * 2. 默认端口 4000（如果没有设置环境变量）
   *
   * 这样做的好处：
   * - 开发环境可以用默认端口
   * - 生产环境可以通过环境变量修改端口
   */
  const port = process.env.PORT || 4000;

  /**
   * 启动 HTTP 服务器
   *
   * await app.listen(port) 做的事情：
   * 1. 创建 HTTP 服务器
   * 2. 监听指定端口
   * 3. 等待客户端请求
   *
   * 这是一个阻塞调用，应用会一直运行直到被手动关闭
   */
  await app.listen(port);

  // 启动成功的提示信息
  console.log(`✓ API is running on http://localhost:${port}`);
  console.log(`✓ Swagger docs available at http://localhost:${port}/api/docs`);
}

/**
 * 执行 Bootstrap 函数
 *
 * 为什么需要 .catch()？
 * - 如果启动过程中出错（如数据库连接失败）
 * - catch 会捕获错误并打印日志
 * - process.exit(1) 退出应用，表示发生错误
 *
 * 错误可能的原因：
 * - 数据库连接失败
 * - 端口已被占用
 * - 环境变量配置错误
 */
bootstrap().catch((error) => {
  console.error('Bootstrap error:', error);
  process.exit(1);  // 1 表示异常退出
});
