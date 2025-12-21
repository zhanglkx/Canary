/**
 * StatsModule - 统计和分析模块
 *
 * 这个模块提供了各种统计和分析功能
 * 用于在前端仪表板展示数据
 */

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StatsController } from './stats.controller';
import { Todo } from '../todo/todo.entity';
import { Category } from '../category/category.entity';

@Module({
  // 导入 TypeORM 模块，注册 Todo 和 Category 实体
  imports: [TypeOrmModule.forFeature([Todo, Category])],

  // 提供 StatsController
  controllers: [StatsController],
  providers: [],
})
export class StatsModule {}
