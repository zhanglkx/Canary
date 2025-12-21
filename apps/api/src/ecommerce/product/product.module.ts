/**
 * 产品模块
 *
 * 包含产品管理的所有相关功能
 *
 * 模块组成：
 * - 实体：Product, ProductCategory, ProductSku, ProductImage等
 * - 服务：ProductService
 * - 仓储：ProductRepository
 * - 解析器：ProductResolver
 * - DTO：CreateProductInput, UpdateProductInput等
 *
 * 依赖注入：
 * - TypeORM 仓储
 * - 业务服务
 * - REST API 解析器
 *
 * @author Claude
 * @module Ecommerce/Product
 */

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from './entities/product.entity';
import { ProductCategory } from './entities/product-category.entity';
import { ProductAttribute } from './entities/product-attribute.entity';
import { ProductAttributeValue } from './entities/product-attribute-value.entity';
import { ProductSku } from './entities/product-sku.entity';
import { ProductImage } from './entities/product-image.entity';
import { ProductService } from './services/product.service';
import { ProductRepository } from './repositories/product.repository';
import { ProductResolver } from './resolvers/product.resolver';

/**
 * 产品模块
 *
 * 导出ProductService供其他模块使用
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([
      Product,
      ProductCategory,
      ProductAttribute,
      ProductAttributeValue,
      ProductSku,
      ProductImage,
    ]),
  ],
  providers: [ProductService, ProductRepository, ProductResolver],
  exports: [ProductService],
})
export class ProductModule {}
