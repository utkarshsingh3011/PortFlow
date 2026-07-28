import { FC, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { Select } from '@/components/common/Select';
import { authService } from '@/services/authService';
import {
  customerRegistrationSchema,
  CustomerRegistrationFormData,
} from '@/utils/schemas/authSchemas';
import { ROUTES } from '@/utils/constants';

export const RegisterPage: FC = () => {
  const navigate = useNavigate();
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [submittedData, setSubmittedData] = useState<CustomerRegistrationFormData | null>(null);
  const [generalError, setGeneralError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<CustomerRegistrationFormData>({
    resolver: zodResolver(customerRegistrationSchema),
    mode: 'onTouched',
    defaultValues: {
      fullName: '',
      businessName: '',
      email: '',
      password: '',
      gstin: '',
      customerType: undefined,
    },
  });

  const onSubmit = async (data: CustomerRegistrationFormData) => {
    setGeneralError(null);
    try {
      // Submit registration payload to backend via Axios client (/api/v1/auth/register)
      await authService.register({
        email: data.email,
        password: data.password,
        fullName: data.fullName,
        businessName: data.businessName,
        gstin: data.gstin,
        customerType: data.customerType,
      });

      setSubmittedData(data);
      setIsSuccess(true);

      // Redirect to /login after a 2-second delay
      setTimeout(() => {
        navigate(ROUTES.LOGIN);
      }, 2000);
    } catch (err: any) {
      const responseData = err.response?.data;

      // Handle FastAPI HTTP 422 field validation errors
      if (responseData?.detail && Array.isArray(responseData.detail)) {
        responseData.detail.forEach(
          (issue: { loc: (string | number)[]; msg: string }) => {
            const rawField = issue.loc[issue.loc.length - 1] as string;
            // Map snake_case or camelCase field names to form field keys
            const fieldMap: Record<string, keyof CustomerRegistrationFormData> = {
              email: 'email',
              password: 'password',
              fullName: 'fullName',
              full_name: 'fullName',
              businessName: 'businessName',
              business_name: 'businessName',
              gstin: 'gstin',
              customerType: 'customerType',
              customer_type: 'customerType',
            };

            const targetField = fieldMap[rawField];
            if (targetField) {
              setError(targetField, {
                type: 'server',
                message: issue.msg,
              });
            }
          }
        );
      } else if (responseData?.error?.message) {
        setGeneralError(responseData.error.message);
      } else if (responseData?.message) {
        setGeneralError(responseData.message);
      } else {
        setGeneralError(err.message || 'Registration failed. Please try again.');
      }
    }
  };

  const handleRegisterAnother = () => {
    setIsSuccess(false);
    setSubmittedData(null);
    setGeneralError(null);
    reset();
  };

  if (isSuccess && submittedData) {
    return (
      <div className="space-y-6 animate-fadeIn">
        <div className="rounded-xl border border-green-200 bg-green-50 p-6 text-center space-y-3">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-green-600 font-bold text-xl">
            ✓
          </div>
          <h2 className="text-xl font-bold text-green-900">Registration Successful!</h2>
          <p className="text-sm text-green-700">
            Welcome to PortFlow, <span className="font-semibold">{submittedData.fullName}</span>! Your customer onboarding account has been registered.
          </p>
          <p className="text-xs font-semibold text-green-600 animate-pulse">
            Redirecting to Sign In page in 2 seconds...
          </p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-xs space-y-2 text-gray-700">
          <p className="font-semibold text-gray-900 text-sm border-b pb-2">Registered Details</p>
          <div className="grid grid-cols-2 gap-2 pt-1">
            <div><span className="text-gray-500">Business:</span> {submittedData.businessName}</div>
            <div><span className="text-gray-500">Customer Type:</span> {submittedData.customerType}</div>
            <div><span className="text-gray-500">Email:</span> {submittedData.email}</div>
            <div><span className="text-gray-500">GSTIN:</span> {submittedData.gstin}</div>
          </div>
        </div>

        <div className="flex flex-col space-y-3">
          <Link to={ROUTES.LOGIN} className="w-full">
            <Button variant="primary" className="w-full">
              Proceed to Sign In Now
            </Button>
          </Link>
          <Button variant="outline" onClick={handleRegisterAnother} className="w-full">
            Register Another Account
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1 text-center">
        <h2 className="text-2xl font-bold tracking-tight text-gray-900">Broker Account Registration</h2>
        <p className="text-sm text-gray-500">Set up your PortFlow broker account</p>
      </div>

      {generalError && (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-xs text-red-700 font-medium">
          {generalError}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Full Name"
            placeholder="John Doe"
            disabled={isSubmitting}
            error={errors.fullName?.message}
            {...register('fullName')}
          />
          <Input
            label="Business Name"
            placeholder="Acme Trade Corp"
            disabled={isSubmitting}
            error={errors.businessName?.message}
            {...register('businessName')}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Email Address"
            type="email"
            placeholder="john@acmetrade.com"
            disabled={isSubmitting}
            error={errors.email?.message}
            {...register('email')}
          />
          <Input
            label="Password"
            type="password"
            placeholder="••••••••"
            disabled={isSubmitting}
            error={errors.password?.message}
            helperText="Min 8 chars, 1 uppercase & 1 number"
            {...register('password')}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="GSTIN"
            placeholder="22AAAAA0000A1Z5"
            disabled={isSubmitting}
            error={errors.gstin?.message}
            helperText="15-character GSTIN number"
            {...register('gstin')}
          />
          <Select
            label="Customer Type"
            placeholder="Select Type..."
            disabled={isSubmitting}
            error={errors.customerType?.message}
            options={[
              { value: 'EXPORTER', label: 'Exporter' },
              { value: 'IMPORTER', label: 'Importer' },
            ]}
            {...register('customerType')}
          />
        </div>

        <Button
          type="submit"
          variant="primary"
          size="lg"
          isLoading={isSubmitting}
          className="w-full mt-6"
        >
          {isSubmitting ? 'Registering Customer...' : 'Create Account'}
        </Button>
      </form>

      <div className="text-center text-sm text-gray-500">
        Already have an account?{' '}
        <Link to={ROUTES.LOGIN} className="font-semibold text-brand-600 hover:text-brand-500">
          Sign in
        </Link>
      </div>
    </div>
  );
};
