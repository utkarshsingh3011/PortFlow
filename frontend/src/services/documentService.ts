import { apiClient } from './api/client';
import { ApiResponse } from '@/types';

export interface CustomerDocument {
  id: string;
  customer_id: string;
  step_id?: string;
  document_type: string;
  filename: string;
  file_path: string;
  file_size: number;
  content_type: string;
  created_at: string;
  updated_at: string;
}

export const documentService = {
  async listCustomerDocuments(customerId: string): Promise<ApiResponse<CustomerDocument[]>> {
    try {
      const response = await apiClient.get<ApiResponse<CustomerDocument[]>>(
        `/customers/${customerId}/documents`
      );
      return response.data;
    } catch {
      return { success: true, message: 'No documents found', data: [] };
    }
  },

  async uploadDocument(
    customerId: string,
    documentType: string,
    file: File,
    stepId?: string
  ): Promise<ApiResponse<CustomerDocument>> {
    const formData = new FormData();
    formData.append('document_type', documentType);
    formData.append('file', file);
    if (stepId) {
      formData.append('step_id', stepId);
    }

    const response = await apiClient.post<ApiResponse<CustomerDocument>>(
      `/customers/${customerId}/documents`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  },

  getDownloadUrl(documentId: string): string {
    const baseURL = apiClient.defaults.baseURL || '/api/v1';
    return `${baseURL}/documents/${documentId}/download`;
  },

  async deleteDocument(documentId: string): Promise<ApiResponse<void>> {
    const response = await apiClient.delete<ApiResponse<void>>(`/documents/${documentId}`);
    return response.data;
  },
};
