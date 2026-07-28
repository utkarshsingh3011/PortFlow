import { FC } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/common/Button';
import { ROUTES } from '@/utils/constants';

export const NotFoundPage: FC = () => {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 text-center px-4">
      <h1 className="text-6xl font-extrabold text-brand-600">404</h1>
      <h2 className="mt-4 text-2xl font-bold text-gray-900">Page Not Found</h2>
      <p className="mt-2 text-sm text-gray-500 max-w-md">
        The requested page does not exist or has been relocated.
      </p>
      <div className="mt-6">
        <Link to={ROUTES.DASHBOARD}>
          <Button variant="primary">Return to Dashboard</Button>
        </Link>
      </div>
    </div>
  );
};
