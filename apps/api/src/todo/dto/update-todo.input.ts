import { IsOptional, IsBoolean, IsUUID, IsEnum, IsDateString } from 'class-validator';
import { Priority } from '../todo.entity';

export class UpdateTodoInput {
  @IsOptional()
  title?: string;

  @IsOptional()
  description?: string;

  @IsOptional()
  @IsBoolean()
  completed?: boolean;

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
