/**
 * 产品解析器
 *
 * GraphQL解析器，处理所有与产品相关的GraphQL查询和变更
 *
 * 负责：
 * - 定义GraphQL @Query 操作（查询）
 * - 定义GraphQL @Mutation 操作（修改）
 * - 调用ProductService执行业务逻辑
 * - 返回GraphQL类型化的响应
 *
 * 设计模式：
 * - @Resolver装饰器：声明这是一个GraphQL解析器
 * - @Query装饰器：定义GraphQL查询操作
 * - @Mutation装饰器：定义GraphQL变更操作
 * - @Args装饰器：声明操作参数
 * - @UseGuards：应用身份验证/授权守卫
 *
 * @author Claude
 * @module Ecommerce/Product
 */

import { Resolver, Query, Mutation, Args, ObjectType, Field } from '@nestjs/graphql';
import { UseGuards, Logger, BadRequestException } from '@nestjs/common';
import { ProductService, ProductPaginationResult } from '../services/product.service';
import { Product } from '../entities/product.entity';
import { ProductResponse } from '../dto/product.response';
import { CreateProductInput } from '../dto/create-product.input';
import { UpdateProductInput } from '../dto/update-product.input';
import { ProductFilterInput } from '../dto/product-filter.input';
import { CreateProductSkuInput } from '../dto/create-product-sku.input';
import { GqlAuthGuard } from '../../../common/guards/gql-auth.guard';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { User } from '../../../user/user.entity';

/**
 * 产品分页响应类型
 */
@ObjectType()
class ProductPaginationResponse {
  @Field(() => [ProductResponse])
  data: ProductResponse[];

  @Field(() => Number)
  total: number;

  @Field(() => Number)
  page: number;

  @Field(() => Number)
  limit: number;

  @Field(() => Number)
  pages: number;
}

/**
 * 产品解析器
 *
 * GraphQL接口示例：
 *
 * 查询：
 * ```graphql
 * query {
 *   products(
 *     filter: {
 *       keyword: "手机"
 *       categoryId: "cat-123"
 *       page: 1
 *       limit: 20
 *     }
 *   ) {
 *     data {
 *       id
 *       name
 *       basePrice
 *       isAvailable
 *       images { url }
 *       skus { skuCode stock }
 *     }
 *     total
 *     pages
 *   }
 * }
 * ```
 *
 * 变更：
 * ```graphql
 * mutation {
 *   createProduct(input: {
 *     name: "华为手机"
 *     description: "..."
 *     categoryId: "cat-123"
 *     basePrice: 299900
 *     sku: "HW-P50"
 *   }) {
 *     id
 *     name
 *     createdAt
 *   }
 * }
 * ```
 */
@Resolver(() => ProductResponse)
export class ProductResolver {
  private readonly logger = new Logger(ProductResolver.name);

  constructor(private readonly productService: ProductService) {}

  /**
   * 查询产品列表
   *
   * GraphQL 操作：query
   *
   * 功能：
   * - 分页查询产品列表
   * - 支持多条件筛选（分类、价格、关键字等）
   * - 支持多种排序方式
   * - 自动加载关联数据
   *
   * 权限：公开API，无需认证
   *
   * @param filter 筛选条件（分页、排序、条件等）
   * @returns 分页产品列表
   *
   * @example
   * // 查询手机分类的产品，价格100-1000元，按销量排序
   * query {
   *   products(
   *     filter: {
   *       keyword: "手机"
   *       categoryId: "cat-123"
   *       priceMin: 10000
   *       priceMax: 100000
   *       sort: "salesCount"
   *       order: "DESC"
   *       page: 1
   *       limit: 20
   *     }
   *   ) {
   *     data { ... }
   *     total
   *     pages
   *   }
   * }
   */
  @Query(() => ProductPaginationResponse, {
    description: '查询产品列表（支持分页、筛选、排序）',
  })
  async products(
    @Args('filter', { type: () => ProductFilterInput })
    filter: ProductFilterInput,
  ): Promise<ProductPaginationResult> {
    this.logger.debug(`Querying products with filter: ${JSON.stringify(filter)}`);

    try {
      return await this.productService.findProducts(filter);
    } catch (error) {
      this.logger.error(`Failed to query products: ${error.message}`);
      throw error;
    }
  }

