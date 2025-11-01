/**
 * CommentModule - 评论功能模块
 *
 * 模块的作用：
 * 将相关的功能组织在一起
 * 在这个模块中，Comment 相关的所有代码（Entity、Service、Resolver）都被组织到一起
 * 然后这个模块可以被导入到其他模块中
 *
 * 模块结构：
 * - imports: 导入其他模块（这个模块需要什么？）
 * - controllers: HTTP 控制器
 * - providers: 服务类（通过依赖注入提供）
 * - exports: 导出给其他模块使用的提供者
 *
 * NestJS 模块架构的优势：
 * 1. 高内聚 - 相关功能在一起
 * 2. 低耦合 - 通过 Module 导入/导出来管理依赖
 * 3. 可重用 - 模块可以在不同项目间复用
 */

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Comment } from './comment.entity';
import { CommentService } from './comment.service';
import { CommentResolver } from './comment.resolver';

/**
 * @Module 装饰器定义了这个 NestJS 模块
 *
 * 参数说明：
 * - imports: 这个模块需要使用哪些其他模块
 * - providers: 这个模块提供哪些服务/提供者
 * - exports: 这个模块向外导出哪些提供者
 */
@Module({
  // imports: 导入 TypeORM 模块，将 Comment 实体注册到数据库
  // TypeOrmModule.forFeature([Comment]) 会为 Comment 创建一个数据库仓库
  // 这样 CommentService 就可以通过 @InjectRepository 注入它
  imports: [TypeOrmModule.forFeature([Comment])],

  // providers: 这个模块提供的所有可注入的类
  // - CommentService: 业务逻辑服务
  // - CommentResolver: GraphQL 解析器（会自动注册 GraphQL Query/Mutation/Subscription）
  providers: [CommentService, CommentResolver],

  // exports: 导出 CommentService 给其他模块使用
  // 例如 TodoModule 可能需要用到 CommentService
  exports: [CommentService],
})
export class CommentModule {}
