/**
 * CommentService - 评论业务逻辑服务
 *
 * 职责：
 * - 创建评论
 * - 查询评论列表
 * - 更新评论
 * - 删除评论
 *
 * Service 的作用：
 * 这是一个纯业务逻辑层，与 HTTP/GraphQL 解耦
 * Resolver 调用 Service，Service 调用数据库仓库
 * 这样遵循了 NestJS 的分层架构
 */

import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Comment } from './comment.entity';
import { CreateCommentInput } from './dto/create-comment.input';
import { User } from '../user/user.entity';

/**
 * @Injectable() 装饰器
 * 标记这个类可以通过 NestJS 的依赖注入系统注入到其他类中
 * 例如：在 Resolver 中通过构造函数注入
 */
@Injectable()
export class CommentService {
  /**
   * 构造函数注入
   * @InjectRepository(Comment) - 注入 Comment 的数据库仓库
   * 使用 TypeORM 的仓库来操作 comments 表
   */
  constructor(
    @InjectRepository(Comment)
    private commentRepository: Repository<Comment>,
  ) {}

  /**
   * 创建新评论
   *
   * @param createCommentInput - 评论输入数据（content 和 todoId）
   * @param user - 当前认证的用户（评论作者）
   * @returns 创建的评论对象
   *
   * 流程：
   * 1. 创建新的 Comment 实体
   * 2. 设置评论内容、所属 Todo 和作者
   * 3. 保存到数据库
   * 4. 返回保存后的评论（带有自动生成的 ID 和时间戳）
   */
  async create(
    createCommentInput: CreateCommentInput,
    user: User,
  ): Promise<Comment> {
    // 创建一个新的 Comment 实体
    const comment = this.commentRepository.create({
      content: createCommentInput.content,
      todoId: createCommentInput.todoId,
      author: user,
      authorId: user.id,
    });

    // 保存到数据库
    return await this.commentRepository.save(comment);
  }

  /**
   * 获取某个 Todo 的所有评论
   *
   * @param todoId - Todo 的 ID
   * @returns 该 Todo 下的所有评论列表
   *
   * 使用场景：
   * 当用户打开某个 Todo 的详情页时，
   * 需要获取这个 Todo 下的所有评论
   */
  async findByTodoId(todoId: string): Promise<Comment[]> {
    // 查询数据库：找到所有 todoId 匹配的评论
    // leftJoinAndSelect 加载关联的 author 和 todo 对象
    return await this.commentRepository
      .createQueryBuilder('comment')
      .where('comment.todoId = :todoId', { todoId })
      .leftJoinAndSelect('comment.author', 'author')
      .leftJoinAndSelect('comment.todo', 'todo')
      .orderBy('comment.createdAt', 'DESC') // 按时间倒序（最新的在前）
      .getMany();
  }

  /**
   * 更新评论内容
   *
   * @param id - 评论 ID
   * @param content - 新的评论内容
   * @param userId - 当前用户 ID（用于权限检查）
   * @returns 更新后的评论
   *
   * 权限检查：
   * 只有评论的原作者才能修改自己的评论
   * 如果是其他用户试图修改，返回 403 Forbidden 错误
   */
  async update(
    id: string,
    content: string,
    userId: string,
  ): Promise<Comment> {
    // 从数据库查找评论
    const comment = await this.commentRepository.findOne({ where: { id } });

    // 如果评论不存在
    if (!comment) {
      throw new NotFoundException(`评论 ${id} 不存在`);
    }

    // 如果当前用户不是评论的作者
    if (comment.authorId !== userId) {
      throw new ForbiddenException('你没有权限修改他人的评论');
    }

    // 更新评论内容
    comment.content = content;

    // 保存到数据库（会自动更新 updatedAt）
    return await this.commentRepository.save(comment);
  }

  /**
   * 删除评论
   *
   * @param id - 评论 ID
   * @param userId - 当前用户 ID（用于权限检查）
   *
   * 权限检查：
   * 只有评论的原作者才能删除自己的评论
   */
  async remove(id: string, userId: string): Promise<boolean> {
    // 查找评论
    const comment = await this.commentRepository.findOne({ where: { id } });

    if (!comment) {
      throw new NotFoundException(`评论 ${id} 不存在`);
    }

    // 权限检查
    if (comment.authorId !== userId) {
      throw new ForbiddenException('你没有权限删除他人的评论');
    }

    // 从数据库删除
    await this.commentRepository.remove(comment);

    return true;
  }
}
