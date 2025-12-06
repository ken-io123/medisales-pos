import api from './api';
import type { User, RegisterPayload } from '../types/User';

export const userService = {
  getAllUsers: async () => {
    const { data } = await api.get<User[]>('/Users');
    return data;
  },

  getUserById: async (userId: number) => {
    const { data } = await api.get<User>(`/Users/${userId}`);
    return data;
  },

  createUser: async (userData: RegisterPayload) => {
    // Transform to match backend DTO with PascalCase
    const payload = {
      Username: userData.username,
      Password: userData.password,
      FullName: userData.fullName,
      Email: userData.email,
      PhoneNumber: userData.phoneNumber || '',
      Role: userData.role, // Backend expects UserRole enum (Administrator/Staff)
    };
    
    console.log('Creating user with payload:', JSON.stringify(payload, null, 2));
    const { data } = await api.post<User>('/Users/register', payload);
    return data;
  },

  updateUser: async (userId: number, userData: Partial<User & { password?: string }>) => {
    const { data } = await api.put<User>(`/Users/${userId}`, userData);
    return data;
  },

  deleteUser: async (userId: number) => {
    await api.delete(`/Users/${userId}`);
  },

  searchUsers: async (searchTerm: string) => {
    const { data } = await api.get<User[]>('/Users/search', {
      params: { query: searchTerm },
    });
    return data;
  },
};
