export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  fullName: string;
  email: string;
  password: string;
  role: string;
}

export interface LoginResponse {
  token: string;
  role: string;
  userId: string;
  fullName: string;
  email: string;
  expiresAt: string;
}

export interface RegisterResponse {
  userId: string;
  email: string;
}

export interface UserProfile {
  userId: string;
  fullName: string;
  email: string;
  phoneNumber?: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  lastLoginAt?: string;
}
