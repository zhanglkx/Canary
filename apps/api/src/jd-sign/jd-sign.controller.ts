/**
 * 京东签到控制器
 *
 * @description
 * 提供 HTTP 接口用于：
 * - 手动触发签到
 * - 查询签到历史
 * - 查看签到统计
 */

import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { JdSignService } from './jd-sign.service';
import { JdSignScheduler } from './jd-sign.scheduler';
import { JdCookieService } from './jd-cookie.service';
import { UpsertCookieDto } from './dto/upsert-cookie.dto';

@Controller('jd-sign')
export class JdSignController {
  private readonly logger = new Logger(JdSignController.name);

  constructor(
    private readonly jdSignService: JdSignService,
    private readonly jdSignScheduler: JdSignScheduler,
    private readonly jdCookieService: JdCookieService,
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

  /**
   * 获取所有 Cookie 配置
   * GET /api/jd-sign/cookies
   */
  @Get('cookies')
  async getCookies() {
    const cookies = await this.jdCookieService.getAllCookies();
    // 隐藏敏感信息，只返回部分 Cookie
    const safeCookies = cookies.map((cookie) => ({
      id: cookie.id,
      account: cookie.account,
      status: cookie.status,
      remark: cookie.remark,
      lastVerifiedAt: cookie.lastVerifiedAt,
      createdAt: cookie.createdAt,
      updatedAt: cookie.updatedAt,
      cookiePreview: cookie.cookie.substring(0, 50) + '...',
    }));
    return {
      success: true,
      data: safeCookies,
    };
  }

  /**
   * 创建或更新 Cookie 配置
   * PUT /api/jd-sign/cookies
   */
  @Put('cookies')
  @HttpCode(HttpStatus.OK)
  async upsertCookie(@Body() body: UpsertCookieDto) {
    try {
      const cookie = await this.jdCookieService.upsertCookie(
        body.account,
        body.cookie,
        body.remark,
      );
      return {
        success: true,
        message: 'Cookie 配置已保存',
        data: {
          id: cookie.id,
          account: cookie.account,
          status: cookie.status,
        },
      };
    } catch (error) {
      this.logger.error('保存 Cookie 配置失败', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : '保存失败',
      };
    }
  }

  /**
   * 删除 Cookie 配置
   * DELETE /api/jd-sign/cookies/:account
   */
  @Delete('cookies/:account')
  @HttpCode(HttpStatus.OK)
  async deleteCookie(@Param('account') account: string) {
    try {
      await this.jdCookieService.deleteCookie(account);
      return {
        success: true,
        message: 'Cookie 配置已删除',
      };
    } catch (error) {
      this.logger.error('删除 Cookie 配置失败', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : '删除失败',
      };
    }
  }
}
