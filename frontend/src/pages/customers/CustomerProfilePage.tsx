import { FC, useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Edit3,
  Trash2,
  Play,
  CheckCircle2,
  Clock,
  Building2,
  Mail,
  FileText,
  Tag,
  Calendar,
  AlertCircle,
  Activity,
  ArrowRight,
  UserCheck,
} from 'lucide-react';
import { Button, Card, ConfirmDialog } from '@/components/common';
import { CardSkeleton, Toast } from '@/components/feedback';
import { CustomerModal } from '@/components/customers';
import { StepList } from '@/components/onboarding';
import { DocumentManager } from '@/components/documents/DocumentManager';
import { Customer, OnboardingFlow } from '@/types';
import { customerService, CustomerActivity } from '@/services/customerService';
import { onboardingService, documentService, CustomerDocument } from '@/services';
import { exportCustomerJSON, exportCustomerPDF } from '@/utils/exportUtils';

export const CustomerProfilePage: FC = () => {
  const { customerId } = useParams<{ customerId: string }>();
  const navigate = useNavigate();

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [flow, setFlow] = useState<OnboardingFlow | null>(null);
  const [activities, setActivities] = useState<CustomerActivity[]>([]);
  const [documents, setDocuments] = useState<CustomerDocument[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Modals & Dialogs
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  // Toast
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
  }, []);

  const hideToast = useCallback(() => {
    setToast(null);
  }, []);

  const fetchProfileData = useCallback(async () => {
    if (!customerId) return;
    setLoading(true);
    setError(null);

    try {
      // 1. Fetch Customer Details
      const custRes = await customerService.getCustomer(customerId);
      const custData = custRes.data || (custRes as unknown as Customer);
      if (custData && (custData as Customer).id) {
        setCustomer(custData as Customer);
      } else {
        throw new Error('Customer profile not found');
      }

      // 2. Fetch Onboarding Flow strictly for this customer (auto-provisions if missing)
      try {
        const flowRes = await onboardingService.getFlowByCustomerId(custData.id);
        setFlow(flowRes.data || null);
      } catch {
        setFlow(null);
      }

      // 3. Fetch Persistent Customer Activity Log from PostgreSQL
      try {
        const actRes = await customerService.getCustomerActivities(custData.id);
        if (actRes.success && Array.isArray(actRes.data)) {
          setActivities(actRes.data);
        }
      } catch {
        setActivities([]);
      }

      // 4. Fetch Customer Documents
      try {
        const docRes = await documentService.listCustomerDocuments(custData.id);
        if (docRes.success && Array.isArray(docRes.data)) {
          setDocuments(docRes.data);
        }
      } catch {
        setDocuments([]);
      }
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { detail?: string; message?: string } }; message?: string })
          ?.response?.data?.detail ||
        (err as { response?: { data?: { detail?: string; message?: string } }; message?: string })
          ?.response?.data?.message ||
        (err as Error)?.message ||
        'Unable to load customer profile';
      setError(msg);
      setCustomer(null);
    } finally {
      setLoading(false);
    }
  }, [customerId]);

  useEffect(() => {
    fetchProfileData();

    const handleDataChanged = () => {
      fetchProfileData();
    };

    window.addEventListener('portflow_data_changed', handleDataChanged);
    return () => {
      window.removeEventListener('portflow_data_changed', handleDataChanged);
    };
  }, [fetchProfileData]);

  const handleDeleteConfirm = async () => {
    if (!customer) return;
    setIsDeleting(true);

    try {
      await customerService.deleteCustomer(customer.id);
      window.dispatchEvent(new Event('portflow_data_changed'));
      showToast(`Customer '${customer.name}' deleted successfully`, 'success');
      navigate('/customers');
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { detail?: string; message?: string } }; message?: string })
          ?.response?.data?.detail ||
        (err as Error)?.message ||
        'Failed to delete customer';
      showToast(msg, 'error');
    } finally {
      setIsDeleting(false);
      setIsDeleteConfirmOpen(false);
    }
  };

  const handleStepStatusChange = async (stepId: string, newStatus: StepStatus) => {
    try {
      await onboardingService.updateStep(stepId, { status: newStatus });
      window.dispatchEvent(new Event('portflow_data_changed'));
      showToast('Step status updated', 'success');
      fetchProfileData();
    } catch (err: unknown) {
      const msg = (err as Error)?.message || 'Failed to update step status';
      showToast(msg, 'error');
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(date);
    } catch {
      return dateString;
    }
  };

  const getBadgeColor = (type?: string) => {
    switch (type?.toLowerCase()) {
      case 'corporate':
      case 'enterprise':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'smb':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'individual':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  // Onboarding stats calculation
  const steps = flow?.steps || [];
  const completedCount = steps.filter((s) => s.status === 'completed' || s.status === 'skipped').length;
  const pendingCount = steps.length - completedCount;
  const progressPercent = steps.length > 0 ? Math.round((completedCount / steps.length) * 100) : 0;

  // Active step to resume
  const activeStep = steps.find((s) => s.status === 'in_progress' || s.status === 'pending') || steps[steps.length - 1];

  const handleResumeOnboarding = () => {
    if (activeStep) {
      navigate(`/onboarding/step/${activeStep.id}`);
    } else {
      navigate('/onboarding');
    }
  };

  const getAccountStatusBadge = () => {
    if (progressPercent === 100) {
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <ShieldCheck className="w-3.5 h-3.5 mr-1" /> Active & Verified
        </span>
      );
    }
    if (progressPercent > 0) {
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-brand-50 text-brand-700 border border-brand-200">
          <Play className="w-3.5 h-3.5 mr-1" /> Onboarding In Progress
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
        <Clock className="w-3.5 h-3.5 mr-1" /> Pending Setup
      </span>
    );
  };

  const getActivityDotColor = (eventType: string) => {
    if (eventType.includes('completed')) return 'bg-emerald-500';
    if (eventType.includes('created')) return 'bg-brand-600';
    if (eventType.includes('updated')) return 'bg-purple-600';
    return 'bg-amber-500';
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}

      {/* Top Bar Navigation & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate('/customers')}
          aria-label="Back to customers list"
          className="self-start"
        >
          <ArrowLeft className="h-4 w-4 mr-1" /> Back to Customers List
        </Button>

        {customer && (
          <div className="flex flex-wrap items-center gap-2.5">
            <Button
              variant="outline"
              size="sm"
              onClick={() => exportCustomerPDF(customer, flow, documents, activities)}
              title="Export Printable PDF Report"
            >
              Export PDF
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => exportCustomerJSON(customer, flow, documents, activities)}
              title="Export Structured JSON File"
            >
              Export JSON
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditModalOpen(true)}
            >
              <Edit3 className="h-4 w-4 mr-1.5" /> Edit Profile
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsDeleteConfirmOpen(true)}
              className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
            >
              <Trash2 className="h-4 w-4 mr-1.5" /> Delete Account
            </Button>
            {activeStep && flow?.status !== 'completed' && (
              <Button
                variant="primary"
                size="sm"
                onClick={handleResumeOnboarding}
              >
                <Play className="h-4 w-4 mr-1.5" /> Resume Onboarding
              </Button>
            )}
          </div>
        )}
      </div>

      {loading ? (
        <div className="space-y-6">
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : error ? (
        <Card className="p-10 text-center border-red-200 bg-red-50/50">
          <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-3" />
          <h3 className="text-base font-semibold text-gray-900">Customer Profile Error</h3>
          <p className="text-sm text-red-600 mt-1 max-w-md mx-auto">{error}</p>
          <div className="mt-4">
            <Button variant="outline" size="sm" onClick={fetchProfileData}>
              Try Again
            </Button>
          </div>
        </Card>
      ) : !customer ? (
        <Card className="p-12 text-center border-gray-200">
          <Building2 className="mx-auto h-12 w-12 text-gray-400 mb-3" />
          <h3 className="text-lg font-semibold text-gray-900">Customer Not Found</h3>
          <p className="text-sm text-gray-500 mt-1 max-w-sm mx-auto">
            The requested customer profile could not be located.
          </p>
          <div className="mt-6">
            <Button variant="primary" size="md" onClick={() => navigate('/customers')}>
              Return to Customers List
            </Button>
          </div>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* CRM Hero Header Card */}
          <Card className="border border-gray-200 shadow-xs bg-white overflow-hidden p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex items-start space-x-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-600 text-white font-bold text-2xl shadow-sm shrink-0">
                  {customer.name.substring(0, 2).toUpperCase()}
                </div>
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">{customer.name}</h1>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getBadgeColor(
                        customer.customer_type
                      )}`}
                    >
                      {customer.customer_type}
                    </span>
                    {getAccountStatusBadge()}
                  </div>
                  <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500 pt-1">
                    <span className="flex items-center">
                      <Mail className="h-3.5 w-3.5 mr-1 text-gray-400" /> {customer.email}
                    </span>
                    {customer.gstin && (
                      <span className="flex items-center font-mono">
                        <FileText className="h-3.5 w-3.5 mr-1 text-gray-400" /> GSTIN: {customer.gstin}
                      </span>
                    )}
                    <span className="flex items-center">
                      <Calendar className="h-3.5 w-3.5 mr-1 text-gray-400" /> Joined {formatDate(customer.created_at)}
                    </span>
                  </div>
                </div>
              </div>

              {activeStep && flow?.status !== 'completed' && (
                <div className="shrink-0 bg-brand-50/70 p-4 rounded-xl border border-brand-100 flex flex-col justify-center">
                  <span className="text-[11px] font-bold text-brand-700 uppercase tracking-wider">
                    Current Active Stage
                  </span>
                  <p className="text-sm font-bold text-gray-900 mt-0.5 truncate max-w-xs">
                    {activeStep.title}
                  </p>
                  <button
                    onClick={handleResumeOnboarding}
                    className="text-xs font-bold text-brand-600 hover:text-brand-700 flex items-center mt-2 group"
                  >
                    Resume Stage <ArrowRight className="h-3.5 w-3.5 ml-1 transition-transform group-hover:translate-x-0.5" />
                  </button>
                </div>
              )}
            </div>
          </Card>

          {/* Metric Summary Widgets Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500">Onboarding Completion</p>
                <p className="text-2xl font-bold text-brand-600 tracking-tight mt-0.5">{progressPercent}%</p>
              </div>
              <div className="p-2.5 rounded-xl bg-brand-50 text-brand-600">
                <Activity className="h-5 w-5" />
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500">Completed Steps</p>
                <p className="text-2xl font-bold text-emerald-600 tracking-tight mt-0.5">
                  {completedCount} / {steps.length}
                </p>
              </div>
              <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600">
                <CheckCircle2 className="h-5 w-5" />
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500">Pending Actions</p>
                <p className="text-2xl font-bold text-amber-500 tracking-tight mt-0.5">{pendingCount}</p>
              </div>
              <div className="p-2.5 rounded-xl bg-amber-50 text-amber-500">
                <Clock className="h-5 w-5" />
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500">Compliance Standing</p>
                <p className="text-base font-bold text-gray-900 tracking-tight mt-1 capitalize">
                  {progressPercent === 100 ? 'Fully Verified' : 'In Review'}
                </p>
              </div>
              <div className="p-2.5 rounded-xl bg-purple-50 text-purple-600">
                <UserCheck className="h-5 w-5" />
              </div>
            </div>
          </div>

          {/* CRM Main Grid View: Left (Company Vault & Activity) | Right (Onboarding Workflow) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column: Company Information Vault & Activity Timeline */}
            <div className="lg:col-span-1 space-y-6">
              {/* Company Information Vault */}
              <Card title="Company Information" className="border border-gray-200 shadow-xs">
                <div className="space-y-4 pt-2 text-xs">
                  <div className="flex items-center space-x-3 text-gray-700">
                    <Building2 className="h-4 w-4 text-gray-400 shrink-0" />
                    <div>
                      <p className="text-[11px] text-gray-500 font-medium">Legal Business Name</p>
                      <p className="font-semibold text-gray-900 text-sm">{customer.name}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 text-gray-700">
                    <Mail className="h-4 w-4 text-gray-400 shrink-0" />
                    <div>
                      <p className="text-[11px] text-gray-500 font-medium">Primary Contact Email</p>
                      <p className="font-semibold text-gray-900">{customer.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 text-gray-700">
                    <FileText className="h-4 w-4 text-gray-400 shrink-0" />
                    <div>
                      <p className="text-[11px] text-gray-500 font-medium">GSTIN Registration</p>
                      <p className="font-mono text-gray-900 font-semibold">
                        {customer.gstin || <span className="text-gray-400 font-sans">Not Provided</span>}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 text-gray-700">
                    <Tag className="h-4 w-4 text-gray-400 shrink-0" />
                    <div>
                      <p className="text-[11px] text-gray-500 font-medium">Customer Category</p>
                      <p className="font-semibold text-gray-900">{customer.customer_type}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 text-gray-700">
                    <Calendar className="h-4 w-4 text-gray-400 shrink-0" />
                    <div>
                      <p className="text-[11px] text-gray-500 font-medium">Created Date</p>
                      <p className="font-medium text-gray-900">{formatDate(customer.created_at)}</p>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Customs Document Vault Card */}
              <Card title="Customs Document Vault" subtitle="Upload and manage customer KYC files" className="border border-gray-200 shadow-xs">
                <DocumentManager customerId={customer.id} onDocumentChange={fetchProfileData} />
              </Card>

              {/* Persistent Activity History & Audit Log */}
              <Card
                title="Activity History & Audit Log"
                subtitle="Persistent PostgreSQL event timeline"
                className="border border-gray-200 shadow-xs"
              >
                <div className="space-y-4 pt-2">
                  {activities.length === 0 ? (
                    <div className="relative pl-5 border-l-2 border-gray-200 space-y-4 text-xs">
                      <div className="relative">
                        <div className="absolute -left-[27px] top-0 h-3.5 w-3.5 rounded-full bg-brand-600 border-2 border-white" />
                        <p className="font-semibold text-gray-900">Customer Account Created</p>
                        <p className="text-gray-500 text-[11px] mt-0.5">{formatDate(customer.created_at)}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="relative pl-5 border-l-2 border-gray-200 space-y-4 text-xs">
                      {activities.map((act) => (
                        <div key={act.id} className="relative">
                          <div
                            className={`absolute -left-[27px] top-0.5 h-3.5 w-3.5 rounded-full border-2 border-white ${getActivityDotColor(
                              act.event_type
                            )}`}
                          />
                          <p className="font-semibold text-gray-900">{act.title}</p>
                          {act.description && (
                            <p className="text-gray-600 text-xs mt-0.5 leading-relaxed">{act.description}</p>
                          )}
                          <p className="text-gray-400 text-[10px] font-mono mt-1">
                            {formatDate(act.created_at)}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </Card>
            </div>

            {/* Right Column: Assigned Customs Onboarding Workflow (2 Columns) */}
            <div className="lg:col-span-2 space-y-6">
              {/* Onboarding Progress Card */}
              <Card title="Assigned Customs Broker Workflow" className="border border-gray-200 shadow-xs">
                <div className="space-y-4 mt-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <h4 className="text-base font-bold text-gray-900">
                        {flow ? flow.title : 'Customs Broker Onboarding Journey'}
                      </h4>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {flow?.description || 'Standard Customs Broker KYC, Authorization, ICEGATE & Compliance Onboarding Workflow'}
                      </p>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div>
                    <div className="flex justify-between items-center text-xs font-medium text-gray-600 mb-1.5">
                      <span>
                        {completedCount} of {steps.length} steps completed
                        {activeStep && flow?.status !== 'completed' && (
                          <span className="text-brand-600 font-semibold ml-2">• Active: {activeStep.title}</span>
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
                </div>
              </Card>

              {/* Onboarding Steps List Card */}
              <Card title="Workflow Step Management" className="border border-gray-200 shadow-xs">
                {steps.length === 0 ? (
                  <div className="py-8 text-center text-gray-500 text-sm">
                    No onboarding steps configured for this customer.
                  </div>
                ) : (
                  <div className="mt-2">
                    <StepList
                      steps={steps}
                      onStepStatusChange={handleStepStatusChange}
                      onSelectStep={(stepId) => navigate(`/onboarding/step/${stepId}`)}
                    />
                  </div>
                )}
              </Card>
            </div>
          </div>
        </div>
      )}

      {/* Edit Customer Modal */}
      {customer && (
        <CustomerModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          customer={customer}
          onSuccess={(msg) => {
            showToast(msg, 'success');
            fetchProfileData();
          }}
          onError={(msg) => showToast(msg, 'error')}
        />
      )}

      {/* Accessible Confirm Delete Dialog */}
      {customer && (
        <ConfirmDialog
          isOpen={isDeleteConfirmOpen}
          onClose={() => setIsDeleteConfirmOpen(false)}
          onConfirm={handleDeleteConfirm}
          title="Delete Customer"
          message={`Are you sure you want to delete customer "${customer.name}"? This action cannot be undone.`}
          confirmText="Delete Customer"
          cancelText="Cancel"
          variant="danger"
          isLoading={isDeleting}
        />
      )}
    </div>
  );
};
