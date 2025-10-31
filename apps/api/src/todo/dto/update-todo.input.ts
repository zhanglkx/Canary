import { InputType, Field, ID } from '@nestjs/graphql';
import { IsOptional, IsBoolean, IsUUID, IsEnum, IsDateString } from 'class-validator';
import { Priority } from '../todo.entity';

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

  @Field(() => ID, { nullable: true })
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @Field(() => Priority, { nullable: true })
  @IsOptional()
  @IsEnum(Priority)
  priority?: Priority;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsDateString()
  dueDate?: string;
}
