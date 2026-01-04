import { IsNotEmpty, IsOptional, IsUUID, IsEnum, IsDateString } from 'class-validator';
import { Priority } from '../todo.entity';

export class CreateTodoInput {
  @IsNotEmpty()
  title: string;

  @IsOptional()
  description?: string;

  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @IsOptional()
  @IsEnum(Priority)
  priority?: Priority;

  @IsOptional()
  @IsDateString()
  dueDate?: string;
}
