/**
 * Batch Operations Module
 *
 * @description
 * 这个模块提供批量操作功能，允许用户在一个请求中执行多个操作。
 * 这对于提高性能和用户体验很有帮助。
 *
 * 功能：
 * - 批量标记 Todo 为完成
 * - 批量删除 Todo
 * - 批量更新 Todo 优先级
 * - 批量添加标签到 Todo
 */

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Todo } from '../todo/todo.entity';
import { Tag } from '../tag/tag.entity';
import { BatchResolver } from './batch.resolver';
import { BatchService } from './batch.service';

@Module({
  imports: [TypeOrmModule.forFeature([Todo, Tag])],
  providers: [BatchResolver, BatchService],
  exports: [BatchService],
})
export class BatchModule {}
