/**
 * 购物车解析器
 *
 * 公开购物车服务的GraphQL API：
 * - 购物车查询：获取用户购物车、购物车详情、统计信息
 * - 购物车操作：添加/移除/更新商品、清空购物车
 * - 验证操作：验证库存、刷新库存状态
 * - 管理员查询：已废弃购物车、购物车统计
 *
 * @author Claude
 * @module Ecommerce/ShoppingCart
 */

import {
  Resolver,
  Query,
  Mutation,
  Args,
  Context,
} from '@nestjs/graphql';
import { Logger, UseGuards } from '@nestjs/common';
import { ShoppingCart } from '../entities/shopping-cart.entity';
import { CartItem } from '../entities/cart-item.entity';
import { ShoppingCartService } from '../services/shopping-cart.service';
import { GqlAuthGuard } from '../../../common/guards/gql-auth.guard';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { User } from '../../../user/user.entity';
import {
  ObjectType,
  Field,
  Float,
  Int,
  InputType,
} from '@nestjs/graphql';

/**
 * 添加到购物车的输入
 */
@InputType()
export class AddToCartInput {
  /**
   * SKU ID
   */
  @Field()
  skuId: string;

  /**
   * 商品数量
   */
  @Field(() => Int)
  quantity: number;
}

/**
 * 更新购物车项目数量的输入
 */
@InputType()
export class UpdateCartItemQuantityInput {
  /**
   * SKU ID
   */
  @Field()
  skuId: string;

  /**
   * 新的数量
   */
  @Field(() => Int)
  quantity: number;
}

/**
 * 购物车统计信息DTO
 */
@ObjectType()
export class CartStatsDto {
  /**
   * 商品总数（数量总和）
   */
  @Field(() => Int)
  totalItems: number;

  /**
   * SKU总数（不同的SKU数量）
   */
  @Field(() => Int)
  totalSKUs: number;

  /**
   * 小计（不含税费）
   */
  @Field(() => Float)
  subtotal: number;

  /**
   * 税费
   */
  @Field(() => Float)
  taxAmount: number;

  /**
   * 总价（含税费）
   */
  @Field(() => Float)
  total: number;

  /**
   * 是否为空
   */
  @Field()
  isEmpty: boolean;

  /**
   * 是否已废弃
   */
  @Field()
  isAbandoned: boolean;
}

/**
 * 购物车验证结果DTO
 */
@ObjectType()
export class CartValidationResultDto {
  /**
   * 验证是否通过
   */
  @Field()
  valid: boolean;

  /**
   * 无法获取或库存不足的SKU列表
   */
  @Field(() => [String])
  unavailableItems: string[];
}

/**
 * 已废弃购物车统计DTO
 */
@ObjectType()
export class AbandonedCartStatsDto {
  /**
   * 已废弃购物车数量
   */
  @Field(() => Int)
  count: number;

  /**
   * 已废弃购物车总金额
   */
  @Field(() => Float)
  totalValue: number;
}

/**
 * 购物车操作结果DTO
 */
@ObjectType()
export class CartOperationResultDto {
  /**
   * 操作是否成功
   */
  @Field()
  success: boolean;

  /**
   * 操作消息
   */
  @Field()
  message: string;

  /**
   * 操作后的购物车
   */
  @Field({ nullable: true })
  cart?: ShoppingCart;
}

@Resolver(() => ShoppingCart)
export class ShoppingCartResolver {
  private readonly logger = new Logger(ShoppingCartResolver.name);

  constructor(private shoppingCartService: ShoppingCartService) {}

  /**
   * ==================== 购物车查询 ====================
   */

  /**
   * 获取当前用户的购物车
   *
   * @example
   * query {
   *   myCart {
   *     id
   *     items {
   *       id
   *       productName
   *       quantity
   *       unitPrice
   *     }
   *     subtotal
   *     total
   *   }
   * }
   */
  @Query(() => ShoppingCart, { nullable: true })
  @UseGuards(GqlAuthGuard)
  async myCart(@CurrentUser() user: User): Promise<ShoppingCart> {
    this.logger.debug(`获取用户购物车: 用户=${user.id}`);
    return this.shoppingCartService.getUserCart(user.id);
  }

  /**
   * 获取购物车详情
   *
   * @example
   * query {
   *   cartDetail(cartId: "123e4567-e89b-12d3-a456-426614174000") {
   *     id
   *     userId
   *     items {
   *       id
   *       productName
   *       skuCode
   *       quantity
   *       unitPrice
   *       stockStatus
   *       attributeSnapshot
   *     }
   *     status
   *     createdAt
   *     updatedAt
   *   }
   * }
   */
  @Query(() => ShoppingCart, { nullable: true })
  @UseGuards(GqlAuthGuard)
  async cartDetail(@Args('cartId') cartId: string): Promise<ShoppingCart> {
    this.logger.debug(`获取购物车详情: 购物车=${cartId}`);
    return this.shoppingCartService.getCart(cartId);
  }

