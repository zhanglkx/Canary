/**
 * OrderController - 订单控制器
 */

import { Controller, Get, Post, Put, Param, Body, UseGuards } from '@nestjs/common';
import { OrderService } from '../services/order.service';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { User } from '../../../user/user.entity';

@Controller('orders')
@UseGuards(JwtAuthGuard)
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Post()
  async create(@Body() createOrderDto: any, @CurrentUser() user: User) {
    return this.orderService.createOrder(user.id, createOrderDto);
  }

  @Get()
  async findAll(@CurrentUser() user: User) {
    return this.orderService.getUserOrders(user.id);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @CurrentUser() user: User) {
    return this.orderService.getOrderById(id, user.id);
  }

  @Put(':id/cancel')
  async cancel(@Param('id') id: string, @CurrentUser() user: User) {
    return this.orderService.cancelOrder(id, user.id);
  }
}
