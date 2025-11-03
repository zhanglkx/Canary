/**
 * 订单服务
 *
 * 核心职责：
 * 1. 订单生命周期管理：创建、支付、发货、送达、取消
 * 2. 购物车转订单：将购物车转换为订单
 * 3. 库存管理集成：确认支付时锁定库存
 * 4. 订单号生成：生成唯一的用户可见订单号
 * 5. 订单统计：订单数据聚合和分析
 *
 * @author Claude
 * @module Ecommerce/Order
 */

import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, In } from 'typeorm';
import { Order, OrderStatus, PaymentMethod } from '../entities/order.entity';
import { OrderItem } from '../entities/order-item.entity';
import { ShoppingCart } from '../../cart/entities/shopping-cart.entity';
import { InventoryService } from '../../inventory/services/inventory.service';

/**
 * 订单创建输入
 */
export interface CreateOrderInput {
  cartId: string;
  shippingAddress: string;
  recipientName: string;
  recipientPhone: string;
  notes?: string;
}

/**
 * 订单统计信息
 */
export interface OrderStats {
  totalOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
  cancellationRate: number;
  conversionRate: number;
}

/**
 * 订单分析结果
 */
export interface OrderAnalysis {
  period: string;
  ordersCreated: number;
  ordersPaid: number;
  ordersShipped: number;
  ordersDelivered: number;
  ordersCancelled: number;
  revenue: number;
}

@Injectable()
export class OrderService {
  private readonly logger = new Logger(OrderService.name);

  constructor(
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
    @InjectRepository(OrderItem)
    private orderItemRepository: Repository<OrderItem>,
    @InjectRepository(ShoppingCart)
    private cartRepository: Repository<ShoppingCart>,
    private inventoryService: InventoryService,
  ) {}

  /**
   * 从购物车创建订单
   *
   * @param userId 用户ID
   * @param input 创建订单输入
   * @returns 新创建的订单
   */
  async createOrderFromCart(
    userId: string,
    input: CreateOrderInput,
  ): Promise<Order> {
    this.logger.debug(`从购物车创建订单: 用户=${userId}, 购物车=${input.cartId}`);

    // 获取购物车
    const cart = await this.cartRepository.findOne({
      where: { id: input.cartId, userId },
      relations: ['items', 'items.sku', 'items.product'],
    });

    if (!cart) {
      throw new NotFoundException(`购物车 ${input.cartId} 不存在或不属于该用户`);
    }

    if (!cart.items || cart.items.length === 0) {
      throw new BadRequestException('购物车为空，无法创建订单');
    }

    // 验证库存
    for (const item of cart.items) {
      const hasStock = await this.inventoryService.hasEnoughStock(
        item.skuId,
        item.quantity,
      );

      if (!hasStock) {
        throw new BadRequestException(
          `商品 ${item.productName} 库存不足，无法创建订单`,
        );
      }
    }

    // 生成订单号
    const orderNumber = await this.generateOrderNumber();

    // 创建订单项目
    const orderItems = cart.items.map((cartItem) =>
      this.orderItemRepository.create({
        skuId: cartItem.skuId,
        productId: cartItem.productId,
        productName: cartItem.productName,
        skuCode: cartItem.skuCode,
        unitPriceCents: cartItem.unitPriceCents,
        quantity: cartItem.quantity,
        attributeSnapshot: cartItem.attributeSnapshot,
        itemDiscountCents: cartItem.itemDiscountCents,
      }),
    );

    // 计算订单总额
    const subtotalCents = orderItems.reduce(
      (sum, item) => sum + item.unitPriceCents * item.quantity,
      0,
    );

    // 创建订单
    const order = this.orderRepository.create({
      userId,
      orderNumber,
      status: OrderStatus.PENDING,
      items: orderItems,
      subtotalCents,
      taxCents: Math.round(subtotalCents * 0.1), // 假设10%税率
      shippingCents: 0, // 免运费
      discountCents: 0,
      shippingAddress: input.shippingAddress,
      recipientName: input.recipientName,
      recipientPhone: input.recipientPhone,
      notes: input.notes,
    });

    // 保存订单
    const savedOrder = await this.orderRepository.save(order);
    this.logger.log(`订单已创建: ID=${savedOrder.id}, 订单号=${orderNumber}`);

    return savedOrder;
  }

