import { FC } from 'react';
import { Outlet } from 'react-router-dom';

export const AuthLayout: FC = () => {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-lg space-y-8 rounded-2xl bg-white p-8 shadow-xl border border-gray-100">
        <div className="text-center">
          <h1 className="text-3xl font-extrabold text-brand-600">PortFlow</h1>
          <p className="mt-2 text-sm text-gray-600">Customer Onboarding & Management Portal</p>
        </div>
        <Outlet />
      </div>
    </div>
  );
};
