/**
 * PaymentController - 支付控制器
 */

import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { PaymentService } from '../services/payment.service';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { User } from '../../../user/user.entity';

@Controller('payments')
@UseGuards(JwtAuthGuard)
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post('stripe/create-intent')
  async createStripeIntent(@Body() createIntentDto: any, @CurrentUser() user: User) {
    return this.paymentService.createStripePaymentIntent(
      createIntentDto.orderId,
      user.id,
    );
  }

  @Post('stripe/confirm')
  async confirmStripe(@Body() confirmDto: any, @CurrentUser() user: User) {
    return this.paymentService.confirmStripePayment(
      confirmDto.paymentIntentId,
      user.id,
    );
  }

  @Post('paypal/create-order')
  async createPayPalOrder(@Body() createOrderDto: any, @CurrentUser() user: User) {
    return this.paymentService.createPayPalOrder(createOrderDto.orderId, user.id);
  }

  @Post('paypal/capture')
  async capturePayPal(@Body() captureDto: any, @CurrentUser() user: User) {
    return this.paymentService.capturePayPalPayment(captureDto.paypalOrderId, user.id);
  }
}
