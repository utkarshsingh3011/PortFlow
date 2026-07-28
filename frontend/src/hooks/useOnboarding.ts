import { useState, useCallback } from 'react';
import { OnboardingFlow, OnboardingStep } from '@/types';
import { onboardingService } from '@/services/onboardingService';

export const useOnboarding = () => {
  const [flows, setFlows] = useState<OnboardingFlow[]>([]);
  const [activeFlow, setActiveFlow] = useState<OnboardingFlow | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchFlows = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await onboardingService.getFlows();
      if (response.data) {
        setFlows(response.data);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch onboarding flows');
    } finally {
      setLoading(false);
    }
  }, []);

  const completeStep = useCallback(async (stepId: string) => {
    try {
      await onboardingService.updateStep(stepId, { status: 'completed' });
    } catch (err: any) {
      setError(err.message || 'Failed to update step');
    }
  }, []);

  return {
    flows,
    activeFlow,
    loading,
    error,
    fetchFlows,
    setActiveFlow,
    completeStep,
  };
};
