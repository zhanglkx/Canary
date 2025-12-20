import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { LoginDto, RegisterDto, AuthResponseDto } from './dto/auth.dto';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto): Promise<AuthResponseDto> {
    const user = await this.usersService.create({
      email: registerDto.email,
      name: registerDto.name,
      password: registerDto.password, // TODO: Hash password in production
    });

    const accessToken = this.generateToken(user.id, user.email);

    return {
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    };
  }

  async login(loginDto: LoginDto): Promise<AuthResponseDto> {
    const user = await this.usersService.findByEmail(loginDto.email);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // TODO: Verify password hash in production

    const accessToken = this.generateToken(user.id, user.email);

    return {
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    };
  }

  private generateToken(userId: string, email: string): string {
    return this.jwtService.sign({
      sub: userId,
      email,
    });
  }
}
