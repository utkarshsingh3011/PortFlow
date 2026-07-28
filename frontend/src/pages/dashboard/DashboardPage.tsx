import { FC, useEffect, useState, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  RefreshCw,
  Users,
  Activity,
  CheckCircle2,
  Clock,
  Play,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';
import { Card, Button } from '@/components/common';
import { CardSkeleton } from '@/components/feedback';
import { customerService, onboardingService, CustomerActivity } from '@/services';
import { useAuth } from '@/hooks';
import { Customer, OnboardingFlow, OnboardingStep } from '@/types';

export const DashboardPage: FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState<boolean>(true);

  // Data states driven 100% by PostgreSQL
  const [recentCustomers, setRecentCustomers] = useState<Customer[]>([]);
  const [activeFlows, setActiveFlows] = useState<OnboardingFlow[]>([]);
  const [pendingTasks, setPendingTasks] = useState<
    Array<{ step: OnboardingStep; flow: OnboardingFlow }>
  >([]);
  const [recentActivities, setRecentActivities] = useState<CustomerActivity[]>([]);

  const [stats, setStats] = useState({
    totalCustomers: 0,
    activeFlowsCount: 0,
    completedStepsCount: 0,
    pendingActionsCount: 0,
    completionPercentage: 0,
  });

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    let custItems: Customer[] = [];
    let custTotal = 0;
    let flowsList: OnboardingFlow[] = [];
    let completedSteps = 0;
    let pendingActions = 0;
    let totalSteps = 0;
    const taskQueue: Array<{ step: OnboardingStep; flow: OnboardingFlow }> = [];

    // 1. Fetch Recent Customers for broker from PostgreSQL
    try {
      const custRes = await customerService.getCustomers(1, 10, user?.id);
      if (custRes?.data) {
        custItems = custRes.data.items || [];
        custTotal = custRes.data.total || custItems.length;
        setRecentCustomers(custItems);
      }
    } catch {
      // Handled silently
    }

    // 2. Fetch Onboarding Flows from PostgreSQL
    try {
      const flowsRes = await onboardingService.getFlows();
      if (flowsRes && flowsRes.data && Array.isArray(flowsRes.data)) {
        flowsList = flowsRes.data;

        flowsList.forEach((flow) => {
          if (flow.steps && Array.isArray(flow.steps)) {
            flow.steps.forEach((step) => {
              totalSteps++;
              if (step.status === 'completed' || step.status === 'skipped') {
                completedSteps++;
              } else if (step.status === 'pending' || step.status === 'in_progress') {
                pendingActions++;
                taskQueue.push({ step, flow });
              }
            });
          }
        });

        const activeList = flowsList.filter((f) => f.status !== 'completed');
        setActiveFlows(activeList);
      }
    } catch {
      // Handled silently
    }

    // 3. Fetch Recent Broker Activity Log Events from PostgreSQL
    try {
      const actRes = await customerService.getRecentBrokerActivities(10);
      if (actRes.success && Array.isArray(actRes.data)) {
        setRecentActivities(actRes.data);
      } else {
        setRecentActivities([]);
      }
    } catch {
      setRecentActivities([]);
    }

    const compPercent =
      totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;

    setPendingTasks(taskQueue.slice(0, 6));
    setStats({
      totalCustomers: custTotal,
      activeFlowsCount: flowsList.filter((f) => f.status !== 'completed').length,
      completedStepsCount: completedSteps,
      pendingActionsCount: pendingActions,
      completionPercentage: compPercent,
    });

    setLoading(false);
  }, [user?.id]);

  useEffect(() => {
    fetchDashboardData();

    const handleDataChanged = () => {
      fetchDashboardData();
    };

    window.addEventListener('portflow_data_changed', handleDataChanged);
    return () => {
      window.removeEventListener('portflow_data_changed', handleDataChanged);
    };
  }, [fetchDashboardData]);

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

  return (
    <div className="space-y-6">
      {/* Broker Workspace Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            Broker Operational Workspace
          </h1>
          <p className="text-sm text-gray-500">
            Real-time customs clearance onboarding & customer management dashboard.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchDashboardData}
          disabled={loading}
          className="self-start sm:self-auto"
        >
          <RefreshCw className={`mr-1.5 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Sync Data
        </Button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Operational KPI Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="transition-all duration-200 hover:shadow-md hover:border-gray-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-500">Total Registered Customers</p>
                  <p className="text-3xl font-bold text-indigo-600 tracking-tight mt-1">
                    {stats.totalCustomers}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-indigo-50 text-indigo-600">
                  <Users className="h-6 w-6" />
                </div>
              </div>
            </Card>

            <Card className="transition-all duration-200 hover:shadow-md hover:border-gray-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-500">Active Onboarding Journeys</p>
                  <p className="text-3xl font-bold text-brand-600 tracking-tight mt-1">
                    {stats.activeFlowsCount}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-brand-50 text-brand-600">
                  <Activity className="h-6 w-6" />
                </div>
              </div>
            </Card>

            <Card className="transition-all duration-200 hover:shadow-md hover:border-gray-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-500">Completed Verification Steps</p>
                  <p className="text-3xl font-bold text-emerald-600 tracking-tight mt-1">
                    {stats.completedStepsCount}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
              </div>
            </Card>

            <Card className="transition-all duration-200 hover:shadow-md hover:border-gray-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-500">Avg Customs Progress</p>
                  <p className="text-3xl font-bold text-amber-500 tracking-tight mt-1">
                    {stats.completionPercentage}%
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-amber-50 text-amber-500">
                  <Clock className="h-6 w-6" />
                </div>
              </div>
            </Card>
          </div>

          {/* Resume Onboarding Shortcuts Banner */}
          {activeFlows.length > 0 && (
            <Card title="Active Journeys & Resume Shortcuts" className="border border-brand-200 bg-linear-to-r from-brand-50/50 to-purple-50/30 shadow-xs">
              <div className="space-y-3 mt-2">
                {activeFlows.slice(0, 3).map((flow) => {
                  const steps = flow.steps || [];
                  const activeStep =
                    steps.find((s) => s.status === 'in_progress' || s.status === 'pending') ||
                    steps[0];
                  const completed = steps.filter(
                    (s) => s.status === 'completed' || s.status === 'skipped'
                  ).length;
                  const percent =
                    steps.length > 0 ? Math.round((completed / steps.length) * 100) : 0;

                  return (
                    <div
                      key={flow.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-xl border border-white bg-white/90 shadow-2xs gap-3"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className="text-xs font-bold text-gray-900">{flow.title}</span>
                          {flow.customer_name && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-purple-50 text-purple-700 border border-purple-200">
                              {flow.customer_name}
                            </span>
                          )}
                        </div>
                        {activeStep && (
                          <p className="text-xs text-gray-500">
                            Active Step: <span className="font-semibold text-brand-700">{activeStep.title}</span>
                          </p>
                        )}
                      </div>

                      <div className="flex items-center space-x-4 shrink-0">
                        <div className="w-28 space-y-1 hidden md:block">
                          <div className="flex justify-between text-[10px] font-semibold text-gray-600">
                            <span>Progress</span>
                            <span>{percent}%</span>
                          </div>
                          <div className="w-full h-1.5 rounded-full bg-gray-100 overflow-hidden">
                            <div
                              className="h-full bg-brand-600 rounded-full"
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                        </div>

                        {activeStep && (
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => navigate(`/onboarding/step/${activeStep.id}`)}
                          >
                            <Play className="h-3.5 w-3.5 mr-1" /> Resume Step
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}

          {/* Main Operational Workspace Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column (2 Cols): Recent Customers & Pending Tasks */}
            <div className="lg:col-span-2 space-y-6">
              {/* Recent Customers Table */}
              <Card
                title="Recent Customers"
                subtitle="Latest onboarding customer profiles"
                action={
                  <Button variant="ghost" size="sm" onClick={() => navigate('/customers')}>
                    View All Customers <ArrowRight className="h-3.5 w-3.5 ml-1" />
                  </Button>
                }
              >
                {recentCustomers.length === 0 ? (
                  <p className="text-xs text-gray-500 italic py-4">No customer accounts registered yet.</p>
                ) : (
                  <div className="overflow-x-auto mt-2">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-gray-200 bg-gray-50/70 text-gray-500 font-semibold uppercase">
                          <th className="py-2.5 px-3">Customer Name</th>
                          <th className="py-2.5 px-3">Category</th>
                          <th className="py-2.5 px-3">GSTIN</th>
                          <th className="py-2.5 px-3">Registered</th>
                          <th className="py-2.5 px-3 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {recentCustomers.map((cust) => (
                          <tr key={cust.id} className="hover:bg-gray-50/50 transition-colors">
                            <td className="py-3 px-3 font-semibold text-gray-900">
                              <Link
                                to={`/customers/${cust.id}`}
                                className="hover:text-brand-600 transition-colors"
                              >
                                {cust.name}
                              </Link>
                              <span className="block text-[11px] font-normal text-gray-400">
                                {cust.email}
                              </span>
                            </td>
                            <td className="py-3 px-3">
                              <span
                                className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${getBadgeColor(
                                  cust.customer_type
                                )}`}
                              >
                                {cust.customer_type}
                              </span>
                            </td>
                            <td className="py-3 px-3 font-mono text-gray-700">
                              {cust.gstin || '-'}
                            </td>
                            <td className="py-3 px-3 text-gray-500">
                              {formatDate(cust.created_at)}
                            </td>
                            <td className="py-3 px-3 text-right">
                              <Link to={`/customers/${cust.id}`}>
                                <Button variant="outline" size="sm" className="text-[11px] py-0.5 px-2">
                                  Profile <ExternalLink className="h-3 w-3 ml-1" />
                                </Button>
                              </Link>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </Card>

              {/* Pending Verifications & Upcoming Tasks */}
              <Card
                title="Pending Verifications & Upcoming Tasks"
                subtitle="Step clearance tasks requiring broker action"
              >
                {pendingTasks.length === 0 ? (
                  <p className="text-xs text-gray-500 italic py-4">All verification tasks completed!</p>
                ) : (
                  <div className="space-y-2.5 mt-2">
                    {pendingTasks.map(({ step, flow }) => (
                      <div
                        key={step.id}
                        className="flex items-center justify-between p-3 rounded-lg border border-amber-200/80 bg-amber-50/40 text-xs"
                      >
                        <div className="flex items-start space-x-2.5">
                          <Clock className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                          <div>
                            <div className="flex items-center space-x-2">
                              <span className="font-bold text-gray-900">
                                Step #{step.order}: {step.title}
                              </span>
                              {flow.customer_name && (
                                <span className="text-[10px] font-semibold text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-200">
                                  {flow.customer_name}
                                </span>
                              )}
                            </div>
                            {step.description && (
                              <p className="text-[11px] text-gray-600 mt-0.5 truncate max-w-md">
                                {step.description}
                              </p>
                            )}
                          </div>
                        </div>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/onboarding/step/${step.id}`)}
                          className="shrink-0 text-xs py-0.5"
                        >
                          Perform Step <ArrowRight className="h-3 w-3 ml-1" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </div>

            {/* Right Column (1 Col): Live Recent Timeline Events Feed */}
            <div className="lg:col-span-1 space-y-6">
              <Card
                title="Recent Timeline Events"
                subtitle="Live PostgreSQL event audit feed"
              >
                {recentActivities.length === 0 ? (
                  <p className="text-xs text-gray-500 italic py-4">No recent activity events recorded.</p>
                ) : (
                  <div className="relative pl-5 border-l-2 border-gray-200 space-y-4 text-xs mt-2">
                    {recentActivities.map((act) => (
                      <div key={act.id} className="relative">
                        <div className="absolute -left-[27px] top-0.5 h-3.5 w-3.5 rounded-full bg-brand-600 border-2 border-white" />
                        <p className="font-semibold text-gray-900">{act.title}</p>
                        {act.description && (
                          <p className="text-gray-500 text-[11px] mt-0.5 leading-relaxed">
                            {act.description}
                          </p>
                        )}
                        <p className="text-gray-400 text-[10px] font-mono mt-1">
                          {formatDate(act.created_at)}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
