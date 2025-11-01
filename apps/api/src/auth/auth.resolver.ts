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
import { LoginInput } from './dto/login.input';
import { RegisterInput } from './dto/register.input';
import { AuthResponse } from './dto/auth.response';
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
  constructor(private readonly authService: AuthService) {}

  @Mutation(() => AuthResponse)
  async login(@Args('loginInput') loginInput: LoginInput): Promise<AuthResponse> {
    return this.authService.login(loginInput);
  }

  @Mutation(() => AuthResponse)
  async register(@Args('registerInput') registerInput: RegisterInput): Promise<AuthResponse> {
    return this.authService.register(registerInput);
  }

  @Query(() => User)
  @UseGuards(GqlAuthGuard)
  async me(@CurrentUser() user: User): Promise<User> {
    return user;
  }
}
