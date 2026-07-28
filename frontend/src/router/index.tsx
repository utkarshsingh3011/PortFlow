import { createBrowserRouter } from 'react-router-dom';
import { RootLayout } from '@/layouts/RootLayout';
import { AuthLayout } from '@/layouts/AuthLayout';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { ProtectedRoute } from './ProtectedRoute';
import { PublicRoute } from './PublicRoute';
import { LandingPage } from '@/pages/landing';
import { LoginPage, RegisterPage } from '@/pages/auth';
import { DashboardPage } from '@/pages/dashboard';
import { CustomersPage, CustomerProfilePage } from '@/pages/customers';
import { OnboardingFlowPage, StepDetailsPage } from '@/pages/onboarding';
import { SettingsPage } from '@/pages/settings';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { ROUTES } from '@/utils/constants';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    children: [
      // Public / Guest Routes (Redirects authenticated users to /dashboard)
      {
        element: <PublicRoute />,
        children: [
          { path: ROUTES.HOME, element: <LandingPage /> },
          {
            element: <AuthLayout />,
            children: [
              { path: ROUTES.LOGIN, element: <LoginPage /> },
              { path: ROUTES.REGISTER, element: <RegisterPage /> },
            ],
          },
        ],
      },
      // Authenticated Protected Routes
      {
        element: <ProtectedRoute />,
        children: [
          {
            element: <DashboardLayout />,
            children: [
              { path: ROUTES.DASHBOARD, element: <DashboardPage /> },
              { path: ROUTES.CUSTOMERS, element: <CustomersPage /> },
              { path: ROUTES.CUSTOMER_PROFILE, element: <CustomerProfilePage /> },
              { path: ROUTES.ONBOARDING, element: <OnboardingFlowPage /> },
              { path: ROUTES.ONBOARDING_STEP, element: <StepDetailsPage /> },
              { path: ROUTES.SETTINGS, element: <SettingsPage /> },
            ],
          },
        ],
      },
      // 404 Catch-All Route
      {
        path: ROUTES.NOT_FOUND,
        element: <NotFoundPage />,
      },
    ],
  },
]);
