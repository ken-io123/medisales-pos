import { createContext, useContext } from 'react';
import type { AuthenticatedUser } from '../types/User';

export const AUTH_TOKEN_KEY = 'medisales.auth.token';
export const AUTH_USER_KEY = 'medisales.auth.user';

export type AuthContextValue = {
  token: string | null;
  user: AuthenticatedUser | null;
  isAuthenticated: boolean;
  login: (token: string, authUser: AuthenticatedUser) => void;
  logout: () => void;
};

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
