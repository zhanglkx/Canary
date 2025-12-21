/**
 * PaymentController - 支付控制器
 */

import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { PaymentService } from '../services/payment.service';
import { PaymentMethodType, PaymentGateway } from '../entities/payment.entity';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { User } from '../../../user/user.entity';

@Controller('payments')
@UseGuards(JwtAuthGuard)
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post('stripe/create-intent')
  async createStripeIntent(@Body() createIntentDto: any, @CurrentUser() user: User) {
    return this.paymentService.initiatePayment({
      orderId: createIntentDto.orderId,
      amount: createIntentDto.amount,
      currency: createIntentDto.currency || 'USD',
      methodType: PaymentMethodType.CREDIT_CARD,
      gateway: PaymentGateway.STRIPE,
    });
  }

  @Post('stripe/confirm')
  async confirmStripe(@Body() confirmDto: any) {
    return this.paymentService.markPaymentAsSucceeded(
      confirmDto.paymentId,
      confirmDto.transactionId,
      confirmDto.paymentIntentId,
    );
  }

  @Post('paypal/create-order')
  async createPayPalOrder(@Body() createOrderDto: any) {
    return this.paymentService.initiatePayment({
      orderId: createOrderDto.orderId,
      amount: createOrderDto.amount,
      currency: createOrderDto.currency || 'USD',
      methodType: PaymentMethodType.DIGITAL_WALLET,
      gateway: PaymentGateway.PAYPAL,
    });
  }

  @Post('paypal/capture')
  async capturePayPal(@Body() captureDto: any) {
    return this.paymentService.markPaymentAsSucceeded(
      captureDto.paymentId,
      captureDto.transactionId,
      captureDto.paypalOrderId,
    );
  }
}
