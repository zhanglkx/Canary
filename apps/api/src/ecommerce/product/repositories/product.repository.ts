/**
 * 产品仓储
 *
 * 数据访问层，负责与数据库的交互
 * 提供自定义的查询方法，优化常见的数据查询场景
 *
 * Repository Pattern（仓储模式）的实现：
 * - 抽象数据源，隐离业务逻辑层与数据访问的细节
 * - 提供类型安全的数据查询接口
 * - 集中管理数据库查询逻辑，便于维护和优化
 *
 * 性能优化考虑：
 * - 使用QueryBuilder构建复杂查询
 * - 合理使用leftJoinAndSelect避免N+1查询
 * - 合理使用select和addSelect控制查询字段
 * - 使用索引优化查询（创建时已定义在Entity中）
 *
 * @author Claude
 * @module Ecommerce/Product
 */

import { Injectable } from '@nestjs/common';
import { DataSource, Repository, ILike, In, MoreThan, Between } from 'typeorm';
import { Product } from '../entities/product.entity';
import { ProductImage } from '../entities/product-image.entity';

/**
 * 产品仓储
 *
 * 扩展TypeORM的Repository，提供自定义查询方法
 */
@Injectable()
export class ProductRepository extends Repository<Product> {
  constructor(private dataSource: DataSource) {
    super(Product, dataSource.createEntityManager());
  }

  /**
   * 按分类查询产品（包括子分类）
   *
   * 功能：
   * - 查询指定分类的所有产品
   * - 支持递归查询子分类的产品
   * - 使用物化路径优化性能
   *
   * 性能：使用LIKE模式匹配category.path字段
   *
   * @param categoryId 分类ID
   * @param activeOnly 是否只查询上架产品
   * @param skip 分页skip
   * @param take 分页take
   * @returns 分页产品列表
   *
   * @example
   * const products = await productRepository.findProductsByCategory(
   *   'cat-123',
   *   true,
   *   0,
   *   20
   * );
   */
  async findProductsByCategory(
    categoryId: string,
    activeOnly: boolean = true,
    skip: number = 0,
    take: number = 20,
  ): Promise<[Product[], number]> {
    let query = this.createQueryBuilder('product')
      .leftJoinAndSelect('product.category', 'category')
      .leftJoinAndSelect('product.images', 'images')
      .leftJoinAndSelect('product.skus', 'skus')
      .where('product.categoryId = :categoryId OR category.path LIKE :categoryPath', {
        categoryId,
        categoryPath: `%${categoryId}%`,
      });

    if (activeOnly) {
      query = query.andWhere('product.status = :status', { status: 'active' });
    }

    query = query
      .orderBy('product.createdAt', 'DESC')
      .skip(skip)
      .take(take);

    return query.getManyAndCount();
  }

  /**
   * 按价格范围查询产品
   *
   * @param priceMin 最低价格（分）
   * @param priceMax 最高价格（分）
   * @param skip 分页skip
   * @param take 分页take
   * @returns 分页产品列表
   */
  async findProductsByPriceRange(
    priceMin: number,
    priceMax: number,
    skip: number = 0,
    take: number = 20,
  ): Promise<[Product[], number]> {
    return this.createQueryBuilder('product')
      .leftJoinAndSelect('product.category', 'category')
      .leftJoinAndSelect('product.images', 'images')
      .where('product.basePrice BETWEEN :priceMin AND :priceMax', {
        priceMin,
        priceMax,
      })
      .andWhere('product.status = :status', { status: 'active' })
      .orderBy('product.basePrice', 'ASC')
      .skip(skip)
      .take(take)
      .getManyAndCount();
  }

  /**
   * 查询热销产品
   *
   * 按销售数量排序，查询最热销的产品
   *
   * @param limit 返回的产品数量
   * @returns 热销产品列表
   *
   * @example
   * const hotProducts = await productRepository.findHotProducts(10);
   */
  async findHotProducts(limit: number = 10): Promise<Product[]> {
    return this.createQueryBuilder('product')
      .leftJoinAndSelect('product.category', 'category')
      .leftJoinAndSelect('product.images', 'images')
      .where('product.status = :status', { status: 'active' })
      .orderBy('product.salesCount', 'DESC')
      .limit(limit)
      .getMany();
  }

  /**
   * 查询新品产品
   *
   * 按创建时间排序，查询最新添加的产品
   *
   * @param days 多少天内的新品
   * @param limit 返回的产品数量
   * @returns 新品列表
   */
  async findNewProducts(days: number = 30, limit: number = 10): Promise<Product[]> {
    const dateFrom = new Date();
    dateFrom.setDate(dateFrom.getDate() - days);

    return this.createQueryBuilder('product')
      .leftJoinAndSelect('product.category', 'category')
      .leftJoinAndSelect('product.images', 'images')
      .where('product.status = :status', { status: 'active' })
      .andWhere('product.createdAt >= :dateFrom', { dateFrom })
      .orderBy('product.createdAt', 'DESC')
      .limit(limit)
      .getMany();
  }

  /**
   * 查询高评分产品
   *
   * @param minRating 最低评分
   * @param limit 返回的产品数量
   * @returns 高评分产品列表
   */
  async findTopRatedProducts(minRating: number = 4.0, limit: number = 10): Promise<Product[]> {
    return this.createQueryBuilder('product')
      .leftJoinAndSelect('product.category', 'category')
      .leftJoinAndSelect('product.images', 'images')
      .where('product.status = :status', { status: 'active' })
      .andWhere('product.averageRating >= :minRating', { minRating })
      .andWhere('product.reviewCount > :minReviewCount', { minReviewCount: 0 })
      .orderBy('product.averageRating', 'DESC')
      .limit(limit)
      .getMany();
  }