  /**
   * 获取购物车统计信息
   *
   * @example
   * query {
   *   cartStats(cartId: "123e4567-e89b-12d3-a456-426614174000") {
   *     totalItems
   *     totalSKUs
   *     subtotal
   *     taxAmount
   *     total
   *     isEmpty
   *     isAbandoned
   *   }
   * }
   */
  @Query(() => CartStatsDto)
  @UseGuards(GqlAuthGuard)
  async cartStats(
    @Args('cartId') cartId: string,
  ): Promise<CartStatsDto> {
    this.logger.debug(`获取购物车统计: 购物车=${cartId}`);
    return this.shoppingCartService.getCartStats(cartId);
  }

  /**
   * 获取当前用户购物车的统计信息
   *
   * @example
   * query {
   *   myCartStats {
   *     totalItems
   *     subtotal
   *     total
   *   }
   * }
   */
  @Query(() => CartStatsDto)
  @UseGuards(GqlAuthGuard)
  async myCartStats(
    @CurrentUser() user: User,
  ): Promise<CartStatsDto> {
    this.logger.debug(`获取用户购物车统计: 用户=${user.id}`);
    const cart = await this.shoppingCartService.getUserCart(user.id);
    return this.shoppingCartService.getCartStats(cart.id);
  }

  /**
   * 获取活跃购物车数量
   *
   * @example
   * query {
   *   activeCartCount
   * }
   */
  @Query(() => Int)
  @UseGuards(GqlAuthGuard)
  async activeCartCount(): Promise<number> {
    this.logger.debug(`获取活跃购物车数量`);
    return this.shoppingCartService.getActiveCartCount();
  }

  /**
   * 获取已废弃购物车统计
   *
   * @example
   * query {
   *   abandonedCartStats {
   *     count
   *     totalValue
   *   }
   * }
   */
  @Query(() => AbandonedCartStatsDto)
  @UseGuards(GqlAuthGuard)
  async abandonedCartStats(): Promise<AbandonedCartStatsDto> {
    this.logger.debug(`获取已废弃购物车统计`);
    return this.shoppingCartService.getAbandonedCartStats();
  }

  /**
   * ==================== 购物车操作 ====================
   */

  /**
   * 添加商品到购物车
   *
   * @example
   * mutation {
   *   addToCart(input: { skuId: "sku-123", quantity: 2 }) {
   *     success
   *     message
   *     cart {
   *       id
   *       items {
   *         id
   *         productName
   *         quantity
   *       }
   *       total
   *     }
   *   }
   * }
   */
  @Mutation(() => CartOperationResultDto)
  @UseGuards(GqlAuthGuard)
  async addToCart(
    @CurrentUser() user: User,
    @Args('input') input: AddToCartInput,
  ): Promise<CartOperationResultDto> {
    try {
      this.logger.debug(
        `添加商品到购物车: 用户=${user.id}, SKU=${input.skuId}, 数量=${input.quantity}`,
      );
      const cart = await this.shoppingCartService.addToCart(user.id, input);
      return {
        success: true,
        message: `成功添加 ${input.quantity} 件商品到购物车`,
        cart,
      };
    } catch (error) {
      this.logger.error(`添加商品到购物车失败: ${error.message}`);
      return {
        success: false,
        message: error.message,
      };
    }
  }

  /**
   * 从购物车移除商品
   *
   * @example
   * mutation {
   *   removeFromCart(skuId: "sku-123") {
   *     success
   *     message
   *     cart {
   *       id
   *       items {
   *         id
   *       }
   *       total
   *     }
   *   }
   * }
   */
  @Mutation(() => CartOperationResultDto)
  @UseGuards(GqlAuthGuard)
  async removeFromCart(
    @CurrentUser() user: User,
    @Args('skuId') skuId: string,
  ): Promise<CartOperationResultDto> {
    try {
      this.logger.debug(
        `从购物车移除商品: 用户=${user.id}, SKU=${skuId}`,
      );
      const cart = await this.shoppingCartService.removeFromCart(
        user.id,
        skuId,
      );
      return {
        success: true,
        message: `成功从购物车移除商品`,
        cart,
      };
    } catch (error) {
      this.logger.error(`移除商品失败: ${error.message}`);
      return {
        success: false,
        message: error.message,
      };
    }
  }

  /**
   * 更新购物车项目数量
   *
   * @example
   * mutation {
   *   updateCartItemQuantity(input: { skuId: "sku-123", quantity: 5 }) {
   *     success
   *     message
   *     cart {
   *       id
   *       items {
   *         id
   *         skuId
   *         quantity
   *       }
   *       total
   *     }
   *   }
   * }
   */
  @Mutation(() => CartOperationResultDto)
  @UseGuards(GqlAuthGuard)
  async updateCartItemQuantity(
    @CurrentUser() user: User,
    @Args('input') input: UpdateCartItemQuantityInput,
  ): Promise<CartOperationResultDto> {
    try {
      this.logger.debug(
        `更新购物车项目数量: 用户=${user.id}, SKU=${input.skuId}, 数量=${input.quantity}`,
      );
      const cart = await this.shoppingCartService.updateItemQuantity(
        user.id,
        input.skuId,
        input.quantity,
      );
      return {
        success: true,
        message: `成功更新商品数量`,
        cart,
      };
    } catch (error) {
      this.logger.error(`更新商品数量失败: ${error.message}`);
      return {
        success: false,
        message: error.message,
      };
    }
  }

