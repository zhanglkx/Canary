/**
 * 库存模块
 *
 * 核心功能：
 * - 库存管理（预留、确认、取消、扣减）
 * - 并发控制（乐观锁 + 分布式锁）
 * - 库存监控（低库存告警、缺货提醒）
 *
 * 依赖关系：
 * - ProductSkuModule（同步库存数据）
 * - 可被 OrderModule 依赖（订单时操作库存）
 * - 可被 CartModule 依赖（购物车时检查库存）
 *
 * @author Claude
 * @module Ecommerce/Inventory
 */

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Inventory } from './entities/inventory.entity';
import { InventoryLock } from './entities/inventory-lock.entity';
import { InventoryService } from './services/inventory.service';
import { InventoryRepository } from './repositories/inventory.repository';
import { InventoryController } from './controllers/inventory.controller';
import { ProductSkuModule } from '../product/modules/product-sku.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Inventory, InventoryLock]),
    ProductSkuModule,
  ],
  providers: [InventoryService, InventoryRepository],
  controllers: [InventoryController],
  exports: [InventoryService, InventoryRepository],
})
export class InventoryModule {}
