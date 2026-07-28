import { apiClient } from './api/client';
import { ApiResponse, AuthToken, LoginCredentials, RegisterPayload, UserProfile } from '@/types';

export const authService = {
  async login(credentials: LoginCredentials): Promise<ApiResponse<AuthToken>> {
    const response = await apiClient.post<ApiResponse<AuthToken>>('/auth/login', credentials);
    return response.data;
  },

  async register(payload: RegisterPayload): Promise<ApiResponse<UserProfile>> {
    const response = await apiClient.post<ApiResponse<UserProfile>>('/auth/register', payload);
    return response.data;
  },

  async getCurrentUser(): Promise<ApiResponse<UserProfile>> {
    const response = await apiClient.get<ApiResponse<UserProfile>>('/users/me');
    return response.data;
  },

  async refreshToken(): Promise<ApiResponse<AuthToken>> {
    const response = await apiClient.post<ApiResponse<AuthToken>>('/auth/refresh');
    return response.data;
  },
};
