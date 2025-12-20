/* User Types */
export interface IUser {
  id: string;
  email: string;
  name: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICreateUserRequest {
  email: string;
  name: string;
  password: string;
}

export interface IUpdateUserRequest {
  name?: string;
  email?: string;
}

export interface IUserResponse {
  id: string;
  email: string;
  name: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/* Auth Types */
export interface ILoginRequest {
  email: string;
  password: string;
}

export interface IRegisterRequest {
  email: string;
  name: string;
  password: string;
}

export interface IAuthResponse {
  accessToken: string;
  user: {
    id: string;
    email: string;
    name: string;
  };
}

export interface ITokenPayload {
  sub: string;
  email: string;
  iat?: number;
  exp?: number;
}

/* API Response Types */
export interface IApiResponse<T> {
  statusCode: number;
  message: string;
  data?: T;
  error?: string;
  timestamp: string;
}

export interface IPaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

/* Error Types */
export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
  ) {
    super(message);
  }
}
