import { InputType, Field } from '@nestjs/graphql';
import { IsOptional, IsBoolean } from 'class-validator';

@InputType()
export class UpdateTodoInput {
  @Field({ nullable: true })
  @IsOptional()
  title?: string;

  @Field({ nullable: true })
  @IsOptional()
  description?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  completed?: boolean;
}
