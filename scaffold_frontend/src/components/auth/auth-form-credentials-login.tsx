'use client';

import Form from 'next/form';
import { redirect, useSearchParams } from 'next/navigation';
import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { cn } from '@/lib/utils/utils';
import { type userAuthFormData, userAuthSchema } from '@/lib/validations/auth';
import { signInCredentials } from '@/server/auth/session';

import { buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/use-toast';
import { Icons } from '@/components/ui/icons';

const ERROR_MESSAGES = {
  signIn: 'Sign In Error',
};

interface AuthFormCredentialsLoginProps {
  isLoading: boolean;
  isSubmitting: boolean;
  setIsSubmitting: (isSubmitting: boolean) => void;
}

export function AuthFormCredentialsLogin({
  isLoading,
  isSubmitting,
  setIsSubmitting,
}: AuthFormCredentialsLoginProps): React.JSX.Element {
  const searchParams = useSearchParams();
  const [callbackUrl] = React.useState(searchParams?.get('from') || '');
  const formRef = React.useRef<HTMLFormElement>(null);
  const [signInState, signInAction] = React.useActionState(
    signInCredentials,
    undefined
  );

  const {
    register,
    handleSubmit,
    formState: { errors, isValid, isDirty },
  } = useForm<userAuthFormData>({
    resolver: zodResolver(userAuthSchema),
    defaultValues: {
      email: '',
      password: '',
      ...(signInState?.fields ?? {}),
    },
    mode: 'onTouched',
  });

  React.useEffect(() => {
    if (signInState?.error) {
      setIsSubmitting(false);
      toast({
        title: ERROR_MESSAGES.signIn,
        description: signInState.error,
        variant: 'destructive',
      });
    }

    if (signInState?.url) {
      redirect(signInState.url);
    }
  }, [signInState, setIsSubmitting]);

  const onSubmit = () => {
    setIsSubmitting(true);
    const formData = new FormData(formRef.current!);
    formData.set('from', callbackUrl);

    React.startTransition(() => {
      signInAction(formData);
    });
  };

  return (
    <Form ref={formRef} action={signInAction} onSubmit={handleSubmit(onSubmit)}>
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
          {errors.email && (
            <p className="px-1 text-xs text-red-600">{errors.email.message}</p>
          )}
        </div>
        <div className="grid gap-1">
          <Label className="sr-only" htmlFor="password">
            Password
          </Label>
          <Input
            id="password"
            placeholder="Enter your password"
            type="password"
            autoCapitalize="none"
            autoComplete="current-password"
            autoCorrect="off"
            disabled={isLoading}
            {...register('password')}
          />
          {errors.password && (
            <p className="px-1 text-xs text-red-600">
              {errors.password.message}
            </p>
          )}
        </div>
        <button
          className={cn(buttonVariants())}
          disabled={isLoading || (!isValid && isDirty)}
          type="submit"
        >
          {isSubmitting && (
            <Icons.spinner className="mr-2 size-4 animate-spin" />
          )}
          Sign In with Email
        </button>
      </div>
    </Form>
  );
}