  /**
   * 获取订单
   *
   * @param orderId 订单ID
   * @returns 订单信息
   */
  async getOrder(orderId: string): Promise<Order> {
    const order = await this.orderRepository.findOne({
      where: { id: orderId },
      relations: ['items', 'items.sku', 'items.product'],
    });

    if (!order) {
      throw new NotFoundException(`订单 ${orderId} 不存在`);
    }

    return order;
  }

  /**
   * 确认订单支付
   *
   * @param orderId 订单ID
   * @param paymentMethod 支付方式
   * @returns 更新后的订单
   */
  async confirmPayment(
    orderId: string,
    paymentMethod: PaymentMethod,
  ): Promise<Order> {
    this.logger.debug(
      `确认订单支付: 订单=${orderId}, 支付方式=${paymentMethod}`,
    );

    const order = await this.getOrder(orderId);

    if (order.status !== OrderStatus.PENDING) {
      throw new ConflictException('只有待支付订单才能确认支付');
    }

    try {
      // 为订单中的所有商品确认库存预留
      for (const item of order.items) {
        await this.inventoryService.confirmReserve(item.skuId, item.quantity, orderId);
      }

      // 更新订单状态
      order.confirmPayment(paymentMethod);
      const updatedOrder = await this.orderRepository.save(order);

      this.logger.log(
        `订单支付已确认: ID=${orderId}, 支付方式=${paymentMethod}`,
      );

      return updatedOrder;
    } catch (error) {
      this.logger.error(`确认支付失败: ${error.message}`);
      throw error;
    }
  }

  /**
   * 标记订单为已发货
   *
   * @param orderId 订单ID
   * @returns 更新后的订单
   */
  async markAsShipped(orderId: string): Promise<Order> {
    this.logger.debug(`标记订单为已发货: 订单=${orderId}`);

    const order = await this.getOrder(orderId);

    if (order.status !== OrderStatus.CONFIRMED) {
      throw new ConflictException('只有已确认订单才能标记为已发货');
    }

    order.markAsShipped();
    const updatedOrder = await this.orderRepository.save(order);

    this.logger.log(`订单已发货: ID=${orderId}`);

    return updatedOrder;
  }

  /**
   * 标记订单为已送达
   *
   * @param orderId 订单ID
   * @returns 更新后的订单
   */
  async markAsDelivered(orderId: string): Promise<Order> {
    this.logger.debug(`标记订单为已送达: 订单=${orderId}`);

    const order = await this.getOrder(orderId);

    if (order.status !== OrderStatus.SHIPPED) {
      throw new ConflictException('只有已发货订单才能标记为已送达');
    }

    order.markAsDelivered();
    const updatedOrder = await this.orderRepository.save(order);

    this.logger.log(`订单已送达: ID=${orderId}`);

    return updatedOrder;
  }

  /**
   * 取消订单
   *
   * @param orderId 订单ID
   * @returns 更新后的订单
   */
  async cancelOrder(orderId: string): Promise<Order> {
    this.logger.debug(`取消订单: 订单=${orderId}`);

    const order = await this.getOrder(orderId);

    if (!order.canBeCancelled()) {
      throw new ConflictException('该订单无法取消（已发货或已送达）');
    }

    // 如果订单已支付，取消预留的库存
    if (order.isPaid()) {
      for (const item of order.items) {
        await this.inventoryService.cancelReserve(item.skuId, item.quantity, orderId);
      }
      this.logger.log(`订单库存已取消: ID=${orderId}`);
    }

    order.cancel();
    const updatedOrder = await this.orderRepository.save(order);

    this.logger.log(`订单已取消: ID=${orderId}`);

    return updatedOrder;
  }

  /**
   * 获取用户订单列表
   *
   * @param userId 用户ID
   * @param skip 跳过数量
   * @param take 获取数量
   * @returns 订单列表
   */
  async getUserOrders(
    userId: string,
    skip: number = 0,
    take: number = 10,
  ): Promise<[Order[], number]> {
    return this.orderRepository.findAndCount({
      where: { userId },
      relations: ['items'],
      order: { createdAt: 'DESC' },
      skip,
      take,
    });
  }

