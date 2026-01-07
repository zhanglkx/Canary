import { ExecutionContext, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
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
      // 提取错误信息
      const errorMessage = err?.message || (info as { message?: string })?.message || '未知错误';

      // 根据错误类型提供更友好的错误消息
      let friendlyMessage = '未授权';
      if (errorMessage.includes('expired') || errorMessage === 'jwt expired') {
        friendlyMessage = '登录已过期，请重新登录';
      } else if (errorMessage.includes('invalid') || errorMessage.includes('malformed')) {
        friendlyMessage = 'Token 无效，请重新登录';
      } else if (errorMessage.includes('No auth token')) {
        friendlyMessage = '未提供认证令牌';
      }

      this.logger.warn(`❌ [JWT Guard] 认证失败: ${errorMessage}`);

      // 抛出 UnauthorizedException 而不是普通 Error，这样会返回 401 状态码
      throw new UnauthorizedException(friendlyMessage);
    }
    this.logger.log(`✅ [JWT Guard] 认证成功, 用户ID: ${(user as { id?: string })?.id}`);
    return user;
  }
}
