/**
 * 产品分类实体
 *
 * 支持无限级分类，通过 parentId 形成树形结构
 * 使用物化路径（Materialized Path）模式实现高效的层级查询
 *
 * @author Claude
 * @module Ecommerce/Product
 */

import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, Index } from 'typeorm';
import { ObjectType, Field, Int } from '@nestjs/graphql';
import { HideField } from '@nestjs/graphql';

/**
 * 产品分类实体
 *
 * 设计特点：
 * - 递归树形结构：支持无限级分类
 * - 物化路径优化：快速查询整个分支
 * - 软排序字段：便于前端自定义排序
 */
@Entity('product_categories')
@ObjectType()
@Index('IDX_category_parent_active', ['parentId', 'isActive'])
@Index('IDX_category_path', ['path'])
@Index('IDX_category_level', ['level'])
export class ProductCategory {
  /**
   * 分类ID
   */
  @PrimaryGeneratedColumn('uuid')
  @Field()
  id: string;

  /**
   * 分类名称
   */
  @Column({ type: 'varchar', length: 100 })
  @Field()
  name: string;

  /**
   * 分类描述
   */
  @Column({ type: 'text', nullable: true })
  @Field({ nullable: true })
  description?: string;

  /**
   * 分类图标或图片URL
   */
  @Column({ type: 'varchar', length: 500, nullable: true })
  @Field({ nullable: true })
  imageUrl?: string;

  /**
   * 分类SEO名称（用于URL友好化）
   */
  @Column({ type: 'varchar', length: 100, unique: true })
  @Field()
  slug: string;

  /**
   * 父分类ID（NULL表示根分类）
   */
  @Column({ type: 'uuid', nullable: true })
  @HideField()
  parentId?: string;

  /**
   * 父分类对象
   */
  @ManyToOne(() => ProductCategory, (category) => category.children, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  @HideField()
  parent?: ProductCategory;

  /**
   * 子分类列表
   */
  @OneToMany(() => ProductCategory, (category) => category.parent, {
    eager: false,
    cascade: false,
  })
  @Field(() => [ProductCategory], { nullable: true })
  children?: ProductCategory[];

  /**
   * 物化路径：格式如 "1.2.3"，用于快速查询整个分支
   * 这是一个关键的性能优化，避免递归查询
   */
  @Column({ type: 'varchar', length: 255, default: '' })
  @HideField()
  path: string;

  /**
   * 分类层级深度（0表示根分类）
   */
  @Column({ type: 'int', default: 0 })
  @Field(() => Int)
  level: number;

  /**
   * 排序权重（值越大越靠前）
   */
  @Column({ type: 'int', default: 0 })
  @Field(() => Int)
  displayOrder: number;

  /**
   * 是否启用
   */
  @Column({ type: 'boolean', default: true })
  @Field()
  isActive: boolean;

  /**
   * 创建时间
   */
  @CreateDateColumn()
  @Field()
  createdAt: Date;

  /**
   * 更新时间
   */
  @UpdateDateColumn()
  @Field()
  updatedAt: Date;

  /**
   * 业务方法：获取完整的分类路径（包括自身）
   */
  getFullPath(): string {
    return this.path ? `${this.path}.${this.id}` : this.id;
  }
}