  /**
   * 查询产品详情
   *
   * GraphQL 操作：query
   *
   * 功能：
   * - 获取单个产品的完整信息
   * - 加载所有关联数据（分类、图片、SKU、评价等）
   * - 自动增加浏览次数
   * - 返回产品可售性状态
   *
   * 权限：公开API，无需认证
   *
   * @param id 产品ID
   * @returns 完整的产品详情
   *
   * @throws NotFoundException 当产品不存在时
   *
   * @example
   * query {
   *   productDetail(id: "prod-123") {
   *     id
   *     name
   *     description
   *     basePrice
   *     category { name }
   *     images { url }
   *     skus { skuCode stock }
   *     isAvailable
   *   }
   * }
   */
  @Query(() => ProductResponse, {
    description: '查询产品详情',
    nullable: true,
  })
  async productDetail(
    @Args('id', { type: () => String, description: '产品ID' })
    id: string,
  ): Promise<ProductResponse> {
    this.logger.debug(`Fetching product detail: ${id}`);

    try {
      return await this.productService.findProductDetail(id);
    } catch (error) {
      this.logger.error(`Failed to fetch product detail: ${error.message}`);
      throw error;
    }
  }

  /**
   * 搜索产品
   *
   * GraphQL 操作：query
   *
   * 功能：
   * - 全文搜索产品
   * - 支持关键字搜索
   * - 支持高级筛选
   * - 返回搜索结果排名
   *
   * 权限：公开API，无需认证
   *
   * @param keyword 搜索关键字
   * @param filter 筛选条件（可选）
   * @returns 搜索结果
   *
   * @example
   * query {
   *   searchProducts(keyword: "手机", filter: { limit: 20 }) {
   *     data { ... }
   *     total
   *   }
   * }
   */
  @Query(() => ProductPaginationResponse, {
    description: '搜索产品',
  })
  async searchProducts(
    @Args('keyword', { type: () => String, description: '搜索关键字' })
    keyword: string,
    @Args('filter', {
      type: () => ProductFilterInput,
      nullable: true,
      description: '筛选条件',
    })
    filter?: ProductFilterInput,
  ): Promise<ProductPaginationResult> {
    if (!keyword || keyword.trim().length === 0) {
      throw new BadRequestException('搜索关键字不能为空');
    }

    this.logger.debug(`Searching products with keyword: ${keyword}`);

    return await this.productService.searchProducts(keyword, filter);
  }

  /**
   * 创建产品
   *
   * GraphQL 操作：mutation
   *
   * 功能：
   * - 创建新产品
   * - 验证输入数据
   * - 检查SKU唯一性
   * - 支持初始SKU和图片
   *
   * 权限：需要认证（管理员）
   * 说明：@UseGuards(GqlAuthGuard) 确保只有认证用户可以创建产品
   *
   * @param input 产品创建输入
   * @param user 当前认证的用户
   * @returns 创建的产品
   *
   * @throws BadRequestException 当输入不合法时
   * @throws NotFoundException 当分类不存在时
   * @throws Unauthorized 当用户未认证时
   *
   * @example
   * mutation {
   *   createProduct(input: {
   *     name: "华为手机 P50"
   *     description: "旗舰手机"
   *     categoryId: "cat-123"
   *     basePrice: 499900
   *     sku: "HW-P50-001"
   *   }) {
   *     id
   *     name
   *     createdAt
   *   }
   * }
   */
  @Mutation(() => ProductResponse, {
    description: '创建产品（需要认证）',
  })
  @UseGuards(GqlAuthGuard)
  async createProduct(
    @Args('input', { type: () => CreateProductInput })
    input: CreateProductInput,
    @CurrentUser() user: User,
  ): Promise<ProductResponse> {
    this.logger.log(`User ${user.id} creating product: ${input.name}`);

    try {
      return await this.productService.createProduct(input);
    } catch (error) {
      this.logger.error(`Failed to create product: ${error.message}`);
      throw error;
    }
  }

  /**
   * 更新产品
   *
   * GraphQL 操作：mutation
   *
   * 功能：
   * - 更新产品信息
   * - 支持部分更新
   * - 验证分类有效性
   * - 检查SKU唯一性
   *
   * 权限：需要认证（管理员）
   *
   * @param id 产品ID
   * @param input 产品更新输入
   * @param user 当前认证的用户
   * @returns 更新后的产品
   *
   * @throws NotFoundException 当产品不存在时
   * @throws BadRequestException 当更新数据不合法时
   * @throws Unauthorized 当用户未认证时
   *
   * @example
   * mutation {
   *   updateProduct(
   *     id: "prod-123"
   *     input: {
   *       name: "新名称"
   *       basePrice: 199900
   *     }
   *   ) {
   *     id
   *     name
   *     basePrice
   *     updatedAt
   *   }
   * }
   */
  @Mutation(() => ProductResponse, {
    description: '更新产品（需要认证）',
  })
  @UseGuards(GqlAuthGuard)
  async updateProduct(
    @Args('id', { type: () => String })
    id: string,
    @Args('input', { type: () => UpdateProductInput })
    input: UpdateProductInput,
    @CurrentUser() user: User,
  ): Promise<ProductResponse> {
    this.logger.log(`User ${user.id} updating product: ${id}`);

    try {
      return await this.productService.updateProduct(id, input);
    } catch (error) {
      this.logger.error(`Failed to update product: ${error.message}`);
      throw error;
    }
  }

