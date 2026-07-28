export type FlowStatus = 'not_started' | 'in_progress' | 'completed';
export type StepStatus = 'pending' | 'in_progress' | 'completed' | 'skipped';

export interface OnboardingStep {
  id: string;
  flow_id: string;
  title: string;
  description?: string;
  order: number;
  status: StepStatus;
  data?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface OnboardingFlow {
  id: string;
  user_id: string;
  customer_id?: string;
  customer_name?: string;
  title: string;
  description?: string;
  status: FlowStatus;
  steps: OnboardingStep[];
  created_at: string;
  updated_at: string;
}

export interface CreateOnboardingFlowPayload {
  customer_id: string;
  customer_name?: string;
  title: string;
  description?: string;
  steps?: Array<{
    title: string;
    description?: string;
    order: number;
  }>;
}

export interface UpdateOnboardingStepPayload {
  title?: string;
  description?: string;
  order?: number;
  status?: StepStatus;
  data?: Record<string, any>;
}
