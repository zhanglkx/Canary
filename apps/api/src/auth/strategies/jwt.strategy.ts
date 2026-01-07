import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UserService } from '../../user/user.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly logger = new Logger(JwtStrategy.name);

  constructor(
    configService: ConfigService,
    private userService: UserService,
  ) {
    const jwtSecret = configService.get<string>('JWT_SECRET');
    if (!jwtSecret) {
      throw new Error(
        'JWT_SECRET is not defined. Please set JWT_SECRET in your .env file.',
      );
    }
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtSecret,
    });
    this.logger.log('JWT Strategy 已初始化');
  }

  async validate(payload: any) {
    this.logger.log(`🔐 [JWT Strategy] 验证 Token, payload.sub: ${payload.sub}`);
    
    try {
      const user = await this.userService.findOne(payload.sub);
      if (!user) {
        this.logger.warn(`⚠️  [JWT Strategy] 用户不存在: ${payload.sub}`);
        throw new UnauthorizedException('用户不存在');
      }
      
      this.logger.log(`✅ [JWT Strategy] 用户验证成功: ${user.id} (${user.email})`);
      return user;
    } catch (error) {
      this.logger.error(`❌ [JWT Strategy] 验证失败: ${error.message}`);
      throw error instanceof UnauthorizedException
        ? error
        : new UnauthorizedException('Token 验证失败');
    }
  }
}
