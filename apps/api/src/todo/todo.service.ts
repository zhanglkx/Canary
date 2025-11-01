/**
 * TodoService - 待办事项业务服务
 *
 * 作用：封装与待办事项相关的数据访问与业务逻辑。
 * 主要职责：
 *  - 创建、查询、更新和删除 Todo 实体
 *  - 执行与权限相关的数据过滤（按 userId）
 *  - 抛出适当的异常以供 Resolver 层映射到 GraphQL 错误
 *
 * 注意：Service 层只关注业务逻辑，不处理 HTTP/GraphQL 请求细节。
 */
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Todo } from './todo.entity';
import { CreateTodoInput } from './dto/create-todo.input';
import { UpdateTodoInput } from './dto/update-todo.input';

@Injectable()
export class TodoService {
  constructor(
    @InjectRepository(Todo)
    private todoRepository: Repository<Todo>,
  ) {}

  async create(createTodoInput: CreateTodoInput, userId: string): Promise<Todo> {
    const todo = this.todoRepository.create({
      ...createTodoInput,
      userId,
    });
    return this.todoRepository.save(todo);
  }

  async findAll(userId: string): Promise<Todo[]> {
    return this.todoRepository.find({
      where: { userId },
      relations: ['user', 'category'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string, userId: string): Promise<Todo> {
    const todo = await this.todoRepository.findOne({
      where: { id, userId },
      relations: ['user', 'category'],
    });
    if (!todo) {
      throw new NotFoundException(`Todo with ID ${id} not found`);
    }
    return todo;
  }

  async update(id: string, updateTodoInput: UpdateTodoInput, userId: string): Promise<Todo> {
    const todo = await this.findOne(id, userId);
    Object.assign(todo, updateTodoInput);
    return this.todoRepository.save(todo);
  }

  async remove(id: string, userId: string): Promise<boolean> {
    const todo = await this.findOne(id, userId);
    await this.todoRepository.remove(todo);
    return true;
  }
}
