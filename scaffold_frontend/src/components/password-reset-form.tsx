'use client';

import type * as z from 'zod';
import * as React from 'react';
import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { AnimatePresence, motion } from 'framer-motion';
import { cn, decodeJwtPayload, addToTransDuration } from '@/lib/utils/utils';
import userApi from '@/api/user-api';
import { isErrorResponse } from '@/lib/errors';
import {
  requestPasswordRecoverySchema,
  passwordResetSchema,
} from '@/lib/validations/auth';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Icons } from '@/components/ui/icons';
import { toast } from '@/components/ui/use-toast';
import CheckmarkProgress, {
  useCheckmarkProgress,
} from '@/components/ui/animations/checkmark-progress';

export function PasswordResetForm({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams?.get('token') || null;
  const [email, setEmail] = useState<string | null | undefined>(null);

  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [isEmailSent, setIsEmailSent] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [isPasswordUpdated, setIsPasswordUpdated] = useState(false);
  const [isPasswordUpdateError, setPasswordUpdateError] = useState(false);
  const [showPasswordResetForm, setShowPasswordResetForm] = useState(false);

  const { progress, progressValue, successMsgProgress } =
    useCheckmarkProgress();

  useEffect(() => {
    setEmail(searchParams?.get('email') || null);
  }, [searchParams]);

  useEffect(() => {
    if (token) {
      setShowPasswordResetForm(true);
      setEmail(token ? decodeJwtPayload(token)?.sub : null);
    }
  }, [token]);

  const requestPasswordRecovery = async (email: string) => {
    setIsSendingEmail(true);
    try {
      const data = await userApi.requestPasswordRecovery(email);
      if (data) {
        // console.log(data.msg);
        setTimeout(() => {
          setIsEmailSent(true);
          setIsSendingEmail(false);
          toast({
            title: 'Password Reset Email Sent',
            description: `We sent a link to ${email}. Be sure to check your spam too.`,
          });
        }, 5000);
      }
    } catch (error) {
      const toastMsg = isErrorResponse(error)
        ? `${error.status} - ${error.detail}`
        : 'Failed to send email. Please try again.';
      toast({
        title: 'Error',
        description: toastMsg,
        variant: 'destructive',
      });
      setIsSendingEmail(false);
    }
  };

  const resetPassword = async (password: string) => {
    setIsUpdatingPassword(true);
    if (!token) {
      setTimeout(() => {
        setIsUpdatingPassword(false);
      }, 2000);
      setPasswordUpdateError(true);
      return;
    }
    try {
      const res = await userApi.resetPassword(token, {
        password,
      });

      if (res.status === 200 && res.data) {
        setTimeout(() => {
          setIsPasswordUpdated(true);
        }, 2000);
        setTimeout(() => {
          setIsUpdatingPassword(false);
        }, 2000);
      } else {
        throw new Error('Password update failed');
      }
    } catch (error) {
      setPasswordUpdateError(true);
      setTimeout(() => {
        console.debug('verification failed\n', error);
        setIsUpdatingPassword(false);
      }, 2000);
    }
  };

  function LoginButton() {
    return (
      <Button
        className="w-full"
        key="login-btn"
        onClick={() => {
          router.push('/login');
        }}
      >
        Sign In
      </Button>
    );
  }

  interface RequestPasswordRecoveryFormProps {
    key?: string;
    initial?: any;
    animate?: any;
    exit?: any;
    transition?: any;
  }

  const RequestPasswordRecoveryFormComponent = React.forwardRef<
    HTMLDivElement,
    RequestPasswordRecoveryFormProps
  >(
    (
      {
        key,
        initial,
        animate,
        exit,
        transition,
      }: RequestPasswordRecoveryFormProps = {
        key: 'resend-email-form',
        initial: { opacity: 0, x: 0 },
        animate: { opacity: 1, x: 1 },
        exit: { opacity: 0 },
        transition: { ease: 'easeIn', delay: 0, duration: 0.2 },
      },
      ref: React.Ref<HTMLDivElement>
    ) => {
      type FormData = z.infer<typeof requestPasswordRecoverySchema>;

      const {
        register,
        handleSubmit,
        formState: { errors },
      } = useForm<FormData>({
        resolver: zodResolver(requestPasswordRecoverySchema),
      });

      const onSubmit = async (data: FormData) => {
        setEmail(data.email);
        await requestPasswordRecovery(data.email);
      };

      return (
        <div ref={ref} className="grid gap-2">
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="grid gap-2">
              {!email && (
                <motion.div
                  key={`${key}-input`}
                  initial={initial}
                  animate={animate}
                  exit={exit}
                  transition={transition}
                  className="grid gap-1"
                >
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
                    disabled={isUpdatingPassword}
                    {...register('email')}
                  />
                  {errors?.email && (
                    <p className="px-1 text-xs text-red-600">
                      {errors.email.message}
                    </p>
                  )}
                </motion.div>
              )}
              <motion.div
                key={`${key}-submit-btn`}
                initial={initial}
                animate={animate}
                exit={exit}
                transition={addToTransDuration(transition, 0.5)}
              >
                <Button className="w-full" type="submit">
                  Send Password Reset Email{isEmailSent ? ' Again' : ''}
                </Button>
              </motion.div>
            </div>
          </form>
          {isEmailSent && (
            <motion.div
              key={`${key}-login-btn`}
              initial={initial}
              animate={animate}
              exit={exit}
              transition={addToTransDuration(transition, 0.4)}
            >
              <LoginButton />
            </motion.div>
          )}
        </div>
      );
    }
  );
  RequestPasswordRecoveryFormComponent.displayName =
    'RequestPasswordRecoveryForm';
  const RequestPasswordRecoveryForm = motion(
    RequestPasswordRecoveryFormComponent,
    { forwardMotionProps: true }
  );

  interface NewPasswordFormProps {
    key?: string;
    initial?: any;
    animate?: any;
    exit?: any;
    transition?: any;
  }
  const NewPasswordFormComponent = React.forwardRef<
    HTMLDivElement,
    NewPasswordFormProps
  >(
    (
      { key, initial, animate, exit, transition }: NewPasswordFormProps = {
        key: 'password-reset-form',
        initial: { opacity: 0, x: 0 },
        animate: { opacity: 1, x: 1 },
        exit: { opacity: 0 },
        transition: { ease: 'easeIn', delay: 0, duration: 0.7 },
      }
    ) => {
      type PasswordResetFormData = z.infer<typeof passwordResetSchema>;

      const {
        register,
        handleSubmit,
        formState: { errors },
      } = useForm<PasswordResetFormData>({
        resolver: zodResolver(passwordResetSchema),
      });

      const onSubmit = async (data: PasswordResetFormData) => {
        await resetPassword(data.password);
      };

      return (
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid gap-2">
            <motion.div
              key={`${key}-input`}
              initial={initial}
              animate={animate}
              exit={exit}
              transition={transition}
              className="grid gap-1"
            >
              <Label className="sr-only" htmlFor="new-password">
                New Password
              </Label>
              <Input
                id="new-password"
                placeholder="Enter your new password"
                type="password"
                autoCapitalize="none"
                autoComplete="password"
                autoCorrect="off"
                disabled={isUpdatingPassword}
                {...register('password')}
              />
              {errors?.password && (
                <p className="px-1 text-xs text-red-600">
                  {errors.password.message}
                </p>
              )}
              <Label className="sr-only" htmlFor="new-password">
                Confirm Password
              </Label>
              <Input
                id="confirm-password"
                placeholder="Confirm your new password"
                type="password"
                autoCapitalize="none"
                autoComplete="off"
                autoCorrect="off"
                disabled={isUpdatingPassword}
                {...register('confirmPassword')}
              />
              {errors?.confirmPassword && (
                <p className="px-1 text-xs text-red-600">
                  {errors.confirmPassword.message}
                </p>
              )}
            </motion.div>
            <motion.div
              key={`${key}-btn`}
              initial={initial}
              animate={animate}
              exit={exit}
              transition={addToTransDuration(transition, 0.5)}
            >
              <Button className="w-full" type="submit">
                Reset Password
              </Button>
            </motion.div>
          </div>
        </form>
      );
    }
  );
  NewPasswordFormComponent.displayName = 'NewPasswordForm';
  const NewPasswordForm = motion(NewPasswordFormComponent, {
    forwardMotionProps: true,
  });

  return (
    <AnimatePresence initial={true}>
      <div
        className={cn('grid place-items-center gap-1', className)}
        {...props}
      >
        {/* RESETTING PASSWORD */}
        {isUpdatingPassword && !isPasswordUpdated ? (
          <>
            <Icons.spinner className="mr-0 size-10 animate-spin" />
            <div className="space-y-4">
              <div className="space-y-2 text-center">
                <motion.h1
                  key="h1-resetting-pass"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ ease: 'easeOut', duration: 1 }}
                  className="text-3xl font-bold"
                >
                  Updating Password
                </motion.h1>
                <motion.p
                  key="p-resetting-pass"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ ease: 'easeOut', duration: 2 }}
                  className="text-gray-500 dark:text-gray-400"
                >
                  Updating your password...
                </motion.p>
              </div>
            </div>
          </>
        ) : // PASSWORD RESET SUCCESSFUL
        isPasswordUpdated ? (
          <>
            <motion.div
              key="checkmark-reset-successful"
              initial={{ x: 0 }}
              animate={{ x: 100 }}
              style={{ x: progress }}
              transition={{ duration: 1 }}
            />
            <CheckmarkProgress progress={progressValue} />
            <div className="space-y-4">
              <div className="space-y-2 text-center">
                <motion.h1
                  key="h1-pass-reset-successful"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ ease: 'easeIn', duration: 0.5 }}
                  className="text-3xl font-bold"
                >
                  Password Reset
                </motion.h1>
                <motion.p
                  key="p-pass-reset-successful"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  style={{ opacity: successMsgProgress }}
                  className="text-gray-500 dark:text-gray-400"
                >
                  Your password has been successfully reset
                </motion.p>
              </div>
              <LoginButton />
            </div>
          </>
        ) : // SENDING EMAIL
        isSendingEmail ? (
          <>
            <Icons.spinner className="mr-0 size-10 animate-spin" />
            <div className="space-y-4">
              <div className="space-y-2 text-center">
                <motion.h1
                  key="h1-sending-pass-reset-email"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ ease: 'easeIn', duration: 0.3 }}
                  className="text-3xl font-bold"
                >
                  Sending Email
                </motion.h1>
                <motion.p
                  key="p-sending-pass-reset-email"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ ease: 'easeIn', duration: 0.5 }}
                  className="text-gray-500 dark:text-gray-400"
                >
                  Sending password reset email{email ? ` to ${email}` : ''}...
                </motion.p>
              </div>
            </div>
          </>
        ) : // EMAIL SENT
        isEmailSent ? (
          <>
            <motion.div
              key="checkmark-pass-reset-email-sent"
              initial={{ x: 0 }}
              animate={{ x: 100 }}
              style={{ x: progress }}
              transition={{ duration: 1 }}
            />
            <CheckmarkProgress progress={progressValue} />
            <div className="space-y-4">
              <div className="space-y-2 text-center">
                <motion.h1
                  key="h1-pass-reset-email-sent"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ ease: 'easeIn', duration: 0.3 }}
                  className="text-3xl font-bold"
                >
                  Email Sent
                </motion.h1>
                <motion.p
                  key="p-pass-reset-email-sent"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ ease: 'easeIn', duration: 0.5 }}
                  className="text-gray-500 dark:text-gray-400"
                >
                  Follow the steps provided in the email to update your
                  password. If you don&apos;t want to change your password,
                  select &quot;Sign In.&quot;
                </motion.p>
              </div>
              <RequestPasswordRecoveryForm
                key="resend-pass-reset-email-sent"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ ease: 'easeIn', duration: 0.3 }}
              />
            </div>
          </>
        ) : showPasswordResetForm ? (
          <div className="space-y-4">
            <div className="space-y-2 text-center">
              <motion.h1
                key="h1-default-pass-reset"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ ease: 'easeIn', duration: 0.3 }}
                className="text-3xl font-bold"
              >
                Reset Password
              </motion.h1>
              <motion.p
                key="p-default-pass-reset"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ ease: 'easeIn', duration: 0.9 }}
                className="text-gray-500 dark:text-gray-400"
              >
                Create a new password for your account
              </motion.p>
            </div>
            <NewPasswordForm
              key="new-password-form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ ease: 'easeIn', duration: 0.3 }}
            />
          </div>
        ) : (
          // DEFAULT
          <div className="space-y-4">
            <div className="space-y-2 text-center">
              <motion.h1
                key="h1-default-pass-reset"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ ease: 'easeIn', duration: 0.3 }}
                className="text-3xl font-bold"
              >
                Password Recovery
              </motion.h1>
              <motion.p
                key="p-default-pass-reset"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ ease: 'easeIn', duration: 0.6 }}
                className="text-gray-500 dark:text-gray-400"
              >
                {isPasswordUpdateError
                  ? 'Invalid or expired link - Please request a new password reset email'
                  : 'Enter your email address to receive a password reset email'}
              </motion.p>
            </div>
            <RequestPasswordRecoveryForm
              key="resend-pass-reset-email"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ ease: 'easeIn', duration: 0.3 }}
            />
          </div>
        )}
      </div>
    </AnimatePresence>
  );
}
