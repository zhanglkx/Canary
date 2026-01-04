/**
 * StatsController - 统计控制器
 */

import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../user/user.entity';

@Controller('stats')
@UseGuards(JwtAuthGuard)
export class StatsController {
  @Get('overview')
  async getOverview(@CurrentUser() user: User) {
    // 返回基本统计信息
    return {
      userId: user.id,
      message: 'Stats overview',
    };
  }
}
