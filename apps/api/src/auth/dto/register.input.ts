import { IsEmail, IsNotEmpty, MinLength } from 'class-validator';

export class RegisterInput {
  @IsEmail()
  email: string;

  @IsNotEmpty()
  username: string;

  @MinLength(6)
  password: string;
}
