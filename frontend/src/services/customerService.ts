import { apiClient } from './api/client';
import { ApiResponse, PaginatedResponse } from '@/types';
import { Customer, CreateCustomerPayload, UpdateCustomerPayload } from '@/types/customer';

export interface CustomerActivity {
  id: string;
  customer_id: string;
  user_id?: string;
  event_type: string;
  title: string;
  description?: string;
  metadata_json?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export const customerService = {
  async getCustomers(
    page = 1,
    pageSize = 20,
    brokerId?: string
  ): Promise<ApiResponse<PaginatedResponse<Customer>>> {
    const params: Record<string, unknown> = { page, page_size: pageSize };
    if (brokerId) {
      params.broker_id = brokerId;
    }
    const response = await apiClient.get<ApiResponse<PaginatedResponse<Customer>>>('/customers', { params });
    return response.data;
  },

  async getCustomer(id: string): Promise<ApiResponse<Customer>> {
    const response = await apiClient.get<ApiResponse<Customer>>(`/customers/${id}`);
    return response.data;
  },

  async getCustomerActivities(id: string): Promise<ApiResponse<CustomerActivity[]>> {
    try {
      const response = await apiClient.get<ApiResponse<CustomerActivity[]>>(`/customers/${id}/activities`);
      return response.data;
    } catch {
      return { success: true, message: 'Activities empty', data: [] };
    }
  },

  async getRecentBrokerActivities(limit = 20): Promise<ApiResponse<CustomerActivity[]>> {
    try {
      const response = await apiClient.get<ApiResponse<CustomerActivity[]>>('/customers/activities/recent', {
        params: { limit },
      });
      return response.data;
    } catch {
      return { success: true, message: 'Recent activities empty', data: [] };
    }
  },

  async createCustomer(payload: CreateCustomerPayload): Promise<ApiResponse<Customer>> {
    const response = await apiClient.post<ApiResponse<Customer>>('/customers', payload);
    return response.data;
  },

  async updateCustomer(id: string, payload: UpdateCustomerPayload): Promise<ApiResponse<Customer>> {
    const response = await apiClient.patch<ApiResponse<Customer>>(`/customers/${id}`, payload);
    return response.data;
  },

  async deleteCustomer(id: string): Promise<ApiResponse<void>> {
    try {
      const response = await apiClient.delete<ApiResponse<void>>(`/customers/${id}`);
      return response.data;
    } catch (err) {
      throw err;
    }
  },
};
