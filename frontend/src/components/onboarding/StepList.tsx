import { FC } from 'react';
import { ExternalLink, CheckCircle2, Clock, Play, SkipForward } from 'lucide-react';
import { Button, Select } from '@/components/common';
import { OnboardingStep, StepStatus } from '@/types';

export interface StepListProps {
  steps: OnboardingStep[];
  onStepStatusChange: (stepId: string, status: StepStatus) => void;
  onSelectStep?: (stepId: string) => void;
}

const STEP_STATUS_OPTIONS = [
  { value: 'pending', label: 'Pending' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'skipped', label: 'Skipped' },
];

export const StepList: FC<StepListProps> = ({
  steps,
  onStepStatusChange,
  onSelectStep,
}) => {
  if (!steps || steps.length === 0) {
    return (
      <p className="text-sm text-gray-500 italic py-2">No steps configured for this flow.</p>
    );
  }

  const getStepIcon = (status: StepStatus) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />;
      case 'in_progress':
        return <Play className="h-4 w-4 text-brand-600 shrink-0" />;
      case 'skipped':
        return <SkipForward className="h-4 w-4 text-gray-400 shrink-0" />;
      default:
        return <Clock className="h-4 w-4 text-amber-500 shrink-0" />;
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } catch {
      return '';
    }
  };

  return (
    <div className="space-y-2.5">
      {steps.map((step, idx) => (
        <div
          key={step.id || idx}
          className={`flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-xl border transition-all gap-3 ${
            step.status === 'completed'
              ? 'bg-emerald-50/40 border-emerald-200/80'
              : step.status === 'in_progress'
              ? 'bg-brand-50/40 border-brand-200/80'
              : 'bg-gray-50/60 border-gray-200'
          }`}
        >
          <div className="flex items-start space-x-3">
            <div className="mt-1">{getStepIcon(step.status)}</div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold text-gray-500 bg-gray-200/70 px-1.5 py-0.5 rounded">
                  Step {step.order || idx + 1}
                </span>
                <h5 className="text-sm font-semibold text-gray-900">{step.title}</h5>
                {step.updated_at && (
                  <span className="text-[10px] text-gray-400 font-mono">
                    {formatDate(step.updated_at)}
                  </span>
                )}
              </div>
              {step.description && (
                <p className="text-xs text-gray-600 mt-1 leading-relaxed">{step.description}</p>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-2 self-end sm:self-auto shrink-0">
            <Select
              value={step.status}
              onChange={(e) => onStepStatusChange(step.id, e.target.value as StepStatus)}
              options={STEP_STATUS_OPTIONS}
              className="py-1 text-xs w-32 font-medium"
            />
            {onSelectStep && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onSelectStep(step.id)}
                aria-label={`View step details for ${step.title}`}
                title="View & Edit Step Details"
                className="text-xs py-1"
              >
                <ExternalLink className="h-3.5 w-3.5 mr-1" /> Edit
              </Button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};
