import { FC, useEffect, useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Edit3,
  Trash2,
  Users,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  AlertCircle,
  Search,
  X,
} from 'lucide-react';
import { Button, Card, ConfirmDialog, Input, Select } from '@/components/common';
import { TableSkeleton, Toast } from '@/components/feedback';
import { CustomerModal } from '@/components/customers';
import { Customer, PaginatedResponse } from '@/types';
import { customerService } from '@/services';
import { useAuth } from '@/hooks';

export const CustomersPage: FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [pagination, setPagination] = useState<PaginatedResponse<Customer> | null>(null);
  const [page, setPage] = useState<number>(1);
  const pageSize = 20;
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('newest');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  // Confirm Delete State
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  // Toast State
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

  const parseCustomerResponse = (
    response: unknown
  ): { items: Customer[]; pagination: PaginatedResponse<Customer> | null } => {
    if (!response) return { items: [], pagination: null };
    const resAny = response as any;

    if (resAny.data && Array.isArray(resAny.data.items)) {
      return { items: resAny.data.items, pagination: resAny.data };
    }
    if (Array.isArray(resAny.items)) {
      return { items: resAny.items, pagination: resAny };
    }
    if (Array.isArray(resAny.data)) {
      return {
        items: resAny.data,
        pagination: {
          items: resAny.data,
          total: resAny.data.length,
          page: 1,
          page_size: resAny.data.length,
          total_pages: 1,
        },
      };
    }
    if (Array.isArray(resAny)) {
      return {
        items: resAny,
        pagination: {
          items: resAny,
          total: resAny.length,
          page: 1,
          page_size: resAny.length,
          total_pages: 1,
        },
      };
    }
    return { items: [], pagination: null };
  };

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await customerService.getCustomers(page, pageSize, user?.id);
      const parsed = parseCustomerResponse(res);

      setCustomers(parsed.items);
      setPagination(parsed.pagination);
    } catch (err: unknown) {
      const errorMsg =
        (err as { response?: { data?: { detail?: string; message?: string } }; message?: string })
          ?.response?.data?.detail ||
        (err as { response?: { data?: { detail?: string; message?: string } }; message?: string })
          ?.response?.data?.message ||
        (err as Error)?.message ||
        'Failed to fetch customers';
      setError(errorMsg);
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  }, [page, user?.id]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  // Client-side search, filtering, and sorting over fetched page data
  const filteredCustomers = useMemo(() => {
    let result = [...customers];

    // Filter by search query (name, email, GSTIN)
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.email.toLowerCase().includes(q) ||
          (c.gstin && c.gstin.toLowerCase().includes(q))
      );
    }

    // Filter by category
    if (categoryFilter !== 'all') {
      result = result.filter(
        (c) => c.customer_type.toLowerCase() === categoryFilter.toLowerCase()
      );
    }

    // Sort
    result.sort((a, b) => {
      if (sortBy === 'newest') {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
      if (sortBy === 'oldest') {
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      }
      if (sortBy === 'name_asc') {
        return a.name.localeCompare(b.name);
      }
      if (sortBy === 'name_desc') {
        return b.name.localeCompare(a.name);
      }
      return 0;
    });

    return result;
  }, [customers, searchQuery, categoryFilter, sortBy]);

  const handleClearFilters = () => {
    setSearchQuery('');
    setCategoryFilter('all');
    setSortBy('newest');
  };

  const handleAddCustomer = () => {
    setSelectedCustomer(null);
    setIsModalOpen(true);
  };

  const handleEditCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setIsModalOpen(true);
  };

  const handleDeletePrompt = (customer: Customer) => {
    setCustomerToDelete(customer);
  };

  const handleConfirmDelete = async () => {
    if (!customerToDelete) return;
    setIsDeleting(true);
    const targetCustomer = customerToDelete;

    try {
      await customerService.deleteCustomer(targetCustomer.id);
      setCustomers((prev) => prev.filter((c) => c.id !== targetCustomer.id));
      window.dispatchEvent(new Event('portflow_data_changed'));
      showToast(`Customer '${targetCustomer.name}' deleted successfully`, 'success');
      setCustomerToDelete(null);
      fetchCustomers();
    } catch (err: unknown) {
      const errorMsg =
        (err as { response?: { data?: { detail?: string; message?: string } }; message?: string })
          ?.response?.data?.detail ||
        (err as Error)?.message ||
        'Failed to delete customer';
      showToast(errorMsg, 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleModalSuccess = (message: string) => {
    showToast(message, 'success');
    fetchCustomers();
  };

  const handleModalError = (message: string) => {
    showToast(message, 'error');
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      }).format(date);
    } catch {
      return dateString;
    }
  };

  const getBadgeColor = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'corporate':
      case 'enterprise':
        return 'bg-purple-50 text-purple-700 border-purple-200/80';
      case 'smb':
        return 'bg-blue-50 text-blue-700 border-blue-200/80';
      case 'individual':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200/80';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200/80';
    }
  };

  const hasActiveFilters = searchQuery !== '' || categoryFilter !== 'all' || sortBy !== 'newest';

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}

      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Customers</h1>
          <p className="text-sm text-gray-500">
            Manage customer accounts, details, and onboarding parameters.
          </p>
        </div>
        <div className="flex items-center space-x-3 self-start sm:self-auto">
          <Button
            variant="outline"
            size="md"
            onClick={fetchCustomers}
            disabled={loading}
            aria-label="Refresh customer list"
            title="Refresh customer list"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
          <Button variant="primary" size="md" onClick={handleAddCustomer}>
            <Plus className="mr-1.5 h-4 w-4" /> Add Customer
          </Button>
        </div>
      </div>

      {/* Search, Filter, & Sort Controls */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs space-y-3 sm:space-y-0 sm:flex sm:items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search by customer name, email, or GSTIN..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 text-xs"
          />
        </div>

        {/* Filter Dropdowns & Clear Action */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="w-36">
            <Select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              options={[
                { value: 'all', label: 'All Categories' },
                { value: 'corporate', label: 'Corporate' },
                { value: 'smb', label: 'SMB' },
                { value: 'individual', label: 'Individual' },
                { value: 'enterprise', label: 'Enterprise' },
              ]}
              className="py-1 text-xs"
            />
          </div>

          <div className="w-40">
            <Select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              options={[
                { value: 'newest', label: 'Sort: Newest First' },
                { value: 'oldest', label: 'Sort: Oldest First' },
                { value: 'name_asc', label: 'Sort: Name (A-Z)' },
                { value: 'name_desc', label: 'Sort: Name (Z-A)' },
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

      {/* Main Content */}
      <Card className="p-0 overflow-hidden border border-gray-200 shadow-xs">
        {loading ? (
          <TableSkeleton rows={5} />
        ) : error ? (
          <div className="p-10 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600 mb-3">
              <AlertCircle className="h-6 w-6" />
            </div>
            <h3 className="text-base font-semibold text-gray-900">Unable to load customers</h3>
            <p className="text-sm text-red-600 mt-1 max-w-md mx-auto">{error}</p>
            <div className="mt-4">
              <Button variant="outline" size="sm" onClick={fetchCustomers}>
                Try Again
              </Button>
            </div>
          </div>
        ) : filteredCustomers.length === 0 ? (
          /* Empty State */
          <div className="p-12 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 mb-4 border border-brand-100">
              <Users className="h-8 w-8" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 tracking-tight">
              {hasActiveFilters ? 'No matching customers found' : 'No customers found'}
            </h3>
            <p className="text-sm text-gray-500 mt-1.5 max-w-sm mx-auto leading-relaxed">
              {hasActiveFilters
                ? 'Try adjusting your search query or category filter.'
                : 'Get started by adding your first customer to manage their onboarding process.'}
            </p>
            <div className="mt-6 flex justify-center space-x-3">
              {hasActiveFilters ? (
                <Button variant="outline" size="md" onClick={handleClearFilters}>
                  Clear Filters
                </Button>
              ) : (
                <Button variant="primary" size="md" onClick={handleAddCustomer}>
                  <Plus className="mr-1.5 h-4 w-4" /> Add Customer
                </Button>
              )}
            </div>
          </div>
        ) : (
          /* Table Component */
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse" aria-label="Customers list">
              <thead>
                <tr className="bg-gray-50/80 border-b border-gray-200 text-xs font-semibold uppercase tracking-wider text-gray-500">
                  <th scope="col" className="px-6 py-3.5">
                    Name
                  </th>
                  <th scope="col" className="px-6 py-3.5">
                    Email
                  </th>
                  <th scope="col" className="px-6 py-3.5">
                    GSTIN
                  </th>
                  <th scope="col" className="px-6 py-3.5">
                    Customer Type
                  </th>
                  <th scope="col" className="px-6 py-3.5">
                    Created Date
                  </th>
                  <th scope="col" className="px-6 py-3.5 text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {filteredCustomers.map((customer) => (
                  <tr key={customer.id} className="hover:bg-gray-50/60 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => navigate(`/customers/${customer.id}`)}
                        className="text-brand-600 hover:text-brand-700 hover:underline font-semibold focus:outline-hidden text-left"
                      >
                        {customer.name}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-gray-600 whitespace-nowrap">{customer.email}</td>
                    <td className="px-6 py-4 text-gray-600 whitespace-nowrap font-mono text-xs">
                      {customer.gstin || <span className="text-gray-400 font-sans">-</span>}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getBadgeColor(
                          customer.customer_type
                        )}`}
                      >
                        {customer.customer_type}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-500 whitespace-nowrap text-xs">
                      {formatDate(customer.created_at)}
                    </td>
                    <td className="px-6 py-4 text-right whitespace-nowrap space-x-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditCustomer(customer)}
                        className="text-brand-600 hover:text-brand-700 hover:bg-brand-50"
                        aria-label={`Edit ${customer.name}`}
                      >
                        <Edit3 className="mr-1 h-3.5 w-3.5" /> Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeletePrompt(customer)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        aria-label={`Delete ${customer.name}`}
                      >
                        <Trash2 className="mr-1 h-3.5 w-3.5" /> Delete
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {pagination && pagination.total_pages > 1 && (
          <div className="flex items-center justify-between px-6 py-3.5 bg-gray-50/80 border-t border-gray-200">
            <div className="text-xs text-gray-500">
              Showing <span className="font-medium text-gray-700">{filteredCustomers.length}</span> of{' '}
              <span className="font-medium text-gray-700">{pagination.total}</span> customers
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                disabled={page <= 1 || loading}
                aria-label="Previous page"
              >
                <ChevronLeft className="h-4 w-4 mr-0.5" /> Previous
              </Button>
              <span className="text-xs font-medium text-gray-700 px-2">
                Page {page} of {pagination.total_pages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((prev) => Math.min(prev + 1, pagination.total_pages))}
                disabled={page >= pagination.total_pages || loading}
                aria-label="Next page"
              >
                Next <ChevronRight className="h-4 w-4 ml-0.5" />
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Customer Create/Edit Modal */}
      <CustomerModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        customer={selectedCustomer}
        onSuccess={handleModalSuccess}
        onError={handleModalError}
      />

      {/* Accessible Confirm Delete Dialog */}
      {customerToDelete && (
        <ConfirmDialog
          isOpen={Boolean(customerToDelete)}
          onClose={() => setCustomerToDelete(null)}
          onConfirm={handleConfirmDelete}
          title="Delete Customer"
          message={`Are you sure you want to delete customer "${customerToDelete.name}"? This action cannot be undone.`}
          confirmText="Delete Customer"
          cancelText="Cancel"
          variant="danger"
          isLoading={isDeleting}
        />
      )}
    </div>
  );
};
