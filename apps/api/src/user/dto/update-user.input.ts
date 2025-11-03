/**
 * UpdateUserInput DTO - 用户更新数据传输对象
 *
 * 用于 GraphQL 中的用户信息更新操作
 */

import { InputType, Field } from '@nestjs/graphql';
import { IsOptional, IsString, MinLength, IsEmail } from 'class-validator';

@InputType()
export class UpdateUserInput {
  /**
   * 用户名 - 可选
   */
  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MinLength(3, {
    message: 'Username must be at least 3 characters long',
  })
  username?: string;

  /**
   * 电子邮件 - 可选
   */
  @Field({ nullable: true })
  @IsOptional()
  @IsEmail({}, {
    message: 'Email must be valid',
  })
  email?: string;

  /**
   * 旧密码 - 如果要更新密码，必须提供
   */
  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  oldPassword?: string;

  /**
   * 新密码 - 如果要更新密码，需要提供
   */
  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MinLength(8, {
    message: 'Password must be at least 8 characters long',
  })
  newPassword?: string;
}
