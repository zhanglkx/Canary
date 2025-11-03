/**
 * Token Service - 令牌管理服务
 *
 * 负责处理:
 * - JWT 令牌生成和验证
 * - 刷新令牌存储和管理
 * - 令牌撤销（登出）
 * - 多设备会话管理
 */

import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RefreshToken } from '../entities/refresh-token.entity';
import { User } from '../../user/user.entity';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class TokenService {
  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
    @InjectRepository(RefreshToken)
    private refreshTokenRepository: Repository<RefreshToken>,
  ) {}

  /**
   * 生成访问令牌和刷新令牌对
   *
   * @param user 用户对象
   * @param userAgent 用户代理（设备信息）
   * @param ipAddress IP 地址
   * @returns 包含 accessToken 和 refreshToken 的对象
   */
  async generateTokenPair(
    user: User,
    userAgent?: string,
    ipAddress?: string,
  ): Promise<{ accessToken: string; refreshToken: string; expiresIn: number }> {
    const accessTokenExpiry = 15 * 60; // 15 分钟
    const refreshTokenExpiry = 7 * 24 * 60 * 60; // 7 天

    // 生成访问令牌（短期，用于 API 请求）
    const accessToken = this.jwtService.sign(
      {
        sub: user.id,
        email: user.email,
        type: 'access',
      },
      {
        expiresIn: accessTokenExpiry,
        secret: this.configService.get('JWT_SECRET'),
      },
    );

    // 生成刷新令牌（长期，用于获取新的访问令牌）
    const refreshToken = this.jwtService.sign(
      {
        sub: user.id,
        type: 'refresh',
      },
      {
        expiresIn: refreshTokenExpiry,
        secret: this.configService.get('JWT_SECRET'),
      },
    );

    // 保存刷新令牌到数据库
    const expiresAt = new Date();
    expiresAt.setSeconds(expiresAt.getSeconds() + refreshTokenExpiry);

    await this.refreshTokenRepository.save({
      userId: user.id,
      token: refreshToken,
      expiresAt,
      isRevoked: false,
      userAgent,
      ipAddress,
    });

    return {
      accessToken,
      refreshToken,
      expiresIn: accessTokenExpiry,
    };
  }

  /**
   * 使用刷新令牌获取新的访问令牌
   *
   * @param refreshToken 刷新令牌字符串
   * @param user 当前用户
   * @returns 新的访问令牌
   * @throws UnauthorizedException 如果刷新令牌无效或已撤销
   */
  async refreshAccessToken(refreshToken: string, user: User): Promise<string> {
    if (!refreshToken) {
      throw new BadRequestException('刷新令牌不能为空');
    }

    try {
      // 验证刷新令牌签名
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get('JWT_SECRET'),
      });

      // 检查令牌类型
      if (payload.type !== 'refresh') {
        throw new UnauthorizedException('令牌类型错误');
      }

      // 检查令牌是否存在于数据库且未被撤销
      const storedToken = await this.refreshTokenRepository.findOne({
        where: {
          userId: user.id,
          token: refreshToken,
          isRevoked: false,
        },
      });

      if (!storedToken) {
        throw new UnauthorizedException('刷新令牌已被撤销或不存在');
      }

      // 检查令牌是否过期
      if (new Date() > storedToken.expiresAt) {
        throw new UnauthorizedException('刷新令牌已过期');
      }

      // 生成新的访问令牌
      const accessTokenExpiry = 15 * 60;
      const newAccessToken = this.jwtService.sign(
        {
          sub: user.id,
          email: user.email,
          type: 'access',
        },
        {
          expiresIn: accessTokenExpiry,
          secret: this.configService.get('JWT_SECRET'),
        },
      );

      return newAccessToken;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('刷新令牌验证失败');
    }
  }

  /**
   * 撤销单个刷新令牌（登出）
   *
   * @param refreshToken 刷新令牌字符串
   * @param userId 用户 ID
   */
  async revokeRefreshToken(refreshToken: string, userId: string): Promise<void> {
    await this.refreshTokenRepository.update(
      {
        token: refreshToken,
        userId,
      },
      {
        isRevoked: true,
        revokedAt: new Date(),
      },
    );
  }

  /**
   * 撤销用户的所有刷新令牌（登出所有设备）
   *
   * @param userId 用户 ID
   */
  async revokeAllRefreshTokens(userId: string): Promise<void> {
    await this.refreshTokenRepository.update(
      {
        userId,
        isRevoked: false,
      },
      {
        isRevoked: true,
        revokedAt: new Date(),
      },
    );
  }

  /**
   * 获取用户的活跃会话列表
   *
   * @param userId 用户 ID
   * @returns 活跃的刷新令牌列表（不包含令牌本身）
   */
  async getActiveSessions(userId: string) {
    return this.refreshTokenRepository.find({
      where: {
        userId,
        isRevoked: false,
      },
      select: ['id', 'createdAt', 'userAgent', 'ipAddress'],
      order: {
        createdAt: 'DESC',
      },
    });
  }

  /**
   * 清理过期的刷新令牌（定期清理任务）
   */
  async cleanupExpiredTokens(): Promise<number> {
    const result = await this.refreshTokenRepository.delete({
      expiresAt: new Date(),
    });

    return result.affected || 0;
  }
}
