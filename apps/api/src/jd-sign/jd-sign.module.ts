/**
 * 京东签到模块
 *
 * @description
 * 提供京东自动签到功能，包括：
 * - 定时任务：每天10点自动签到
 * - HTTP 接口：手动触发签到、查询历史、查看统计
 * - 签到历史记录：保存每次签到的结果
 */

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { JdSignHistory } from './entities/jd-sign-history.entity';
import { JdSignService } from './jd-sign.service';
import { JdSignScheduler } from './jd-sign.scheduler';
import { JdSignController } from './jd-sign.controller';

@Module({
  imports: [
    // 注册定时任务模块
    ScheduleModule.forRoot(),
    // 注册实体
    TypeOrmModule.forFeature([JdSignHistory]),
  ],
  controllers: [JdSignController],
  providers: [JdSignService, JdSignScheduler],
  exports: [JdSignService],
})
export class JdSignModule {}
