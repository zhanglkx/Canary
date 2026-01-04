/**
 * SearchController - 搜索控制器
 */

import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../user/user.entity';

@Controller('search')
@UseGuards(JwtAuthGuard)
export class SearchController {
  @Get()
  async search(@Query('q') query: string, @CurrentUser() user: User) {
    // 简单的搜索实现
    return {
      query,
      results: [],
      userId: user.id,
    };
  }
}
