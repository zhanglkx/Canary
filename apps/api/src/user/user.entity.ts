/**
 * User 实体定义 (User Entity)
 *
 * 这个文件展示了 NestJS 中 GraphQL 和 TypeORM 的完美整合：
 * 1. TypeORM 装饰器（@Entity, @Column）- 用于数据库表映射
 * 2. GraphQL 装饰器（@ObjectType, @Field）- 用于自动生成 GraphQL Schema
 * 3. 同一个类同时定义了：数据库模型 + GraphQL API 类型
 *
 * 优势：代码简洁，避免重复定义同样的数据结构
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { ObjectType, Field, ID, HideField } from '@nestjs/graphql';
import { Todo } from '../todo/todo.entity';
import { Category } from '../category/category.entity';
import { RefreshToken } from '../auth/entities/refresh-token.entity';

/**
 * @Entity('users') - TypeORM 装饰器
 * 告诉 TypeORM 这个类对应数据库中的 'users' 表
 *
 * @ObjectType() - GraphQL 装饰器
 * 告诉 NestJS/GraphQL 这个类是一个 GraphQL 对象类型
 * 它会自动在 GraphQL schema 中生成对应的类型定义
 */
@Entity('users')
@ObjectType()
export class User {
  /**
   * 用户 ID - 唯一标识符
   * @PrimaryGeneratedColumn('uuid') - 自动生成 UUID 作为主键
   * @Field(() => ID) - GraphQL 中的 ID 类型
   */
  @PrimaryGeneratedColumn('uuid')
  @Field(() => ID)
  id: string;

  /**
   * 用户邮箱 - 唯一字段
   * @Column({ unique: true }) - 确保邮箱的唯一性，不能重复
   * @Field() - 在 GraphQL Schema 中暴露这个字段
   */
  @Column({ unique: true })
  @Field()
  email: string;

  /**
   * 用户名 - 用户的昵称
   * @Column() - 普通数据库列
   * @Field() - 在 GraphQL Schema 中暴露
   */
  @Column()
  @Field()
  username: string;

  /**
   * 用户密码 - 已加密存储
   * @Column() - 存储在数据库中
   * @HideField() - 重要！这个字段不会出现在 GraphQL Schema 中（安全考虑）
   * 我们永远不应该在 GraphQL 响应中返回密码
   */
  @Column()
  @HideField()
  password: string;

  /**
   * 用户的待办事项列表
   * @OneToMany(() => Todo, (todo) => todo.user)
   *   - 一个用户可以拥有多个待办事项
   *   - 与 Todo 的 @ManyToOne 关系对应
   * @Field(() => [Todo], { nullable: true })
   *   - 在 GraphQL 中是一个 Todo 对象数组
   *   - nullable: true 表示可以为 null（用户可能还没有创建待办事项）
   */
  @OneToMany(() => Todo, (todo) => todo.user)
  @Field(() => [Todo], { nullable: true })
  todos?: Todo[];

  /**
   * 用户创建的分类列表
   * @OneToMany 关系 - 一个用户可以有多个分类
   * 用于组织和分类待办事项
   */
  @OneToMany(() => Category, (category) => category.user)
  @Field(() => [Category], { nullable: true })
  categories?: Category[];

  /**
   * 记录用户创建的时间
   * @CreateDateColumn() - 自动记录创建时间，不需要手动设置
   * 当用户第一次被保存到数据库时自动填充
   */
  @CreateDateColumn()
  @Field()
  createdAt: Date;

  /**
   * 记录用户上次更新的时间
   * @UpdateDateColumn() - 自动记录每次更新的时间
   * 每次用户信息被修改时自动更新
   */
  @UpdateDateColumn()
  @Field()
  updatedAt: Date;

  /**
   * 用户的刷新令牌列表
   * 支持多设备登录和令牌管理
   * @HideField() - 不在 GraphQL 中暴露（敏感信息）
   */
  @OneToMany(() => RefreshToken, (refreshToken) => refreshToken.user, {
    eager: false,
  })
  @HideField()
  refreshTokens?: RefreshToken[];
}