  /**
   * 搜索产品（全文搜索）
   *
   * 在产品名称和描述中进行全文搜索
   *
   * @param keyword 搜索关键字
   * @param skip 分页skip
   * @param take 分页take
   * @returns 分页搜索结果
   *
   * @example
   * const results = await productRepository.searchProducts('手机', 0, 20);
   */
  async searchProducts(
    keyword: string,
    skip: number = 0,
    take: number = 20,
  ): Promise<[Product[], number]> {
    return this.createQueryBuilder('product')
      .leftJoinAndSelect('product.category', 'category')
      .leftJoinAndSelect('product.images', 'images')
      .leftJoinAndSelect('product.skus', 'skus')
      .where('product.status = :status', { status: 'active' })
      .andWhere(
        '(product.name ILIKE :keyword OR product.description ILIKE :keyword OR product.summary ILIKE :keyword)',
        { keyword: `%${keyword}%` },
      )
      .orderBy('product.name', 'ASC')
      .skip(skip)
      .take(take)
      .getManyAndCount();
  }

  /**
   * 查询低库存产品
   *
   * 用于库存管理，查询库存不足的产品
   *
   * @param stockThreshold 库存阈值
   * @returns 低库存产品列表
   */
  async findLowStockProducts(stockThreshold: number = 10): Promise<Product[]> {
    return this.createQueryBuilder('product')
      .leftJoinAndSelect('product.skus', 'skus')
      .where('product.status = :status', { status: 'active' })
      .andWhere('skus.stock <= :threshold', { threshold: stockThreshold })
      .orderBy('skus.stock', 'ASC')
      .getMany();
  }

  /**
   * 查询指定SKU编码的产品
   *
   * @param skuCode SKU编码
   * @returns 产品，如果不存在则返回undefined
   */
  async findProductBySkuCode(skuCode: string): Promise<Product | null> {
    return this.createQueryBuilder('product')
      .leftJoinAndSelect('product.category', 'category')
      .leftJoinAndSelect('product.images', 'images')
      .leftJoinAndSelect('product.skus', 'skus')
      .where('product.sku = :skuCode', { skuCode })
      .getOne();
  }

  /**
   * 批量获取产品及其关联数据
   *
   * @param ids 产品ID列表
   * @returns 产品列表
   */
  async findProductsWithRelations(ids: string[]): Promise<Product[]> {
    if (ids.length === 0) return [];

    return this.createQueryBuilder('product')
      .leftJoinAndSelect('product.category', 'category')
      .leftJoinAndSelect('product.images', 'images')
      .leftJoinAndSelect('product.skus', 'skus')
      .where('product.id IN (:...ids)', { ids })
      .orderBy('product.createdAt', 'DESC')
      .getMany();
  }

  /**
   * 获取产品及其主图
   *
   * 优化查询：只加载主图（purpose='main'）
   *
   * @param id 产品ID
   * @returns 产品及其主图
   */
  async findProductWithMainImage(id: string): Promise<Product | null> {
    return this.createQueryBuilder('product')
      .leftJoinAndSelect('product.category', 'category')
      .leftJoinAndSelect(
        'product.images',
        'images',
        "images.purpose = 'main'",
        {},
      )
      .leftJoinAndSelect('product.skus', 'skus')
      .where('product.id = :id', { id })
      .getOne();
  }

  /**
   * 统计产品总数
   *
   * @param status 产品状态（可选，为空则统计所有）
   * @returns 产品总数
   */
  async countProducts(status?: 'active' | 'inactive' | 'deleted'): Promise<number> {
    let query = this.createQueryBuilder('product');

    if (status) {
      query = query.where('product.status = :status', { status });
    }

    return query.getCount();
  }

  /**
   * 统计分类下的产品数
   *
   * @param categoryId 分类ID
   * @returns 产品数
   */
  async countProductsByCategory(categoryId: string): Promise<number> {
    return this.createQueryBuilder('product')
      .where('product.categoryId = :categoryId OR product.category.path LIKE :categoryPath', {
        categoryId,
        categoryPath: `%${categoryId}%`,
      })
      .getCount();
  }

  /**
   * 获取产品销售统计
   *
   * 用于后台统计分析
   *
   * @returns 统计数据
   */
  async getProductStats() {
    return this.createQueryBuilder('product')
      .select('COUNT(product.id)', 'totalProducts')
      .addSelect('SUM(product.salesCount)', 'totalSales')
      .addSelect('AVG(product.averageRating)', 'avgRating')
      .addSelect('COUNT(DISTINCT product.categoryId)', 'categoriesCount')
      .where('product.status = :status', { status: 'active' })
      .getRawOne();
  }

  /**
   * 批量更新产品状态
   *
   * @param ids 产品ID列表
   * @param status 新状态
   * @returns 更新数量
   */
  async updateProductsStatus(
    ids: string[],
    status: 'active' | 'inactive' | 'deleted',
  ): Promise<number> {
    if (ids.length === 0) return 0;

    const result = await this.createQueryBuilder()
      .update(Product)
      .set({ status })
      .where('id IN (:...ids)', { ids })
      .execute();

    return result.affected || 0;
  }

  /**
   * 检查SKU编码是否存在
   *
   * @param skuCode SKU编码
   * @param excludeProductId 排除的产品ID（用于编辑时检查）
   * @returns 是否存在
   */
  async checkSkuCodeExists(skuCode: string, excludeProductId?: string): Promise<boolean> {
    let query = this.createQueryBuilder('product').where('product.sku = :skuCode', { skuCode });

    if (excludeProductId) {
      query = query.andWhere('product.id != :excludeProductId', { excludeProductId });
    }

    const count = await query.getCount();
    return count > 0;
  }
}