  /**
   * 删除产品
   *
   * GraphQL 操作：mutation
   *
   * 功能：
   * - 逻辑删除产品（不真正删除数据库记录）
   * - 删除后产品不会出现在任何查询中
   * - 可以后续恢复
   *
   * 权限：需要认证（管理员）
   *
   * @param id 产品ID
   * @param user 当前认证的用户
   * @returns 删除成功消息
   *
   * @throws NotFoundException 当产品不存在时
   * @throws Unauthorized 当用户未认证时
   *
   * @example
   * mutation {
   *   deleteProduct(id: "prod-123") {
   *     success
   *     message
   *   }
   * }
   */
  @Mutation(() => Boolean, {
    description: '删除产品（需要认证）',
  })
  @UseGuards(GqlAuthGuard)
  async deleteProduct(
    @Args('id', { type: () => String })
    id: string,
    @CurrentUser() user: User,
  ): Promise<boolean> {
    this.logger.log(`User ${user.id} deleting product: ${id}`);

    try {
      await this.productService.deleteProduct(id);
      return true;
    } catch (error) {
      this.logger.error(`Failed to delete product: ${error.message}`);
      throw error;
    }
  }

  /**
   * 设置产品上下架状态
   *
   * GraphQL 操作：mutation
   *
   * 功能：
   * - 上架/下架产品
   * - 下架后产品不会在前端显示
   * - 库存和订单数据保留
   *
   * 权限：需要认证（管理员）
   *
   * @param id 产品ID
   * @param isActive 是否上架
   * @param user 当前认证的用户
   * @returns 更新后的产品
   *
   * @throws NotFoundException 当产品不存在时
   * @throws Unauthorized 当用户未认证时
   *
   * @example
   * mutation {
   *   setProductActive(id: "prod-123", isActive: true) {
   *     id
   *     status
   *   }
   * }
   */
  @Mutation(() => ProductResponse, {
    description: '设置产品上下架状态（需要认证）',
  })
  @UseGuards(GqlAuthGuard)
  async setProductActive(
    @Args('id', { type: () => String })
    id: string,
    @Args('isActive', { type: () => Boolean })
    isActive: boolean,
    @CurrentUser() user: User,
  ): Promise<ProductResponse> {
    this.logger.log(`User ${user.id} setting product ${id} active=${isActive}`);

    try {
      return await this.productService.setProductActive(id, isActive);
    } catch (error) {
      this.logger.error(`Failed to set product active: ${error.message}`);
      throw error;
    }
  }

  /**
   * 检查产品库存
   *
   * GraphQL 操作：query
   *
   * 功能：
   * - 检查产品是否有可用库存
   * - 用于下单前的库存验证
   *
   * 权限：公开API，无需认证
   *
   * @param productId 产品ID
   * @returns 是否有库存
   *
   * @example
   * query {
   *   checkInventory(productId: "prod-123")
   * }
   */
  @Query(() => Boolean, {
    description: '检查产品库存',
  })
  async checkInventory(
    @Args('productId', { type: () => String })
    productId: string,
  ): Promise<boolean> {
    return await this.productService.checkInventory(productId);
  }

  /**
   * 获取产品统计信息
   *
   * GraphQL 操作：query
   *
   * 功能：
   * - 获取产品销售统计
   * - 包括销售数量、评价数、浏览次数等
   *
   * 权限：公开API，无需认证
   *
   * @param productId 产品ID
   * @returns 统计信息
   *
   * @example
   * query {
   *   productStats(productId: "prod-123") {
   *     salesCount
   *     viewCount
   *     averageRating
   *     reviewCount
   *   }
   * }
   */
  @Query(() => Object, {
    description: '获取产品统计信息',
  })
  async productStats(
    @Args('productId', { type: () => String })
    productId: string,
  ): Promise<any> {
    return await this.productService.getProductStats(productId);
  }
}
