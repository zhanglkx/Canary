/**
 * 电商模块
 *
 * 集合所有电商相关的子模块
 *
 * 包含：
 * - ProductModule：产品管理
 * - InventoryModule：库存管理（后续实现）
 * - ShoppingCartModule：购物车（后续实现）
 * - OrderModule：订单管理（后续实现）
 * - PaymentModule：支付管理（后续实现）
 * - ReviewModule：评价管理（后续实现）
 *
 * @author Claude
 * @module Ecommerce
 */

import { Module } from '@nestjs/common';
import { ProductModule } from './product/product.module';
import { InventoryModule } from './inventory/inventory.module';

/**
 * 电商主模块
 *
 * 导出所有子模块的公共服务供其他应用模块使用
 */
@Module({
  imports: [
    ProductModule,
    InventoryModule,
    // ShoppingCartModule, // 后续添加
    // OrderModule, // 后续添加
    // PaymentModule, // 后续添加
    // ReviewModule, // 后续添加
  ],
  exports: [ProductModule, InventoryModule],
})
export class EcommerceModule {}
