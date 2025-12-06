import type { UserRole, UserStatus } from './User';

export interface Staff {
  userId: number;
  username: string;
  fullName: string;
  email: string;
  phoneNumber?: string | null;
  role: UserRole;
  status: UserStatus;
  lastLoginDate?: string | null;
  avatarColor?: string | null;
  profilePictureUrl?: string | null;
  isOnlineNow?: boolean;
}

export type StaffInput = {
  fullName: string;
  username: string;
  password: string;
  email: string;
  phoneNumber?: string;
  role: 'Staff';
};

export type StaffUpdateInput = {
  fullName: string;
  email: string;
  phoneNumber?: string;
  role: UserRole;
};
