/**
 * 京东签到配置 DTO
 *
 * @description
 * 用于配置京东签到的 Cookie 和参数
 */

import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class JdSignConfigDto {
  /**
   * pt_pin 参数
   */
  @IsString()
  @IsNotEmpty()
  ptPin: string;

  /**
   * pt_key 参数
   */
  @IsString()
  @IsNotEmpty()
  ptKey: string;

  /**
   * __jd_ref_cls 参数
   */
  @IsString()
  @IsOptional()
  jdRefCls?: string;

  /**
   * mba_muid 参数
   */
  @IsString()
  @IsOptional()
  mbaMuid?: string;

  /**
   * mba_sid 参数
   */
  @IsString()
  @IsOptional()
  mbaSid?: string;

  /**
   * 完整的 Cookie 字符串
   */
  @IsString()
  @IsOptional()
  cookie?: string;
}
