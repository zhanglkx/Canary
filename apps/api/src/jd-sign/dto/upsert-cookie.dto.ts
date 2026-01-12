/**
 * 创建或更新 Cookie 配置的 DTO
 */

import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class UpsertCookieDto {
  /**
   * 账号标识（如 pt_pin 值或自定义账号名）
   */
  @IsString({ message: '账号标识必须是字符串' })
  @IsNotEmpty({ message: '账号标识不能为空' })
  account: string;

  /**
   * 完整的 Cookie 字符串
   */
  @IsString({ message: 'Cookie 必须是字符串' })
  @IsNotEmpty({ message: 'Cookie 不能为空' })
  cookie: string;

  /**
   * 备注信息（可选）
   */
  @IsOptional()
  @IsString({ message: '备注必须是字符串' })
  remark?: string;
}
