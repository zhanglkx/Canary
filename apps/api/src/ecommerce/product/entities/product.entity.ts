/**
 * 产品实体
 *
 * 核心产品信息，每个产品可以有多个SKU
 * SKU代表具体的产品变体（不同的属性组合）
 *
 * 设计原则：
 * - 产品：抽象的产品概念（如"T恤"）
 * - SKU：具体的库存单位（如"红色M码T恤"）
 *
 * @author Claude
 * @module Ecommerce/Product
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
  Index,
} from 'typeorm';
import { ObjectType, Field, Float, Int } from '@nestjs/graphql';
import { HideField } from '@nestjs/graphql';
import { ProductCategory } from './product-category.entity';
import { ProductImage } from './product-image.entity';
import { ProductSku } from './product-sku.entity';
import { User } from '../../../user/user.entity';

/**
 * 产品实体
 *
 * 关键字段说明：
 * - basePrice: 基础价格，SKU可以有自己的价格覆盖
 * - status: 产品状态控制（上架/下架/删除）
 * - sku列表：一个产品包含多个具体的SKU变体
 */
@Entity('products')
@ObjectType()
@Index('IDX_product_category_status', ['categoryId', 'status'])
@Index('IDX_product_name', ['name'])
@Index('IDX_product_sku', ['sku'])
@Index('IDX_product_status_created', ['status', 'createdAt'])
export class Product {
  /**
   * 产品ID
   */
  @PrimaryGeneratedColumn('uuid')
  @Field()
  id: string;

  /**
   * 产品名称
   */
  @Column({ type: 'varchar', length: 200 })
  @Field()
  name: string;

  /**
   * 产品描述
   */
  @Column({ type: 'text' })
  @Field()
  description: string;

  /**
   * 产品SKU（库存单位编号，唯一标识）
   */
  @Column({ type: 'varchar', length: 100, unique: true })
  @Field()
  sku: string;

  /**
   * 产品分类ID
   */
  @Column({ type: 'uuid' })
  @HideField()
  categoryId: string;

  /**
   * 产品分类
   */
  @ManyToOne(() => ProductCategory, { onDelete: 'SET NULL', nullable: true })
  @Field(() => ProductCategory, { nullable: true })
  category?: ProductCategory;

  /**
   * 基础价格（人民币，单位：分）
   * 使用整数存储以避免浮点数精度问题
   * 显示时需除以100
   */
  @Column({ type: 'int' })
  @Field(() => Float)
  basePrice: number;

  /**
   * 成本价格（人民币，单位：分）
   * @HideField 隐藏在GraphQL中（敏感信息）
   */
  @Column({ type: 'int', default: 0 })
  @HideField()
  costPrice: number;

  /**
   * 产品简介（用于列表显示）
   */
  @Column({ type: 'varchar', length: 500, nullable: true })
  @Field({ nullable: true })
  summary?: string;

  /**
   * 产品状态：
   * - 'active': 上架中
   * - 'inactive': 下架
   * - 'deleted': 逻辑删除
   */
  @Column({
    type: 'enum',
    enum: ['active', 'inactive', 'deleted'],
    default: 'active',
  })
  @Field()
  status: 'active' | 'inactive' | 'deleted';

  /**
   * 销售数量（用于热度排序）
   */
  @Column({ type: 'int', default: 0 })
  @Field(() => Int)
  salesCount: number;

  /**
   * 平均评分（0-5之间）
   */
  @Column({ type: 'decimal', precision: 3, scale: 2, default: 0 })
  @Field(() => Float)
  averageRating: number;

  /**
   * 评价数量
   */
  @Column({ type: 'int', default: 0 })
  @Field(() => Int)
  reviewCount: number;

  /**
   * 产品图片列表
   */
  @OneToMany(() => ProductImage, (image) => image.product, {
    cascade: ['insert', 'update', 'remove'],
    eager: false,
  })
  @Field(() => [ProductImage], { nullable: true })
  images?: ProductImage[];

  /**
   * 产品SKU列表（具体的库存单位）
   */
  @OneToMany(() => ProductSku, (productSku) => productSku.product, {
    eager: false,
    cascade: ['insert', 'update'],
  })
  @Field(() => [ProductSku], { nullable: true })
  skus?: ProductSku[];

  /**
   * 关联的属性（通过Many-to-Many，因为多个产品可能使用同一个属性）
   * 在实际使用中，可能需要创建ProductAttributeMapping中间表来记录顺序
   */
  @ManyToMany(() => User, { eager: false })
  @JoinTable({ name: 'product_tags' })
  @HideField()
  tags?: User[];

  /**
   * 浏览次数
   */
  @Column({ type: 'int', default: 0 })
  @Field(() => Int)
  viewCount: number;

  /**
   * SEO友好的URL名称
   */
  @Column({ type: 'varchar', length: 200, unique: true, nullable: true })
  @Field({ nullable: true })
  slug?: string;

  /**
   * SEO关键词
   */
  @Column({ type: 'varchar', length: 500, nullable: true })
  @HideField()
  seoKeywords?: string;

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
   * 业务方法：获取主图（第一张图片或默认图片）
   */
  getMainImage(): ProductImage | undefined {
    return this.images && this.images.length > 0 ? this.images[0] : undefined;
  }

  /**
   * 业务方法：检查产品是否可售
   * 条件：
   * - 状态为active
   * - 至少有一个SKU有库存
   */
  isAvailable(): boolean {
    if (this.status !== 'active') return false;
    if (!this.skus || this.skus.length === 0) return false;
    return this.skus.some((sku) => sku.stock > 0);
  }
}
