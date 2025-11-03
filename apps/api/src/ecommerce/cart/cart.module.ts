/**
 * 购物车模块
 *
 * 提供购物车功能的完整模块，包括：
 * - 购物车和购物车项目实体
 * - 购物车服务和仓储库
 * - GraphQL解析器
 * - 与库存和产品模块的集成
 *
 * @author Claude
 * @module Ecommerce/ShoppingCart
 */

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ShoppingCart } from './entities/shopping-cart.entity';
import { CartItem } from './entities/cart-item.entity';
import { ProductSku } from '../product/entities/product-sku.entity';
import { Product } from '../product/entities/product.entity';
import { ShoppingCartService } from './services/shopping-cart.service';
import { ShoppingCartRepository } from './repositories/shopping-cart.repository';
import { ShoppingCartResolver } from './resolvers/shopping-cart.resolver';
import { InventoryModule } from '../inventory/inventory.module';
import { ProductModule } from '../product/product.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ShoppingCart, CartItem, ProductSku, Product]),
    InventoryModule,
    ProductModule,
  ],
  providers: [
    ShoppingCartService,
    ShoppingCartRepository,
    ShoppingCartResolver,
  ],
  exports: [ShoppingCartService, ShoppingCartRepository],
})
export class ShoppingCartModule {}
