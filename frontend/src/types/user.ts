export interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
  company_name?: string;
  is_active: boolean;
  is_superuser: boolean;
  created_at: string;
  updated_at: string;
}

export interface UpdateUserPayload {
  email?: string;
  full_name?: string;
  company_name?: string;
  password?: string;
  is_active?: boolean;
}
