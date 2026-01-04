/**
 * RefreshToken DTO
 * 用于刷新 JWT 访问令牌
 */

import { IsString, IsNotEmpty } from 'class-validator';

export class RefreshTokenDto {
  @IsString()
  @IsNotEmpty({ message: '刷新令牌不能为空' })
  refreshToken: string;
}
