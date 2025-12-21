/**
 * 创建标签的输入 DTO
 *
 * GraphQL 变更示例：
 * mutation {
 *   createTag(createTagInput: {
 *     name: "紧急"
 *     color: "#FF5733"
 *   }) {
 *     id
 *     name
 *   }
 * }
 */

import { IsNotEmpty, IsString, IsOptional, MinLength } from 'class-validator';

export class CreateTagInput {
  /**
   * 标签名称
   * 例如："紧急"、"后端"、"前端"
   */
  @IsNotEmpty({ message: '标签名称不能为空' })
  @IsString()
  @MinLength(1, { message: '标签名称至少需要1个字符' })
  name: string;

  /**
   * 标签颜色（可选）
   * 十六进制颜色值，如 "#FF5733"
   * 如果不提供，默认为蓝色 "#3B82F6"
   */
  @IsOptional()
  @IsString()
  color?: string;
}
