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
} from 'typeorm';
import { ObjectType, Field, ID, registerEnumType } from '@nestjs/graphql';
import { User } from '../user/user.entity';
import { Category } from '../category/category.entity';

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

  @CreateDateColumn()
  @Field()
  createdAt: Date;

  @UpdateDateColumn()
  @Field()
  updatedAt: Date;
}
