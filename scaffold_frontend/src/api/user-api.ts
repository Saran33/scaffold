import type { AxiosResponse } from 'axios';
import type { RespMsg } from '@/types/api';
import type {
  UserProfile,
  UserProfileUpdate,
  UserProfileCreate,
  ResetPasswordData,
  UpdatePasswordData,
} from '@/types/user';
import { BaseApiClient } from '@/api/base-api';

class UserApiClient extends BaseApiClient {
  async getAccessToken(username: string, password: string): Promise<string> {
    try {
      const res = await this.client.post<{ access_token: string }>(
        '/login/access-token',
        {
          username,
          password,
        },
        { headers: this.formHeaders }
      );
      return res.data.access_token;
    } catch (error) {
      return this.handleError(error);
    }
  }

  async exchangeToken(token: string): Promise<string | null> {
    try {
      const res = await this.client.post<{ access_token: string }>(
        '/token/exchange',
        { token }
      );
      return res.data.access_token;
    } catch (error) {
      console.debug(error);
      return null;
    }
  }

  async getMe(token: string): Promise<UserProfile> {
    try {
      const res = await this.client.get<UserProfile>('/users/me', {
        headers: this.getAuthHeaders(token),
      });
      return res.data;
    } catch (error) {
      return this.handleError(error);
    }
  }

  async updateMe(token: string, data: UserProfileUpdate): Promise<UserProfile> {
    try {
      const res = await this.client.put<UserProfile>('/users/me', data, {
        headers: this.getAuthHeaders(token),
      });
      return res.data;
    } catch (error) {
      return this.handleError(error);
    }
  }

  async getUsers(token: string): Promise<UserProfile[]> {
    try {
      const res = await this.client.get<UserProfile[]>('/users', {
        headers: this.getAuthHeaders(token),
      });
      return res.data;
    } catch (error) {
      return this.handleError(error);
    }
  }

  async updateUser(
    token: string,
    userId: number,
    data: UserProfileUpdate
  ): Promise<UserProfile> {
    try {
      const res = await this.client.put<UserProfile>(`/users/${userId}`, data, {
        headers: this.getAuthHeaders(token),
      });
      return res.data;
    } catch (error) {
      return this.handleError(error);
    }
  }

  async createUser(
    token: string,
    data: UserProfileCreate
  ): Promise<UserProfile> {
    try {
      const res = await this.client.post<UserProfile>('/users', data, {
        headers: this.getAuthHeaders(token),
      });
      return res.data;
    } catch (error) {
      return this.handleError(error);
    }
  }

  async createUserOpen(data: UserProfileCreate): Promise<UserProfile> {
    try {
      const res = await this.client.post<UserProfile>('/users/open', data);
      return res.data;
    } catch (error) {
      return this.handleError(error);
    }
  }

  async verifyEmail(token: string): Promise<AxiosResponse<RespMsg, any>> {
    try {
      const res = await this.client.post<RespMsg>('/verify-email', {
        token,
      });
      return res;
    } catch (error) {
      return this.handleError(error);
    }
  }

  async requestEmailVerificationEmail(
    email: string
  ): Promise<AxiosResponse<RespMsg, any>> {
    try {
      const res = await this.client.post<RespMsg>(
        `/resend-verification-email/${email}`
      );
      return res;
    } catch (error) {
      return this.handleError(error);
    }
  }

  async requestPasswordRecovery(email: string): Promise<RespMsg> {
    try {
      const res = await this.client.post<RespMsg>(
        `/password-recovery/${email}`
      );
      return res.data;
    } catch (error) {
      return this.handleError(error);
    }
  }

  async resetPassword(
    token: string,
    passwordData: ResetPasswordData
  ): Promise<AxiosResponse<RespMsg, any>> {
    try {
      const res = await this.client.post<RespMsg>('/reset-password', {
        password: passwordData.password,
        token,
      });
      return res;
    } catch (error) {
      return this.handleError(error);
    }
  }

  async updatePassword(
    token: string,
    passwordData: UpdatePasswordData
  ): Promise<RespMsg> {
    try {
      const res = await this.client.put<RespMsg>(
        '/users/me/update-password',
        {
          oldPassword: passwordData.oldPassword,
          newPassword: passwordData.newPassword,
        },
        { headers: this.getAuthHeaders(token) }
      );
      return res.data;
    } catch (error) {
      return this.handleError(error);
    }
  }
}

const userApi = new UserApiClient();
export default userApi;
