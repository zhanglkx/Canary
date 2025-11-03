/**
 * 产品SKU模块
 *
 * @author Claude
 * @module Ecommerce/Product
 */

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductSku } from '../entities/product-sku.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ProductSku])],
  exports: [TypeOrmModule],
})
export class ProductSkuModule {}
