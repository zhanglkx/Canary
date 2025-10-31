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
