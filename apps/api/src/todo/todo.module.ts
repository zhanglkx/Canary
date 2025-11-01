/**
 * TodoModule - 待办事项模块
 *
 * 作用：将 Todo 实体、Service 与 Resolver 组合为一个可重用的模块，便于在根模块中导入。
 * 约定：模块只负责把功能组合在一起，具体业务由 Service 实现，GraphQL 接口由 Resolver 暴露。
 */
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Todo } from './todo.entity';
import { TodoService } from './todo.service';
import { TodoResolver } from './todo.resolver';

@Module({
  imports: [TypeOrmModule.forFeature([Todo])],
  providers: [TodoService, TodoResolver],
})
export class TodoModule {}
