export interface User {
  id: string;
  email: string;
  username: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Todo {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthPayload {
  accessToken: string;
  user: User;
}
