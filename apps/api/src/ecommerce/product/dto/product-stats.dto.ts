/**
 * 产品统计信息 DTO
 *
 * 返回产品的统计数据，包括销售量、浏览量、评分等
 *
 * @author Claude
 * @module Ecommerce/Product
 */


/**
 * 产品统计信息
 *
 * 用于 productStats REST API Query 返回值
 */
export class ProductStatsDto {
  /**
   * 产品ID
   */
  productId: string;

  /**
   * 销售量
   */
  salesCount: number;

  /**
   * 浏览量
   */
  viewCount: number;

  /**
   * 平均评分（0-5）
   */
  averageRating?: number;

  /**
   * 评价数量
   */
  reviewCount: number;
}
