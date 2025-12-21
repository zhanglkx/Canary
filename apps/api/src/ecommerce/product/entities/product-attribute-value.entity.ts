/**
 * 产品属性值实体
 *
 * 存储属性的具体取值选项
 * 例如：颜色属性 -> 红色、蓝色、绿色等值
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
import { ProductAttribute } from './product-attribute.entity';

/**
 * 产品属性值实体
 */
@Entity('product_attribute_values')
@Index('IDX_attr_value_unique', ['attributeId', 'value'], { unique: true })
export class ProductAttributeValue {
  /**
   * 属性值ID
   */
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * 所属属性ID
   */
  @Column({ type: 'uuid' })
  attributeId: string;

  /**
   * 所属属性
   */
  @ManyToOne(() => ProductAttribute, (attribute) => attribute.values, {
    onDelete: 'CASCADE',
    lazy: false,
  })
  attribute: ProductAttribute;

  /**
   * 属性值（如"红色"、"M号"、"#FF0000"）
   */
  @Column({ type: 'varchar', length: 100 })
  value: string;

  /**
   * 属性值的显示名称（可以与value不同）
   */
  @Column({ type: 'varchar', length: 100, nullable: true })
  displayName?: string;

  /**
   * 对于颜色类型属性，可以存储颜色代码
   */
  @Column({ type: 'varchar', length: 20, nullable: true })
  colorCode?: string;

  /**
   * 对于图片类型属性，存储图片URL
   */
  @Column({ type: 'varchar', length: 500, nullable: true })
  imageUrl?: string;

  /**
   * 排序顺序（值越大越靠前）
   */
  @Column({ type: 'int', default: 0 })
  displayOrder: number;

  /**
   * 创建时间
   */
  @CreateDateColumn()
  createdAt: Date;
}
