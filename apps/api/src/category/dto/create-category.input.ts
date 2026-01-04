import { IsString, IsNotEmpty, IsOptional, IsHexColor, Length } from 'class-validator';

export class CreateCategoryInput {
  @IsString()
  @IsNotEmpty()
  @Length(1, 50)
  name: string;

  @IsString()
  @IsOptional()
  @Length(0, 200)
  description?: string;

  @IsString()
  @IsOptional()
  @IsHexColor()
  color?: string;

  @IsString()
  @IsOptional()
  @Length(1, 10)
  icon?: string;
}
