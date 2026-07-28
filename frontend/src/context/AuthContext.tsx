import { createContext, useState, useEffect, ReactNode, FC } from 'react';
import { AuthState, LoginCredentials, RegisterPayload, UserProfile } from '@/types';
import { STORAGE_KEYS } from '@/utils/constants';
import { authService } from '@/services/authService';

export interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => void;
  refreshUserProfile: () => Promise<UserProfile | null>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(() => {
    const storedUser = localStorage.getItem(STORAGE_KEYS.USER_DATA);
    return storedUser ? JSON.parse(storedUser) : null;
  });
  const [token, setToken] = useState<string | null>(
    localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN)
  );
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchProfile = async (): Promise<UserProfile | null> => {
    try {
      const profileResponse = await authService.getCurrentUser();
      const profileData = profileResponse.data || (profileResponse as unknown as UserProfile);
      if (profileData && (profileData as UserProfile).id) {
        const userObj = profileData as UserProfile;
        localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(userObj));
        setUser(userObj);
        return userObj;
      }
    } catch {
      // Handled silently
    }
    return null;
  };

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
      if (storedToken) {
        setToken(storedToken);
        const profile = await fetchProfile();
        if (!profile) {
          // Token is invalid/expired
          logout();
        }
      } else {
        setUser(null);
        setToken(null);
      }
      setIsLoading(false);
    };

    initAuth();

    const handleUnauthorized = () => {
      logout();
    };

    window.addEventListener('portflow_unauthorized', handleUnauthorized);
    return () => {
      window.removeEventListener('portflow_unauthorized', handleUnauthorized);
    };
  }, []);

  const login = async (credentials: LoginCredentials): Promise<void> => {
    const response = await authService.login(credentials);
    const accessToken = response.data?.access_token || (response as unknown as { access_token: string }).access_token;

    if (!accessToken) {
      throw new Error('No token returned from server');
    }

    localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, accessToken);
    setToken(accessToken);

    await fetchProfile();
  };

  const register = async (payload: RegisterPayload): Promise<void> => {
    await authService.register(payload);
  };

  const logout = (): void => {
    localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.USER_DATA);
    setUser(null);
    setToken(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token,
        isLoading,
        login,
        register,
        logout,
        refreshUserProfile: fetchProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
