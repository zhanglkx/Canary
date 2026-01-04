/**
 * Stripe 支付服务
 *
 * 集成 Stripe 支付网关，实现：
 * - 支付意图创建和确认
 * - 卡片信息处理
 * - webhook 验证和处理
 * - 退款处理
 * - 错误码映射
 *
 * @author Claude
 * @module Ecommerce/Payment/Integrations
 */

import {
  Injectable,
  Logger,
  BadRequestException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { PaymentService } from '../services/payment.service';
import { PaymentRepository } from '../repositories/payment.repository';
import { Payment, PaymentGateway } from '../entities/payment.entity';
import { TransactionType } from '../entities/payment-transaction.entity';

/**
 * Stripe 支付结果
 */
export interface StripePaymentResult {
  success: boolean;
  paymentIntentId?: string;
  clientSecret?: string;
  requiresAction?: boolean;
  status?: string;
  errorCode?: string;
  errorMessage?: string;
}

/**
 * Stripe 卡片信息
 */
export interface StripeCardInfo {
  token: string;  // 来自 Stripe.js 的 token
  last4?: string;
  brand?: string;
  expMonth?: number;
  expYear?: number;
}

/**
 * Stripe webhook 事件处理结果
 */
export interface StripeWebhookResult {
  success: boolean;
  eventId: string;
  message: string;
}

@Injectable()
export class StripePaymentService {
  private readonly logger = new Logger(StripePaymentService.name);
  private stripe: Stripe;
  private webhookSecret: string;

  constructor(
    private configService: ConfigService,
    private paymentService: PaymentService,
    private paymentRepository: PaymentRepository,
  ) {
    const apiKey = this.configService.get<string>('STRIPE_API_KEY');
    if (!apiKey) {
      this.logger.warn('STRIPE_API_KEY not configured');
    }
    this.stripe = new Stripe(apiKey || '', {
      apiVersion: '2024-04-10' as any,
    });

    this.webhookSecret = this.configService.get<string>(
      'STRIPE_WEBHOOK_SECRET',
      '',
    );
  }

  /**
   * 创建支付意图
   *
   * @param paymentId 支付ID
   * @param cardToken Stripe 卡片 token
   * @returns Stripe 支付结果
   */
  async createPaymentIntent(
    paymentId: string,
    cardToken?: string,
  ): Promise<StripePaymentResult> {
    this.logger.debug(`创建 Stripe 支付意图: 支付=${paymentId}`);

    try {
      const payment = await this.paymentRepository.findById(paymentId);
      if (!payment) {
        throw new NotFoundException(`支付 ${paymentId} 不存在`);
      }

      if (payment.gateway !== PaymentGateway.STRIPE) {
        throw new BadRequestException('该支付不是 Stripe 网关');
      }

      // 创建支付意图
      const intentParams: Stripe.PaymentIntentCreateParams = {
        amount: payment.amountCents,
        currency: payment.currency.toLowerCase(),
        payment_method_types: ['card'],
        metadata: {
          paymentId: payment.id,
          orderId: payment.orderId,
          userId: payment.userId,
        },
        statement_descriptor: `Order ${payment.orderId.substring(0, 15)}`,
      };

      // 如果提供了卡片 token，使用 off-session 支付
      if (cardToken) {
        intentParams.payment_method = cardToken;
        intentParams.off_session = true;
        intentParams.confirm = false;  // 稍后由用户确认
      }

      const paymentIntent = await this.stripe.paymentIntents.create(
        intentParams,
      );

      this.logger.log(
        `Stripe 支付意图已创建: ID=${paymentIntent.id}, 状态=${paymentIntent.status}`,
      );

      // 保存 intent ID
      if (!payment.intentId) {
        payment.intentId = paymentIntent.id;
        await this.paymentRepository.save(payment);
      }

      return {
        success: true,
        paymentIntentId: paymentIntent.id,
        clientSecret: paymentIntent.client_secret || undefined,
        status: paymentIntent.status,
      };
    } catch (error) {
      this.logger.error(`创建支付意图失败: ${error.message}`);
      return this.mapStripeError(error);
    }
  }

  /**
   * 确认支付意图
   *
   * @param paymentId 支付ID
   * @param cardToken 卡片 token（可选，如果已有 token 则使用）
   * @returns Stripe 支付结果
   */
  async confirmPaymentIntent(
    paymentId: string,
    cardToken?: string,
  ): Promise<StripePaymentResult> {
    this.logger.debug(
      `确认 Stripe 支付意图: 支付=${paymentId}, 有token=${!!cardToken}`,
    );

    try {
      const payment = await this.paymentRepository.findById(paymentId);
      if (!payment) {
        throw new NotFoundException(`支付 ${paymentId} 不存在`);
      }

      if (!payment.intentId) {
        throw new BadRequestException('支付没有关联的 Stripe 意图 ID');
      }

      // 确认支付意图
      const confirmParams: Stripe.PaymentIntentConfirmParams = {};

      if (cardToken) {
        confirmParams.payment_method = cardToken;
      }

      const paymentIntent = await this.stripe.paymentIntents.confirm(
        payment.intentId,
        confirmParams,
      );

      this.logger.log(
        `Stripe 支付意图已确认: ID=${paymentIntent.id}, 状态=${paymentIntent.status}`,
      );

      // 处理支付结果
      return this.handlePaymentIntentStatus(payment, paymentIntent);
    } catch (error) {
      this.logger.error(`确认支付意图失败: ${error.message}`);
      return this.mapStripeError(error);
    }
  }

  /**
   * 处理支付意图状态
   *
   * @param payment 支付记录
   * @param paymentIntent Stripe 支付意图
   * @returns 支付结果
   */
  private async handlePaymentIntentStatus(
    payment: Payment,
    paymentIntent: Stripe.PaymentIntent,
  ): Promise<StripePaymentResult> {
    // 创建交易记录
    const transaction = await this.paymentService.createTransaction(
      payment.id,
      TransactionType.CHARGE,
      payment.retryCount + 1,
    );

    switch (paymentIntent.status) {
      case 'succeeded': {
        // 支付成功
        await this.paymentService.markPaymentAsSucceeded(
          payment.id,
          transaction.id,
          paymentIntent.id,
          {
            chargeId: (paymentIntent as any)?.charges?.data?.[0]?.id,
            receiptUrl: (paymentIntent as any)?.charges?.data?.[0]?.receipt_url,
            receiptNumber: (paymentIntent as any)?.charges?.data?.[0]?.receipt_number,
            brand: (paymentIntent.payment_method_types as any)?.[0],
            last4: undefined,
          },
        );

        return {
          success: true,
          paymentIntentId: paymentIntent.id,
          status: 'succeeded',
        };
      }

      case 'processing': {
        // 正在处理
        await this.paymentService.markPaymentAsProcessing(
          payment.id,
          transaction.id,
        );

        return {
          success: true,
          paymentIntentId: paymentIntent.id,
          status: 'processing',
        };
      }

      case 'requires_payment_method': {
        // 需要支付方式
        return {
          success: false,
          errorCode: 'requires_payment_method',
          errorMessage: '需要提供支付方式',
        };
      }

      case 'requires_action': {
        // 需要用户操作（3D Secure 等）
        return {
          success: false,
          paymentIntentId: paymentIntent.id,
          clientSecret: paymentIntent.client_secret || undefined,
          requiresAction: true,
          errorCode: 'requires_action',
          errorMessage: '需要用户确认（3D Secure 等）',
        };
      }

      default: {
        // 其他状态
        return {
          success: false,
          paymentIntentId: paymentIntent.id,
          status: paymentIntent.status,
          errorCode: paymentIntent.status,
          errorMessage: `支付状态: ${paymentIntent.status}`,
        };
      }
    }
  }

  /**
   * 处理 webhook 事件
   *
   * @param rawBody 原始 request body
   * @param signature Stripe signature header
   * @returns webhook 处理结果
   */
  async handleWebhookEvent(
    rawBody: Buffer | string,
    signature: string,
  ): Promise<StripeWebhookResult> {
    if (!this.webhookSecret) {
      throw new BadRequestException('未配置 Stripe webhook secret');
    }

    try {
      // 验证 webhook 签名
      const event = this.stripe.webhooks.constructEvent(
        rawBody,
        signature,
        this.webhookSecret,
      );

      this.logger.debug(`收到 Stripe webhook 事件: ${event.type}`);

      // 处理事件
      switch (event.type) {
        case 'payment_intent.succeeded':
          return await this.handlePaymentIntentSucceeded(
            event.data.object as Stripe.PaymentIntent,
          );

        case 'payment_intent.payment_failed':
          return await this.handlePaymentIntentFailed(
            event.data.object as Stripe.PaymentIntent,
          );

        case 'payment_intent.canceled':
          return await this.handlePaymentIntentCanceled(
            event.data.object as Stripe.PaymentIntent,
          );

        case 'charge.refunded':
          return await this.handleChargeRefunded(
            event.data.object as Stripe.Charge,
          );

        case 'charge.dispute.created':
          return await this.handleDisputeCreated(
            event.data.object as Stripe.Dispute,
          );

        default:
          this.logger.warn(`未处理的 webhook 事件: ${event.type}`);
          return {
            success: true,
            eventId: event.id,
            message: `事件 ${event.type} 已接收但未处理`,
          };
      }
    } catch (error) {
      this.logger.error(`处理 webhook 失败: ${error.message}`);
      throw new BadRequestException(`Webhook 验证失败: ${error.message}`);
    }
  }

  /**
   * 处理支付成功事件
   *
   * @param paymentIntent 支付意图
   * @returns 处理结果
   */
  private async handlePaymentIntentSucceeded(
    paymentIntent: Stripe.PaymentIntent,
  ): Promise<StripeWebhookResult> {
    const paymentId = paymentIntent.metadata?.paymentId;
    if (!paymentId) {
      this.logger.warn(
        `支付意图 ${paymentIntent.id} 没有 paymentId 元数据`,
      );
      return {
        success: true,
        eventId: paymentIntent.id,
        message: '支付意图成功但未找到关联的支付记录',
      };
    }

    const payment = await this.paymentRepository.findById(paymentId);
    if (!payment) {
      this.logger.warn(`找不到支付记录: ${paymentId}`);
      return {
        success: true,
        eventId: paymentIntent.id,
        message: '支付意图成功但支付记录不存在',
      };
    }

    // 检查是否已处理
    if (payment.transactionId === paymentIntent.id) {
      this.logger.debug(`支付 ${paymentId} 已处理`);
      return {
        success: true,
        eventId: paymentIntent.id,
        message: '支付已处理',
      };
    }

    try {
      // 创建交易记录
      const transaction = await this.paymentService.createTransaction(
        paymentId,
        TransactionType.CHARGE,
        payment.retryCount + 1,
      );

      // 标记为成功
      await this.paymentService.markPaymentAsSucceeded(
        paymentId,
        transaction.id,
        paymentIntent.id,
        {
          chargeId: (paymentIntent as any)?.charges?.data?.[0]?.id,
          receiptUrl: (paymentIntent as any)?.charges?.data?.[0]?.receipt_url,
          brand: (paymentIntent.payment_method_types as any)?.[0],
          last4: undefined,
        },
      );

      this.logger.log(`支付已标记为成功: ${paymentId}`);

      return {
        success: true,
        eventId: paymentIntent.id,
        message: `支付 ${paymentId} 已成功处理`,
      };
    } catch (error) {
      this.logger.error(
        `处理支付成功事件失败: ${error.message}`,
      );
      throw error;
    }
  }

  /**
   * 处理支付失败事件
   *
   * @param paymentIntent 支付意图
   * @returns 处理结果
   */
  private async handlePaymentIntentFailed(
    paymentIntent: Stripe.PaymentIntent,
  ): Promise<StripeWebhookResult> {
    const paymentId = paymentIntent.metadata?.paymentId;
    if (!paymentId) {
      return {
        success: true,
        eventId: paymentIntent.id,
        message: '支付意图失败但未找到关联的支付记录',
      };
    }

    const payment = await this.paymentRepository.findById(paymentId);
    if (!payment) {
      return {
        success: true,
        eventId: paymentIntent.id,
        message: '支付意图失败但支付记录不存在',
      };
    }

    try {
      // 创建交易记录
      const transaction = await this.paymentService.createTransaction(
        paymentId,
        TransactionType.CHARGE,
        payment.retryCount + 1,
      );

      // 获取错误信息
      const lastError = paymentIntent.last_payment_error;
      const errorCode = lastError?.code || 'unknown_error';
      const errorMessage = lastError?.message || '支付被拒绝';

      // 标记为失败
      await this.paymentService.markPaymentAsFailed(
        paymentId,
        transaction.id,
        errorCode,
        errorMessage,
        {
          declineCode: lastError?.decline_code,
          chargeId: lastError?.charge,
        },
      );

      this.logger.log(`支付已标记为失败: ${paymentId}, 错误=${errorCode}`);

      return {
        success: true,
        eventId: paymentIntent.id,
        message: `支付 ${paymentId} 已标记为失败`,
      };
    } catch (error) {
      this.logger.error(`处理支付失败事件失败: ${error.message}`);
      throw error;
    }
  }

  /**
   * 处理支付取消事件
   *
   * @param paymentIntent 支付意图
   * @returns 处理结果
   */
  private async handlePaymentIntentCanceled(
    paymentIntent: Stripe.PaymentIntent,
  ): Promise<StripeWebhookResult> {
    const paymentId = paymentIntent.metadata?.paymentId;
    if (!paymentId) {
      return {
        success: true,
        eventId: paymentIntent.id,
        message: '支付意图取消但未找到关联的支付记录',
      };
    }

    try {
      await this.paymentService.cancelPayment(
        paymentId,
        'Stripe webhook: 支付意图已取消',
      );

      this.logger.log(`支付已取消: ${paymentId}`);

      return {
        success: true,
        eventId: paymentIntent.id,
        message: `支付 ${paymentId} 已取消`,
      };
    } catch (error) {
      this.logger.error(`处理支付取消事件失败: ${error.message}`);
      throw error;
    }
  }

  /**
   * 处理退款事件
   *
   * @param charge 扣款记录
   * @returns 处理结果
   */
  private async handleChargeRefunded(
    charge: Stripe.Charge,
  ): Promise<StripeWebhookResult> {
    const payment = await this.paymentRepository.findByTransactionId(
      charge.payment_intent as string,
    );

    if (!payment) {
      return {
        success: true,
        eventId: charge.id,
        message: '扣款已退款但未找到关联的支付记录',
      };
    }

    this.logger.log(
      `扣款已退款: ${charge.id}, 退款金额=${charge.amount_refunded}`,
    );

    // 注意: 实际的退款处理由应用通过 REST API mutation 触发
    // 这里只是记录 webhook 事件

    return {
      success: true,
      eventId: charge.id,
      message: `扣款 ${charge.id} 已退款`,
    };
  }

  /**
   * 处理争议创建事件
   *
   * @param dispute 争议记录
   * @returns 处理结果
   */
  private async handleDisputeCreated(
    dispute: Stripe.Dispute,
  ): Promise<StripeWebhookResult> {
    this.logger.warn(
      `收到争议创建事件: ${dispute.id}, 原因=${dispute.reason}`,
    );

    // 注意: 需要在应用中实现争议处理逻辑
    // 这里只是记录警告

    return {
      success: true,
      eventId: dispute.id,
      message: `争议 ${dispute.id} 已创建，需要手动处理`,
    };
  }

  /**
   * 创建退款
   *
   * @param paymentId 支付ID
   * @param refundAmount 退款金额（分）
   * @returns Stripe 退款结果
   */
  async createRefund(
    paymentId: string,
    refundAmount: number,
  ): Promise<StripePaymentResult> {
    this.logger.debug(
      `创建 Stripe 退款: 支付=${paymentId}, 金额=${refundAmount}`,
    );

    try {
      const payment = await this.paymentRepository.findById(paymentId);
      if (!payment) {
        throw new NotFoundException(`支付 ${paymentId} 不存在`);
      }

      if (!payment.transactionId) {
        throw new BadRequestException('支付没有 Stripe 交易 ID');
      }

      // 创建退款
      const refund = await this.stripe.refunds.create({
        payment_intent: payment.transactionId,
        amount: refundAmount,
        metadata: {
          paymentId: payment.id,
          orderId: payment.orderId,
        },
      });

      this.logger.log(`Stripe 退款已创建: ID=${refund.id}, 金额=${refund.amount}`);

      return {
        success: true,
        paymentIntentId: refund.id,
        status: refund.status,
      };
    } catch (error) {
      this.logger.error(`创建退款失败: ${error.message}`);
      return this.mapStripeError(error);
    }
  }

  /**
   * 将 Stripe 错误映射到标准错误码
   *
   * @param error Stripe 错误
   * @returns 标准化的错误结果
   */
  private mapStripeError(error: any): StripePaymentResult {
    const stripeError = error as Stripe.StripeRawError;

    const errorMap: Record<string, string> = {
      card_error: 'card_declined',
      rate_limit_error: 'rate_limited',
      authentication_error: 'auth_failed',
      api_connection_error: 'network_error',
      api_error: 'gateway_error',
    };

    const errorCode =
      errorMap[stripeError.type as string] || stripeError.code || 'gateway_error';
    const errorMessage = stripeError.message || 'Stripe 处理失败';

    return {
      success: false,
      errorCode,
      errorMessage,
    };
  }

  /**
   * 验证 Stripe webhook 签名
   *
   * @param rawBody 原始 request body
   * @param signature 签名
   * @returns 是否有效
   */
  verifyWebhookSignature(rawBody: Buffer | string, signature: string): boolean {
    if (!this.webhookSecret) {
      return false;
    }

    try {
      this.stripe.webhooks.constructEvent(
        rawBody,
        signature,
        this.webhookSecret,
      );
      return true;
    } catch {
      return false;
    }
  }
}
