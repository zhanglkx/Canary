import { IsEmail, IsNotEmpty, MinLength } from 'class-validator';

export class CreateUserInput {
  @IsEmail()
  email: string;

  @IsNotEmpty()
  username: string;

  @MinLength(6)
  password: string;
}
