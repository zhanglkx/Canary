import { InputType, Field } from '@nestjs/graphql';
import { IsString, IsNotEmpty, IsOptional, IsHexColor, Length } from 'class-validator';

@InputType()
export class CreateCategoryInput {
  @Field()
  @IsString()
  @IsNotEmpty()
  @Length(1, 50)
  name: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  @Length(0, 200)
  description?: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  @IsHexColor()
  color?: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  @Length(1, 10)
  icon?: string;
}
