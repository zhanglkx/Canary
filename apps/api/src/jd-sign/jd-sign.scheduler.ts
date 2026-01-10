/**
 * 京东签到定时任务调度器
 *
 * @description
 * 使用 @nestjs/schedule 实现定时任务，每天10点执行京东签到
 */

import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { JdSignService } from './jd-sign.service';

@Injectable()
export class JdSignScheduler {
  private readonly logger = new Logger(JdSignScheduler.name);

  constructor(private readonly jdSignService: JdSignService) {}

  /**
   * 每天上午10点执行签到
   * Cron 表达式: 0 10 * * *
   * - 0: 分钟 (0分)
   * - 10: 小时 (10点)
   * - *: 日期 (每天)
   * - *: 月份 (每月)
   * - *: 星期 (每周)
   */
  @Cron('0 10 * * *', {
    name: 'jd-daily-sign',
    timeZone: 'Asia/Shanghai', // 使用中国时区
  })
  async handleDailySign() {
    this.logger.log('⏰ 定时任务触发: 开始执行京东签到');

    try {
      const result = await this.jdSignService.signIn();

      if (result.status === 'success') {
        this.logger.log('✅ 定时任务执行成功: 京东签到完成');
      } else {
        this.logger.warn(`⚠️ 定时任务执行失败: ${result.errorMessage || '未知错误'}`);
      }
    } catch (error) {
      this.logger.error(
        '❌ 定时任务执行异常',
        error instanceof Error ? error.stack : String(error),
      );
    }
  }

  /**
   * 手动触发签到（用于测试）
   * 可以通过 HTTP 接口调用此方法
   */
  async triggerManualSign(): Promise<void> {
    this.logger.log('🔧 手动触发京东签到');

    try {
      const result = await this.jdSignService.signIn();

      if (result.status === 'success') {
        this.logger.log('✅ 手动签到成功');
      } else {
        this.logger.warn(`⚠️ 手动签到失败: ${result.errorMessage || '未知错误'}`);
      }
    } catch (error) {
      this.logger.error('❌ 手动签到异常', error instanceof Error ? error.stack : String(error));
      throw error;
    }
  }
}
