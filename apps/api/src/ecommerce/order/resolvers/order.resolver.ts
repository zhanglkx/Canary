/**
 * 订单解析器
 *
 * 提供订单相关的GraphQL查询和变更：
 * - 订单查询（我的订单、订单详情、订单统计）
 * - 订单操作（创建、支付、发货、取消）
 * - 数据分析（收入分析、客户分析）
 *
 * @author Claude
 * @module Ecommerce/Order
 */

import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { Order } from '../entities/order.entity';
import { OrderStatus, PaymentMethod } from '../entities/order.entity';
import { OrderService } from '../services/order.service';
import { OrderRepository } from '../repositories/order.repository';
import { GqlAuthGuard } from '../../../common/guards/gql-auth.guard';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { User } from '../../../user/user.entity';
import { Logger, BadRequestException } from '@nestjs/common';

/**
 * 创建订单输入
 */
import { InputType, Field } from '@nestjs/graphql';

@InputType()
export class CreateOrderInput {
  @Field()
  cartId: string;

  @Field()
  shippingAddress: string;

  @Field()
  recipientName: string;

  @Field()
  recipientPhone: string;

  @Field({ nullable: true })
  notes?: string;
}

/**
 * 订单统计输出
 */
import { ObjectType } from '@nestjs/graphql';

@ObjectType()
export class OrderStatsOutput {
  @Field(() => Int)
  totalOrders: number;

  @Field()
  totalSpent: number;

  @Field(() => Int)
  pendingOrders: number;

  @Field(() => Int)
  shippedOrders: number;

  @Field(() => Int)
  deliveredOrders: number;
}

/**
 * 订单分析输出
 */
@ObjectType()
export class OrderAnalysisOutput {
  @Field()
  period: string;

  @Field(() => Int)
  ordersCreated: number;

  @Field(() => Int)
  ordersPaid: number;

  @Field(() => Int)
  ordersShipped: number;

  @Field(() => Int)
  ordersDelivered: number;

  @Field(() => Int)
  ordersCancelled: number;

  @Field()
  revenue: number;
}

/**
 * 订单分页输出
 */
@ObjectType()
export class OrdersPageOutput {
  @Field(() => [Order])
  orders: Order[];

  @Field(() => Int)
  total: number;
}

/**
 * 订单解析器
 */
@Resolver(() => Order)
export class OrderResolver {
  private readonly logger = new Logger(OrderResolver.name);

  constructor(
    private orderService: OrderService,
    private orderRepository: OrderRepository,
  ) {}

  /**
   * ==================== 查询 ====================
   */

  /**
   * 获取订单详情
   *
   * @param orderId 订单ID
   * @param user 当前用户
   * @returns 订单信息
   */
  @Query(() => Order, { nullable: true })
  @UseGuards(GqlAuthGuard)
  async order(
    @Args('id') orderId: string,
    @CurrentUser() user: User,
  ): Promise<Order | null> {
    this.logger.debug(`查询订单: ID=${orderId}, 用户=${user.id}`);

    const order = await this.orderRepository.findById(orderId);

    // 只有订单所有者或管理员才能查看
    if (order && order.userId !== user.id) {
      throw new BadRequestException('无权访问该订单');
    }

    return order;
  }

  /**
   * 获取我的订单列表
   *
   * @param user 当前用户
   * @param skip 跳过数量
   * @param take 获取数量
   * @returns 订单分页结果
   */
  @Query(() => OrdersPageOutput)
  @UseGuards(GqlAuthGuard)
  async myOrders(
    @CurrentUser() user: User,
    @Args('skip', { type: () => Int, nullable: true }) skip?: number,
    @Args('take', { type: () => Int, nullable: true }) take?: number,
  ): Promise<OrdersPageOutput> {
    this.logger.debug(`查询我的订单: 用户=${user.id}`);

    const [orders, total] = await this.orderService.getUserOrders(
      user.id,
      skip || 0,
      take || 10,
    );

    return {
      orders,
      total,
    };
  }

  /**
   * 获取指定状态的我的订单
   *
   * @param user 当前用户
   * @param status 订单状态
   * @returns 订单列表
   */
  @Query(() => [Order])
  @UseGuards(GqlAuthGuard)
  async myOrdersByStatus(
    @CurrentUser() user: User,
    @Args('status', { type: () => OrderStatus }) status: OrderStatus,
  ): Promise<Order[]> {
    this.logger.debug(`查询订单（按状态）: 用户=${user.id}, 状态=${status}`);

    return this.orderService.getUserOrdersByStatus(user.id, status);
  }

  /**
   * 获取我的订单统计
   *
   * @param user 当前用户
   * @returns 订单统计
   */
  @Query(() => OrderStatsOutput)
  @UseGuards(GqlAuthGuard)
  async myOrderStats(@CurrentUser() user: User): Promise<OrderStatsOutput> {
    this.logger.debug(`查询我的订单统计: 用户=${user.id}`);

    const stats = await this.orderService.getUserOrderStats(user.id);

    return {
      totalOrders: stats.totalOrders,
      totalSpent: stats.totalSpent,
      pendingOrders: stats.pendingOrders,
      shippedOrders: stats.shippedOrders,
      deliveredOrders: stats.deliveredOrders,
    };
  }