  /**
   * 按状态获取用户订单
   *
   * @param userId 用户ID
   * @param status 订单状态
   * @returns 订单列表
   */
  async getUserOrdersByStatus(
    userId: string,
    status: OrderStatus,
  ): Promise<Order[]> {
    return this.orderRepository.find({
      where: { userId, status },
      relations: ['items'],
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * 获取订单统计信息
   *
   * @param userId 用户ID
   * @returns 订单统计
   */
  async getUserOrderStats(userId: string): Promise<{
    totalOrders: number;
    totalSpent: number;
    pendingOrders: number;
    shippedOrders: number;
    deliveredOrders: number;
  }> {
    const orders = await this.orderRepository.find({
      where: { userId },
    });

    const totalSpent = orders.reduce(
      (sum, order) => sum + order.totalAmount,
      0,
    );
    const pendingOrders = orders.filter(
      (o) => o.status === OrderStatus.PENDING,
    ).length;
    const shippedOrders = orders.filter(
      (o) => o.status === OrderStatus.SHIPPED,
    ).length;
    const deliveredOrders = orders.filter(
      (o) => o.status === OrderStatus.DELIVERED,
    ).length;

    return {
      totalOrders: orders.length,
      totalSpent,
      pendingOrders,
      shippedOrders,
      deliveredOrders,
    };
  }

  /**
   * 获取系统订单统计信息
   *
   * @returns 统计信息
   */
  async getSystemOrderStats(): Promise<OrderStats> {
    const totalOrders = await this.orderRepository.count();
    const allOrders = await this.orderRepository.find();

    const totalRevenue = allOrders.reduce(
      (sum, order) =>
        sum +
        (order.status !== OrderStatus.CANCELLED ? order.totalAmount : 0),
      0,
    );

    const cancelledOrders = allOrders.filter(
      (o) => o.status === OrderStatus.CANCELLED,
    ).length;
    const cancellationRate =
      totalOrders > 0 ? (cancelledOrders / totalOrders) * 100 : 0;

    return {
      totalOrders,
      totalRevenue,
      averageOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0,
      cancellationRate,
      conversionRate: 0, // 需要购物车数据计算
    };
  }

  /**
   * 获取指定日期范围的订单分析
   *
   * @param startDate 开始日期
   * @param endDate 结束日期
   * @returns 分析结果
   */
  async getOrderAnalysisByDateRange(
    startDate: Date,
    endDate: Date,
  ): Promise<OrderAnalysis> {
    const orders = await this.orderRepository.find({
      where: {
        createdAt: Between(startDate, endDate),
      },
    });

    const revenue = orders
      .filter((o) => o.status !== OrderStatus.CANCELLED)
      .reduce((sum, order) => sum + order.totalAmount, 0);

    return {
      period: `${startDate.toISOString()} ~ ${endDate.toISOString()}`,
      ordersCreated: orders.length,
      ordersPaid: orders.filter((o) => o.isPaid()).length,
      ordersShipped: orders.filter((o) => o.isShipped()).length,
      ordersDelivered: orders.filter((o) => o.isDelivered()).length,
      ordersCancelled: orders.filter((o) => o.status === OrderStatus.CANCELLED)
        .length,
      revenue,
    };
  }

  /**
   * ==================== 私有辅助方法 ====================
   */

  /**
   * 生成唯一的订单号
   *
   * @private
   * @returns 订单号，格式：ORD-20251103-000001
   */
  private async generateOrderNumber(): Promise<string> {
    const date = new Date();
    const dateStr = date.toISOString().split('T')[0].replace(/-/g, '');

    // 获取今天的订单数
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const todayCount = await this.orderRepository.count({
      where: {
        createdAt: Between(startOfDay, endOfDay),
      },
    });

    const sequence = String(todayCount + 1).padStart(6, '0');
    const orderNumber = `ORD-${dateStr}-${sequence}`;

    return orderNumber;
  }
}
