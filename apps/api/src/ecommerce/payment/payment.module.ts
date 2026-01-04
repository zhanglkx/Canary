/**
 * 支付模块
 *
 * 提供支付处理相关的功能：
 * - 支付初始化和生命周期管理
 * - 交易记录和状态追踪
 * - 退款处理
 * - 支付网关集成
 *
 * @author Claude
 * @module Ecommerce/Payment
 */

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Payment } from './entities/payment.entity';
import { PaymentTransaction } from './entities/payment-transaction.entity';
import { PaymentService } from './services/payment.service';
import { PaymentRepository } from './repositories/payment.repository';
import { PaymentMethodService } from './services/payment-method.service';
import { PaymentController } from './controllers/payment.controller';
import { StripePaymentService } from './integrations/stripe-payment.service';
import { StripeWebhookController } from './integrations/stripe-webhook.controller';
import { PayPalPaymentService } from './integrations/paypal-payment.service';
import { PayPalWebhookController } from './integrations/paypal-webhook.controller';
import { Order } from '../order/entities/order.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Payment, PaymentTransaction, Order]),
  ],
  providers: [
    PaymentService,
    PaymentRepository,
    PaymentMethodService,
    StripePaymentService,
    PayPalPaymentService,
  ],
  controllers: [PaymentController, StripeWebhookController, PayPalWebhookController],
  exports: [
    PaymentService,
    PaymentRepository,
    PaymentMethodService,
    StripePaymentService,
    PayPalPaymentService,
  ],
})
export class PaymentModule {}
