export type UserRole = 'user' | 'admin' | 'super_admin';

interface UserProfileBase {
  email: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  nickname?: string;
  image?: string;
  locale?: string;
}

export interface UserProfile extends UserProfileBase {
  id: number;
  active: boolean;
  emailVerified: boolean;
  isSuperuser: boolean;
  role?: UserRole;
}

export interface UserProfileUpdate extends UserProfileBase {
  email?: string;
  emailVerified?: boolean;
}

export interface UserProfileCreate extends UserProfileBase {
  password: string;
}

export interface UpdatePasswordData {
  oldPassword: string;
  newPassword: string;
}

export interface ResetPasswordData {
  password: string;
}
