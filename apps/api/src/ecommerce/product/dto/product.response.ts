/**
 * 产品响应DTO
 *
 * 用于API返回的产品信息
 * 包含产品的完整信息及关联的分类、图片、SKU等
 *
 * @author Claude
 * @module Ecommerce/Product
 */

import { ProductCategory } from '../entities/product-category.entity';
import { ProductImage } from '../entities/product-image.entity';
import { ProductSku } from '../entities/product-sku.entity';

/**
 * 产品响应
 *
 * 返回给前端的产品完整数据
 */
export class ProductResponse {
  /**
   * 产品ID
   */
  id: string;

  /**
   * 产品名称
   */
  name: string;

  /**
   * 产品描述
   */
  description: string;

  /**
   * 产品SKU（库存单位编号）
   */
  sku: string;

  /**
   * 基础价格（人民币，单位：分，显示时需除以100）
   */
  basePrice: number;

  /**
   * 产品简介
   */
  summary?: string;

  /**
   * SEO友好的URL名称
   */
  slug?: string;

  /**
   * 产品状态
   */
  status: 'active' | 'inactive' | 'deleted';

  /**
   * 销售数量
   */
  salesCount: number;

  /**
   * 平均评分（0-5）
   */
  averageRating: number;

  /**
   * 评价数量
   */
  reviewCount: number;

  /**
   * 浏览次数
   */
  viewCount: number;

  /**
   * 是否可售（有库存且状态为active）
   */
  isAvailable: boolean;

  /**
   * 所属分类
   */
  category?: ProductCategory;

  /**
   * 产品图片列表
   */
  images?: ProductImage[];

  /**
   * 产品SKU列表（具体的库存单位）
   */
  skus?: ProductSku[];

  /**
   * 创建时间
   */
  createdAt: Date;

  /**
   * 更新时间
   */
  updatedAt: Date;
}
