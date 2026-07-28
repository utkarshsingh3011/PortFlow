import { UserProfile } from './user';

export interface AuthToken {
  access_token: string;
  token_type: string;
  expires_in?: number;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterPayload extends LoginCredentials {
  fullName?: string;
  full_name?: string;
  businessName?: string;
  business_name?: string;
  gstin?: string;
  customerType?: string;
  customer_type?: string;
}

export interface AuthState {
  user: UserProfile | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}
