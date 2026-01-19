import type { PasswordData } from '@/types/user';
export interface ProfileFormProps {
  onChangePassword: (passwords: PasswordData) => void;
}
