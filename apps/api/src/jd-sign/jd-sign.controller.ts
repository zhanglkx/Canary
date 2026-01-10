/**
 * 京东签到控制器
 *
 * @description
 * 提供 HTTP 接口用于：
 * - 手动触发签到
 * - 查询签到历史
 * - 查看签到统计
 */

import { Controller, Get, Post, HttpCode, HttpStatus, Logger } from '@nestjs/common';
import { JdSignService } from './jd-sign.service';
import { JdSignScheduler } from './jd-sign.scheduler';

@Controller('jd-sign')
export class JdSignController {
  private readonly logger = new Logger(JdSignController.name);

  constructor(
    private readonly jdSignService: JdSignService,
    private readonly jdSignScheduler: JdSignScheduler,
  ) {}

  /**
   * 手动触发签到
   * POST /api/jd-sign/trigger
   */
  @Post('trigger')
  @HttpCode(HttpStatus.OK)
  async triggerSign() {
    this.logger.log('收到手动签到请求');
    try {
      await this.jdSignScheduler.triggerManualSign();
      return {
        success: true,
        message: '签到请求已提交',
      };
    } catch (error) {
      this.logger.error('手动签到失败', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : '签到失败',
      };
    }
  }

  /**
   * 获取签到历史
   * GET /api/jd-sign/history?limit=10
   */
  @Get('history')
  async getHistory() {
    const history = await this.jdSignService.getRecentHistory(10);
    return {
      success: true,
      data: history,
    };
  }

  /**
   * 获取签到统计
   * GET /api/jd-sign/statistics
   */
  @Get('statistics')
  async getStatistics() {
    const statistics = await this.jdSignService.getSignStatistics();
    return {
      success: true,
      data: statistics,
    };
  }
}
