/**
 * InventoryController - 库存控制器
 */

import { Controller, Get, Post, Param, Body, UseGuards } from '@nestjs/common';
import { InventoryService } from '../services/inventory.service';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';

@Controller('inventory')
@UseGuards(JwtAuthGuard)
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get(':skuId')
  async getStock(@Param('skuId') skuId: string) {
    return this.inventoryService.getStock(skuId);
  }

  @Post(':skuId/reserve')
  async reserve(@Param('skuId') skuId: string, @Body('quantity') quantity: number) {
    return this.inventoryService.reserveStock(skuId, quantity);
  }

  @Post(':skuId/release')
  async release(@Param('skuId') skuId: string, @Body('quantity') quantity: number) {
    return this.inventoryService.releaseStock(skuId, quantity);
  }
}
