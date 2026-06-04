export interface User {
  userId: number;
  username: string;
  email: string;
  role: string;
  departmentId: number | null;
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
  departmentId: number | null;
  role: string;
}

export interface LoginRequest {
  usernameOrEmail: string;
  password: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}

