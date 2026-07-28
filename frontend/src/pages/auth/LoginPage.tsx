import { FC, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { useAuth } from '@/hooks/useAuth';
import { ROUTES } from '@/utils/constants';

export const LoginPage: FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);

    try {
      await login({
        email,
        password,
      });

      navigate(ROUTES.DASHBOARD);
    } catch (error: unknown) {
      const msg =
        (error as { response?: { data?: { detail?: string; message?: string } } })
          ?.response?.data?.detail ||
        (error as { response?: { data?: { detail?: string; message?: string } } })
          ?.response?.data?.message ||
        'Invalid email or password. Please check your credentials.';
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <h2 className="text-2xl font-bold tracking-tight text-gray-900">
          Sign in to PortFlow
        </h2>
        <p className="text-sm text-gray-500">
          Enter your portal credentials below
        </p>
      </div>

      {errorMessage && (
        <div
          role="alert"
          className="flex items-center space-x-2 rounded-xl bg-red-50 p-3.5 text-sm text-red-800 border border-red-200 animate-in fade-in duration-150"
        >
          <AlertCircle className="h-4 w-4 text-red-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form className="space-y-4" onSubmit={handleSubmit}>
        <Input
          label="Email address"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="name@company.com"
          required
        />

        <Input
          label="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          required
        />

        <Button type="submit" className="w-full" isLoading={loading}>
          Sign In
        </Button>
      </form>

      <div className="text-center text-sm text-gray-500">
        Don't have an account?{' '}
        <Link
          to={ROUTES.REGISTER}
          className="font-semibold text-brand-600 hover:text-brand-500 transition-colors"
        >
          Sign up
        </Link>
      </div>
    </div>
  );
};