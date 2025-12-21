/**
 * 创建产品输入DTO
 *
 * @author Claude
 * @module Ecommerce/Product
 */

import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsUUID,
  IsPositive,
  Length,
  MaxLength,
} from 'class-validator';

/**
 * 创建产品输入
 */
export class CreateProductInput {
  /**
   * 产品名称
   */
  @IsString()
  @IsNotEmpty({ message: '产品名称不能为空' })
  @Length(2, 200, { message: '产品名称长度必须在2-200字符之间' })
  name: string;

  /**
   * 产品描述
   */
  @IsString()
  @IsNotEmpty({ message: '产品描述不能为空' })
  description: string;

  /**
   * 产品分类ID
   */
  @IsUUID('all', { message: '分类ID必须是有效的UUID' })
  categoryId: string;

  /**
   * 基础价格（人民币，单位：元）
   * 注意：输入是元，存储时会转换为分
   */
  @IsPositive({ message: '价格必须大于0' })
  basePrice: number;

  /**
   * 产品SKU编码
   */
  @IsString()
  @IsNotEmpty({ message: '产品SKU不能为空' })
  @MaxLength(100)
  sku: string;

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
}
