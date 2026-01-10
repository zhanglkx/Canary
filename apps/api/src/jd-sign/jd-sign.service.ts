/**
 * 京东签到服务
 *
 * @description
 * 负责处理京东签到相关的业务逻辑，包括：
 * - 发送签到请求
 * - 处理响应数据
 * - 记录签到历史
 * - 错误处理和重试机制
 */

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { JdSignHistory, JdSignStatus } from './entities/jd-sign-history.entity';
import { JdSignConfigDto } from './dto/jd-sign-config.dto';

/**
 * 京东签到 API 响应接口
 */
interface JdSignResponse {
  code?: string;
  msg?: string;
  data?: unknown;
  [key: string]: unknown;
}

@Injectable()
export class JdSignService {
  private readonly logger = new Logger(JdSignService.name);
  private readonly axiosInstance: AxiosInstance;

  constructor(
    @InjectRepository(JdSignHistory)
    private readonly signHistoryRepository: Repository<JdSignHistory>,
    private readonly configService: ConfigService,
  ) {
    // 创建 axios 实例，配置默认选项
    this.axiosInstance = axios.create({
      timeout: 30000, // 30秒超时
      validateStatus: (status) => status < 500, // 只对 5xx 状态码抛出错误
    });
  }

  /**
   * 从环境变量或配置中获取签到配置
   */
  private getSignConfig(): JdSignConfigDto {
    // 直接获取完整 Cookie
    const fullCookie = this.configService.get<string>('JD_FULL_COOKIE');

    if (!fullCookie) {
      throw new Error('请配置 JD_FULL_COOKIE 环境变量');
    }

    // 从 Cookie 中提取关键参数用于验证
    const cookieMap = this.parseCookie(fullCookie);
    const ptPin = cookieMap.pt_pin;
    const ptKey = cookieMap.pt_key;

    if (!ptPin || !ptKey) {
      throw new Error('Cookie 中缺少 pt_pin 或 pt_key 参数');
    }

    return {
      ptPin,
      ptKey,
      cookie: fullCookie,
    };
  }

  /**
   * 构建请求头
   */
  private buildHeaders(config: JdSignConfigDto): Record<string, string> {
    return {
      Connection: 'keep-alive',
      'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
      'Cache-Control': 'no-cache',
      'User-Agent': 'okhttp/3.12.1;jdmall;android;version/10.3.4;build/92451;',
      accept: '*/*',
      connection: 'Keep-Alive',
      'Accept-Encoding': 'gzip,deflate',
      Cookie: config.cookie,
    };
  }

  /**
   * 解析 Cookie 字符串为对象
   */
  private parseCookie(cookieString: string): Record<string, string> {
    const cookieMap: Record<string, string> = {};
    const cookies = cookieString.split(';');

    cookies.forEach((cookie) => {
      const [key, value] = cookie.trim().split('=');
      if (key && value) {
        cookieMap[key] = value;
      }
    });

    return cookieMap;
  }

  /**
   * 构建请求 URL
   */
  private buildRequestUrl(): string {
    const baseUrl = this.configService.get<string>(
      'JD_SIGN_API_URL',
      'https://api.m.jd.com/client.action',
    );

    const body = encodeURIComponent(
      JSON.stringify({
        fp: '-1',
        shshshfp: '-1',
        shshshfpa: '-1',
        referUrl: '-1',
        userAgent: '-1',
        jda: '-1',
        rnVersion: '3.9',
      }),
    );

    const timestamp = Date.now();
    const jsonpCallback = `jsonp_${timestamp}_${Math.floor(Math.random() * 100000)}`;

    const params = new URLSearchParams({
      functionId: 'signBeanAct',
      body,
      appid: 'ld',
      client: 'apple',
      clientVersion: '10.0.4',
      networkType: 'wifi',
      osVersion: '14.8.1',
      uuid: '3acd1f6361f86fc0a1bc23971b2e7bbe6197afb6',
      openudid: '3acd1f6361f86fc0a1bc23971b2e7bbe6197afb6',
      jsonp: jsonpCallback,
    });

    return `${baseUrl}?${params.toString()}`;
  }

