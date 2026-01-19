'use client';

import { type Toast, toast } from '@/components/ui/use-toast';

const unknownErrorMsg = (title?: string, description?: string): Toast => ({
  title: title || 'Something went wrong',
  description:
    description || 'If the problem persists, please contact support.',
  variant: 'destructive',
});

export const errorToast = ({
  title,
  description,
}: {
  title?: string;
  description?: string;
}) => {
  return toast(unknownErrorMsg(title, description));
};
