import { FC, useEffect, useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, RefreshCw, Workflow, Search, X } from 'lucide-react';
import { Button, Card, Input, Select } from '@/components/common';
import { CardSkeleton, Toast } from '@/components/feedback';
import { CreateFlowModal, FlowCard } from '@/components/onboarding';
import { OnboardingFlow } from '@/types';
import { onboardingService } from '@/services';

export const OnboardingFlowPage: FC = () => {
  const navigate = useNavigate();
  const [flows, setFlows] = useState<OnboardingFlow[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Filter & Search state
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('recent');

  // Modal & Toast state
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
  }, []);

  const hideToast = useCallback(() => {
    setToast(null);
  }, []);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        setToast(null);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const fetchFlows = useCallback(async () => {
    setLoading(true);
    try {
      const response = await onboardingService.getFlows();
      if (response && response.data && Array.isArray(response.data)) {
        setFlows(response.data);
      } else {
        setFlows([]);
      }
    } catch {
      setFlows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFlows();
  }, [fetchFlows]);

  const handleSelectStep = (stepId: string) => {
    navigate(`/onboarding/step/${stepId}`);
  };

  const calculateFlowProgress = (flow: OnboardingFlow): number => {
    const steps = flow.steps || [];
    if (steps.length === 0) return 0;
    const completed = steps.filter((s) => s.status === 'completed' || s.status === 'skipped').length;
    return Math.round((completed / steps.length) * 100);
  };

  const filteredFlows = useMemo(() => {
    let result = flows.filter((flow) => {
      const matchesFilter =
        statusFilter === 'all' ? true : flow.status === statusFilter;
      const matchesSearch =
        searchQuery.trim() === ''
          ? true
          : flow.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (flow.customer_name &&
              flow.customer_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
            (flow.description &&
              flow.description.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesFilter && matchesSearch;
    });

    result.sort((a, b) => {
      if (sortBy === 'progress_high') {
        return calculateFlowProgress(b) - calculateFlowProgress(a);
      }
      if (sortBy === 'progress_low') {
        return calculateFlowProgress(a) - calculateFlowProgress(b);
      }
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

    return result;
  }, [flows, statusFilter, searchQuery, sortBy]);

  const handleClearFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setSortBy('recent');
  };

  const hasActiveFilters = searchQuery !== '' || statusFilter !== 'all' || sortBy !== 'recent';

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Onboarding Flows</h1>
          <p className="text-sm text-gray-500">
            Configure, manage, and track SaaS customer onboarding journeys.
          </p>
        </div>

        <div className="flex items-center space-x-3 self-start sm:self-auto">
          <Button
            variant="outline"
            size="md"
            onClick={fetchFlows}
            disabled={loading}
            aria-label="Refresh flows"
            title="Refresh flow list"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
          <Button variant="primary" size="md" onClick={() => setIsModalOpen(true)}>
            <Plus className="mr-1.5 h-4 w-4" /> Create Flow
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
        {/* Status Tabs */}
        <div className="flex flex-wrap items-center gap-1 bg-gray-100 p-1 rounded-lg">
          {['all', 'in_progress', 'completed', 'not_started'].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                statusFilter === status
                  ? 'bg-white text-gray-900 shadow-2xs font-semibold'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {status === 'all'
                ? 'All Flows'
                : status === 'in_progress'
                ? 'In Progress'
                : status === 'completed'
                ? 'Completed'
                : 'Not Started'}
            </button>
          ))}
        </div>

        {/* Search & Sort Controls */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative sm:w-56">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search flows or customers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 text-xs"
            />
          </div>

          <div className="w-44">
            <Select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              options={[
                { value: 'recent', label: 'Sort: Most Recent' },
                { value: 'progress_high', label: 'Progress: High to Low' },
                { value: 'progress_low', label: 'Progress: Low to High' },
              ]}
              className="py-1 text-xs"
            />
          </div>

          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearFilters}
              className="text-xs text-gray-500 hover:text-gray-700 py-1"
            >
              <X className="h-3.5 w-3.5 mr-1" /> Clear
            </Button>
          )}
        </div>
      </div>

      {/* Main Flow List View */}
      {loading ? (
        <div className="space-y-4">
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : filteredFlows.length === 0 ? (
        /* Empty State */
        <Card className="p-12 text-center border-gray-200">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 mb-4 border border-brand-100">
            <Workflow className="h-8 w-8" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 tracking-tight">
            {hasActiveFilters ? 'No matching onboarding flows found' : 'No onboarding flows found'}
          </h3>
          <p className="text-sm text-gray-500 mt-1.5 max-w-sm mx-auto leading-relaxed">
            {hasActiveFilters
              ? 'No onboarding flows match your filter or search parameters.'
              : 'Create your first onboarding flow to track customer onboarding progress.'}
          </p>
          <div className="mt-6 flex justify-center space-x-3">
            {hasActiveFilters ? (
              <Button variant="outline" size="md" onClick={handleClearFilters}>
                Clear Search & Filters
              </Button>
            ) : (
              <Button variant="primary" size="md" onClick={() => setIsModalOpen(true)}>
                <Plus className="mr-1.5 h-4 w-4" /> Create Flow
              </Button>
            )}
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredFlows.map((flow) => (
            <FlowCard
              key={flow.id}
              flow={flow}
              onRefresh={fetchFlows}
              onSelectStep={handleSelectStep}
              showToast={showToast}
            />
          ))}
        </div>
      )}

      {/* Create Flow Modal */}
      <CreateFlowModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={(msg) => {
          showToast(msg, 'success');
          fetchFlows();
        }}
        onError={(msg) => showToast(msg, 'error')}
      />
    </div>
  );
};
