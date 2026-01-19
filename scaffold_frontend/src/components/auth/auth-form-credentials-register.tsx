'use client';

import * as React from 'react';
import type * as z from 'zod';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';

import userApi from '@/api/user-api';
import { isErrorResponse } from '@/lib/errors';
import { cn, createQueryString } from '@/lib/utils/utils';
import { userSignUpSchema } from '@/lib/validations/auth';

import { buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Icons } from '@/components/ui/icons';
import { toast } from '@/components/ui/use-toast';

const ERROR_MESSAGES = {
  USER_EXISTS: 'The email address provided is already in use.',
  DEFAULT: 'Something went wrong. Please try again.',
};

interface AuthFormCredentialsRegisterProps {
  isLoading: boolean;
  isSubmitting: boolean;
  setIsSubmitting: (isSubmitting: boolean) => void;
}

type FormData = z.infer<typeof userSignUpSchema>;

export function AuthFormCredentialsRegister({
  isLoading,
  isSubmitting,
  setIsSubmitting,
}: AuthFormCredentialsRegisterProps): React.JSX.Element {
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<FormData>({
    resolver: zodResolver(userSignUpSchema),
  });

  async function onSubmit(data: FormData) {
    setIsSubmitting(true);
    try {
      await userApi.createUserOpen({
        email: data.email,
        password: data.password,
      });
      const redirectURL = '/verify-email';
      const query = createQueryString({
        email: data.email,
      });
      router.push(`${redirectURL}?${query}`);
    } catch (error) {
      if (isErrorResponse(error)) {
        if (error.status === 409) {
          setError('email', { message: ERROR_MESSAGES.USER_EXISTS });
        } else {
          console.error('Registration Error:', error.detail);
          toast({
            title: 'Registration Error',
            description: error.detail,
            variant: 'destructive',
          });
        }
      } else {
        console.error('Registration Error:', error);
        toast({
          title: 'Registration Error',
          description: ERROR_MESSAGES.DEFAULT,
          variant: 'destructive',
        });
      }
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className="grid gap-2">
        <div className="grid gap-1">
          <Label className="sr-only" htmlFor="email">
            Email
          </Label>
          <Input
            id="email"
            placeholder="Enter your email"
            type="email"
            autoCapitalize="none"
            autoComplete="email"
            autoCorrect="off"
            disabled={isLoading}
            {...register('email')}
          />
          {errors?.email && (
            <p className="px-1 text-xs text-red-600">{errors.email.message}</p>
          )}
        </div>
        <div className="grid gap-1">
          <Label className="sr-only" htmlFor="password">
            Create Password
          </Label>
          <Input
            id="password"
            placeholder="Create password"
            type="password"
            autoCapitalize="none"
            autoComplete="new-password"
            autoCorrect="off"
            disabled={isLoading}
            {...register('password')}
          />
          {errors?.password && (
            <p className="px-1 text-xs text-red-600">
              {errors.password.message}
            </p>
          )}
        </div>
        <div className="grid gap-1">
          <Label className="sr-only" htmlFor="confirmPassword">
            Confirm Password
          </Label>
          <Input
            id="confirmPassword"
            placeholder="Confirm password"
            type="password"
            autoCapitalize="none"
            autoComplete="new-password"
            autoCorrect="off"
            disabled={isLoading}
            {...register('confirmPassword')}
          />
          {errors?.confirmPassword && (
            <p className="px-1 text-xs text-red-600">
              {errors.confirmPassword.message}
            </p>
          )}
        </div>
        <button
          className={cn(buttonVariants())}
          disabled={isLoading || isSubmitting}
        >
          {isSubmitting && (
            <Icons.spinner className="mr-2 size-4 animate-spin" />
          )}
          Create Account
        </button>
      </div>
    </form>
  );
}
