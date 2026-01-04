/**
 * BatchController - 批量操作控制器
 */

import { Controller, Post, Delete, Body, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../user/user.entity';

export class BatchCompleteDto {
  todoIds: string[];
}

export class BatchDeleteDto {
  todoIds: string[];
}

@Controller('batch')
@UseGuards(JwtAuthGuard)
export class BatchController {
  @Post('todos/complete')
  async completeTodos(@Body() batchCompleteDto: BatchCompleteDto, @CurrentUser() user: User) {
    return {
      success: true,
      count: batchCompleteDto.todoIds.length,
      userId: user.id,
    };
  }

  @Delete('todos')
  async deleteTodos(@Body() batchDeleteDto: BatchDeleteDto, @CurrentUser() user: User) {
    return {
      success: true,
      count: batchDeleteDto.todoIds.length,
      userId: user.id,
    };
  }
}
