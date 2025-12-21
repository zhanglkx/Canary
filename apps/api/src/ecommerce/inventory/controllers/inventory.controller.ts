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
    return this.inventoryService.getInventory(skuId);
  }

  @Post(':skuId/reserve')
  async reserve(@Param('skuId') skuId: string, @Body() body: { quantity: number; orderId?: string }) {
    return this.inventoryService.reserveStock(skuId, body.quantity, body.orderId);
  }

  @Post(':skuId/release')
  async release(@Param('skuId') skuId: string, @Body() body: { quantity: number; orderId?: string }) {
    return this.inventoryService.cancelReserve(skuId, body.quantity, body.orderId);
  }
}
