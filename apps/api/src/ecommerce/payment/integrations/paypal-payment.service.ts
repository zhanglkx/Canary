/**
 * PayPal 支付服务
 *
 * 集成 PayPal 支付网关，实现：
 * - 订单创建和批准
 * - 支付捕获处理
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
import { PaymentService } from '../services/payment.service';
import { PaymentRepository } from '../repositories/payment.repository';
import { Payment, PaymentGateway } from '../entities/payment.entity';
import { TransactionType } from '../entities/payment-transaction.entity';

/**
 * PayPal 支付结果
 */
export interface PayPalPaymentResult {
  success: boolean;
  orderId?: string;
  approvalUrl?: string;
  transactionId?: string;
  status?: string;
  errorCode?: string;
  errorMessage?: string;
}

/**
 * PayPal webhook 事件处理结果
 */
export interface PayPalWebhookResult {
  success: boolean;
  eventId: string;
  message: string;
}

/**
 * PayPal 订单信息
 */
interface PayPalOrder {
  id: string;
  status: string;
  payer: {
    email_address: string;
    name: {
      given_name: string;
      surname: string;
    };
  };
  purchase_units: Array<{
    reference_id: string;
    amount: {
      value: string;
      currency_code: string;
    };
  }>;
}

/**
 * PayPal 支付服务
 *
 * 管理 PayPal 支付网关集成
 * 处理订单生命周期和 webhook 事件
 */
@Injectable()
export class PayPalPaymentService {
  private readonly logger = new Logger(PayPalPaymentService.name);
  private clientId: string;
  private clientSecret: string;
  private environment: string;

  constructor(
    private configService: ConfigService,
    private paymentService: PaymentService,
    private paymentRepository: PaymentRepository,
  ) {
    this.clientId = this.configService.get<string>('PAYPAL_CLIENT_ID', '');
    this.clientSecret = this.configService.get<string>('PAYPAL_CLIENT_SECRET', '');
    this.environment = this.configService.get<string>('PAYPAL_ENVIRONMENT', 'sandbox');

    if (!this.clientId || !this.clientSecret) {
      this.logger.warn('PayPal credentials not configured');
    }
  }

  /**
   * 创建 PayPal 订单
   *
   * @param paymentId 支付ID
   * @returns PayPal 支付结果
   */
  async createOrder(paymentId: string): Promise<PayPalPaymentResult> {
    this.logger.debug(`创建 PayPal 订单: 支付=${paymentId}`);

    try {
      const payment = await this.paymentRepository.findById(paymentId);
      if (!payment) {
        throw new NotFoundException(`支付 ${paymentId} 不存在`);
      }

      if (payment.gateway !== PaymentGateway.PAYPAL) {
        throw new BadRequestException('该支付不是 PayPal 网关');
      }

      // TODO: 使用 PayPal SDK 创建订单
      // const client = new paypal.core.PayPalHttpClient(environment);
      // const request = new paypal.orders.OrdersCreateRequest();
      // request.prefer("return=representation");
      // request.body = {
      //   intent: "CAPTURE",
      //   purchase_units: [{
      //     reference_id: payment.id,
      //     amount: {
      //       value: (payment.amountCents / 100).toString(),
      //       currency_code: payment.currency
      //     }
      //   }],
      //   application_context: {
      //     return_url: `${this.configService.get('FRONTEND_URL')}/payment/callback`,
      //     cancel_url: `${this.configService.get('FRONTEND_URL')}/payment/cancel`,
      //     brand_name: "My Store",
      //     landing_page: "LOGIN",
      //     user_action: "PAY_NOW"
      //   }
      // };
      // const response = await client.execute(request);

      // 模拟响应
      const mockOrderId = `paypal_order_${paymentId.substring(0, 8)}`;
      const mockApprovalUrl = `https://www.sandbox.paypal.com/checkoutnow?token=${mockOrderId}`;

      // 保存 PayPal 订单 ID
      payment.intentId = mockOrderId;
      await this.paymentRepository.save(payment);

      this.logger.log(
        `PayPal 订单已创建: 订单ID=${mockOrderId}, 支付=${paymentId}`,
      );

      return {
        success: true,
        orderId: mockOrderId,
        approvalUrl: mockApprovalUrl,
        status: 'CREATED',
      };
    } catch (error) {
      this.logger.error(`创建 PayPal 订单失败: ${error.message}`);
      return this.mapPayPalError(error);
    }
  }

