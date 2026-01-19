import type { ApplicationError } from '@/lib/errors';

export const jsonHeaders = {
  'Content-Type': 'application/json',
};

export function authHeaders(token: string) {
  return { Authorization: `Bearer ${token}` };
}

export function isAxiosDataWithDetail(
  data: unknown
): data is { detail: string } {
  return (
    typeof data === 'object' &&
    data !== null &&
    'detail' in data &&
    typeof (data as { detail: unknown }).detail === 'string'
  );
}

export const fetcher = async (url: string) => {
  const res = await fetch(url);

  if (!res.ok) {
    const error = new Error(
      'An error occurred while fetching the data.'
    ) as ApplicationError;

    error.info = await res.json();
    error.status = res.status;

    throw error;
  }

  return res.json();
};
