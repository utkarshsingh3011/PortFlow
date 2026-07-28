import { FC, useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  Play,
  SkipForward,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  MessageSquare,
  Plus,
} from 'lucide-react';
import { Card, Button, Input } from '@/components/common';
import { Toast, LoadingSpinner } from '@/components/feedback';
import { StepFormWizard } from '@/components/onboarding/StepFormWizard';
import { OnboardingFlow, OnboardingStep, StepStatus } from '@/types';
import { onboardingService } from '@/services';

export const StepDetailsPage: FC = () => {
  const { stepId } = useParams<{ stepId: string }>();
  const navigate = useNavigate();

  const [step, setStep] = useState<OnboardingStep | null>(null);
  const [parentFlow, setParentFlow] = useState<OnboardingFlow | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Notes state
  const [newNote, setNewNote] = useState('');
  const [notesList, setNotesList] = useState<Array<{ text: string; date: string }>>([]);

  const fetchStepDetails = useCallback(async () => {
    if (!stepId) return;
    setLoading(true);
    setError(null);
    try {
      const flowsRes = await onboardingService.getFlows();
      if (flowsRes.data) {
        let foundStep: OnboardingStep | undefined;
        let foundFlow: OnboardingFlow | undefined;

        for (const flow of flowsRes.data) {
          if (flow.steps) {
            foundStep = flow.steps.find((s) => s.id === stepId);
            if (foundStep) {
              foundFlow = flow;
              break;
            }
          }
        }

        if (foundStep) {
          setStep(foundStep);
          setParentFlow(foundFlow || null);

          // Parse notes from description if formatted
          if (foundStep.description && foundStep.description.includes('--- Notes ---')) {
            const parts = foundStep.description.split('--- Notes ---');
            const parsedNotes = parts[1]
              .trim()
              .split('\n')
              .filter(Boolean)
              .map((line) => {
                const match = line.match(/^\[(.*?)\]\s*(.*)$/);
                return match ? { date: match[1], text: match[2] } : { date: '', text: line };
              });
            setNotesList(parsedNotes);
          } else {
            setNotesList([]);
          }
        } else {
          setError('Step not found in active onboarding flows.');
        }
      }
    } catch (err: unknown) {
      const msg = (err as Error)?.message || 'Failed to fetch step details';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [stepId]);

  useEffect(() => {
    fetchStepDetails();
  }, [fetchStepDetails]);

  // Find Next & Previous step in flow sequence
  const currentSteps = parentFlow?.steps || [];
  const currentIndex = currentSteps.findIndex((s) => s.id === stepId);
  const prevStep = currentIndex > 0 ? currentSteps[currentIndex - 1] : null;
  const nextStep =
    currentIndex >= 0 && currentIndex < currentSteps.length - 1 ? currentSteps[currentIndex + 1] : null;

  const handleSaveStepWizardData = async (formData: Record<string, any>, completeStep: boolean) => {
    if (!stepId || !step) return;
    setIsSaving(true);

    try {
      const newStatus: StepStatus = completeStep ? 'completed' : step.status === 'pending' ? 'in_progress' : step.status;

      const updated = await onboardingService.updateStep(stepId, {
        data: formData,
        status: newStatus,
      });

      setStep((prev) => (prev ? { ...prev, data: formData, status: newStatus } : null));
      window.dispatchEvent(new Event('portflow_data_changed'));

      if (completeStep) {
        setToast({ message: `Step #${step.order} completed successfully!`, type: 'success' });
        if (nextStep) {
          setTimeout(() => {
            navigate(`/onboarding/step/${nextStep.id}`);
          }, 400);
        } else {
          setToast({ message: `All onboarding steps completed! Flow finished.`, type: 'success' });
        }
      } else {
        setToast({ message: 'Progress saved successfully to database.', type: 'success' });
      }
    } catch (err: unknown) {
      const msg = (err as Error)?.message || 'Failed to save step progress';
      setToast({ message: msg, type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddNote = () => {
    if (!newNote.trim()) return;
    const dateStr = new Date().toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
    setNotesList((prev) => [{ text: newNote.trim(), date: dateStr }, ...prev]);
    setNewNote('');
  };

  const getStatusBadge = (status: StepStatus) => {
    switch (status) {
      case 'completed':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" /> Completed
          </span>
        );
      case 'in_progress':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-brand-50 text-brand-700 border border-brand-200">
            <Play className="w-3.5 h-3.5 mr-1.5" /> In Progress
          </span>
        );
      case 'skipped':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700 border border-gray-200">
            <SkipForward className="w-3.5 h-3.5 mr-1.5" /> Skipped
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="w-3.5 h-3.5 mr-1.5" /> Pending
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Top Bar Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate('/onboarding')}
        >
          <ArrowLeft className="h-4 w-4 mr-1.5" /> Back to Onboarding List
        </Button>

        <div className="flex items-center space-x-2">
          {prevStep && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(`/onboarding/step/${prevStep.id}`)}
              title={`Previous: ${prevStep.title}`}
            >
              <ChevronLeft className="h-4 w-4 mr-1" /> Previous Step
            </Button>
          )}
          {nextStep && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(`/onboarding/step/${nextStep.id}`)}
              title={`Next: ${nextStep.title}`}
            >
              Next Step <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          )}
        </div>
      </div>

      {loading ? (
        <Card className="p-12 text-center">
          <LoadingSpinner size="lg" />
          <p className="text-sm text-gray-500 mt-2">Loading customs step wizard...</p>
        </Card>
      ) : error ? (
        <Card className="p-8 text-center border-red-200 bg-red-50/50">
          <AlertCircle className="mx-auto h-10 w-10 text-red-500 mb-2" />
          <h3 className="text-base font-semibold text-gray-900">Error Loading Step</h3>
          <p className="text-sm text-red-600 mt-1">{error}</p>
        </Card>
      ) : step ? (
        <div className="space-y-6">
          {/* Header Card with Customer Info */}
          <Card className="border border-gray-200 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="px-2 py-0.5 rounded text-xs font-bold bg-brand-100 text-brand-700">
                    Step {step.order} of {currentSteps.length || 7}
                  </span>
                  {parentFlow?.customer_name && (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
                      Customer: {parentFlow.customer_name}
                    </span>
                  )}
                </div>
                <h1 className="text-xl font-bold text-gray-900 tracking-tight mt-1.5">
                  {step.title}
                </h1>
                {step.description && (
                  <p className="text-xs text-gray-500 mt-1">{step.description}</p>
                )}
              </div>
              <div>{getStatusBadge(step.status)}</div>
            </div>
          </Card>

          {/* Stepper Progress Navigation Bar */}
          {currentSteps.length > 0 && (
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs overflow-x-auto">
              <div className="flex items-center justify-between min-w-[640px] px-2">
                {currentSteps.map((s, idx) => {
                  const isActive = s.id === stepId;
                  const isCompleted = s.status === 'completed';
                  return (
                    <button
                      key={s.id}
                      onClick={() => navigate(`/onboarding/step/${s.id}`)}
                      className={`flex flex-col items-center space-y-1 group ${
                        isActive ? 'scale-105' : 'opacity-80 hover:opacity-100'
                      }`}
                    >
                      <div
                        className={`h-8 w-8 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                          isCompleted
                            ? 'bg-emerald-600 text-white'
                            : isActive
                            ? 'bg-brand-600 text-white ring-4 ring-brand-100'
                            : 'bg-gray-100 text-gray-600 group-hover:bg-gray-200'
                        }`}
                      >
                        {isCompleted ? '✓' : idx + 1}
                      </div>
                      <span
                        className={`text-[10px] font-semibold truncate max-w-[80px] text-center ${
                          isActive ? 'text-brand-600 font-bold' : 'text-gray-500'
                        }`}
                      >
                        Step {idx + 1}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Interactive Multi-Step Customs Wizard Form */}
          <Card className="border border-gray-200 shadow-xs">
            <StepFormWizard
              step={step}
              customerId={parentFlow?.customer_id}
              initialData={step.data || {}}
              onSave={handleSaveStepWizardData}
              onPrevious={() => prevStep && navigate(`/onboarding/step/${prevStep.id}`)}
              hasNext={Boolean(nextStep)}
              hasPrev={Boolean(prevStep)}
              isSaving={isSaving}
            />
          </Card>

          {/* Verification Notes & Audit Log */}
          <Card title="Step Notes & Verification Log" subtitle="Record broker notes and customs references">
            <div className="space-y-4 pt-2">
              <div className="flex gap-2">
                <Input
                  placeholder="Add a verification note (e.g. 'IEC confirmed on DGFT portal', 'PoA received via courier')..."
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  className="text-xs"
                />
                <Button variant="outline" size="sm" onClick={handleAddNote} className="shrink-0">
                  <Plus className="h-4 w-4 mr-1" /> Add Note
                </Button>
              </div>

              {notesList.length === 0 ? (
                <p className="text-xs text-gray-400 italic py-2">No custom notes recorded yet.</p>
              ) : (
                <div className="space-y-2 pt-2">
                  {notesList.map((note, idx) => (
                    <div
                      key={idx}
                      className="flex items-start space-x-2.5 p-3 rounded-lg border border-gray-100 bg-gray-50/70 text-xs"
                    >
                      <MessageSquare className="h-4 w-4 text-brand-600 shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-gray-900 font-medium">{note.text}</p>
                        {note.date && (
                          <span className="text-[10px] text-gray-400 font-mono mt-0.5 block">
                            {note.date}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>
        </div>
      ) : null}
    </div>
  );
};
