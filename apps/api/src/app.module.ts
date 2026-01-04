/**
 * NestJS 主模块配置
 *
 * @description
 * 这是整个应用程序的根模块，负责整合所有子模块和配置全局设置。
 * NestJS 使用模块化架构，每个功能都被封装在独立的模块中。
 */

import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config'; // 用于管理环境变量和配置
import { TypeOrmModule } from '@nestjs/typeorm'; // 数据库 ORM
import { join } from 'path';

// 功能模块导入
import { UserModule } from './user/user.module'; // 用户管理模块
import { AuthModule } from './auth/auth.module'; // 认证授权模块
import { TodoModule } from './todo/todo.module'; // 待办事项模块
import { CategoryModule } from './category/category.module'; // 分类管理模块
import { CommentModule } from './comment/comment.module'; // 评论功能模块
import { TagModule } from './tag/tag.module'; // 标签功能模块
import { StatsModule } from './stats/stats.module'; // 统计功能模块
import { SearchModule } from './search/search.module'; // 搜索功能模块
import { BatchModule } from './batch/batch.module'; // 批量操作模块
import { EcommerceModule } from './ecommerce/ecommerce.module'; // 电商模块
import { CommonModule } from './common/common.module'; // 通用模块
import { AppController } from './app.controller';

/**
 * @Module 装饰器定义了应用程序的根模块
 *
 * NestJS 中的模块装饰器包含以下关键部分：
 * - controllers: 处理 HTTP 请求的控制器
 * - imports: 导入其他模块
 * - providers: 依赖注入的服务提供者
 * - exports: 导出给其他模块使用的提供者
 */
@Module({
  controllers: [AppController],
  imports: [
    // 全局配置模块，用于管理环境变量
    ConfigModule.forRoot({
      isGlobal: true, // 使配置在全局可用
    }),

    // 数据库连接配置
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DATABASE_HOST', 'localhost'),
        port: configService.get('DATABASE_PORT', 5432),
        username: configService.get('DATABASE_USERNAME', 'postgres'),
        password: configService.get('DATABASE_PASSWORD', 'postgres'),
        database: configService.get('DATABASE_NAME', 'learning_nest_next'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        // 允许通过环境变量 TYPEORM_SYNCHRONIZE 控制同步行为
        synchronize: configService.get('TYPEORM_SYNCHRONIZE') === 'true' 
          ? true 
          : configService.get('NODE_ENV') !== 'production',
        logging: configService.get('NODE_ENV') === 'development',
        ssl: configService.get('DATABASE_SSL') === 'true' ? { rejectUnauthorized: false } : false,
      }),
      inject: [ConfigService],
    }),

    // 功能模块导入
    CommonModule, // 通用模块
    UserModule, // 用户管理功能
    AuthModule, // 身份认证功能
    TodoModule, // 待办事项功能
    CategoryModule, // 分类管理功能
    CommentModule, // 评论功能
    TagModule, // 标签功能
    StatsModule, // 统计功能
    SearchModule, // 搜索功能
    BatchModule, // 批量操作功能
    EcommerceModule, // 电商功能
  ],
})
export class AppModule {}
