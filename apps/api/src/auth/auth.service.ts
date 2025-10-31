import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { UserService } from '../user/user.service';
import { User } from '../user/user.entity';
import { LoginInput } from './dto/login.input';
import { RegisterInput } from './dto/register.input';
import { AuthResponse } from './dto/auth.response';

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private jwtService: JwtService,
  ) {}

  async validateUser(email: string, password: string): Promise<User | null> {
    const user = await this.userService.findByEmail(email);
    if (user && (await bcrypt.compare(password, user.password))) {
      return user;
    }
    return null;
  }

  async login(loginInput: LoginInput): Promise<AuthResponse> {
    const user = await this.validateUser(loginInput.email, loginInput.password);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    return this.generateToken(user);
  }

  async register(registerInput: RegisterInput): Promise<AuthResponse> {
    const existingUser = await this.userService.findByEmail(registerInput.email);
    if (existingUser) {
      throw new UnauthorizedException('Email already exists');
    }

    const user = await this.userService.create(registerInput);
    return this.generateToken(user);
  }

  private generateToken(user: User): AuthResponse {
    const payload = { sub: user.id, email: user.email };
    return {
      accessToken: this.jwtService.sign(payload),
      user,
    };
  }

  async getUserFromToken(token: string): Promise<User> {
    try {
      const payload = this.jwtService.verify(token);
      return await this.userService.findOne(payload.sub);
    } catch (error) {
      throw new UnauthorizedException('Invalid token');
    }
  }
}
