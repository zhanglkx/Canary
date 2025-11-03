/**
 * 更新产品输入DTO
 *
 * 用于产品更新操作的输入验证
 * 所有字段都是可选的，只更新提供的字段
 *
 * @author Claude
 * @module Ecommerce/Product
 */

import { InputType, Field, Float } from '@nestjs/graphql';
import {
  IsString,
  IsOptional,
  IsUUID,
  IsPositive,
  Length,
  MaxLength,
  IsEnum,
} from 'class-validator';

/**
 * 产品更新输入
 *
 * 支持部分更新，只需提供要修改的字段
 */
@InputType()
export class UpdateProductInput {
  /**
   * 产品名称
   */
  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @Length(2, 200, { message: '产品名称长度必须在2-200字符之间' })
  name?: string;

  /**
   * 产品描述
   */
  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  description?: string;

  /**
   * 产品分类ID
   */
  @Field({ nullable: true })
  @IsOptional()
  @IsUUID('all', { message: '分类ID必须是有效的UUID' })
  categoryId?: string;

  /**
   * 基础价格（人民币，单位：元）
   */
  @Field(() => Float, { nullable: true })
  @IsOptional()
  @IsPositive({ message: '价格必须大于0' })
  basePrice?: number;

  /**
   * 产品SKU编码
   */
  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  sku?: string;

  /**
   * 产品简介
   */
  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  summary?: string;

  /**
   * SEO友好的URL名称
   */
  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  slug?: string;

  /**
   * SEO关键词
   */
  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  seoKeywords?: string;

  /**
   * 产品状态
   */
  @Field({ nullable: true })
  @IsOptional()
  @IsEnum(['active', 'inactive', 'deleted'], {
    message: '产品状态必须是 active, inactive 或 deleted',
  })
  status?: 'active' | 'inactive' | 'deleted';
}
