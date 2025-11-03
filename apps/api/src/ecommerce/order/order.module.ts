/**
 * 订单模块
 *
 * 提供订单管理的完整模块，包括：
 * - 订单和订单项目实体
 * - 订单服务和仓储库
 * - GraphQL解析器
 * - 与库存和购物车模块的集成
 *
 * @author Claude
 * @module Ecommerce/Order
 */

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { ShoppingCart } from '../cart/entities/shopping-cart.entity';
import { CartItem } from '../cart/entities/cart-item.entity';
import { OrderService } from './services/order.service';
import { OrderRepository } from './repositories/order.repository';
import { OrderResolver } from './resolvers/order.resolver';
import { InventoryModule } from '../inventory/inventory.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Order, OrderItem, ShoppingCart, CartItem]),
    InventoryModule,
  ],
  providers: [
    OrderService,
    OrderRepository,
    OrderResolver,
  ],
  exports: [OrderService, OrderRepository],
})
export class OrderModule {}
