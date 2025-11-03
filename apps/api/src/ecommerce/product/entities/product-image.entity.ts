/**
 * 产品图片实体
 *
 * 存储产品的图片信息
 * 支持多张图片，有顺序和用途区分
 *
 * @author Claude
 * @module Ecommerce/Product
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { ObjectType, Field, Int } from '@nestjs/graphql';
import { HideField } from '@nestjs/graphql';
import { Product } from './product.entity';

/**
 * 产品图片实体
 */
@Entity('product_images')
@ObjectType()
@Index(['productId', 'displayOrder'], { name: 'IDX_image_product_order' })
export class ProductImage {
  /**
   * 图片ID
   */
  @PrimaryGeneratedColumn('uuid')
  @Field()
  id: string;

  /**
   * 所属产品ID
   */
  @Column({ type: 'uuid' })
  @HideField()
  productId: string;

  /**
   * 所属产品
   */
  @ManyToOne(() => Product, (product) => product.images, {
    onDelete: 'CASCADE',
    lazy: false,
  })
  @HideField()
  product: Product;

  /**
   * 图片URL
   */
  @Column({ type: 'varchar', length: 500 })
  @Field()
  url: string;

  /**
   * 缩略图URL（用于列表显示，通常是压缩版本）
   */
  @Column({ type: 'varchar', length: 500, nullable: true })
  @Field({ nullable: true })
  thumbnailUrl?: string;

  /**
   * 图片用途：
   * - 'main': 主图（首图，用于列表显示）
   * - 'gallery': 相册图（详情页显示）
   * - 'detail': 细节图（用于展示产品细节）
   * - 'compare': 对比图（用于产品对比）
   */
  @Column({
    type: 'enum',
    enum: ['main', 'gallery', 'detail', 'compare'],
    default: 'gallery',
  })
  @Field()
  purpose: 'main' | 'gallery' | 'detail' | 'compare';

  /**
   * 显示顺序（值越小越靠前）
   */
  @Column({ type: 'int', default: 0 })
  @Field(() => Int)
  displayOrder: number;

  /**
   * 图片标题（用于SEO和无障碍访问）
   */
  @Column({ type: 'varchar', length: 200, nullable: true })
  @Field({ nullable: true })
  altText?: string;

  /**
   * 创建时间
   */
  @CreateDateColumn()
  @Field()
  createdAt: Date;
}
