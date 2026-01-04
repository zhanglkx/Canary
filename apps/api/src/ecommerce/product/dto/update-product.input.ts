/**
 * 更新产品输入DTO
 *
 * 用于产品更新操作的输入验证
 * 所有字段都是可选的，只更新提供的字段
 *
 * @author Claude
 * @module Ecommerce/Product
 */

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
export class UpdateProductInput {
  /**
   * 产品名称
   */
  @IsOptional()
  @IsString()
  @Length(2, 200, { message: '产品名称长度必须在2-200字符之间' })
  name?: string;

  /**
   * 产品描述
   */
  @IsOptional()
  @IsString()
  description?: string;

  /**
   * 产品分类ID
   */
  @IsOptional()
  @IsUUID('all', { message: '分类ID必须是有效的UUID' })
  categoryId?: string;

  /**
   * 基础价格（人民币，单位：元）
   */
  @IsOptional()
  @IsPositive({ message: '价格必须大于0' })
  basePrice?: number;

  /**
   * 产品SKU编码
   */
  @IsOptional()
  @IsString()
  @MaxLength(100)
  sku?: string;

  /**
   * 产品简介
   */
  @IsOptional()
  @IsString()
  @MaxLength(500)
  summary?: string;

  /**
   * SEO友好的URL名称
   */
  @IsOptional()
  @IsString()
  slug?: string;

  /**
   * SEO关键词
   */
  @IsOptional()
  @IsString()
  @MaxLength(500)
  seoKeywords?: string;

  /**
   * 产品状态
   */
  @IsOptional()
  @IsEnum(['active', 'inactive', 'deleted'], {
    message: '产品状态必须是 active, inactive 或 deleted',
  })
  status?: 'active' | 'inactive' | 'deleted';
}
