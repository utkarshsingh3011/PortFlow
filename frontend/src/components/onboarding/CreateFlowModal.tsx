import { FC, useState, useEffect } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Modal, Input, Button } from '@/components/common';
import { CreateOnboardingFlowPayload, Customer, OnboardingFlow } from '@/types';
import { onboardingService, customerService } from '@/services';
import { useAuth } from '@/hooks';

export interface CreateFlowModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
}

export const CreateFlowModal: FC<CreateFlowModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  onError,
}) => {
  const { user } = useAuth();
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [steps, setSteps] = useState<Array<{ title: string; description: string }>>([
    { title: 'Initial Document Verification', description: 'Upload and verify business registration documents' },
    { title: 'Account Setup', description: 'Configure customer preferences and billing info' },
  ]);

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [existingFlows, setExistingFlows] = useState<OnboardingFlow[]>([]);
  const [loadingData, setLoadingData] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      const fetchData = async () => {
        setLoadingData(true);
        try {
          const [custRes, flowsRes] = await Promise.all([
            customerService.getCustomers(1, 100, user?.id),
            onboardingService.getFlows(),
          ]);

          const custItems = (custRes as any)?.data?.items || (custRes as any)?.items || [];
          setCustomers(custItems);

          const flowItems = flowsRes.data || [];
          setExistingFlows(flowItems);
        } catch {
          // Ignore
        } finally {
          setLoadingData(false);
        }
      };
      fetchData();
    }
  }, [isOpen, user?.id]);

  const assignedCustomerIds = new Set(
    existingFlows.map((f) => f.customer_id).filter(Boolean)
  );

  const handleAddStep = () => {
    setSteps((prev) => [
      ...prev,
      { title: `Step ${prev.length + 1}`, description: '' },
    ]);
  };

  const handleRemoveStep = (index: number) => {
    setSteps((prev) => prev.filter((_, i) => i !== index));
  };

  const handleStepChange = (index: number, field: 'title' | 'description', value: string) => {
    setSteps((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomerId) {
      setFormError('Please select a customer for this onboarding flow.');
      return;
    }

    if (assignedCustomerIds.has(selectedCustomerId)) {
      setFormError('This customer already has an assigned onboarding flow.');
      return;
    }

    if (!title.trim()) {
      setFormError('Flow title is required');
      return;
    }

    setSubmitting(true);
    setFormError(null);

    const selectedCust = customers.find((c) => c.id === selectedCustomerId);

    const payload: CreateOnboardingFlowPayload = {
      customer_id: selectedCustomerId,
      customer_name: selectedCust?.name || 'Customer',
      title: title.trim(),
      description: description.trim() || undefined,
      steps: steps.map((s, idx) => ({
        title: s.title.trim() || `Step ${idx + 1}`,
        description: s.description.trim() || undefined,
        order: idx + 1,
      })),
    };

    try {
      await onboardingService.createFlow(payload);
      window.dispatchEvent(new Event('portflow_data_changed'));
      onSuccess('Onboarding flow created successfully!');
      onClose();
      // Reset form
      setSelectedCustomerId('');
      setTitle('');
      setDescription('');
      setSteps([
        { title: 'Initial Document Verification', description: 'Upload and verify business registration documents' },
        { title: 'Account Setup', description: 'Configure customer preferences and billing info' },
      ]);
    } catch (err: unknown) {
      const errorMsg =
        (err as { response?: { data?: { detail?: string; message?: string } }; message?: string })
          ?.response?.data?.detail ||
        (err as { response?: { data?: { detail?: string; message?: string } }; message?: string })
          ?.response?.data?.message ||
        (err as Error)?.message ||
        'Failed to create onboarding flow';
      setFormError(errorMsg);
      onError(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create Onboarding Flow">
      <form onSubmit={handleSubmit} className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">
        {formError && (
          <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700 border border-red-200">
            {formError}
          </div>
        )}

        {/* Customer Select Field */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wider">
            Select Customer <span className="text-red-500">*</span>
          </label>
          <select
            value={selectedCustomerId}
            onChange={(e) => setSelectedCustomerId(e.target.value)}
            disabled={loadingData || submitting}
            required
            className="w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-900 focus:border-brand-500 focus:outline-hidden focus:ring-2 focus:ring-brand-500/20 disabled:bg-gray-50"
          >
            <option value="">-- Choose a Customer --</option>
            {customers.map((cust) => {
              const hasFlow = assignedCustomerIds.has(cust.id);
              return (
                <option key={cust.id} value={cust.id} disabled={hasFlow}>
                  {cust.name} ({cust.email}){hasFlow ? ' - Flow Assigned' : ''}
                </option>
              );
            })}
          </select>
          {customers.length === 0 && !loadingData && (
            <p className="text-xs text-amber-600 mt-1">
              No customers found. Please create a customer first.
            </p>
          )}
        </div>

        <Input
          label="Flow Title"
          placeholder="e.g. Corporate Client Journey"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />

        <Input
          label="Description (Optional)"
          placeholder="e.g. Standard 5-step onboarding flow for corporate clients"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        <div className="pt-2 border-t border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold text-gray-900">Flow Steps ({steps.length})</h4>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddStep}
            >
              <Plus className="h-3.5 w-3.5 mr-1" /> Add Step
            </Button>
          </div>

          <div className="space-y-3">
            {steps.map((step, idx) => (
              <div
                key={idx}
                className="p-3 rounded-lg border border-gray-200 bg-gray-50/50 space-y-2 relative"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Step {idx + 1}
                  </span>
                  {steps.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveStep(idx)}
                      className="text-gray-400 hover:text-red-600 rounded p-1 transition-colors"
                      aria-label="Remove step"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>

                <Input
                  placeholder="Step Title"
                  value={step.title}
                  onChange={(e) => handleStepChange(idx, 'title', e.target.value)}
                  className="bg-white"
                />

                <Input
                  placeholder="Step Description (Optional)"
                  value={step.description}
                  onChange={(e) => handleStepChange(idx, 'description', e.target.value)}
                  className="bg-white"
                />
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100">
          <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button type="submit" isLoading={submitting}>
            Create Flow
          </Button>
        </div>
      </form>
    </Modal>
  );
};
