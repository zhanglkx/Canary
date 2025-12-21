/**
 * TodoController - 待办事项控制器
 *
 * 提供 RESTful Todo 接口：
 * - GET /api/todos - 获取Todo列表
 * - GET /api/todos/:id - 获取单个Todo
 * - POST /api/todos - 创建Todo
 * - PUT /api/todos/:id - 更新Todo
 * - DELETE /api/todos/:id - 删除Todo
 */

import { Controller, Get, Post, Put, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { TodoService } from './todo.service';
import { Todo } from './todo.entity';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../user/user.entity';

// 我们需要创建 DTO 类
export class CreateTodoDto {
  title: string;
  description?: string;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  dueDate?: string;
  categoryId?: string;
}

export class UpdateTodoDto {
  title?: string;
  description?: string;
  completed?: boolean;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  dueDate?: string;
  categoryId?: string;
}

@Controller('todos')
@UseGuards(JwtAuthGuard)
export class TodoController {
  constructor(private readonly todoService: TodoService) {}

  @Post()
  async create(
    @Body() createTodoDto: CreateTodoDto,
    @CurrentUser() user: User,
  ): Promise<Todo> {
    return this.todoService.create(createTodoDto, user.id);
  }

  @Get()
  async findAll(@CurrentUser() user: User): Promise<Todo[]> {
    return this.todoService.findAll(user.id);
  }

  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @CurrentUser() user: User,
  ): Promise<Todo> {
    return this.todoService.findOne(id, user.id);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateTodoDto: UpdateTodoDto,
    @CurrentUser() user: User,
  ): Promise<Todo> {
    return this.todoService.update(id, updateTodoDto, user.id);
  }

  @Delete(':id')
  async remove(
    @Param('id') id: string,
    @CurrentUser() user: User,
  ): Promise<{ success: boolean }> {
    await this.todoService.remove(id, user.id);
    return { success: true };
  }
}
