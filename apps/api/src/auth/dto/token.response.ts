/**
 * Token Response DTO
 * 用于返回访问令牌和刷新令牌
 */

import { ObjectType, Field } from '@nestjs/graphql';

@ObjectType()
export class TokenResponse {
  @Field()
  accessToken: string;

  @Field()
  refreshToken: string;

  @Field()
  expiresIn: number; // 秒数

  @Field()
  tokenType: string;
}
