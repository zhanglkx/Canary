/**
 * Token Response DTO
 * 用于返回访问令牌和刷新令牌
 */


export class TokenResponse {
  accessToken: string;

  refreshToken: string;

  expiresIn: number; // 秒数

  tokenType: string;
}
