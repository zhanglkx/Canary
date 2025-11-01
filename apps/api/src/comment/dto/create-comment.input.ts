/**
 * 创建评论的输入 DTO (Data Transfer Object)
 *
 * DTO 的作用：
 * 1. 定义客户端应该如何提交数据
 * 2. 自动验证输入数据
 * 3. 确保 GraphQL 参数的类型安全
 *
 * 使用示例 (GraphQL 变更)：
 * mutation {
 *   createComment(createCommentInput: {
 *     content: "这个需求很紧急，需要明天完成"
 *     todoId: "uuid-here"
 *   }) {
 *     id
 *     content
 *     createdAt
 *   }
 * }
 */

import { InputType, Field } from '@nestjs/graphql';
import { IsNotEmpty, IsString, IsUUID, MinLength } from 'class-validator';

/**
 * @InputType() 装饰器
 * 标记这个类为 GraphQL 的输入类型
 * 在 GraphQL Schema 中会生成 CreateCommentInput 类型
 */
@InputType()
export class CreateCommentInput {
  /**
   * 评论内容
   * @Field() - 在 GraphQL 中暴露这个字段
   * @IsNotEmpty() - 验证字段不为空（否则返回验证错误）
   * @IsString() - 验证是字符串类型
   * @MinLength(1) - 至少要有 1 个字符
   */
  @Field()
  @IsNotEmpty({ message: '评论内容不能为空' })
  @IsString({ message: '评论内容必须是字符串' })
  @MinLength(1, { message: '评论内容至少需要1个字符' })
  content: string;

  /**
   * 要评论的 Todo ID
   * @IsUUID() - 验证是有效的 UUID 格式
   */
  @Field()
  @IsNotEmpty({ message: 'Todo ID 不能为空' })
  @IsUUID('4', { message: 'Todo ID 必须是有效的 UUID' })
  todoId: string;
}
