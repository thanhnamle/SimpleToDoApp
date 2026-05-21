export interface User {
  userId: number;
  username: string;
  email: string;
}

export interface AuthResponse {
  token: string;
  expiresAt: string;
  user: User;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password?: string;
}

export interface LoginRequest {
  usernameOrEmail: string;
  password: string;
}
