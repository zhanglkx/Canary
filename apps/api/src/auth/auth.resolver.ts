/**
 * 认证系统 - GraphQL 实现
 *
 * 本模块展示了如何在 GraphQL API 中实现用户认证：
 * 1. 使用 JWT（JSON Web Tokens）进行身份验证
 * 2. 实现登录和注册功能
 * 3. 用户信息查询
 * 4. 使用 Guards 保护路由
 */

import { Resolver, Mutation, Args, Query } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { TokenService } from './services/token.service';
import { LoginInput } from './dto/login.input';
import { RegisterInput } from './dto/register.input';
import { AuthResponse } from './dto/auth.response';
import { RefreshTokenInput } from './dto/refresh-token.input';
import { TokenResponse } from './dto/token.response';
import { GqlAuthGuard } from '../common/guards/gql-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../user/user.entity';

/**
 * 认证解析器
 * 处理所有与用户认证相关的 GraphQL 操作
 *
 * 主要功能：
 * - 用户注册
 * - 用户登录
 * - 获取当前用户信息
 */
@Resolver()
export class AuthResolver {
  constructor(
    private readonly authService: AuthService,
    private readonly tokenService: TokenService,
  ) {}

  @Mutation(() => AuthResponse)
  async login(@Args('loginInput') loginInput: LoginInput): Promise<AuthResponse> {
    return this.authService.login(loginInput);
  }

  @Mutation(() => AuthResponse)
  async register(@Args('registerInput') registerInput: RegisterInput): Promise<AuthResponse> {
    return this.authService.register(registerInput);
  }

  /**
   * 刷新访问令牌
   * 使用刷新令牌获取新的访问令牌，无需重新登录
   *
   * GraphQL 查询示例:
   * mutation {
   *   refreshToken(refreshTokenInput: { refreshToken: "..." }) {
   *     accessToken
   *     tokenType
   *     expiresIn
   *   }
   * }
   */
  @Mutation(() => TokenResponse)
  @UseGuards(GqlAuthGuard)
  async refreshToken(
    @Args('refreshTokenInput') input: RefreshTokenInput,
    @CurrentUser() user: User,
  ): Promise<TokenResponse> {
    const accessToken = await this.tokenService.refreshAccessToken(input.refreshToken, user);

    return {
      accessToken,
      refreshToken: input.refreshToken, // 返回原有刷新令牌
      expiresIn: 15 * 60, // 15 分钟
      tokenType: 'Bearer',
    };
  }

  /**
   * 登出
   * 撤销刷新令牌，使该令牌失效
   *
   * GraphQL 查询示例:
   * mutation {
   *   logout(refreshToken: "...") {
   *     success
   *     message
   *   }
   * }
   */
  @Mutation(() => Boolean)
  @UseGuards(GqlAuthGuard)
  async logout(
    @Args('refreshToken') refreshToken: string,
    @CurrentUser() user: User,
  ): Promise<boolean> {
    await this.tokenService.revokeRefreshToken(refreshToken, user.id);
    return true;
  }

  /**
   * 登出所有设备
   * 撤销该用户的所有刷新令牌
   *
   * GraphQL 查询示例:
   * mutation {
   *   logoutAll {
   *     success
   *   }
   * }
   */
  @Mutation(() => Boolean)
  @UseGuards(GqlAuthGuard)
  async logoutAll(@CurrentUser() user: User): Promise<boolean> {
    await this.tokenService.revokeAllRefreshTokens(user.id);
    return true;
  }

  @Query(() => User)
  @UseGuards(GqlAuthGuard)
  async me(@CurrentUser() user: User): Promise<User> {
    return user;
  }
}
