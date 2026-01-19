import type { ClassValue } from 'clsx';
import type { UUID } from '@/types/utils';

import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { v4 as uuidv4 } from 'uuid';

import { env } from '@/env/client.mjs';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
export function uuid4() {
  return uuidv4() as UUID;
}

export function absoluteUrl(path: string) {
  return `${env.NEXT_PUBLIC_APP_URL}${path}`;
}

export function toTitleCase(input: string) {
  return input
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export const toNumber = (val: string) => {
  const n = Number(val);
  return Number.isFinite(n) ? n : undefined;
};

export function clamp(n: number, lo: number, hi: number) {
  return Math.min(Math.max(n, lo), hi);
}

export function formatCurrency(
  amount: number,
  currency = 'usd',
  decimals?: number,
  locale = 'en-US'
) {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: decimals !== undefined ? decimals : 2,
  }).format(amount / 100);
}

export function createQueryString(
  addParams: Record<string, string>,
  searchParams?: URLSearchParams | string
) {
  const params = new URLSearchParams(searchParams ?? undefined);
  Object.entries(addParams).forEach(([key, value]) => {
    params.set(key, value);
  });
  return params.toString();
}

export function isMobile() {
  if (typeof window === 'undefined') {
    throw new Error('isMobile() can only be called in the browser');
  }
  return window.innerWidth <= 768;
}

export const decodeJwtPayload = (token: string) => {
  try {
    return JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
  } catch (exc) {
    console.error('Error decoding token:', exc);
    return null;
  }
};

export const addToTransDuration = (transition: any, duration: number) => {
  const updatedDuration = transition.duration + duration;
  return { ...transition, duration: updatedDuration };
};

export function parseBoolean(
  value?: boolean | 'true' | 'false' | null
): boolean {
  if (typeof value === 'string') {
    return value === 'true';
  }
  return !!value;
}

const formatNumber = (value: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(value);

/**
 * Format a numeric value with up to `maxDecimals` decimals,
 * dropping any unnecessary trailing zeros.
 */
export const formatTokenCost = (
  value: number | string,
  maxDecimals = 6
): string =>
  Number(value).toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: maxDecimals,
  });

const runAsyncFnWithoutBlocking = (fn: (...args: any) => Promise<any>) => {
  fn().catch(error => {
    console.error('An error occurred in the async function:', error);
  });
};

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const getStringFromBuffer = (buffer: ArrayBuffer) =>
  Array.from(new Uint8Array(buffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');

function ensureString(value: unknown): string {
  if (typeof value === 'string') {
    return value;
  }
  return JSON.stringify(value);
}

export function redirectWithQuery(
  destination: string,
  pathname: string,
  search: string
) {
  let from = pathname;
  if (search) from += search;

  if (destination.includes('?')) {
    destination += `&from=${encodeURIComponent(from)}`;
  } else {
    destination += `?from=${encodeURIComponent(from)}`;
  }
  return destination;
}

export const getIsServer = () => typeof window === 'undefined';

function coerceBinaryToBase64(data: Uint8Array | ArrayBuffer | Buffer): string {
  if (Buffer.isBuffer(data)) {
    return data.toString('base64');
  } else if (data instanceof Uint8Array) {
    return Buffer.from(data).toString('base64');
  } else if (data instanceof ArrayBuffer) {
    return Buffer.from(new Uint8Array(data)).toString('base64');
  }
  throw new Error('Unsupported data format');
}

export function normalizeToString(
  data: string | URL | Uint8Array | ArrayBuffer | Buffer
): string {
  if (data instanceof URL) {
    return data.toString();
  } else if (typeof data === 'string') {
    return data;
  } else {
    return coerceBinaryToBase64(data);
  }
}

export function getFileExtensionFromURLString(url: string): string {
  // remove any query string and then get the extension
  const extension = url.split('?')[0].split('.').pop();
  if (!extension) {
    throw new Error('Could not determine MIME type from URL');
  }
  return extension;
}

export function toCamelCase(str: string): string {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

export function convertKeysToCamelCase<T = any>(obj: Record<string, any>): T {
  return Object.entries(obj).reduce((acc, [key, value]) => {
    acc[toCamelCase(key)] = value;
    return acc;
  }, {} as any);
}

export function camelCaseToTitleCase(str: string): string {
  return str
    .replace(/([A-Z])/g, ' $1') // Add space before uppercase letters
    .replace(/^./, char => char.toUpperCase()) // Capitalize first letter
    .trim();
}

export function truncateAddress(address: string, chars = 4): string {
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
}
