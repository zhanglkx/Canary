/**
 * Stripe webhook 控制器
 *
 * 接收并处理来自 Stripe 的 webhook 事件：
 * - POST /webhook/stripe: 接收 Stripe webhook 事件
 *
 * @author Claude
 * @module Ecommerce/Payment/Integrations
 */

import {
  Controller,
  Post,
  Body,
  Headers,
  Logger,
  BadRequestException,
  RawBodyRequest,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import { StripePaymentService } from './stripe-payment.service';

/**
 * Stripe webhook 控制器
 */
@Controller('webhook/stripe')
export class StripeWebhookController {
  private readonly logger = new Logger(StripeWebhookController.name);

  constructor(private stripePaymentService: StripePaymentService) {}

  /**
   * 处理 Stripe webhook 事件
   *
   * Stripe 会通过 POST 请求发送事件到该端点
   * 我们需要验证签名后处理事件
   *
   * @param req 原始请求对象
   * @param signature Stripe 签名 header
   * @returns 处理结果
   */
  @Post()
  async handleWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') signature: string,
  ) {
    this.logger.debug('收到 Stripe webhook 请求');

    if (!signature) {
      throw new BadRequestException('缺少 Stripe 签名头');
    }

    try {
      // 获取原始 body
      const rawBody = req.rawBody || Buffer.from('');

      // 处理 webhook 事件
      const result = await this.stripePaymentService.handleWebhookEvent(
        rawBody,
        signature,
      );

      this.logger.log(`Webhook 已处理: ${result.eventId}, 消息=${result.message}`);

      return {
        success: result.success,
        eventId: result.eventId,
        message: result.message,
      };
    } catch (error) {
      this.logger.error(`处理 webhook 失败: ${error.message}`);
      throw error;
    }
  }
}
