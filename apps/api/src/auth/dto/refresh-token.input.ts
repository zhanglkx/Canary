/**
 * RefreshToken Input DTO
 * 用于刷新 JWT 访问令牌
 */

import { InputType, Field } from '@nestjs/graphql';
import { IsString, IsNotEmpty } from 'class-validator';

@InputType()
export class RefreshTokenInput {
  @Field()
  @IsString()
  @IsNotEmpty({ message: '刷新令牌不能为空' })
  refreshToken: string;
}
