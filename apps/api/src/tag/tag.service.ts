/**
 * TagService - 标签业务逻辑服务
 *
 * 主要功能：
 * - 创建标签
 * - 查询标签列表
 * - 添加标签到 Todo
 * - 删除标签
 */

import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tag } from './tag.entity';
import { Todo } from '../todo/todo.entity';
import { CreateTagInput } from './dto/create-tag.input';
import { User } from '../user/user.entity';

@Injectable()
export class TagService {
  constructor(
    @InjectRepository(Tag)
    private tagRepository: Repository<Tag>,
    @InjectRepository(Todo)
    private todoRepository: Repository<Todo>,
  ) {}

  /**
   * 为用户创建新标签
   *
   * @param createTagInput - 标签输入数据
   * @param user - 当前用户（标签拥有者）
   * @returns 创建的标签
   */
  async create(createTagInput: CreateTagInput, user: User): Promise<Tag> {
    const tag = this.tagRepository.create({
      name: createTagInput.name,
      color: createTagInput.color || '#3B82F6',
      user,
      userId: user.id,
    });

    return await this.tagRepository.save(tag);
  }

  /**
   * 获取某个用户的所有标签
   *
   * @param userId - 用户 ID
   * @returns 该用户的标签列表
   */
  async findByUser(userId: string): Promise<Tag[]> {
    return await this.tagRepository.find({
      where: { userId },
      relations: ['todos'],
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * 获取单个标签详情
   *
   * @param id - 标签 ID
   * @param userId - 用户 ID（用于权限检查）
   * @returns 标签对象
   */
  async findOne(id: string, userId: string): Promise<Tag> {
    const tag = await this.tagRepository.findOne({
      where: { id, userId },
      relations: ['todos'],
    });

    if (!tag) {
      throw new NotFoundException(`标签 ${id} 不存在或您没有权限访问`);
    }

    return tag;
  }

  /**
   * 添加标签到 Todo
   *
   * 这是多对多关系的实际应用：
   * 一个 Todo 可以有多个标签
   * 一个标签可以被多个 Todo 使用
   *
   * @param tagId - 标签 ID
   * @param todoId - Todo ID
   * @param userId - 用户 ID（用于权限检查）
   * @returns 更新后的 Todo
   */
  async addTagToTodo(tagId: string, todoId: string, userId: string): Promise<Todo> {
    // 查找标签（必须属于当前用户）
    const tag = await this.findOne(tagId, userId);

    // 查找 Todo（必须属于当前用户）
    const todo = await this.todoRepository.findOne({
      where: { id: todoId, userId },
      relations: ['tags'],
    });

    if (!todo) {
      throw new NotFoundException(`Todo ${todoId} 不存在或您没有权限修改`);
    }

    // 检查标签是否已经添加过（避免重复）
    const tagExists = todo.tags?.some((t) => t.id === tagId);
    if (!tagExists) {
      // 添加标签到 Todo
      if (!todo.tags) {
        todo.tags = [];
      }
      todo.tags.push(tag);

      // 保存更新
      await this.todoRepository.save(todo);
    }

    return todo;
  }

  /**
   * 从 Todo 移除标签
   *
   * @param tagId - 标签 ID
   * @param todoId - Todo ID
   * @param userId - 用户 ID（用于权限检查）
   * @returns 更新后的 Todo
   */
  async removeTagFromTodo(tagId: string, todoId: string, userId: string): Promise<Todo> {
    const todo = await this.todoRepository.findOne({
      where: { id: todoId, userId },
      relations: ['tags'],
    });

    if (!todo) {
      throw new NotFoundException(`Todo ${todoId} 不存在或您没有权限修改`);
    }

    // 从 Todo 的标签列表中移除指定标签
    if (todo.tags) {
      todo.tags = todo.tags.filter((tag) => tag.id !== tagId);
      await this.todoRepository.save(todo);
    }

    return todo;
  }

  /**
   * 删除标签
   *
   * 注意：删除标签会自动移除所有关联的 Todo 中的该标签
   * （由于多对多关系的配置）
   *
   * @param id - 标签 ID
   * @param userId - 用户 ID（用于权限检查）
   * @returns 是否删除成功
   */
  async remove(id: string, userId: string): Promise<boolean> {
    const tag = await this.findOne(id, userId);
    await this.tagRepository.remove(tag);
    return true;
  }
}
