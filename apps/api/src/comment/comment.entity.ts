/**
 * Comment 实体定义 (评论/讨论功能)
 *
 * 功能说明：
 * - 允许用户在待办事项上添加评论
 * - 支持评论讨论和协作
 * - 记录评论的创建和修改时间
 *
 * 使用场景：
 * 用户可以在某个 Todo 上添加评论，比如：
 * "这个任务需要和 PM 确认一下需求"
 * "已完成初版代码，等待代码审查"
 *
 * 数据库关系：
 * Todo (1) ←→ (N) Comment
 * Comment ←→ User (谁写的评论)
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
} from 'typeorm';
import { Todo } from '../todo/todo.entity';
import { User } from '../user/user.entity';

/**
 * @Entity('comments') - 在数据库中创建 comments 表
 */
@Entity('comments')
export class Comment {
  /**
   * 评论唯一 ID
   * @PrimaryGeneratedColumn('uuid') - 自动生成的 UUID 主键
   */
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * 评论内容
   * 用户在评论中输入的文字内容
   */
  @Column()
  content: string;

  /**
   * 这条评论属于哪个 Todo
   * @ManyToOne - 多个评论可以属于同一个 Todo
   * 删除 Todo 时自动删除相关评论（cascade）
   */
  @ManyToOne(() => Todo, (todo) => todo.comments, {
    onDelete: 'CASCADE',
  })
  todo: Todo;

  /**
   * Todo 的 ID（用于数据库关联）
   */
  @Column()
  todoId: string;

  /**
   * 评论的作者
   * 哪个用户发表了这条评论
   */
  @ManyToOne(() => User)
  author: User;

  /**
   * 作者 ID（用于数据库关联）
   */
  @Column()
  authorId: string;

  /**
   * 评论创建时间
   * @CreateDateColumn() - 自动记录
   */
  @CreateDateColumn()
  createdAt: Date;

  /**
   * 评论更新时间
   * @UpdateDateColumn() - 每次修改时自动更新
   */
  @UpdateDateColumn()
  updatedAt: Date;
}
