/**
 * TagModule - 标签功能模块
 *
 * 这个模块包含标签（Tag）的所有功能
 * 标签用于为待办事项进行灵活的多维度分类
 *
 * 关键概念：
 * 这个模块展示了如何处理多对多关系 (Many-to-Many)
 * TypeORM 会自动创建联接表来管理 Tag 和 Todo 之间的关系
 */

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Tag } from './tag.entity';
import { TagService } from './tag.service';
import { TagController } from './tag.controller';
import { Todo } from '../todo/todo.entity';

@Module({
  // 导入 TypeORM 模块，注册 Tag 和 Todo 实体
  // 需要 Todo 是因为 TagService 需要操作 Todo 与 Tag 的关系
  imports: [TypeOrmModule.forFeature([Tag, Todo])],

  // 这个模块提供的控制器和服务
  controllers: [TagController],
  providers: [TagService],

  // 导出 TagService，以防其他模块需要使用它
  exports: [TagService],
})
export class TagModule {}
