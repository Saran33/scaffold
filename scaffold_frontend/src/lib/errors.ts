import { CredentialsSignin } from 'next-auth';

export class ErrorResponse extends Error {
  status: number;
  detail: string;

  constructor(status: number, detail: string) {
    super(JSON.stringify({ status, detail }));
    this.status = status;
    this.detail = detail;
  }
}

function isError(error: unknown): error is Error {
  return error instanceof Error;
}

export function isErrorResponse(error: unknown): error is ErrorResponse {
  try {
    if (isError(error)) {
      const parsedMessage = JSON.parse(error.message);
      return (
        Object.prototype.hasOwnProperty.call(parsedMessage, 'status') &&
        Object.prototype.hasOwnProperty.call(parsedMessage, 'detail')
      );
    }
    return false;
  } catch {
    return false;
  }
}

export function parseErrorResponse(message: string): ErrorResponse | null {
  try {
    return JSON.parse(message);
  } catch {
    return null;
  }
}

export function isUnauthorizedError(error: unknown): boolean {
  if (isErrorResponse(error)) {
    try {
      const errorData: ErrorResponse = JSON.parse(error.message);
      return errorData.status === 401;
    } catch {
      return false;
    }
  }
  // For errors from streams
  if (isError(error) && error.message) {
    return (
      error.message.includes('status: 401') ||
      error.message.includes('statusCode: 401')
    );
  }
  return false;
}

export class CredentialsError extends CredentialsSignin {
  code = 'Invalid email or password';
}

class UnauthorizedError extends Error {
  constructor(message: string = 'Unauthorized') {
    super(message);
    this.name = 'UnauthorizedError';
  }
}

export function handleActionError(error: unknown): void {
  if (
    error instanceof Error &&
    error.message === 'NEXT_REDIRECT' &&
    'digest' in error
  ) {
    // Let Next.js handle the redirect
    throw error;
  }
}

export interface ApplicationError extends Error {
  info: string;
  status: number;
}

export function getErrorMessage(
  error: unknown,
  fallbackMessage: string,
  maxLength = 100
): string {
  if (isErrorResponse(error)) {
    try {
      const errorData: ErrorResponse = JSON.parse(error.message);
      console.log(errorData);
      // For 4xx errors, include the server's detail message
      if (errorData.status >= 400 && errorData.status < 500) {
        const detail = errorData.detail;
        return detail.length > maxLength
          ? `${detail.substring(0, maxLength)}...`
          : detail;
      }
    } catch {
      // Fall through to default message
    }
  }
  return fallbackMessage;
}