  /**
   * 清空购物车
   *
   * @example
   * mutation {
   *   clearCart {
   *     success
   *     message
   *     cart {
   *       id
   *       items {
   *         id
   *       }
   *     }
   *   }
   * }
   */
  @Mutation(() => CartOperationResultDto)
  @UseGuards(GqlAuthGuard)
  async clearCart(
    @CurrentUser() user: User,
  ): Promise<CartOperationResultDto> {
    try {
      this.logger.debug(`清空购物车: 用户=${user.id}`);
      const cart = await this.shoppingCartService.clearCart(user.id);
      return {
        success: true,
        message: `购物车已清空`,
        cart,
      };
    } catch (error) {
      this.logger.error(`清空购物车失败: ${error.message}`);
      return {
        success: false,
        message: error.message,
      };
    }
  }

  /**
   * ==================== 验证操作 ====================
   */

  /**
   * 验证购物车中所有商品的库存
   *
   * @example
   * query {
   *   validateCartInventory(cartId: "123e4567-e89b-12d3-a456-426614174000") {
   *     valid
   *     unavailableItems
   *   }
   * }
   */
  @Query(() => CartValidationResultDto)
  @UseGuards(GqlAuthGuard)
  async validateCartInventory(
    @Args('cartId') cartId: string,
  ): Promise<CartValidationResultDto> {
    this.logger.debug(`验证购物车库存: 购物车=${cartId}`);
    return this.shoppingCartService.validateCartInventory(cartId);
  }

  /**
   * 验证用户购物车库存
   *
   * @example
   * query {
   *   validateMyCartInventory {
   *     valid
   *     unavailableItems
   *   }
   * }
   */
  @Query(() => CartValidationResultDto)
  @UseGuards(GqlAuthGuard)
  async validateMyCartInventory(
    @CurrentUser() user: User,
  ): Promise<CartValidationResultDto> {
    this.logger.debug(`验证用户购物车库存: 用户=${user.id}`);
    const cart = await this.shoppingCartService.getUserCart(user.id);
    return this.shoppingCartService.validateCartInventory(cart.id);
  }

  /**
   * 刷新购物车库存状态
   *
   * @example
   * mutation {
   *   refreshCartInventoryStatus(cartId: "123e4567-e89b-12d3-a456-426614174000") {
   *     success
   *     message
   *     cart {
   *       id
   *       items {
   *         id
   *         stockStatus
   *       }
   *     }
   *   }
   * }
   */
  @Mutation(() => CartOperationResultDto)
  @UseGuards(GqlAuthGuard)
  async refreshCartInventoryStatus(
    @Args('cartId') cartId: string,
  ): Promise<CartOperationResultDto> {
    try {
      this.logger.debug(`刷新购物车库存状态: 购物车=${cartId}`);
      const cart = await this.shoppingCartService.refreshInventoryStatus(cartId);
      return {
        success: true,
        message: `购物车库存状态已更新`,
        cart,
      };
    } catch (error) {
      this.logger.error(`刷新库存状态失败: ${error.message}`);
      return {
        success: false,
        message: error.message,
      };
    }
  }

  /**
   * 刷新用户购物车库存状态
   *
   * @example
   * mutation {
   *   refreshMyCartInventoryStatus {
   *     success
   *     message
   *     cart {
   *       id
   *       items {
   *         id
   *         stockStatus
   *       }
   *     }
   *   }
   * }
   */
  @Mutation(() => CartOperationResultDto)
  @UseGuards(GqlAuthGuard)
  async refreshMyCartInventoryStatus(
    @CurrentUser() user: User,
  ): Promise<CartOperationResultDto> {
    try {
      this.logger.debug(`刷新用户购物车库存状态: 用户=${user.id}`);
      const cart = await this.shoppingCartService.getUserCart(user.id);
      const updatedCart = await this.shoppingCartService.refreshInventoryStatus(
        cart.id,
      );
      return {
        success: true,
        message: `购物车库存状态已更新`,
        cart: updatedCart,
      };
    } catch (error) {
      this.logger.error(`刷新库存状态失败: ${error.message}`);
      return {
        success: false,
        message: error.message,
      };
    }
  }

  /**
   * ==================== 管理员操作 ====================
   */

  /**
   * 标记已废弃的购物车（24小时未更新）
   *
   * @example
   * mutation {
   *   markAbandonedCarts
   * }
   */
  @Mutation(() => Int)
  @UseGuards(GqlAuthGuard)
  async markAbandonedCarts(): Promise<number> {
    this.logger.debug(`标记已废弃购物车`);
    return this.shoppingCartService.markAbandonedCarts();
  }
}
