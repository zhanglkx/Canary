/**
 * Batch Service - 批量操作业务逻辑
 *
 * 提供批量操作的功能，如批量删除、批量更新等
 */

import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Todo } from '../todo/todo.entity';
import { Tag } from '../tag/tag.entity';

@Injectable()
export class BatchService {
  constructor(
    @InjectRepository(Todo)
    private todoRepository: Repository<Todo>,
    @InjectRepository(Tag)
    private tagRepository: Repository<Tag>,
  ) {}

  /**
   * 批量标记 Todo 为完成
   *
   * @param todoIds - Todo ID 数组
   * @param userId - 当前用户 ID
   * @returns 更新的 Todo 数量
   */
  async markTodosAsCompleted(todoIds: string[], userId: string): Promise<number> {
    if (!todoIds || todoIds.length === 0) {
      throw new BadRequestException('Todo IDs cannot be empty');
    }

    if (todoIds.length > 100) {
      throw new BadRequestException('Cannot update more than 100 todos at once');
    }

    const result = await this.todoRepository.update(
      {
        id: In(todoIds),
        userId,
      },
      {
        completed: true,
        updatedAt: new Date(),
      },
    );

    return result.affected || 0;
  }

  /**
   * 批量删除 Todo
   *
   * @param todoIds - Todo ID 数组
   * @param userId - 当前用户 ID
   * @returns 删除的 Todo 数量
   */
  async deleteTodos(todoIds: string[], userId: string): Promise<number> {
    if (!todoIds || todoIds.length === 0) {
      throw new BadRequestException('Todo IDs cannot be empty');
    }

    if (todoIds.length > 100) {
      throw new BadRequestException('Cannot delete more than 100 todos at once');
    }

    const result = await this.todoRepository.delete({
      id: In(todoIds),
      userId,
    });

    return result.affected || 0;
  }

  /**
   * 批量更新 Todo 优先级
   *
   * @param todoIds - Todo ID 数组
   * @param priority - 新优先级 (LOW, MEDIUM, HIGH, URGENT)
   * @param userId - 当前用户 ID
   * @returns 更新的 Todo 数量
   */
  async updatePriority(todoIds: string[], priority: string, userId: string): Promise<number> {
    if (!todoIds || todoIds.length === 0) {
      throw new BadRequestException('Todo IDs cannot be empty');
    }

    if (todoIds.length > 100) {
      throw new BadRequestException('Cannot update more than 100 todos at once');
    }

    const validPriorities = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];
    if (!validPriorities.includes(priority)) {
      throw new BadRequestException(`Invalid priority: ${priority}`);
    }

    const result = await this.todoRepository
      .createQueryBuilder()
      .update(Todo)
      .set({
        priority: priority as any,
        updatedAt: new Date(),
      })
      .where('id IN (:...todoIds)', { todoIds })
      .andWhere('userId = :userId', { userId })
      .execute();

    return result.affected || 0;
  }

  /**
   * 批量添加标签到 Todo
   *
   * @param todoIds - Todo ID 数组
   * @param tagIds - Tag ID 数组
   * @param userId - 当前用户 ID
   * @returns 更新的 Todo 数量
   */
  async addTagsToTodos(todoIds: string[], tagIds: string[], userId: string): Promise<number> {
    if (!todoIds || todoIds.length === 0) {
      throw new BadRequestException('Todo IDs cannot be empty');
    }

    if (!tagIds || tagIds.length === 0) {
      throw new BadRequestException('Tag IDs cannot be empty');
    }

    if (todoIds.length > 100) {
      throw new BadRequestException('Cannot update more than 100 todos at once');
    }

    // 验证所有 tag 都属于当前用户
    const tags = await this.tagRepository.find({
      where: {
        id: In(tagIds),
        userId,
      },
    });

    if (tags.length !== tagIds.length) {
      throw new BadRequestException('Some tags do not exist or do not belong to you');
    }

    // 验证所有 todo 都属于当前用户
    const todos = await this.todoRepository.find({
      where: {
        id: In(todoIds),
        userId,
      },
      relations: ['tags'],
    });

    if (todos.length !== todoIds.length) {
      throw new BadRequestException('Some todos do not exist or do not belong to you');
    }

    // 添加标签到所有 todo
    let updatedCount = 0;
    for (const todo of todos) {
      let hasChanges = false;
      for (const tag of tags) {
        const tagExists = todo.tags?.some((t) => t.id === tag.id);
        if (!tagExists) {
          if (!todo.tags) {
            todo.tags = [];
          }
          todo.tags.push(tag);
          hasChanges = true;
        }
      }

      if (hasChanges) {
        await this.todoRepository.save(todo);
        updatedCount++;
      }
    }

    return updatedCount;
  }

  /**
   * 获取用户的所有待完成 Todo
   *
   * @param userId - 用户 ID
   * @returns 未完成的 Todo 列表
   */
  async getPendingTodos(userId: string): Promise<Todo[]> {
    return this.todoRepository.find({
      where: {
        userId,
        completed: false,
      },
      order: {
        priority: 'DESC',
        dueDate: 'ASC',
      },
      relations: ['user', 'category', 'tags'],
    });
  }

  /**
   * 清理已完成且超过 30 天的 Todo
   *
   * @param userId - 用户 ID
   * @returns 清理的 Todo 数量
   */
  async cleanupCompletedTodos(userId: string): Promise<number> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const result = await this.todoRepository
      .createQueryBuilder('todo')
      .delete()
      .where('todo.userId = :userId', { userId })
      .andWhere('todo.completed = true')
      .andWhere('todo.updatedAt < :date', { date: thirtyDaysAgo })
      .execute();

    return result.affected || 0;
  }
}
