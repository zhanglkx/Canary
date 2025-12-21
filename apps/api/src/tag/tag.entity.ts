/**
 * Tag 实体定义 - 标签系统
 *
 * 功能说明：
 * 标签用于为待办事项进行多维度的分类和标记
 * 与 Category（分类）不同，一个 Todo 可以有多个标签
 * 例如：某个 Todo 可以同时有 "紧急"、"后端"、"BUG修复" 三个标签
 *
 * 数据库关系 (多对多 Many-to-Many)：
 * 一个标签可以属于多个 Todo
 * 一个 Todo 可以有多个标签
 * 使用联接表 (junction table) 实现
 *
 * 这是一个重要的学习案例：
 * 展示如何在 NestJS/TypeORM 中实现多对多关系
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToMany,
  ManyToOne,
} from 'typeorm';
import { Todo } from '../todo/todo.entity';
import { User } from '../user/user.entity';

/**
 * @Entity('tags') - 在数据库中创建 tags 表
 */
@Entity('tags')
export class Tag {
  /**
   * 标签唯一 ID
   * @PrimaryGeneratedColumn('uuid') - 自动生成的 UUID 主键
   */
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * 标签名称
   * 例如："紧急"、"后端"、"前端"、"文档"
   * 同一个用户不能有重复的标签名
   */
  @Column()
  name: string;

  /**
   * 标签颜色 (用于 UI 展示)
   * 存储十六进制颜色值，例如 "#FF5733"
   * 方便前端美化展示
   */
  @Column({ default: '#3B82F6' })
  color: string;

  /**
   * 这个标签的创建者（拥有者）
   * 每个用户维护自己的标签集合
   */
  @ManyToOne(() => User)
  user: User;

  /**
   * 用户 ID（用于数据库关联）
   */
  @Column()
  userId: string;

  /**
   * 多对多关系：Tag ←→ Todo
   *
   * @ManyToMany(() => Todo, (todo) => todo.tags)
   * 表示：
   * - 一个 Tag 可以属于多个 Todo
   * - 一个 Todo 可以有多个 Tag（反向关系在 Todo Entity 中定义）
   *
   * { eager: true } - 查询 Tag 时自动加载关联的 Todo（方便使用）
   *
   * 多对多关系会自动创建一个联接表（junction table）
   * 表名通常是：tag_todos_todo
   */
  @ManyToMany(() => Todo, (todo) => todo.tags)
  todos?: Todo[];

  /**
   * 创建时间
   * @CreateDateColumn() - 自动记录
   */
  @CreateDateColumn()
  createdAt: Date;
}
