export type UserRole = 'Administrator' | 'Staff';

export type UserStatus = 'Online' | 'Offline';

export interface User {
  userId: number;
  username: string;
  fullName: string;
  email: string;
  phoneNumber?: string | null;
  role: UserRole;
  status: UserStatus;
  lastLoginDate?: string | null;
  createdAt: string;
  updatedAt: string;
  // Profile picture fields
  profilePictureUrl?: string | null;
  profilePictureFileName?: string | null;
  profilePictureUploadedAt?: string | null;
  // Real-time status
  isOnlineNow?: boolean;
  lastSeenAt?: string | null;
}

export interface AuthenticatedUser extends User {
  token?: string;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface RegisterPayload {
  username: string;
  password: string;
  fullName: string;
  email: string;
  phoneNumber?: string;
  role?: UserRole;
}

export interface StaffLoginHistory {
  loginId: number;
  userId: number;
  loginDate: string;
  logoutDate?: string | null;
  ipAddress?: string | null;
  notes?: string | null;
  sessionDurationMinutes?: number | null;
}
