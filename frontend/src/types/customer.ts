export interface Customer {
  id: string;
  broker_id: string;
  name: string;
  email: string;
  gstin?: string | null;
  customer_type: string;
  created_at: string;
  updated_at: string;
}

export interface CreateCustomerPayload {
  name: string;
  email: string;
  gstin?: string | null;
  customer_type: string;
  broker_id: string;
}

export interface UpdateCustomerPayload {
  name?: string;
  email?: string;
  gstin?: string | null;
  customer_type?: string;
  broker_id?: string;
}
