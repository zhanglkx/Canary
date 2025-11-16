/**
 * NestJS 主模块配置
 *
 * @description
 * 这是整个应用程序的根模块，负责整合所有子模块和配置全局设置。
 * NestJS 使用模块化架构，每个功能都被封装在独立的模块中。
 */

import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config'; // 用于管理环境变量和配置
import { GraphQLModule } from '@nestjs/graphql'; // GraphQL 模块，用于构建 GraphQL API
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo'; // Apollo Server 配置
import { TypeOrmModule } from '@nestjs/typeorm'; // 数据库 ORM
import { join } from 'path';

// 功能模块导入
import { UserModule } from './user/user.module'; // 用户管理模块
import { AuthModule } from './auth/auth.module'; // 认证授权模块
import { TodoModule } from './todo/todo.module'; // 待办事项模块
import { CategoryModule } from './category/category.module'; // 分类管理模块
import { CommentModule } from './comment/comment.module'; // 评论功能模块（新增）
import { TagModule } from './tag/tag.module'; // 标签功能模块（新增）
import { StatsModule } from './stats/stats.module'; // 统计功能模块（新增）
import { SearchModule } from './search/search.module'; // 搜索功能模块（新增）
import { BatchModule } from './batch/batch.module'; // 批量操作模块（新增）
import { EcommerceModule } from './ecommerce/ecommerce.module'; // 电商模块（新增）
import { CommonModule } from './common/common.module'; // 通用模块
import { AppController } from './app.controller';
import { ApolloStudioController } from './apollo-studio.controller';

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
  controllers: [AppController, ApolloStudioController],
  imports: [
    // 全局配置模块，用于管理环境变量
    ConfigModule.forRoot({
      isGlobal: true, // 使配置在全局可用
    }),

    // GraphQL 模块配置
    // 这里使用了 Code First 方式，通过装饰器自动生成 schema
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: join(process.cwd(), 'src/schema.gql'), // 自动生成的 schema 文件位置
      sortSchema: true, // 按字母顺序排序 schema
      introspection: true, // 允许 schema 内省，用于开发工具
      playground: false, // 使用自定义的 Apollo Studio 替代默认 playground
      formatError: (error) => ({
        message: error.message,
        locations: error.locations,
        path: error.path,
        extensions: {
          code: error.extensions?.code,
          timestamp: new Date().toISOString(),
        },
      }),
      context: ({ req, res }) => ({ req, res }),
      csrfPrevention: false, // 禁用 CSRF 保护以解决前端连接问题
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
    CommentModule, // 评论功能（新增）
    TagModule, // 标签功能（新增）
    StatsModule, // 统计功能（新增）
    SearchModule, // 搜索功能（新增）
    BatchModule, // 批量操作功能（新增）
    EcommerceModule, // 电商功能（新增）
  ],
})
export class AppModule {}
