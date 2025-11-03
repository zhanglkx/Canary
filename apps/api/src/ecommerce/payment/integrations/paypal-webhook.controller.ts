/**
 * PayPal webhook 控制器
 *
 * 接收并处理来自 PayPal 的 webhook 事件：
 * - POST /webhook/paypal: 接收 PayPal webhook 事件
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
} from '@nestjs/common';
import { PayPalPaymentService } from './paypal-payment.service';

/**
 * PayPal webhook 控制器
 */
@Controller('webhook/paypal')
export class PayPalWebhookController {
  private readonly logger = new Logger(PayPalWebhookController.name);

  constructor(private paypalPaymentService: PayPalPaymentService) {}

  /**
   * 处理 PayPal webhook 事件
   *
   * PayPal 会通过 POST 请求发送事件到该端点
   * 我们需要验证签名后处理事件
   *
   * @param event PayPal webhook 事件对象
   * @param transmissionId PayPal 传输ID header
   * @param transmissionTime PayPal 传输时间 header
   * @param certUrl PayPal 证书URL header
   * @param authAlgo PayPal 认证算法 header
   * @param authSig PayPal 认证签名 header
   * @returns 处理结果
   */
  @Post()
  async handleWebhook(
    @Body() event: any,
    @Headers('paypal-transmission-id') transmissionId: string,
    @Headers('paypal-transmission-time') transmissionTime: string,
    @Headers('paypal-cert-url') certUrl: string,
    @Headers('paypal-auth-algo') authAlgo: string,
    @Headers('paypal-transmission-sig') authSig: string,
  ) {
    this.logger.debug('收到 PayPal webhook 请求');

    if (!transmissionId || !authSig) {
      throw new BadRequestException('缺少 PayPal webhook 签名头');
    }

    try {
      // 处理 webhook 事件
      const result = await this.paypalPaymentService.handleWebhookEvent(
        event,
        transmissionId,
        transmissionTime,
        certUrl,
        authAlgo,
        authSig,
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
