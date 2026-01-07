import { ExecutionContext, Injectable, Logger } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  private readonly logger = new Logger(JwtAuthGuard.name);

  getRequest(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    console.log(`🔐 [JWT Guard] 请求路径: ${request.url}, 方法: ${request.method}`);
    this.logger.log(`🔐 [JWT Guard] 请求路径: ${request.url}, 方法: ${request.method}`);
    return request;
  }

  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    const token = request.headers?.authorization?.replace('Bearer ', '');
    this.logger.log(`🔑 [JWT Guard] Token 存在: ${!!token}`);
    return super.canActivate(context);
  }

  handleRequest(err: Error | null, user: any, info: any) {
    if (err || !user) {
      this.logger.warn(`❌ [JWT Guard] 认证失败: ${err?.message || info?.message || '未知错误'}`);
      throw err || new Error('未授权');
    }
    this.logger.log(`✅ [JWT Guard] 认证成功, 用户ID: ${user?.id}`);
    return user;
  }
}
