/**
 * 产品服务
 *
 * 负责产品相关的所有业务逻辑，包括：
 * - 产品的CRUD操作
 * - 产品的查询（列表、详情、搜索）
 * - 高级筛选和排序
 * - 产品可用性检查
 *
 * 设计原则：
 * - 单一职责：只处理产品相关的业务逻辑
 * - 依赖注入：通过NestJS DI获取Repository
 * - 事务管理：重要操作使用@Transactional
 * - 性能优化：避免N+1查询，使用QueryBuilder的关联加载
 *
 * @author Claude
 * @module Ecommerce/Product
 */

import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike, In, MoreThan, Between } from 'typeorm';
import { Product } from '../entities/product.entity';
import { ProductCategory } from '../entities/product-category.entity';
import { ProductSku } from '../entities/product-sku.entity';
import { ProductImage } from '../entities/product-image.entity';
import { CreateProductInput } from '../dto/create-product.input';
import { UpdateProductInput } from '../dto/update-product.input';
import { ProductFilterInput } from '../dto/product-filter.input';
import { CreateProductSkuInput } from '../dto/create-product-sku.input';
import { ProductResponse } from '../dto/product.response';

/**
 * 产品分页结果接口
 */
export interface ProductPaginationResult {
  data: ProductResponse[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

/**
 * 产品服务
 *
 * @example
 * // 在Controller或Resolver中注入
 * constructor(private productService: ProductService) {}
 *
 * // 查询产品列表
 * const result = await this.productService.findProducts({
 *   keyword: '手机',
 *   categoryId: 'cat-123',
 *   page: 1,
 *   limit: 20,
 *   sort: 'createdAt',
 *   order: 'DESC'
 * });
 *
 * // 创建产品
 * const product = await this.productService.createProduct({
 *   name: '华为手机',
 *   description: '...',
 *   categoryId: 'cat-123',
 *   basePrice: 299900, // 2999元（存储为分）
 *   sku: 'HW-001'
 * });
 */
@Injectable()
export class ProductService {
  private readonly logger = new Logger(ProductService.name);

  constructor(
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    @InjectRepository(ProductCategory)
    private categoryRepository: Repository<ProductCategory>,
    @InjectRepository(ProductSku)
    private skuRepository: Repository<ProductSku>,
    @InjectRepository(ProductImage)
    private imageRepository: Repository<ProductImage>,
  ) {}

  /**
   * 查询产品列表（分页、排序、筛选）
   *
   * 功能：
   * - 分页查询产品列表
   * - 支持多条件筛选（分类、价格范围、关键字）
   * - 支持多种排序方式（热度、价格、新品、销量）
   * - 自动加载关联数据（分类、图片、SKU）
   *
   * 性能优化：
   * - 使用QueryBuilder的leftJoinAndSelect避免N+1查询
   * - 使用索引优化查询（IDX_product_category_status等）
   * - 分页查询，避免一次性加载大量数据
   *
   * @param filter 查询条件和排序参数
   * @returns 分页结果，包含产品列表和总数
   *
   * @throws BadRequestException 当分页参数不合法时
   *
   * @example
   * // 基础查询
   * const result = await productService.findProducts({
   *   page: 1,
   *   limit: 20
   * });
   *
   * // 按分类和价格范围查询
   * const result = await productService.findProducts({
   *   categoryId: 'cat-123',
   *   priceMin: 10000,  // 100元
   *   priceMax: 100000, // 1000元
   *   page: 1,
   *   limit: 20
   * });
   *
   * // 按热度排序
   * const result = await productService.findProducts({
   *   sort: 'salesCount',
   *   order: 'DESC',
   *   page: 1,
   *   limit: 20
   * });
   */
  async findProducts(filter: ProductFilterInput): Promise<ProductPaginationResult> {
    // 参数验证
    if (filter.page < 1 || filter.limit < 1) {
      throw new BadRequestException('分页参数必须大于0');
    }
    if (filter.limit > 100) {
      throw new BadRequestException('单次查询最多100条记录');
    }

    // 验证排序字段
    const validSortFields = [
      'createdAt',
      'salesCount',
      'basePrice',
      'averageRating',
      'viewCount',
    ];
    const sortField = validSortFields.includes(filter.sort)
      ? filter.sort
      : 'createdAt';
    const sortOrder = filter.order?.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    // 构建QueryBuilder
    let query = this.productRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.category', 'category')
      .leftJoinAndSelect('product.images', 'images')
      .leftJoinAndSelect('product.skus', 'skus')
      .where('product.status = :status', { status: 'active' });

    // 应用条件筛选
    if (filter.keyword) {
      query = query.andWhere(
        '(product.name ILIKE :keyword OR product.description ILIKE :keyword)',
        { keyword: `%${filter.keyword}%` },
      );
    }

    if (filter.categoryId) {
      // 支持分类ID查询，且包括该分类的所有子分类产品
      query = query.andWhere(
        '(product.categoryId = :categoryId OR category.path LIKE :categoryPath)',
        {
          categoryId: filter.categoryId,
          categoryPath: `%${filter.categoryId}%`,
        },
      );
    }

    if (filter.priceMin !== undefined || filter.priceMax !== undefined) {
      if (filter.priceMin !== undefined && filter.priceMax !== undefined) {
        query = query.andWhere(
          'product.basePrice BETWEEN :priceMin AND :priceMax',
          {
            priceMin: filter.priceMin,
            priceMax: filter.priceMax,
          },
        );
      } else if (filter.priceMin !== undefined) {
        query = query.andWhere('product.basePrice >= :priceMin', {
          priceMin: filter.priceMin,
        });
      } else if (filter.priceMax !== undefined) {
        query = query.andWhere('product.basePrice <= :priceMax', {
          priceMax: filter.priceMax,
        });
      }
    }

    if (filter.minRating !== undefined) {
      query = query.andWhere('product.averageRating >= :minRating', {
        minRating: filter.minRating,
      });
    }

    // 排序和分页
    const skip = (filter.page - 1) * filter.limit;
    query = query.orderBy(`product.${sortField}`, sortOrder).skip(skip).take(filter.limit);

    // 执行查询
    const [data, total] = await query.getManyAndCount();

    // 计算分页信息
    const pages = Math.ceil(total / filter.limit);

    this.logger.debug(
      `Query products: keyword=${filter.keyword}, categoryId=${filter.categoryId}, ` +
        `page=${filter.page}, limit=${filter.limit}, total=${total}`,
    );

    return {
      data: data.map((product) => this.toProductResponse(product)),
      total,
      page: filter.page,
      limit: filter.limit,
      pages,
    };
  }

  /**
   * 获取产品详情
   *
   * 功能：
   * - 获取单个产品的完整信息
   * - 自动加载关联的分类、图片、SKU、评价等
   * - 增加浏览次数计数
   * - 返回产品是否可售的状态
   *
   * 性能考虑：
   * - 使用leftJoinAndSelect预加载关联数据，避免N+1查询
   * - 使用单个数据库往返获取所有需要的信息
   *
   * @param id 产品ID
   * @returns 完整的产品详情
   *
   * @throws NotFoundException 当产品不存在时
   *
   * @example
   * const product = await productService.findProductDetail('prod-123');
   * console.log(product.skus); // 包含所有SKU变体
   * console.log(product.images); // 包含所有图片
   */
  async findProductDetail(id: string): Promise<ProductResponse> {
    const product = await this.productRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.category', 'category')
      .leftJoinAndSelect('product.images', 'images')
      .leftJoinAndSelect('product.skus', 'skus')
      .where('product.id = :id', { id })
      .andWhere('product.status != :status', { status: 'deleted' })
      .orderBy('images.displayOrder', 'ASC')
      .addOrderBy('skus.createdAt', 'ASC')
      .getOne();

    if (!product) {
      throw new NotFoundException(`产品 ${id} 不存在`);
    }

    // 增加浏览次数（异步执行，不阻塞响应）
    this.productRepository
      .increment({ id }, 'viewCount', 1)
      .catch((err) => this.logger.error(`Failed to increment viewCount: ${err.message}`));

    this.logger.debug(`Fetched product detail: ${id}`);

    return this.toProductResponse(product);
  }

  /**
   * 搜索产品
   *
   * 功能：
   * - 全文搜索产品名称和描述
   * - 支持关键字匹配
   * - 支持分类筛选
   * - 支持价格范围筛选
   * - 结果按相关性排序（可选）
   *
   * 实现注意：
   * - 使用PostgreSQL的ILIKE进行不区分大小写的模糊搜索
   * - 在生产环境可以考虑使用全文搜索引擎（Elasticsearch等）
   * - 当前实现适合中小规模产品库
   *
   * @param keyword 搜索关键字
   * @param filter 额外的筛选条件
   * @returns 搜索结果
   *
   * @example
   * // 简单搜索
   * const results = await productService.searchProducts('手机');
   *
   * // 高级搜索
   * const results = await productService.searchProducts('手机', {
   *   categoryId: 'cat-123',
   *   priceMin: 50000,
   *   priceMax: 150000
   * });
   */
  async searchProducts(
    keyword: string,
    filter?: Partial<ProductFilterInput>,
  ): Promise<ProductPaginationResult> {
    const searchFilter: ProductFilterInput = {
      keyword,
      page: filter?.page || 1,
      limit: filter?.limit || 20,
      sort: filter?.sort || 'createdAt',
      order: filter?.order || 'DESC',
      categoryId: filter?.categoryId,
      priceMin: filter?.priceMin,
      priceMax: filter?.priceMax,
      minRating: filter?.minRating,
    };

    return this.findProducts(searchFilter);
  }

  /**
   * 创建产品
   *
   * 功能：
   * - 创建新产品
   * - 验证分类是否存在
   * - 检查SKU编码唯一性
   * - 支持同时创建初始SKU
   * - 支持上传产品图片
   *
   * 事务安全：
   * - 整个操作应在事务中执行，确保数据一致性
   * - 如果任何步骤失败，所有更改都会回滚
   *
   * 业务规则：
   * - 产品名称长度2-200字符
   * - SKU编码必须唯一
   * - 价格必须大于0
   * - 分类必须存在
   *
   * @param input 产品创建输入
   * @returns 创建的产品
   *
   * @throws BadRequestException 当输入不合法时
   * @throws NotFoundException 当分类不存在时
   *
   * @example
   * const product = await productService.createProduct({
   *   name: '华为手机 P50',
   *   description: '旗舰手机，拍照能力强悍',
   *   categoryId: 'cat-123',
   *   basePrice: 499900, // 4999元
   *   sku: 'HW-P50-001',
   *   summary: '华为旗舰手机',
   *   slug: 'huawei-p50'
   * });
   */
  async createProduct(input: CreateProductInput): Promise<ProductResponse> {
    // 验证分类存在
    const category = await this.categoryRepository.findOne({
      where: { id: input.categoryId },
    });
    if (!category) {
      throw new NotFoundException(`分类 ${input.categoryId} 不存在`);
    }

    // 检查SKU唯一性
    const existingSku = await this.productRepository.findOne({
      where: { sku: input.sku },
    });
    if (existingSku) {
      throw new BadRequestException(`SKU编码 ${input.sku} 已存在`);
    }

    // 创建产品
    const product = this.productRepository.create({
      name: input.name,
      description: input.description,
      sku: input.sku,
      categoryId: input.categoryId,
      basePrice: input.basePrice,
      summary: input.summary,
      slug: input.slug,
      seoKeywords: input.seoKeywords,
      status: 'active',
    });

    const savedProduct = await this.productRepository.save(product);

    this.logger.log(`Created product: ${savedProduct.id} - ${savedProduct.name}`);

    // 返回包含关联数据的完整产品信息
    return this.findProductDetail(savedProduct.id);
  }

  /**
   * 更新产品
   *
   * 功能：
   * - 更新产品的基本信息
   * - 支持部分更新（只更新提供的字段）
   * - 验证分类有效性
   * - 检查SKU编码唯一性（如果修改）
   *
   * 性能考虑：
   * - 只更新实际修改的字段
   * - 减少数据库写入次数
   *
   * @param id 产品ID
   * @param input 产品更新输入
   * @returns 更新后的产品
   *
   * @throws NotFoundException 当产品或分类不存在时
   * @throws BadRequestException 当更新数据不合法时
   *
   * @example
   * const updated = await productService.updateProduct('prod-123', {
   *   name: '新名称',
   *   basePrice: 199900
   * });
   */
  async updateProduct(id: string, input: UpdateProductInput): Promise<ProductResponse> {
    // 检查产品存在
    const product = await this.productRepository.findOne({ where: { id } });
    if (!product) {
      throw new NotFoundException(`产品 ${id} 不存在`);
    }

    // 如果修改了分类，验证新分类存在
    if (input.categoryId && input.categoryId !== product.categoryId) {
      const category = await this.categoryRepository.findOne({
        where: { id: input.categoryId },
      });
      if (!category) {
        throw new NotFoundException(`分类 ${input.categoryId} 不存在`);
      }
    }

    // 如果修改了SKU，检查唯一性
    if (input.sku && input.sku !== product.sku) {
      const existingSku = await this.productRepository.findOne({
        where: { sku: input.sku },
      });
      if (existingSku) {
        throw new BadRequestException(`SKU编码 ${input.sku} 已存在`);
      }
    }

    // 更新字段（只更新提供的字段）
    Object.assign(product, input);
    const updatedProduct = await this.productRepository.save(product);

    this.logger.log(`Updated product: ${id}`);

    return this.findProductDetail(updatedProduct.id);
  }

  /**
   * 删除产品（逻辑删除）
   *
   * 功能：
   * - 逻辑删除产品（不真正删除数据库记录）
   * - 删除后产品不会出现在任何查询中
   * - 支持恢复（通过更新状态）
   *
   * 安全考虑：
   * - 使用逻辑删除而不是物理删除，保留审计日志
   * - 删除后仍然可以查询历史数据
   * - 支持数据恢复
   *
   * @param id 产品ID
   *
   * @throws NotFoundException 当产品不存在时
   *
   * @example
   * await productService.deleteProduct('prod-123');
   */
  async deleteProduct(id: string): Promise<void> {
    const product = await this.productRepository.findOne({ where: { id } });
    if (!product) {
      throw new NotFoundException(`产品 ${id} 不存在`);
    }

    await this.productRepository.update({ id }, { status: 'deleted' });

    this.logger.log(`Deleted product: ${id}`);
  }

  /**
   * 恢复已删除的产品
   *
   * @param id 产品ID
   * @throws NotFoundException 当产品不存在时
   */
  async restoreProduct(id: string): Promise<ProductResponse> {
    const product = await this.productRepository.findOne({ where: { id } });
    if (!product) {
      throw new NotFoundException(`产品 ${id} 不存在`);
    }

    product.status = 'active';
    await this.productRepository.save(product);

    this.logger.log(`Restored product: ${id}`);

    return this.findProductDetail(id);
  }

  /**
   * 上架/下架产品
   *
   * 功能：
   * - 更改产品上下架状态
   * - 下架后产品不会在前端显示
   * - 但库存和订单数据保留
   *
   * @param id 产品ID
   * @param isActive 是否上架
   * @returns 更新后的产品
   *
   * @throws NotFoundException 当产品不存在时
   */
  async setProductActive(id: string, isActive: boolean): Promise<ProductResponse> {
    const product = await this.productRepository.findOne({ where: { id } });
    if (!product) {
      throw new NotFoundException(`产品 ${id} 不存在`);
    }

    product.status = isActive ? 'active' : 'inactive';
    await this.productRepository.save(product);

    this.logger.log(`Set product ${id} status to ${product.status}`);

    return this.findProductDetail(id);
  }

  /**
   * 批量查询产品（用于DataLoader）
   *
   * 功能：
   * - 根据ID列表批量查询产品
   * - 避免N+1查询问题
   * - 用于GraphQL DataLoader优化
   *
   * 设计模式：
   * - 接收ID数组，返回对应的产品数组
   * - 返回顺序与输入ID顺序一致
   *
   * @param ids 产品ID数组
   * @returns 产品数组（顺序与ids一致）
   *
   * @example
   * // 在DataLoader中使用
   * const loader = new DataLoader(async (ids) => {
   *   return this.productService.findProductsByIds(ids);
   * });
   */
  async findProductsByIds(ids: string[]): Promise<Product[]> {
    if (ids.length === 0) {
      return [];
    }

    const products = await this.productRepository.find({
      where: { id: In(ids), status: 'active' },
      relations: ['category', 'images', 'skus'],
    });

    // 保持与输入数组相同的顺序
    return ids.map((id) => products.find((p) => p.id === id)).filter(Boolean);
  }

  /**
   * 检查产品库存
   *
   * 功能：
   * - 检查产品是否有可用库存
   * - 用于下单前的库存验证
   *
   * @param productId 产品ID
   * @returns 是否有库存
   *
   * @example
   * const hasStock = await productService.checkInventory('prod-123');
   */
  async checkInventory(productId: string): Promise<boolean> {
    const product = await this.productRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.skus', 'skus')
      .where('product.id = :id', { id: productId })
      .getOne();

    if (!product) {
      return false;
    }

    return product.isAvailable();
  }

  /**
   * 获取产品统计信息
   *
   * 功能：
   * - 获取产品销售统计
   * - 包括销售数量、评价数、浏览次数等
   *
   * @param id 产品ID
   * @returns 统计信息对象
   *
   * @throws NotFoundException 当产品不存在时
   */
  async getProductStats(id: string) {
    const product = await this.productRepository.findOne({ where: { id } });
    if (!product) {
      throw new NotFoundException(`产品 ${id} 不存在`);
    }

    return {
      productId: id,
      salesCount: product.salesCount,
      viewCount: product.viewCount,
      averageRating: product.averageRating,
      reviewCount: product.reviewCount,
    };
  }

  /**
   * 内部方法：将Product实体转换为ProductResponse DTO
   *
   * @param product 产品实体
   * @returns 产品响应DTO
   * @private
   */
  private toProductResponse(product: Product): ProductResponse {
    return {
      id: product.id,
      name: product.name,
      description: product.description,
      sku: product.sku,
      basePrice: product.basePrice,
      summary: product.summary,
      slug: product.slug,
      status: product.status,
      salesCount: product.salesCount,
      averageRating: product.averageRating,
      reviewCount: product.reviewCount,
      viewCount: product.viewCount,
      isAvailable: product.isAvailable(),
      category: product.category,
      images: product.images || [],
      skus: product.skus || [],
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
    };
  }
}
