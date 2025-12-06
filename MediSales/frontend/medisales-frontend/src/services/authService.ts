import api from './api';
import type { AuthenticatedUser, LoginCredentials, RegisterPayload, UserRole } from '../types/User';
import { successToast } from '../utils/toast';

// Backend returns user data at root level, not nested
type LoginResponse = {
  userId: number;
  username: string;
  fullName: string;
  email: string;
  role: UserRole;
  token?: string;
  phoneNumber?: string | null;
};

export const authService = {
  login: async (credentials: LoginCredentials) => {
    const { data } = await api.post<LoginResponse>('/auth/login', credentials);
    successToast('Login successful!');
    return data;
  },

  logout: async (userId: number) => {
    // Send userId in request body as backend expects
    try {
      await api.post('/auth/logout', userId);
      successToast('Logout successful!');
    } catch (err) {
      console.error('Logout failed on server:', err);
      // Still show success toast - frontend state will be cleared
      successToast('Logout successful!');
    }
    return Promise.resolve();
  },

  getCurrentUser: async () => {
    const { data } = await api.get<AuthenticatedUser>('/Users/me');
    return data;
  },

  register: async (userData: RegisterPayload) => {
    const { data } = await api.post('/auth/register', userData);
    successToast('Registration successful!');
    return data;
  },
};