  /**
   * 按订单号查询订单
   *
   * @param orderNumber 订单号
   * @param user 当前用户
   * @returns 订单信息
   */
  @Query(() => Order, { nullable: true })
  @UseGuards(GqlAuthGuard)
  async orderByNumber(
    @Args('orderNumber') orderNumber: string,
    @CurrentUser() user: User,
  ): Promise<Order | null> {
    this.logger.debug(`按订单号查询: 订单号=${orderNumber}, 用户=${user.id}`);

    const order = await this.orderRepository.findByOrderNumber(orderNumber);

    if (order && order.userId !== user.id) {
      throw new BadRequestException('无权访问该订单');
    }

    return order;
  }

  /**
   * 搜索我的订单
   *
   * @param user 当前用户
   * @param keyword 搜索关键词
   * @param skip 跳过数量
   * @param take 获取数量
   * @returns 订单分页结果
   */
  @Query(() => OrdersPageOutput)
  @UseGuards(GqlAuthGuard)
  async searchMyOrders(
    @CurrentUser() user: User,
    @Args('keyword') keyword: string,
    @Args('skip', { type: () => Int, nullable: true }) skip?: number,
    @Args('take', { type: () => Int, nullable: true }) take?: number,
  ): Promise<OrdersPageOutput> {
    this.logger.debug(`搜索我的订单: 用户=${user.id}, 关键词=${keyword}`);

    const [orders, total] = await this.orderRepository.searchOrders(
      keyword,
      skip || 0,
      take || 10,
    );

    // 过滤：只返回属于当前用户的订单
    const userOrders = orders.filter((o) => o.userId === user.id);

    return {
      orders: userOrders,
      total: userOrders.length,
    };
  }

  /**
   * ==================== 变更 ====================
   */

  /**
   * 创建订单（从购物车）
   *
   * @param user 当前用户
   * @param input 创建订单输入
   * @returns 新创建的订单
   */
  @Mutation(() => Order)
  @UseGuards(GqlAuthGuard)
  async createOrder(
    @CurrentUser() user: User,
    @Args('input') input: CreateOrderInput,
  ): Promise<Order> {
    this.logger.debug(`创建订单: 用户=${user.id}, 购物车=${input.cartId}`);

    return this.orderService.createOrderFromCart(user.id, {
      cartId: input.cartId,
      shippingAddress: input.shippingAddress,
      recipientName: input.recipientName,
      recipientPhone: input.recipientPhone,
      notes: input.notes,
    });
  }

  /**
   * 确认订单支付
   *
   * @param user 当前用户
   * @param orderId 订单ID
   * @param paymentMethod 支付方式
   * @returns 更新后的订单
   */
  @Mutation(() => Order)
  @UseGuards(GqlAuthGuard)
  async confirmOrderPayment(
    @CurrentUser() user: User,
    @Args('orderId') orderId: string,
    @Args('paymentMethod', { type: () => PaymentMethod })
    paymentMethod: PaymentMethod,
  ): Promise<Order> {
    this.logger.debug(
      `确认订单支付: 用户=${user.id}, 订单=${orderId}, 支付方式=${paymentMethod}`,
    );

    // 验证权限
    const order = await this.orderRepository.findById(orderId);
    if (!order || order.userId !== user.id) {
      throw new BadRequestException('无权操作该订单');
    }

    return this.orderService.confirmPayment(orderId, paymentMethod);
  }

  /**
   * 标记订单为已发货
   *
   * @param orderId 订单ID
   * @returns 更新后的订单
   */
  @Mutation(() => Order)
  async shipOrder(@Args('orderId') orderId: string): Promise<Order> {
    this.logger.debug(`标记订单为已发货: 订单=${orderId}`);

    return this.orderService.markAsShipped(orderId);
  }

  /**
   * 标记订单为已送达
   *
   * @param orderId 订单ID
   * @returns 更新后的订单
   */
  @Mutation(() => Order)
  async deliverOrder(@Args('orderId') orderId: string): Promise<Order> {
    this.logger.debug(`标记订单为已送达: 订单=${orderId}`);

    return this.orderService.markAsDelivered(orderId);
  }

  /**
   * 取消订单
   *
   * @param user 当前用户
   * @param orderId 订单ID
   * @returns 更新后的订单
   */
  @Mutation(() => Order)
  @UseGuards(GqlAuthGuard)
  async cancelOrder(
    @CurrentUser() user: User,
    @Args('orderId') orderId: string,
  ): Promise<Order> {
    this.logger.debug(`取消订单: 用户=${user.id}, 订单=${orderId}`);

    // 验证权限
    const order = await this.orderRepository.findById(orderId);
    if (!order || order.userId !== user.id) {
      throw new BadRequestException('无权操作该订单');
    }

    return this.orderService.cancelOrder(orderId);
  }

  /**
   * 获取订单分析（日期范围）
   *
   * @param startDate 开始日期
   * @param endDate 结束日期
   * @returns 分析结果
   */
  @Query(() => OrderAnalysisOutput)
  async orderAnalysisByDateRange(
    @Args('startDate', { type: () => String })
    startDate: string,
    @Args('endDate', { type: () => String })
    endDate: string,
  ): Promise<OrderAnalysisOutput> {
    this.logger.debug(
      `查询订单分析: 开始=${startDate}, 结束=${endDate}`,
    );

    const analysis = await this.orderService.getOrderAnalysisByDateRange(
      new Date(startDate),
      new Date(endDate),
    );

    return {
      period: analysis.period,
      ordersCreated: analysis.ordersCreated,
      ordersPaid: analysis.ordersPaid,
      ordersShipped: analysis.ordersShipped,
      ordersDelivered: analysis.ordersDelivered,
      ordersCancelled: analysis.ordersCancelled,
      revenue: analysis.revenue,
    };
  }
}
