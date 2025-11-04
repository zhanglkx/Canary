/**
 * 产品统计信息 DTO
 *
 * 返回产品的统计数据，包括销售量、浏览量、评分等
 *
 * @author Claude
 * @module Ecommerce/Product
 */

import { ObjectType, Field, Float, Int } from '@nestjs/graphql';

/**
 * 产品统计信息
 *
 * 用于 productStats GraphQL Query 返回值
 */
@ObjectType('ProductStats')
export class ProductStatsDto {
  /**
   * 产品ID
   */
  @Field()
  productId: string;

  /**
   * 销售量
   */
  @Field(() => Int)
  salesCount: number;

  /**
   * 浏览量
   */
  @Field(() => Int)
  viewCount: number;

  /**
   * 平均评分（0-5）
   */
  @Field(() => Float, { nullable: true })
  averageRating?: number;

  /**
   * 评价数量
   */
  @Field(() => Int)
  reviewCount: number;
}
