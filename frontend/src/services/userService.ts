import { apiClient } from './api/client';
import { ApiResponse, PaginatedResponse, UpdateUserPayload, UserProfile } from '@/types';

export const userService = {
  async getProfile(): Promise<ApiResponse<UserProfile>> {
    const response = await apiClient.get<ApiResponse<UserProfile>>('/users/me');
    return response.data;
  },

  async updateProfile(payload: UpdateUserPayload): Promise<ApiResponse<UserProfile>> {
    const response = await apiClient.patch<ApiResponse<UserProfile>>('/users/me', payload);
    return response.data;
  },

  async getUsers(page = 1, pageSize = 20): Promise<ApiResponse<PaginatedResponse<UserProfile>>> {
    const response = await apiClient.get<ApiResponse<PaginatedResponse<UserProfile>>>('/users', {
      params: { page, page_size: pageSize },
    });
    return response.data;
  },
};
