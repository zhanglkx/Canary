/**
 * 产品响应DTO
 *
 * 用于API返回的产品信息
 * 包含产品的完整信息及关联的分类、图片、SKU等
 *
 * @author Claude
 * @module Ecommerce/Product
 */

import { ObjectType, Field, Float, Int } from '@nestjs/graphql';
import { ProductCategory } from '../entities/product-category.entity';
import { ProductImage } from '../entities/product-image.entity';
import { ProductSku } from '../entities/product-sku.entity';

/**
 * 产品响应
 *
 * 返回给前端的产品完整数据
 */
@ObjectType()
export class ProductResponse {
  /**
   * 产品ID
   */
  @Field()
  id: string;

  /**
   * 产品名称
   */
  @Field()
  name: string;

  /**
   * 产品描述
   */
  @Field()
  description: string;

  /**
   * 产品SKU（库存单位编号）
   */
  @Field()
  sku: string;

  /**
   * 基础价格（人民币，单位：分，显示时需除以100）
   */
  @Field(() => Float)
  basePrice: number;

  /**
   * 产品简介
   */
  @Field({ nullable: true })
  summary?: string;

  /**
   * SEO友好的URL名称
   */
  @Field({ nullable: true })
  slug?: string;

  /**
   * 产品状态
   */
  @Field()
  status: 'active' | 'inactive' | 'deleted';

  /**
   * 销售数量
   */
  @Field(() => Int)
  salesCount: number;

  /**
   * 平均评分（0-5）
   */
  @Field(() => Float)
  averageRating: number;

  /**
   * 评价数量
   */
  @Field(() => Int)
  reviewCount: number;

  /**
   * 浏览次数
   */
  @Field(() => Int)
  viewCount: number;

  /**
   * 是否可售（有库存且状态为active）
   */
  @Field()
  isAvailable: boolean;

  /**
   * 所属分类
   */
  @Field(() => ProductCategory, { nullable: true })
  category?: ProductCategory;

  /**
   * 产品图片列表
   */
  @Field(() => [ProductImage], { nullable: true })
  images?: ProductImage[];

  /**
   * 产品SKU列表（具体的库存单位）
   */
  @Field(() => [ProductSku], { nullable: true })
  skus?: ProductSku[];

  /**
   * 创建时间
   */
  @Field()
  createdAt: Date;

  /**
   * 更新时间
   */
  @Field()
  updatedAt: Date;
}
