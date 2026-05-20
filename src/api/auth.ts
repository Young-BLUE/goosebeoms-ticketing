import { apiClient } from './client';
import type { ApiResponse, AuthResponse } from './types';

export async function login(email: string, password: string): Promise<AuthResponse> {
  const res = await apiClient.post<ApiResponse<AuthResponse>>('/auth/login', { email, password });
  return res.data.data;
}

export async function signup(data: {
  email: string;
  password: string;
  name: string;
  phone?: string;
}): Promise<AuthResponse> {
  const res = await apiClient.post<ApiResponse<AuthResponse>>('/auth/signup', data);
  return res.data.data;
}

export async function getMe(): Promise<AuthResponse> {
  const res = await apiClient.get<ApiResponse<AuthResponse>>('/auth/me');
  return res.data.data;
}
