import type {
  AxiosError,
  AxiosInstance,
  AxiosResponse,
  RawAxiosRequestHeaders,
} from 'axios';
import axios from 'axios';
import { redirect } from 'next/navigation';
import { HOME_URL, LOGIN_URL } from '@/config/site';
import { env } from '@/env/client.mjs';
import { isAxiosDataWithDetail } from '@/lib/api';
import { ErrorResponse } from '@/lib/errors';
import { getIsServer } from '@/lib/utils/utils';

interface ApiConfig {
  baseURL?: string;
  timeout?: number;
}

export class BaseApiClient {
  protected client: AxiosInstance;

  constructor(config?: ApiConfig) {
    this.client = axios.create({
      baseURL: config?.baseURL || env.NEXT_PUBLIC_API_URL,
      timeout: config?.timeout || 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    this.client.interceptors.response.use(
      (response: AxiosResponse) => response,
      async (error: AxiosError) => {
        // Handle blob error responses - convert to JSON before passing to error handler
        if (error.response?.data instanceof Blob) {
          try {
            const text = await error.response.data.text();
            const json = JSON.parse(text);
            // Replace the blob with parsed JSON so downstream handlers work correctly
            error.response.data = json;
          } catch {
            // If parsing fails, leave it as-is
          }
        }

        if (error.response?.status === 401) {
          const isServer = getIsServer();
          const redirectUrl = `${LOGIN_URL}?signInAgain=true&redirect=${encodeURIComponent(
            isServer ? HOME_URL : window.location.pathname
          )}`;

          if (isServer) {
            throw redirect(redirectUrl) as Error;
          } else {
            window.location.href = redirectUrl;
          }
        }
        return Promise.reject(error);
      }
    );
  }

  protected handleError(error: unknown): never {
    if (
      // handle errors thrown in server actions
      error instanceof Error &&
      'digest' in error &&
      error.message === 'NEXT_REDIRECT'
    ) {
      // console.log('throwing');
      throw error;
    }
    const errorResponse = this.getErrorResponse(error);
    throw errorResponse;
  }

  private getErrorResponse(error: unknown): ErrorResponse {
    if (axios.isAxiosError(error)) {
      if (error.response) {
        // The request was made, and the server responded with a status code outside the range of 2xx
        // Note: Blob responses are transformed to JSON by the interceptor
        const detail = isAxiosDataWithDetail(error.response.data)
          ? error.response.data.detail
          : 'Internal server error';
        return new ErrorResponse(error.response.status, detail);
      } else if (error.request) {
        // The request was made, but no response was received
        return new ErrorResponse(
          500,
          'The server did not respond. Please try again.'
        );
      } else {
        // Something happened in setting up the request that triggered an Error
        console.error('Error setting up request:', error);
        return new ErrorResponse(500, error.message);
      }
    }
    console.error('Unknown error:', error);
    return new ErrorResponse(500, 'An unexpected error occurred.');
  }

  protected getAuthHeaders(token: string): RawAxiosRequestHeaders {
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    };
  }

  protected jsonHeaders = {
    'Content-Type': 'application/json',
  };

  protected formHeaders = {
    'Content-Type': 'application/x-www-form-urlencoded',
  };
}