  /**
   * 执行签到
   */
  async signIn(): Promise<JdSignHistory> {
    const startTime = Date.now();
    this.logger.log('开始执行京东签到...');

    // 创建签到历史记录
    const signHistory = this.signHistoryRepository.create({
      status: JdSignStatus.PENDING,
      signTime: new Date(),
    });
    await this.signHistoryRepository.save(signHistory);

    try {
      // 获取配置
      const config = this.getSignConfig();
      this.logger.debug(`使用配置: pt_pin=${config.ptPin}`);

      // 构建请求
      const url = this.buildRequestUrl();
      const headers = this.buildHeaders(config);

      this.logger.debug(`请求 URL: ${url.substring(0, 100)}...`);

      // 发送请求
      const response = await this.axiosInstance.post<JdSignResponse>(url, null, {
        headers,
      } as AxiosRequestConfig);

      const responseTime = Date.now() - startTime;
      this.logger.log(`签到请求完成，耗时: ${responseTime}ms`);

      // 处理响应
      const responseData = JSON.stringify(response.data);
      this.logger.debug(`响应数据: ${responseData.substring(0, 500)}...`);

      // 判断签到是否成功
      const isSuccess = this.isSignSuccess(response.data);

      // 更新签到历史
      signHistory.status = isSuccess ? JdSignStatus.SUCCESS : JdSignStatus.FAILED;
      signHistory.responseData = responseData;
      if (!isSuccess) {
        signHistory.errorMessage = this.extractErrorMessage(response.data);
      }

      await this.signHistoryRepository.save(signHistory);

      if (isSuccess) {
        this.logger.log('✅ 京东签到成功');
      } else {
        this.logger.warn(`⚠️ 京东签到失败: ${signHistory.errorMessage}`);
      }

      return signHistory;
    } catch (error) {
      const responseTime = Date.now() - startTime;
      this.logger.error(`❌ 京东签到异常，耗时: ${responseTime}ms`, error.stack);

      // 更新签到历史为失败状态
      signHistory.status = JdSignStatus.FAILED;
      signHistory.errorMessage = error instanceof Error ? error.message : String(error);
      signHistory.responseData = error.response ? JSON.stringify(error.response.data) : null;

      await this.signHistoryRepository.save(signHistory);

      throw error;
    }
  }

  /**
   * 判断签到是否成功
   */
  private isSignSuccess(response: JdSignResponse | string): boolean {
    try {
      // 处理 JSONP 响应格式
      let responseData: JdSignResponse;

      // 如果响应是字符串（JSONP格式），需要解析
      if (typeof response === 'string') {
        // 提取 JSONP 回调中的 JSON 数据
        const jsonpMatch = response.match(/jsonp_\d+_\d+\((.+)\);?$/);
        if (jsonpMatch && jsonpMatch[1]) {
          responseData = JSON.parse(jsonpMatch[1]) as JdSignResponse;
        } else {
          return false;
        }
      } else {
        responseData = response;
      }

      // 检查 code 字段
      if (responseData.code === '0') {
        // 进一步检查 data 字段确认签到成功
        if (responseData.data) {
          const data = responseData.data as any;

          // 检查是否有签到成功的标识
          if (data.status === '1' || data.status === 1) {
            return true;
          }

          // 检查是否有奖励信息（表示签到成功）
          if (data.dailyAward || data.beanAward) {
            return true;
          }

          // 检查标题是否包含成功信息
          if (
            data.dailyAward &&
            data.dailyAward.title &&
            data.dailyAward.title.includes('签到成功')
          ) {
            return true;
          }
        }

        return true; // code 为 0 通常表示成功
      }

      // 检查是否有错误消息
      if (responseData.msg && responseData.msg.includes('成功')) {
        return true;
      }

      // 检查响应数据中是否包含成功标识
      if (responseData.data) {
        const dataStr = JSON.stringify(responseData.data);
        if (dataStr.includes('success') || dataStr.includes('成功') || dataStr.includes('已签到')) {
          return true;
        }
      }

      return false;
    } catch (error) {
      this.logger.error('解析签到响应失败', error);
      return false;
    }
  }

  /**
   * 提取错误信息
   */
  private extractErrorMessage(response: JdSignResponse): string {
    if (response.msg) {
      return response.msg;
    }

    if (response.code && response.code !== '0' && response.code !== '200') {
      return `错误代码: ${response.code}`;
    }

    if (response.data) {
      const dataStr = JSON.stringify(response.data);
      if (dataStr.includes('失败') || dataStr.includes('error')) {
        return dataStr.substring(0, 200);
      }
    }

    return '未知错误';
  }

  /**
   * 获取最近的签到历史
   */
  async getRecentHistory(limit: number = 10): Promise<JdSignHistory[]> {
    return this.signHistoryRepository.find({
      order: {
        signTime: 'DESC',
      },
      take: limit,
    });
  }

  /**
   * 获取签到统计信息
   */
  async getSignStatistics(): Promise<{
    total: number;
    success: number;
    failed: number;
    successRate: number;
  }> {
    const [total, success, failed] = await Promise.all([
      this.signHistoryRepository.count(),
      this.signHistoryRepository.count({
        where: { status: JdSignStatus.SUCCESS },
      }),
      this.signHistoryRepository.count({
        where: { status: JdSignStatus.FAILED },
      }),
    ]);

    const successRate = total > 0 ? (success / total) * 100 : 0;

    return {
      total,
      success,
      failed,
      successRate: Math.round(successRate * 100) / 100,
    };
  }
}
