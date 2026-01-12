/**
 * 京东 Cookie 配置服务
 *
 * @description
 * 负责管理京东 Cookie 配置的 CRUD 操作
 */

import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JdCookieConfig, CookieStatus } from './entities/jd-cookie-config.entity';

@Injectable()
export class JdCookieService {
  private readonly logger = new Logger(JdCookieService.name);

  constructor(
    @InjectRepository(JdCookieConfig)
    private readonly cookieRepository: Repository<JdCookieConfig>,
  ) {}

  /**
   * 获取激活的 Cookie 配置
   * 如果有多个，返回第一个激活的
   */
  async getActiveCookie(): Promise<JdCookieConfig | null> {
    const cookie = await this.cookieRepository.findOne({
      where: { status: CookieStatus.ACTIVE },
      order: { updatedAt: 'DESC' },
    });

    if (!cookie) {
      this.logger.warn('未找到激活的 Cookie 配置');
      return null;
    }

    return cookie;
  }

  /**
   * 根据账号获取 Cookie 配置
   */
  async getCookieByAccount(account: string): Promise<JdCookieConfig | null> {
    return this.cookieRepository.findOne({
      where: { account },
    });
  }

  /**
   * 获取所有 Cookie 配置
   */
  async getAllCookies(): Promise<JdCookieConfig[]> {
    return this.cookieRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * 创建或更新 Cookie 配置
   */
  async upsertCookie(
    account: string,
    cookie: string,
    remark?: string,
  ): Promise<JdCookieConfig> {
    const existing = await this.getCookieByAccount(account);

    if (existing) {
      // 更新现有配置
      existing.cookie = cookie;
      existing.status = CookieStatus.ACTIVE;
      if (remark) {
        existing.remark = remark;
      }
      const updated = await this.cookieRepository.save(existing);
      this.logger.log(`✅ Cookie 配置已更新: ${account}`);
      return updated;
    } else {
      // 创建新配置
      const newCookie = this.cookieRepository.create({
        account,
        cookie,
        status: CookieStatus.ACTIVE,
        remark,
      });
      const created = await this.cookieRepository.save(newCookie);
      this.logger.log(`✅ Cookie 配置已创建: ${account}`);
      return created;
    }
  }

  /**
   * 更新 Cookie 状态
   */
  async updateCookieStatus(
    account: string,
    status: CookieStatus,
  ): Promise<JdCookieConfig> {
    const cookie = await this.getCookieByAccount(account);
    if (!cookie) {
      throw new NotFoundException(`未找到账号 ${account} 的 Cookie 配置`);
    }

    cookie.status = status;
    return this.cookieRepository.save(cookie);
  }

  /**
   * 更新最后验证时间
   */
  async updateLastVerifiedAt(account: string): Promise<void> {
    const cookie = await this.getCookieByAccount(account);
    if (cookie) {
      cookie.lastVerifiedAt = new Date();
      await this.cookieRepository.save(cookie);
    }
  }

  /**
   * 删除 Cookie 配置
   */
  async deleteCookie(account: string): Promise<void> {
    const cookie = await this.getCookieByAccount(account);
    if (!cookie) {
      throw new NotFoundException(`未找到账号 ${account} 的 Cookie 配置`);
    }

    await this.cookieRepository.remove(cookie);
    this.logger.log(`✅ Cookie 配置已删除: ${account}`);
  }
}
