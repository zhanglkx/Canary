/**
 * AuthController - 认证控制器
 *
 * 提供 RESTful 认证接口：
 * - POST /api/auth/login - 用户登录
 * - POST /api/auth/register - 用户注册
 * - POST /api/auth/refresh - 刷新访问令牌
 * - POST /api/auth/logout - 用户登出
 * - POST /api/auth/logout-all - 登出所有设备
 * - GET /api/auth/me - 获取当前用户信息
 */

import { Controller, Post, Get, Body, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { TokenService } from './services/token.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { AuthResponse } from './dto/auth.response';
import { TokenResponse } from './dto/token.response';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../user/user.entity';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly tokenService: TokenService,
  ) {}

  /**
   * POST /api/auth/login
   * 用户登录
   */
  @Post('login')
  async login(@Body() loginDto: LoginDto): Promise<AuthResponse> {
    return this.authService.login(loginDto);
  }

  /**
   * POST /api/auth/register
   * 用户注册
   */
  @Post('register')
  async register(@Body() registerDto: RegisterDto): Promise<AuthResponse> {
    return this.authService.register(registerDto);
  }

  /**
   * POST /api/auth/refresh
   * 刷新访问令牌
   * 不需要JWT认证，因为token可能已过期，从refreshToken中提取用户信息
   */
  @Post('refresh')
  async refreshToken(
    @Body() refreshTokenDto: RefreshTokenDto,
  ): Promise<TokenResponse> {
    // 从refreshToken中提取用户信息
    const user = await this.authService.getUserFromRefreshToken(
      refreshTokenDto.refreshToken,
    );

    const accessToken = await this.tokenService.refreshAccessToken(
      refreshTokenDto.refreshToken,
      user,
    );

    return {
      accessToken,
      refreshToken: refreshTokenDto.refreshToken,
      expiresIn: 15 * 60, // 15 分钟
      tokenType: 'Bearer',
    };
  }

  /**
   * POST /api/auth/logout
   * 用户登出（撤销特定刷新令牌）
   * 需要认证
   */
  @Post('logout')
  @UseGuards(JwtAuthGuard)
  async logout(
    @Body('refreshToken') refreshToken: string,
    @CurrentUser() user: User,
  ): Promise<{ success: boolean }> {
    await this.tokenService.revokeRefreshToken(refreshToken, user.id);
    return { success: true };
  }

  /**
   * POST /api/auth/logout-all
   * 登出所有设备（撤销所有刷新令牌）
   * 需要认证
   */
  @Post('logout-all')
  @UseGuards(JwtAuthGuard)
  async logoutAll(@CurrentUser() user: User): Promise<{ success: boolean }> {
    await this.tokenService.revokeAllRefreshTokens(user.id);
    return { success: true };
  }

  /**
   * GET /api/auth/me
   * 获取当前用户信息
   * 需要认证
   */
  @Get('me')
  @UseGuards(JwtAuthGuard)
  async me(@CurrentUser() user: User): Promise<User> {
    return user;
  }
}
