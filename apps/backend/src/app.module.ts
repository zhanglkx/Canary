/**
 * ============================================
 * Canary Backend - Root Application Module
 * ============================================
 *
 * 这是后端应用的根模块（App Module）。
 *
 * 什么是模块？
 * - 模块是组织相关功能的容器
 * - 每个模块包含 Controller、Service、Entity 等
 * - App Module 是所有模块的入口点
 *
 * 这个模块做什么？
 * 1. 导入全局配置（环境变量）
 * 2. 配置数据库连接（TypeORM）
 * 3. 注册所有功能模块（Auth、Users 等）
 * 4. 定义全局 Controller
 *
 * 学习点：
 * - 如何配置 NestJS 模块
 * - 如何配置数据库
 * - 如何管理模块依赖
 */

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { HealthController } from './health/health.controller';

/**
 * @Module 装饰器
 *
 * 在 NestJS 中，@Module 装饰器用来定义一个模块。
 * 模块通常包含以下内容：
 *
 * 1. imports: 导入其他模块（使用它们导出的服务等）
 * 2. controllers: 该模块包含的控制器
 * 3. providers: 该模块包含的服务和其他提供者
 * 4. exports: 该模块导出的提供者（供其他模块使用）
 *
 * 这个应用的结构：
 * ```
 * AppModule (根模块)
 *   ├── ConfigModule (配置)
 *   ├── TypeOrmModule (数据库)
 *   ├── AuthModule (认证功能)
 *   ├── UsersModule (用户管理功能)
 *   └── HealthController (健康检查)
 * ```
 */
@Module({
  /**
   * imports 数组
   *
   * 导入其他模块，使用它们提供的功能。
   * 导入的顺序很重要：
   * 1. ConfigModule 必须先导入（提供环境变量）
   * 2. TypeOrmModule 需要用到环境变量配置
   * 3. 其他功能模块可以使用数据库和环境变量
   */
  imports: [
    /**
     * ConfigModule
     *
     * 作用：从 .env 文件加载环境变量
     *
     * 环境变量的用途：
     * - 数据库连接字符串
     * - JWT 密钥
     * - 前端 URL
     * - 其他敏感配置
     *
     * 配置说明：
     * - isGlobal: true - 在整个应用中都可以使用环境变量
     * - envFilePath: '.env' - 从 .env 文件读取配置
     *
     * 访问环境变量：
     * ```typescript
     * const dbUrl = process.env.DATABASE_URL;
     * const secret = process.env.JWT_SECRET;
     * ```
     */
    ConfigModule.forRoot({
      isGlobal: true,          // 使环境变量在全局可用
      envFilePath: '.env',     // 读取 .env 文件
    }),

    /**
     * TypeOrmModule
     *
     * 作用：配置数据库连接和 ORM（Object-Relational Mapping）
     *
     * 什么是 ORM？
     * - 一个库，将数据库表映射到 TypeScript 类
     * - 不用写 SQL，用面向对象的方式操作数据库
     * - 自动处理类型转换和数据验证
     *
     * TypeORM 配置说明：
     *
     * type: 'sqlite'
     * - 使用 SQLite 数据库（开发环境推荐）
     * - 其他选项：postgresql, mysql, mariadb, mongodb 等
     * - SQLite 的优点：不需要单独的服务器，数据存储在文件中
     *
     * database: 'db.sqlite'
     * - 数据库文件名
     * - SQLite 将数据存储在 db.sqlite 文件中
     * - 文件会自动创建
     *
     * entities: [__dirname + '/**\/*.entity{.ts,.js}']
     * - 自动扫描所有 Entity 文件
     * - Entity 是代表数据库表的 TypeScript 类
     * - __dirname 是当前目录
     * - **\/*.entity.ts 匹配所有 .entity.ts 文件
     *
     * synchronize: process.env.NODE_ENV !== 'production'
     * - 自动同步数据库表结构
     * - true: 开发环境，自动创建/修改表（便于开发）
     * - false: 生产环境，手动管理数据库迁移（更安全）
     *
     * logging: process.env.NODE_ENV === 'development'
     * - 打印 SQL 日志
     * - true: 开发环境，打印所有数据库操作（便于调试）
     * - false: 生产环境，不打印日志（性能更好）
     *
     * 例子：
     * - 创建用户时，TypeORM 自动发送 SQL INSERT 语句
     * - 查询用户时，TypeORM 自动发送 SQL SELECT 语句
     * - 都是基于 User Entity 自动生成的
     */
    TypeOrmModule.forRoot({
      type: 'sqlite',                                      // 数据库类型
      database: 'db.sqlite',                               // 数据库文件
      entities: [__dirname + '/**/*.entity{.ts,.js}'],    // 自动加载所有 Entity
      synchronize: process.env.NODE_ENV !== 'production', // 开发时自动同步表结构
      logging: process.env.NODE_ENV === 'development',    // 开发时打印 SQL 日志
    }),

    /**
     * AuthModule
     *
     * 认证模块，提供：
     * - 用户注册功能
     * - 用户登录功能
     * - JWT Token 生成
     *
     * 导入这个模块后，@Module 注册的 Controller 就可以使用
     * AuthModule 提供的服务了
     */
    AuthModule,

    /**
     * UsersModule
     *
     * 用户管理模块，提供：
     * - 获取用户列表
     * - 获取单个用户
     * - 创建用户
     * - 更新用户
     * - 删除用户
     *
     * 导入这个模块后，应用就可以处理所有用户管理相关的请求
     */
    UsersModule,
  ],

  /**
   * controllers 数组
   *
   * 定义这个模块包含的 Controller
   * Controller 是处理 HTTP 请求的类
   *
   * HealthController：
   * - 处理 GET /api/health 请求
   * - 返回服务器健康状态
   * - 通常用于监控和负载均衡
   */
  controllers: [HealthController],
})
export class AppModule {}
