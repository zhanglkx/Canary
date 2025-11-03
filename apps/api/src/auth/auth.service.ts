/**
 * AuthService - 认证业务服务
 *
 * 作用：
 *  - 验证用户凭证（validateUser）
 *  - 注册与登录逻辑（register / login）
 *  - JWT Token 的生成与解析
 *
 * 说明：该类不直接处理 HTTP 请求或 GraphQL 层面的细节，而是为解析器和守卫提供业务方法。
 */
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { UserService } from '../user/user.service';
import { TokenService } from './services/token.service';
import { User } from '../user/user.entity';
import { LoginInput } from './dto/login.input';
import { RegisterInput } from './dto/register.input';
import { AuthResponse } from './dto/auth.response';

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private jwtService: JwtService,
    private tokenService: TokenService,
  ) {}

  async validateUser(email: string, password: string): Promise<User | null> {
    const user = await this.userService.findByEmail(email);
    if (user && (await bcrypt.compare(password, user.password))) {
      return user;
    }
    return null;
  }

  async login(loginInput: LoginInput): Promise<AuthResponse> {
    const user = await this.validateUser(loginInput.email, loginInput.password);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    return this.generateToken(user);
  }

  async register(registerInput: RegisterInput): Promise<AuthResponse> {
    const existingUser = await this.userService.findByEmail(registerInput.email);
    if (existingUser) {
      throw new UnauthorizedException('Email already exists');
    }

    const user = await this.userService.create(registerInput);
    return this.generateToken(user);
  }

  private async generateToken(user: User): Promise<AuthResponse> {
    const tokenPair = await this.tokenService.generateTokenPair(user);
    return {
      accessToken: tokenPair.accessToken,
      refreshToken: tokenPair.refreshToken,
      expiresIn: tokenPair.expiresIn,
      tokenType: 'Bearer',
      user,
    };
  }

  async getUserFromToken(token: string): Promise<User> {
    try {
      const payload = this.jwtService.verify(token);
      return await this.userService.findOne(payload.sub);
    } catch (error) {
      throw new UnauthorizedException('Invalid token');
    }
  }
}
