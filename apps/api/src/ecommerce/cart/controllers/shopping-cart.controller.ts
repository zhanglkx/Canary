/**
 * ShoppingCartController - 购物车控制器
 */

import { Controller, Get, Post, Put, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { ShoppingCartService } from '../services/shopping-cart.service';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { User } from '../../../user/user.entity';

@Controller('cart')
@UseGuards(JwtAuthGuard)
export class ShoppingCartController {
  constructor(private readonly cartService: ShoppingCartService) {}

  @Get()
  async getCart(@CurrentUser() user: User) {
    return this.cartService.getCart(user.id);
  }

  @Post('items')
  async addItem(@Body() addItemDto: any, @CurrentUser() user: User) {
    return this.cartService.addToCart(user.id, { skuId: addItemDto.skuId, quantity: addItemDto.quantity });
  }

  @Put('items/:itemId')
  async updateItem(@Param('itemId') itemId: string, @Body() body: { quantity: number }, @CurrentUser() user: User) {
    return this.cartService.updateItemQuantity(user.id, itemId, body.quantity);
  }

  @Delete('items/:itemId')
  async removeItem(@Param('itemId') itemId: string, @CurrentUser() user: User) {
    return this.cartService.removeFromCart(user.id, itemId);
  }

  @Delete()
  async clearCart(@CurrentUser() user: User) {
    return this.cartService.clearCart(user.id);
  }
}
