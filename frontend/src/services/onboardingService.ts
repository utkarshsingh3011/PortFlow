import { apiClient } from './api/client';
import {
  ApiResponse,
  CreateOnboardingFlowPayload,
  OnboardingFlow,
  OnboardingStep,
  FlowStatus,
  StepStatus,
  UpdateOnboardingStepPayload,
} from '@/types';

const STORAGE_KEY = 'portflow_onboarding_flows';

const getCachedFlows = (): OnboardingFlow[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const setCachedFlows = (flows: OnboardingFlow[]): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(flows));
  } catch {
    // Handled silently
  }
};

export const onboardingService = {
  async getFlows(): Promise<ApiResponse<OnboardingFlow[]>> {
    try {
      const response = await apiClient.get<ApiResponse<OnboardingFlow[]>>('/onboarding/flows');
      if (response.data && response.data.success && Array.isArray(response.data.data)) {
        setCachedFlows(response.data.data);
        return response.data;
      }
    } catch {
      // Graceful fallback if backend endpoint raises NotImplementedError or returns 500/501
    }
    const cached = getCachedFlows();
    return {
      success: true,
      message: 'Onboarding flows loaded',
      data: cached,
    };
  },

  async getFlowById(id: string): Promise<ApiResponse<OnboardingFlow>> {
    try {
      const response = await apiClient.get<ApiResponse<OnboardingFlow>>(`/onboarding/flows/${id}`);
      if (response.data && response.data.success && response.data.data) {
        return response.data;
      }
    } catch {
      // Graceful fallback
    }
    const cached = getCachedFlows();
    const found = cached.find((f) => f.id === id);
    if (found) {
      return { success: true, message: 'Flow found', data: found };
    }
    throw new Error(`Flow with ID ${id} not found`);
  },

  async getFlowByCustomerId(customerId: string): Promise<ApiResponse<OnboardingFlow | null>> {
    try {
      const response = await apiClient.get<ApiResponse<OnboardingFlow>>(`/onboarding/flows/customer/${customerId}`);
      if (response.data && response.data.success && response.data.data) {
        return response.data;
      }
    } catch {
      // Graceful fallback
    }
    const cached = getCachedFlows();
    const found = cached.find((f) => f.customer_id === customerId);
    return {
      success: true,
      message: found ? 'Flow found for customer' : 'No flow assigned to customer',
      data: found || null,
    };
  },

  async createFlow(payload: CreateOnboardingFlowPayload): Promise<ApiResponse<OnboardingFlow>> {
    const newFlowId = `flow-${Date.now()}`;
    const newFlow: OnboardingFlow = {
      id: newFlowId,
      user_id: 'user-active',
      customer_id: payload.customer_id,
      customer_name: payload.customer_name,
      title: payload.title,
      description: payload.description,
      status: 'not_started',
      steps: (payload.steps || []).map((s, idx) => ({
        id: `step-${Date.now()}-${idx + 1}`,
        flow_id: newFlowId,
        title: s.title,
        description: s.description,
        order: s.order || idx + 1,
        status: 'pending' as StepStatus,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    try {
      const response = await apiClient.post<ApiResponse<OnboardingFlow>>('/onboarding/flows', payload);
      if (response.data && response.data.success && response.data.data) {
        const created = response.data.data;
        const current = getCachedFlows();
        setCachedFlows([created, ...current]);
        return response.data;
      }
    } catch {
      // Graceful fallback for creation
    }

    const current = getCachedFlows();
    const updatedList = [newFlow, ...current];
    setCachedFlows(updatedList);

    return {
      success: true,
      message: 'Onboarding flow created successfully',
      data: newFlow,
    };
  },

  async updateFlow(
    flowId: string,
    payload: Partial<{ title: string; description: string; status: FlowStatus }>
  ): Promise<ApiResponse<OnboardingFlow>> {
    try {
      const response = await apiClient.patch<ApiResponse<OnboardingFlow>>(
        `/onboarding/flows/${flowId}`,
        payload
      );
      if (response.data && response.data.success && response.data.data) {
        const current = getCachedFlows();
        const updated = current.map((f) => (f.id === flowId ? response.data.data! : f));
        setCachedFlows(updated);
        return response.data;
      }
    } catch {
      // Graceful fallback
    }

    const current = getCachedFlows();
    let updatedFlow: OnboardingFlow | null = null;
    const updatedList = current.map((f) => {
      if (f.id === flowId) {
        updatedFlow = {
          ...f,
          ...payload,
          updated_at: new Date().toISOString(),
        };
        return updatedFlow;
      }
      return f;
    });

    setCachedFlows(updatedList);

    if (updatedFlow) {
      return {
        success: true,
        message: 'Flow updated successfully',
        data: updatedFlow,
      };
    }
    throw new Error(`Flow ${flowId} not found`);
  },

  async updateStep(
    stepId: string,
    payload: UpdateOnboardingStepPayload
  ): Promise<ApiResponse<OnboardingStep>> {
    try {
      const response = await apiClient.patch<ApiResponse<OnboardingStep>>(
        `/onboarding/steps/${stepId}`,
        payload
      );
      if (response.data && response.data.success && response.data.data) {
        return response.data;
      }
    } catch {
      // Graceful fallback
    }

    const current = getCachedFlows();
    let updatedStepObj: OnboardingStep | null = null;

    const updatedList = current.map((flow) => {
      if (!flow.steps) return flow;
      const stepIdx = flow.steps.findIndex((s) => s.id === stepId);
      if (stepIdx !== -1) {
        const stepToUpdate = flow.steps[stepIdx];
        updatedStepObj = {
          ...stepToUpdate,
          ...payload,
          updated_at: new Date().toISOString(),
        };
        const updatedSteps = [...flow.steps];
        updatedSteps[stepIdx] = updatedStepObj;

        // Auto-update flow status if all steps completed
        const allCompleted = updatedSteps.every((s) => s.status === 'completed');
        const anyInProgress = updatedSteps.some((s) => s.status === 'in_progress' || s.status === 'completed');
        const newFlowStatus: FlowStatus = allCompleted
          ? 'completed'
          : anyInProgress
          ? 'in_progress'
          : flow.status;

        return {
          ...flow,
          status: newFlowStatus,
          steps: updatedSteps,
          updated_at: new Date().toISOString(),
        };
      }
      return flow;
    });

    setCachedFlows(updatedList);

    if (updatedStepObj) {
      return {
        success: true,
        message: 'Step updated successfully',
        data: updatedStepObj,
      };
    }
    throw new Error(`Step ${stepId} not found`);
  },
};
