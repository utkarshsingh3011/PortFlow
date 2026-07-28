import { FC, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, ChevronUp, CheckCircle2, Clock, Play, ListOrdered, ArrowRight } from 'lucide-react';
import { Card, Button } from '@/components/common';
import { OnboardingFlow, FlowStatus, StepStatus } from '@/types';
import { StepList } from './StepList';
import { onboardingService } from '@/services';

export interface FlowCardProps {
  flow: OnboardingFlow;
  onRefresh: () => void;
  onSelectStep?: (stepId: string) => void;
  showToast?: (message: string, type: 'success' | 'error') => void;
}

export const FlowCard: FC<FlowCardProps> = ({
  flow,
  onRefresh,
  onSelectStep,
  showToast,
}) => {
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const steps = flow.steps || [];
  const completedCount = steps.filter((s) => s.status === 'completed' || s.status === 'skipped').length;
  const progressPercent = steps.length > 0 ? Math.round((completedCount / steps.length) * 100) : 0;

  // Find next pending or in_progress step to resume onboarding
  const activeStep = steps.find((s) => s.status === 'in_progress' || s.status === 'pending') || steps[steps.length - 1];

  const handleStatusChange = async (newStatus: FlowStatus) => {
    setUpdatingStatus(true);
    try {
      await onboardingService.updateFlow(flow.id, { status: newStatus });
      window.dispatchEvent(new Event('portflow_data_changed'));
      if (showToast) showToast(`Flow status updated to ${newStatus.replace('_', ' ')}`, 'success');
      onRefresh();
    } catch (err: unknown) {
      const msg = (err as Error)?.message || 'Failed to update flow status';
      if (showToast) showToast(msg, 'error');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleResumeOnboarding = () => {
    if (activeStep) {
      if (onSelectStep) {
        onSelectStep(activeStep.id);
      } else {
        navigate(`/onboarding/step/${activeStep.id}`);
      }
    }
  };

  const getStatusBadge = (status: FlowStatus) => {
    switch (status) {
      case 'completed':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 mr-1" /> Completed
          </span>
        );
      case 'in_progress':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-brand-50 text-brand-700 border border-brand-200">
            <Play className="w-3 h-3 mr-1" /> In Progress
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200">
            <Clock className="w-3 h-3 mr-1" /> Not Started
          </span>
        );
    }
  };

  const handleStepStatusChange = async (stepId: string, newStatus: StepStatus) => {
    try {
      await onboardingService.updateStep(stepId, { status: newStatus });
      window.dispatchEvent(new Event('portflow_data_changed'));
      if (showToast) showToast('Step status updated', 'success');
      onRefresh();
    } catch (err: unknown) {
      const msg = (err as Error)?.message || 'Failed to update step status';
      if (showToast) showToast(msg, 'error');
    }
  };

  return (
    <Card className="transition-all duration-200 hover:shadow-md hover:border-gray-300">
      <div className="space-y-4">
        {/* Header Row */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-lg font-semibold text-gray-900 tracking-tight">{flow.title}</h3>
              {getStatusBadge(flow.status)}
              {flow.customer_name && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-50 text-purple-700 border border-purple-200">
                  Customer: {flow.customer_name}
                </span>
              )}
            </div>
            {flow.description && (
              <p className="text-sm text-gray-500 mt-1">{flow.description}</p>
            )}
          </div>

          {/* Quick Flow Actions */}
          <div className="flex items-center space-x-2 shrink-0">
            {activeStep && flow.status !== 'completed' && (
              <Button
                variant="primary"
                size="sm"
                onClick={handleResumeOnboarding}
                title={`Resume step: ${activeStep.title}`}
              >
                <Play className="h-3.5 w-3.5 mr-1" /> Resume Onboarding
              </Button>
            )}
            {flow.status === 'completed' && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleResumeOnboarding}
              >
                View Steps <ArrowRight className="h-3.5 w-3.5 ml-1" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setExpanded(!expanded)}
              aria-label={expanded ? 'Hide steps' : 'View steps'}
            >
              <ListOrdered className="h-4 w-4 mr-1" />
              {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {/* Progress Bar */}
        <div>
          <div className="flex justify-between items-center text-xs font-medium text-gray-600 mb-1.5">
            <span>
              {completedCount} of {steps.length} steps completed
              {activeStep && flow.status !== 'completed' && (
                <span className="text-brand-600 font-semibold ml-2">• Next: {activeStep.title}</span>
              )}
            </span>
            <span className="font-bold text-gray-900">{progressPercent}%</span>
          </div>
          <div className="w-full h-2.5 rounded-full bg-gray-100 overflow-hidden">
            <div
              className={`h-full transition-all duration-300 rounded-full ${
                progressPercent === 100 ? 'bg-emerald-500' : 'bg-brand-600'
              }`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Expanded Steps Manager */}
        {expanded && (
          <div className="pt-4 border-t border-gray-100 animate-in fade-in duration-150">
            <h4 className="text-sm font-semibold text-gray-900 mb-3">Customs Onboarding Steps</h4>
            <StepList
              steps={steps}
              onStepStatusChange={handleStepStatusChange}
              onSelectStep={onSelectStep}
            />
          </div>
        )}
      </div>
    </Card>
  );
};
