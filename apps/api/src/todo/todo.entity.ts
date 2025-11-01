/**
 * Todo 实体定义
 *
 * 这个文件展示了 NestJS 中 GraphQL 和 TypeORM 的强大整合：
 * 1. TypeORM 装饰器用于数据库映射（@Entity, @Column 等）
 * 2. GraphQL 装饰器用于 API Schema 生成（@ObjectType, @Field 等）
 * 3. 一个类同时服务于两个目的：数据库模型和 API 类型定义
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  ManyToMany,
  JoinTable,
} from 'typeorm';
import { ObjectType, Field, ID, registerEnumType } from '@nestjs/graphql';
import { User } from '../user/user.entity';
import { Category } from '../category/category.entity';
import { Comment } from '../comment/comment.entity';
import { Tag } from '../tag/tag.entity';

/**
 * Todo 优先级枚举
 * GraphQL 和 TypeScript 都会使用这个枚举
 */
export enum Priority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

// 在 GraphQL schema 中注册枚举类型
registerEnumType(Priority, {
  name: 'Priority',
  description: 'Todo 优先级',
});

@Entity('todos')
@ObjectType()
export class Todo {
  @PrimaryGeneratedColumn('uuid')
  @Field(() => ID)
  id: string;

  @Column()
  @Field()
  title: string;

  @Column({ nullable: true })
  @Field({ nullable: true })
  description?: string;

  @Column({ default: false })
  @Field()
  completed: boolean;

  @ManyToOne(() => User, (user) => user.todos)
  @Field(() => User)
  user: User;

  @Column()
  userId: string;

  @ManyToOne(() => Category, (category) => category.todos, { nullable: true })
  @Field(() => Category, { nullable: true })
  category?: Category;

  @Column({ nullable: true })
  categoryId?: string;

  @Column({
    type: 'enum',
    enum: Priority,
    default: Priority.MEDIUM,
  })
  @Field(() => Priority)
  priority: Priority;

  @Column({ type: 'timestamp', nullable: true })
  @Field(() => String, { nullable: true })
  dueDate?: string;

  /**
   * Todo 的评论列表
   * @OneToMany - 一个 Todo 可以有多个评论
   * 与 Comment 的 @ManyToOne 关系对应
   */
  @OneToMany(() => Comment, (comment) => comment.todo)
  @Field(() => [Comment], { nullable: true })
  comments?: Comment[];

  /**
   * Todo 的标签列表（多对多关系）
   * @ManyToMany - 一个 Todo 可以有多个标签，一个标签可以被多个 Todo 使用
   * @JoinTable() - 在这一侧定义多对多关系的联接表
   *
   * 多对多关系的学习要点：
   * - 一个 Todo 可以同时有 "紧急"、"后端"、"重要" 多个标签
   * - 一个标签 "紧急" 可以被多个 Todo 使用
   * - TypeORM 自动创建联接表来管理这个关系
   */
  @ManyToMany(() => Tag, (tag) => tag.todos, { eager: true })
  @JoinTable()
  @Field(() => [Tag], { nullable: true })
  tags?: Tag[];

  @CreateDateColumn()
  @Field()
  createdAt: Date;

  @UpdateDateColumn()
  @Field()
  updatedAt: Date;
}
