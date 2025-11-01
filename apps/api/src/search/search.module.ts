/**
 * SearchModule - 搜索功能模块
 *
 * 这个模块提供了强大的搜索和过滤功能
 * 用户可以按多个条件搜索 Todo
 */

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SearchResolver } from './search.resolver';
import { Todo } from '../todo/todo.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Todo])],
  providers: [SearchResolver],
})
export class SearchModule {}
