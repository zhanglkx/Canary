/**
 * 产品筛选查询输入DTO
 *
 * 用于产品列表查询的筛选条件
 * 支持关键字搜索、分类筛选、价格范围、评分筛选等
 *
 * @author Claude
 * @module Ecommerce/Product
 */

import { InputType, Field, Float, Int } from '@nestjs/graphql';
import {
  IsString,
  IsOptional,
  IsUUID,
  IsNumber,
  IsPositive,
  Min,
  Max,
  IsEnum,
} from 'class-validator';

/**
 * 产品筛选输入
 *
 * 用于构建复杂的产品查询条件
 *
 * @example
 * // 按分类和价格范围查询
 * const filter: ProductFilterInput = {
 *   categoryId: 'cat-123',
 *   priceMin: 10000,  // 100元
 *   priceMax: 100000, // 1000元
 *   page: 1,
 *   limit: 20,
 *   sort: 'salesCount',
 *   order: 'DESC'
 * };
 */
@InputType()
export class ProductFilterInput {
  /**
   * 搜索关键字
   *
   * 在产品名称和描述中进行模糊搜索
   */
  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  keyword?: string;

  /**
   * 分类ID
   *
   * 按指定分类查询，包括该分类的子分类产品
   */
  @Field({ nullable: true })
  @IsOptional()
  @IsUUID('all', { message: '分类ID必须是有效的UUID' })
  categoryId?: string;

  /**
   * 最低价格（人民币，单位：分）
   *
   * 例如：100元 = 10000分
   */
  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(0, { message: '最低价格不能为负数' })
  priceMin?: number;

  /**
   * 最高价格（人民币，单位：分）
   *
   * 例如：10000元 = 1000000分
   */
  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(0, { message: '最高价格不能为负数' })
  priceMax?: number;

  /**
   * 最低评分
   *
   * 范围：0-5，过滤出评分大于等于指定值的产品
   */
  @Field(() => Float, { nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(0, { message: '评分最小值为0' })
  @Max(5, { message: '评分最大值为5' })
  minRating?: number;

  /**
   * 排序字段
   *
   * 支持的字段：
   * - createdAt: 创建时间（新品优先）
   * - salesCount: 销售数量（热销商品）
   * - basePrice: 基础价格
   * - averageRating: 平均评分
   * - viewCount: 浏览次数
   *
   * @default 'createdAt'
   */
  @Field({ nullable: true })
  @IsOptional()
  @IsEnum(['createdAt', 'salesCount', 'basePrice', 'averageRating', 'viewCount'], {
    message: '排序字段不支持',
  })
  sort?: string;

  /**
   * 排序顺序
   *
   * - ASC: 升序（从小到大）
   * - DESC: 降序（从大到小）
   *
   * @default 'DESC'
   */
  @Field({ nullable: true })
  @IsOptional()
  @IsEnum(['ASC', 'DESC'], { message: '排序顺序必须是 ASC 或 DESC' })
  order?: 'ASC' | 'DESC';

  /**
   * 当前页码（从1开始）
   *
   * @default 1
   */
  @Field(() => Int)
  @IsPositive({ message: '页码必须大于0' })
  @Min(1, { message: '页码最小值为1' })
  page: number = 1;

  /**
   * 每页记录数
   *
   * 限制：最多100条
   *
   * @default 20
   */
  @Field(() => Int)
  @IsPositive({ message: '每页记录数必须大于0' })
  @Min(1, { message: '每页记录数最小值为1' })
  @Max(100, { message: '每页记录数最多100条' })
  limit: number = 20;
}
