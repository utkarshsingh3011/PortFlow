export const STORAGE_KEYS = {
  AUTH_TOKEN: 'portflow_auth_token',
  USER_DATA: 'portflow_user_data',
  THEME: 'portflow_theme',
} as const;

export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  DASHBOARD: '/dashboard',
  ONBOARDING: '/onboarding',
  CUSTOMERS: '/customers',
  CUSTOMER_PROFILE: '/customers/:customerId',
  ONBOARDING_STEP: '/onboarding/step/:stepId',
  SETTINGS: '/settings',
  NOT_FOUND: '*',
} as const;

export const DEFAULT_PAGE_SIZE = 20;
