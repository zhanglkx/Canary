/**
 * 日志验证管道
 * 
 * 扩展 ValidationPipe，添加详细的验证日志
 * 记录验证过程和验证错误
 */

import {
  PipeTransform,
  Injectable,
  ArgumentMetadata,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';

@Injectable()
export class LoggingValidationPipe implements PipeTransform<any> {
  private readonly logger = new Logger('Validation');

  async transform(value: any, { metatype, type, data }: ArgumentMetadata) {
    // 如果没有元类型或不是 DTO，直接返回
    if (!metatype || !this.toValidate(metatype)) {
      return value;
    }

    // 记录验证开始
    if (process.env.NODE_ENV === 'development') {
      this.logger.debug(
        `🔍 [Validation] 开始验证 ${type}:${data || 'body'} (${metatype.name})`,
      );
    }

    // 转换为 DTO 实例
    const object = plainToInstance(metatype, value);

    // 执行验证
    const errors = await validate(object, {
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    });

    if (errors.length > 0) {
      // 格式化错误信息
      const formattedErrors = this.formatErrors(errors);
      
      this.logger.warn(
        `⚠️  [Validation] 验证失败 ${type}:${data || 'body'}: ${JSON.stringify(formattedErrors)}`,
      );

      throw new BadRequestException({
        message: '请求参数验证失败',
        errors: formattedErrors,
      });
    }

    // 验证成功
    if (process.env.NODE_ENV === 'development') {
      this.logger.debug(`✅ [Validation] 验证通过 ${type}:${data || 'body'}`);
    }

    return object;
  }

  /**
   * 检查是否需要验证
   */
  private toValidate(metatype: Function): boolean {
    const types: Function[] = [String, Boolean, Number, Array, Object];
    return !types.includes(metatype);
  }

  /**
   * 格式化验证错误
   */
  private formatErrors(errors: any[]): Record<string, string[]> {
    const formatted: Record<string, string[]> = {};

    errors.forEach((error) => {
      const property = error.property;
      const constraints = error.constraints || {};

      formatted[property] = Object.values(constraints);

      // 处理嵌套验证错误
      if (error.children && error.children.length > 0) {
        const nestedErrors = this.formatErrors(error.children);
        Object.keys(nestedErrors).forEach((key) => {
          formatted[`${property}.${key}`] = nestedErrors[key];
        });
      }
    });

    return formatted;
  }
}
