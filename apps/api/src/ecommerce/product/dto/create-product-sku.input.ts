/**
 * 创建产品SKU输入DTO
 *
 * 用于创建或更新产品SKU（库存单位）的输入验证
 *
 * @author Claude
 * @module Ecommerce/Product
 */

import { InputType, Field, Float, Int } from '@nestjs/graphql';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsUUID,
  IsPositive,
  MaxLength,
  IsObject,
  IsInt,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

/**
 * 创建产品SKU输入
 *
 * 用于创建产品的具体变体（如：红色M码、蓝色L码等）
 *
 * @example
 * const skuInput: CreateProductSkuInput = {
 *   productId: 'prod-123',
 *   skuCode: 'TSHIRT-RED-M',
 *   skuName: 'T恤-红色-M码',
 *   attributeValues: {
 *     '颜色': '红色',
 *     '尺寸': 'M'
 *   },
 *   price: 9900, // 99元
 *   stock: 100,
 *   weight: 250 // 克
 * };
 */
@InputType()
export class CreateProductSkuInput {
  /**
   * 所属产品ID
   */
  @Field()
  @IsUUID('all', { message: '产品ID必须是有效的UUID' })
  productId: string;

  /**
   * SKU编码
   *
   * 唯一标识一个具体的产品变体
   * 命名规范示例：
   * - SPU-001-RED-M（标准化）
   * - TSHIRT-RED-M（易读）
   * - 202501-RED-M-XL（包含日期）
   */
  @Field()
  @IsString()
  @IsNotEmpty({ message: 'SKU编码不能为空' })
  @MaxLength(100, { message: 'SKU编码长度不超过100字符' })
  skuCode: string;

  /**
   * SKU名称
   *
   * 用户可读的SKU描述，通常由属性值组合而成
   * 示例：'T恤-红色-M码'
   */
  @Field()
  @IsString()
  @IsNotEmpty({ message: 'SKU名称不能为空' })
  @MaxLength(200, { message: 'SKU名称长度不超过200字符' })
  skuName: string;

  /**
   * 属性值JSON
   *
   * 存储该SKU的属性组合，格式为对象
   * 示例：
   * {
   *   "颜色": "红色",
   *   "尺寸": "M",
   *   "材质": "纯棉"
   * }
   *
   * 这用于标识SKU的具体变体
   * 多个产品可以共享相同的属性定义
   */
  @Field(() => Object)
  @IsObject({ message: '属性值必须是对象' })
  attributeValues: Record<string, string>;

  /**
   * SKU价格（可选）
   *
   * 人民币，单位：分
   * 如果为空，使用产品基础价格
   *
   * 示例：
   * - 99元 = 9900分
   * - 999.99元 = 99999分
   *
   * 用于某些SKU有特殊定价的情况
   */
  @Field(() => Float, { nullable: true })
  @IsOptional()
  @IsPositive({ message: '价格必须大于0' })
  @Type(() => Number)
  price?: number;

  /**
   * 初始库存数量
   *
   * 该SKU的初始库存数
   */
  @Field(() => Int)
  @IsInt({ message: '库存必须是整数' })
  @Min(0, { message: '库存不能为负数' })
  @Type(() => Number)
  stock: number;

  /**
   * 已预留库存（可选）
   *
   * 初始预留库存数（通常为0）
   *
   * @default 0
   */
  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt({ message: '已预留库存必须是整数' })
  @Min(0, { message: '已预留库存不能为负数' })
  @Type(() => Number)
  reservedStock?: number;

  /**
   * SKU图片URL（可选）
   *
   * 如果这个SKU有特定的图片，可以覆盖产品主图
   * 例如：某个SKU的颜色图片
   */
  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(500, { message: 'SKU图片URL长度不超过500字符' })
  imageUrl?: string;

  /**
   * 重量（可选，克）
   *
   * 该SKU的重量，用于运费计算
   */
  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt({ message: '重量必须是整数' })
  @Min(0, { message: '重量不能为负数' })
  @Type(() => Number)
  weight?: number;

  /**
   * 是否启用（可选）
   *
   * @default true
   */
  @Field({ nullable: true })
  @IsOptional()
  isActive?: boolean;
}
