/**
 * 认证相关 API
 */

import { apiClient } from "./client";

export interface LoginRequest {
  email: string;
  password: string;
}

export interface UserRead {
  id: string;
  email: string;
  nickname?: string;
  avatar?: string;
  created_at: string;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  user: UserRead;
}

export interface RefreshRequest {
  refresh_token: string;
}

export async function login(data: LoginRequest): Promise<TokenResponse> {
  return apiClient.post<TokenResponse>("/auth/login", data);
}

export async function refreshToken(data: RefreshRequest): Promise<TokenResponse> {
  return apiClient.post<TokenResponse>("/auth/refresh", data);
}

export async function getCurrentUser(): Promise<UserRead> {
  return apiClient.get<UserRead>("/users/me");
}