  /**
   * 捕获 PayPal 订单支付
   *
   * @param paymentId 支付ID
   * @param orderId PayPal 订单ID
   * @returns PayPal 支付结果
   */
  async captureOrder(paymentId: string, orderId: string): Promise<PayPalPaymentResult> {
    this.logger.debug(
      `捕获 PayPal 订单: 支付=${paymentId}, 订单=${orderId}`,
    );

    try {
      const payment = await this.paymentRepository.findById(paymentId);
      if (!payment) {
        throw new NotFoundException(`支付 ${paymentId} 不存在`);
      }

      // TODO: 使用 PayPal SDK 捕获订单
      // const client = new paypal.core.PayPalHttpClient(environment);
      // const request = new paypal.orders.OrdersCaptureRequest(orderId);
      // request.requestBody({});
      // const response = await client.execute(request);

      // 模拟响应
      const mockTransactionId = `paypal_capture_${orderId.substring(0, 8)}`;

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
        mockTransactionId,
        {
          transactionId: mockTransactionId,
          orderId: orderId,
          gateway: 'paypal',
        },
      );

      this.logger.log(
        `PayPal 订单已捕获: 订单ID=${orderId}, 支付=${paymentId}`,
      );

      return {
        success: true,
        orderId: orderId,
        transactionId: mockTransactionId,
        status: 'COMPLETED',
      };
    } catch (error) {
      this.logger.error(`捕获 PayPal 订单失败: ${error.message}`);
      return this.mapPayPalError(error);
    }
  }

  /**
   * 处理 PayPal webhook 事件
   *
   * @param event PayPal webhook 事件
   * @param transmissionId 传输ID
   * @param transmissionTime 传输时间
   * @param certUrl 证书URL
   * @param authAlgo 认证算法
   * @param authSig 认证签名
   * @returns webhook 处理结果
   */
  async handleWebhookEvent(
    event: any,
    transmissionId: string,
    transmissionTime: string,
    certUrl: string,
    authAlgo: string,
    authSig: string,
  ): Promise<PayPalWebhookResult> {
    this.logger.debug(`收到 PayPal webhook 事件: ${event.event_type}`);

    try {
      // TODO: 验证 webhook 签名
      // const valid = await this.verifyWebhookSignature(
      //   transmissionId,
      //   transmissionTime,
      //   event,
      //   certUrl,
      //   authAlgo,
      //   authSig
      // );
      // if (!valid) {
      //   throw new BadRequestException('Invalid webhook signature');
      // }

      // 处理事件
      switch (event.event_type) {
        case 'CHECKOUT.ORDER.APPROVED':
          return await this.handleOrderApproved(event.resource);

        case 'CHECKOUT.ORDER.COMPLETED':
          return await this.handleOrderCompleted(event.resource);

        case 'PAYMENT.CAPTURE.COMPLETED':
          return await this.handleCaptureCompleted(event.resource);

        case 'PAYMENT.CAPTURE.DENIED':
          return await this.handleCaptureDenied(event.resource);

        case 'PAYMENT.CAPTURE.REFUNDED':
          return await this.handleCaptureRefunded(event.resource);

        case 'PAYMENT.CAPTURE.PENDING':
          return await this.handleCapturePending(event.resource);

        default:
          this.logger.warn(`未处理的 PayPal webhook 事件: ${event.event_type}`);
          return {
            success: true,
            eventId: event.id,
            message: `事件 ${event.event_type} 已接收但未处理`,
          };
      }
    } catch (error) {
      this.logger.error(`处理 PayPal webhook 失败: ${error.message}`);
      throw new BadRequestException(`Webhook 验证失败: ${error.message}`);
    }
  }

  /**
   * 处理订单已批准事件
   *
   * @param order PayPal 订单
   * @returns 处理结果
   */
  private async handleOrderApproved(order: PayPalOrder): Promise<PayPalWebhookResult> {
    const paymentId = order.purchase_units?.[0]?.reference_id;
    if (!paymentId) {
      this.logger.warn(`订单 ${order.id} 没有 reference_id`);
      return {
        success: true,
        eventId: order.id,
        message: '订单已批准但未找到关联的支付记录',
      };
    }

    this.logger.log(`订单已批准: ${order.id}, 支付=${paymentId}`);

    return {
      success: true,
      eventId: order.id,
      message: `订单 ${order.id} 已批准`,
    };
  }

  /**
   * 处理订单完成事件
   *
   * @param order PayPal 订单
   * @returns 处理结果
   */
  private async handleOrderCompleted(order: PayPalOrder): Promise<PayPalWebhookResult> {
    const paymentId = order.purchase_units?.[0]?.reference_id;
    if (!paymentId) {
      this.logger.warn(`订单 ${order.id} 没有 reference_id`);
      return {
        success: true,
        eventId: order.id,
        message: '订单完成但未找到关联的支付记录',
      };
    }

    this.logger.log(`订单完成: ${order.id}, 支付=${paymentId}`);

    return {
      success: true,
      eventId: order.id,
      message: `订单 ${order.id} 已完成`,
    };
  }

  /**
   * 处理支付捕获完成事件
   *
   * @param capture PayPal 捕获记录
   * @returns 处理结果
   */
  private async handleCaptureCompleted(capture: any): Promise<PayPalWebhookResult> {
    this.logger.log(`支付捕获完成: ${capture.id}`);

    return {
      success: true,
      eventId: capture.id,
      message: `支付捕获 ${capture.id} 已完成`,
    };
  }

  /**
   * 处理支付捕获被拒事件
   *
   * @param capture PayPal 捕获记录
   * @returns 处理结果
   */
  private async handleCaptureDenied(capture: any): Promise<PayPalWebhookResult> {
    this.logger.warn(`支付捕获被拒: ${capture.id}, 原因=${capture.status_details?.reason}`);

    return {
      success: true,
      eventId: capture.id,
      message: `支付捕获 ${capture.id} 被拒`,
    };
  }

  /**
   * 处理支付退款事件
   *
   * @param refund PayPal 退款记录
   * @returns 处理结果
   */
  private async handleCaptureRefunded(refund: any): Promise<PayPalWebhookResult> {
    this.logger.log(`支付已退款: ${refund.id}, 金额=${refund.amount?.value}`);

    return {
      success: true,
      eventId: refund.id,
      message: `支付 ${refund.id} 已退款`,
    };
  }

  /**
   * 处理支付捕获待处理事件
   *
   * @param capture PayPal 捕获记录
   * @returns 处理结果
   */
  private async handleCapturePending(capture: any): Promise<PayPalWebhookResult> {
    this.logger.log(`支付捕获待处理: ${capture.id}, 原因=${capture.status_details?.reason}`);

    return {
      success: true,
      eventId: capture.id,
      message: `支付捕获 ${capture.id} 待处理`,
    };
  }

  /**
   * 创建退款
   *
   * @param paymentId 支付ID
   * @param refundAmount 退款金额（分）
   * @returns PayPal 退款结果
   */
  async createRefund(
    paymentId: string,
    refundAmount: number,
  ): Promise<PayPalPaymentResult> {
    this.logger.debug(
      `创建 PayPal 退款: 支付=${paymentId}, 金额=${refundAmount}`,
    );

    try {
      const payment = await this.paymentRepository.findById(paymentId);
      if (!payment) {
        throw new NotFoundException(`支付 ${paymentId} 不存在`);
      }

      if (!payment.transactionId) {
        throw new BadRequestException('支付没有 PayPal 交易 ID');
      }

      // TODO: 使用 PayPal SDK 创建退款
      // const client = new paypal.core.PayPalHttpClient(environment);
      // const request = new paypal.payments.CapturesRefundRequest(captureId);
      // request.body = {
      //   amount: {
      //     value: (refundAmount / 100).toString(),
      //     currency_code: payment.currency
      //   }
      // };
      // const response = await client.execute(request);

      // 模拟响应
      const mockRefundId = `paypal_refund_${payment.id.substring(0, 8)}`;

      this.logger.log(`PayPal 退款已创建: ID=${mockRefundId}, 金额=${refundAmount}`);

      return {
        success: true,
        transactionId: mockRefundId,
        status: 'COMPLETED',
      };
    } catch (error) {
      this.logger.error(`创建 PayPal 退款失败: ${error.message}`);
      return this.mapPayPalError(error);
    }
  }

  /**
   * 将 PayPal 错误映射到标准错误码
   *
   * @param error PayPal 错误
   * @returns 标准化的错误结果
   */
  private mapPayPalError(error: any): PayPalPaymentResult {
    const errorName = error.name || 'unknown_error';
    const errorMessage = error.message || 'PayPal 处理失败';

    const errorMap: Record<string, string> = {
      'INSTRUMENT_DECLINED': 'card_declined',
      'PAYER_CANNOT_PAY': 'payer_cannot_pay',
      'REFERENCE_ID_NOT_FOUND': 'order_not_found',
      'INVALID_ACCOUNT_STATUS': 'account_invalid',
      'PERMISSION_DENIED': 'permission_denied',
    };

    const errorCode = errorMap[errorName] || 'gateway_error';

    return {
      success: false,
      errorCode,
      errorMessage,
    };
  }

  /**
   * 验证 PayPal webhook 签名
   *
   * @param transmissionId 传输ID
   * @param transmissionTime 传输时间
   * @param event 事件对象
   * @param certUrl 证书URL
   * @param authAlgo 认证算法
   * @param authSig 认证签名
   * @returns 是否有效
   */
  async verifyWebhookSignature(
    transmissionId: string,
    transmissionTime: string,
    event: any,
    certUrl: string,
    authAlgo: string,
    authSig: string,
  ): Promise<boolean> {
    try {
      // TODO: 使用 PayPal SDK 验证签名
      // const webhookId = this.configService.get('PAYPAL_WEBHOOK_ID');
      // const client = new paypal.core.PayPalHttpClient(environment);
      // const request = new paypal.notifications.VerifyWebhookSignatureRequest();
      // request.body = {
      //   transmission_id: transmissionId,
      //   transmission_time: transmissionTime,
      //   cert_url: certUrl,
      //   auth_algo: authAlgo,
      //   auth_sig: authSig,
      //   webhook_id: webhookId,
      //   webhook_event: event
      // };
      // const response = await client.execute(request);
      // return response.result.verification_status === 'SUCCESS';

      // 模拟验证
      return true;
    } catch (error) {
      this.logger.error(`验证 PayPal webhook 签名失败: ${error.message}`);
      return false;
    }
  }
}
