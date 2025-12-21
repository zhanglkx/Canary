import { User } from '../../user/user.entity';

export class AuthResponse {
  accessToken: string;

  refreshToken: string;

  expiresIn: number; // 秒数

  tokenType: string;

  user: User;
}
