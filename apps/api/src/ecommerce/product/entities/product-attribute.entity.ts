/**
 * 产品属性实体
 *
 * 用于存储产品的规格选项（如尺寸、颜色等）
 * 支持灵活的属性定义和值的关联
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
  OneToMany,
  Index,
} from 'typeorm';
import { ObjectType, Field, Int } from '@nestjs/graphql';
import { ProductAttributeValue } from './product-attribute-value.entity';

/**
 * 产品属性实体
 *
 * 示例：
 * - 属性名称："颜色" -> 属性值："红色"、"蓝色"、"绿色"
 * - 属性名称："尺寸" -> 属性值："S"、"M"、"L"、"XL"
 * - 属性名称："材质" -> 属性值："棉"、"聚酯纤维"、"混纺"
 */
@Entity('product_attributes')
@ObjectType()
@Index(['name'], { name: 'IDX_attribute_name' })
@Index(['displayOrder'], { name: 'IDX_attribute_order' })
export class ProductAttribute {
  /**
   * 属性ID
   */
  @PrimaryGeneratedColumn('uuid')
  @Field()
  id: string;

  /**
   * 属性名称（如：颜色、尺寸、材质）
   */
  @Column({ type: 'varchar', length: 50 })
  @Field()
  name: string;

  /**
   * 属性的英文标识符（用于代码中标识）
   */
  @Column({ type: 'varchar', length: 50, unique: true })
  @Field()
  code: string;

  /**
   * 属性描述
   */
  @Column({ type: 'text', nullable: true })
  @Field({ nullable: true })
  description?: string;

  /**
   * 属性类型：
   * - 'select': 单选（如选择一个颜色）
   * - 'multiselect': 多选（如选择多个材质）
   * - 'text': 文本输入（如自定义尺寸）
   * - 'color': 颜色选择器
   * - 'image': 图片选择
   */
  @Column({ type: 'enum', enum: ['select', 'multiselect', 'text', 'color', 'image'], default: 'select' })
  @Field()
  type: 'select' | 'multiselect' | 'text' | 'color' | 'image';

  /**
   * 是否用于SKU区分
   * SKU（库存保持单位）：true表示这个属性的不同值会产生不同的SKU
   * 例如：颜色和尺寸通常是 true，但描述性属性可能是 false
   */
  @Column({ type: 'boolean', default: true })
  @Field()
  isForSku: boolean;

  /**
   * 排序顺序（值越大越靠前）
   */
  @Column({ type: 'int', default: 0 })
  @Field(() => Int)
  displayOrder: number;

  /**
   * 是否必选
   */
  @Column({ type: 'boolean', default: true })
  @Field()
  isRequired: boolean;

  /**
   * 属性值列表
   */
  @OneToMany(() => ProductAttributeValue, (value) => value.attribute, {
    eager: false,
    cascade: ['insert', 'update'],
  })
  @Field(() => [ProductAttributeValue], { nullable: true })
  values?: ProductAttributeValue[];

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
}
