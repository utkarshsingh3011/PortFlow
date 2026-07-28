import { FC, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Modal, Input, Select, Button } from '@/components/common';
import { Customer } from '@/types';
import { customerService, authService } from '@/services';
import { useAuth } from '@/hooks';

const customerSchema = z.object({
  name: z.string().trim().min(1, 'Name is required'),
  email: z.string().trim().min(1, 'Email is required').email('Invalid email address'),
  gstin: z.string().trim().optional(),
  customer_type: z.string().trim().min(1, 'Customer type is required'),
});

export type CustomerFormData = z.infer<typeof customerSchema>;

export interface CustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer?: Customer | null;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
}

const CUSTOMER_TYPE_OPTIONS = [
  { value: 'Corporate', label: 'Corporate' },
  { value: 'Individual', label: 'Individual' },
  { value: 'SMB', label: 'SMB' },
  { value: 'Enterprise', label: 'Enterprise' },
];

export const CustomerModal: FC<CustomerModalProps> = ({
  isOpen,
  onClose,
  customer,
  onSuccess,
  onError,
}) => {
  const { user, refreshUserProfile } = useAuth();
  const isEditMode = Boolean(customer);
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setError: setFieldError,
    formState: { errors },
  } = useForm<CustomerFormData>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      name: '',
      email: '',
      gstin: '',
      customer_type: 'Corporate',
    },
  });

  useEffect(() => {
    if (isOpen) {
      setServerError(null);
      if (customer) {
        reset({
          name: customer.name || '',
          email: customer.email || '',
          gstin: customer.gstin || '',
          customer_type: customer.customer_type || 'Corporate',
        });
      } else {
        reset({
          name: '',
          email: '',
          gstin: '',
          customer_type: 'Corporate',
        });
      }
    }
  }, [isOpen, customer, reset]);

  const onSubmit = async (data: CustomerFormData) => {
    setSubmitting(true);
    setServerError(null);

    try {
      if (isEditMode && customer) {
        await customerService.updateCustomer(customer.id, {
          name: data.name,
          email: data.email,
          gstin: data.gstin ? data.gstin.trim() : null,
          customer_type: data.customer_type,
        });
        window.dispatchEvent(new Event('portflow_data_changed'));
        onSuccess('Customer updated successfully');
        onClose();
      } else {
        let activeUserId = user?.id;
        if (!activeUserId) {
          const freshUser = await refreshUserProfile();
          activeUserId = freshUser?.id;
        }

        if (!activeUserId) {
          const profile = await authService.getCurrentUser();
          activeUserId = profile?.data?.id;
        }

        if (!activeUserId) {
          throw new Error('Authentication session error: missing user profile. Please log in again.');
        }

        await customerService.createCustomer({
          name: data.name,
          email: data.email,
          gstin: data.gstin ? data.gstin.trim() : null,
          customer_type: data.customer_type,
          broker_id: activeUserId,
        });
        window.dispatchEvent(new Event('portflow_data_changed'));
        onSuccess('Customer added successfully');
        onClose();
      }
    } catch (err: unknown) {
      const errObj = err as {
        response?: { status?: number; data?: { detail?: string; message?: string } };
        message?: string;
      };
      const status = errObj.response?.status;
      const detail = errObj.response?.data?.detail || errObj.response?.data?.message || errObj.message || '';

      if (status === 409 || detail.toLowerCase().includes('already exists')) {
        // Trigger Toast: "Customer already exists."
        onError('Customer already exists.');
        setServerError(detail || 'Customer already exists.');

        // Highlight field error
        if (detail.toLowerCase().includes('gstin')) {
          setFieldError('gstin', {
            type: 'manual',
            message: 'Customer with this GSTIN already exists.',
          });
        } else {
          setFieldError('email', {
            type: 'manual',
            message: 'Customer with this email already exists.',
          });
        }
        // Modal stays open with entered form values retained!
      } else {
        const errorMsg = detail || 'Failed to save customer. Please try again.';
        setServerError(errorMsg);
        onError(errorMsg);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditMode ? 'Edit Customer' : 'Add New Customer'}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {serverError && (
          <div className="rounded-md bg-red-50 p-3 text-sm text-red-700 border border-red-200">
            {serverError}
          </div>
        )}

        <Input
          label="Customer Name"
          placeholder="e.g. Acme Corp"
          error={errors.name?.message}
          {...register('name')}
        />

        <Input
          label="Email Address"
          type="email"
          placeholder="e.g. contact@acme.com"
          error={errors.email?.message}
          {...register('email')}
        />

        <Input
          label="GSTIN (Optional)"
          placeholder="e.g. 27AAAAA0000A1Z5"
          error={errors.gstin?.message}
          {...register('gstin')}
        />

        <Select
          label="Customer Type"
          options={CUSTOMER_TYPE_OPTIONS}
          error={errors.customer_type?.message}
          {...register('customer_type')}
        />

        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button type="submit" isLoading={submitting}>
            {isEditMode ? 'Save Changes' : 'Add Customer'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
