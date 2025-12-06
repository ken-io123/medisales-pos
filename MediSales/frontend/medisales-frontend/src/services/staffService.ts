import api from './api';
import type { Staff, StaffInput, StaffUpdateInput } from '../types/Staff';

export type PaginatedResponse<T> = {
  data: T[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
};

export interface AuditLog {
  id: number;
  action: string;
  entityName: string;
  entityId: string;
  userId: number | null;
  userName: string;
  userRole: string;
  details: string;
  timestamp: string;
}

export const staffService = {
  getAllStaff: async (page = 1, pageSize = 10, searchTerm = '', role = '', status = '') => {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('pageSize', pageSize.toString());
    if (searchTerm) params.append('searchTerm', searchTerm);
    if (role) params.append('role', role);
    if (status) params.append('status', status);

    const { data } = await api.get<PaginatedResponse<Staff>>('/staff', { params });
    return data;
  },

  addStaff: async (payload: StaffInput) => {
    const { data } = await api.post<Staff>('/staff', payload);
    return data;
  },

  updateStaff: async (staffId: number, payload: StaffUpdateInput) => {
    const { data } = await api.put<Staff>(`/staff/${staffId}`, payload);
    return data;
  },

  deleteStaff: async (staffId: number) => {
    await api.delete(`/staff/${staffId}`);
  },
  
  updateStaffStatus: async (staffId: number, status: string) => {
    const { data } = await api.patch<Staff>(`/staff/${staffId}/status`, null, {
      params: { status }
    });
    return data;
  },

  getAuditLogs: async () => {
    const { data } = await api.get<AuditLog[]>('/staff/audit-logs');
    return data;
  },
};
