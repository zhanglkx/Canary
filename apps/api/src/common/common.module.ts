/**
 * 通用模块
 *
 * 包含全局共享的服务、守卫、装饰器和拦截器
 * - 认证守卫 (GqlAuthGuard)
 * - 当前用户装饰器 (@CurrentUser)
 * - 种子数据服务 (ProductSeederService)
 *
 * @author Claude
 * @module Common
 */

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from '../ecommerce/product/entities/product.entity';
import { ProductCategory } from '../ecommerce/product/entities/product-category.entity';
import { ProductSku } from '../ecommerce/product/entities/product-sku.entity';
import { ProductAttribute } from '../ecommerce/product/entities/product-attribute.entity';
import { ProductAttributeValue } from '../ecommerce/product/entities/product-attribute-value.entity';
import { ProductImage } from '../ecommerce/product/entities/product-image.entity';
import { ProductSeederService } from './seeders/product-seeder.service';

/**
 * 通用模块
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([
      Product,
      ProductCategory,
      ProductSku,
      ProductAttribute,
      ProductAttributeValue,
      ProductImage,
    ]),
  ],
  providers: [ProductSeederService],
  exports: [ProductSeederService],
})
export class CommonModule {}
