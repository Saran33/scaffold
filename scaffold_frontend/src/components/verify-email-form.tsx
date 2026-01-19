'use client';

import type * as z from 'zod';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { type MotionValue, AnimatePresence, motion } from 'framer-motion';
import { cn, createQueryString, decodeJwtPayload } from '@/lib/utils/utils';
import userApi from '@/api/user-api';
import { isErrorResponse } from '@/lib/errors';
import { resendVerificationEmailSchema } from '@/lib/validations/auth';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Icons } from '@/components/ui/icons';
import { toast } from '@/components/ui/use-toast';
import CheckmarkProgress, {
  useCheckmarkProgress,
} from '@/components/ui/animations/checkmark-progress';

const fadeInAnimation = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};

enum VerificationState {
  VERIFYING,
  VERIFIED,
  REQUESTING_EMAIL,
  EMAIL_REQUESTED,
  DEFAULT,
}

interface VerifyingStateProps {
  className?: string;
}
function VerifyingState({ className }: VerifyingStateProps) {
  return (
    <div className={cn('grid place-items-center gap-1', className)}>
      <Icons.spinner className="mr-0 size-10 animate-spin" />
      <div className="space-y-4">
        <div className="space-y-2 text-center">
          <motion.h1 {...fadeInAnimation} className="text-3xl font-bold">
            Email Verification
          </motion.h1>
          <motion.p
            {...fadeInAnimation}
            transition={{ ease: 'easeOut', duration: 2 }}
            className="text-gray-500 dark:text-gray-400"
          >
            Verifying your email address...
          </motion.p>
        </div>
      </div>
    </div>
  );
}

interface VerifiedStateProps {
  className?: string;
  progress: MotionValue<number>;
  progressValue: MotionValue<number>;
  successMsgProgress: MotionValue<number>;
}
function VerifiedState({
  className,
  progress,
  progressValue,
  successMsgProgress,
}: VerifiedStateProps) {
  return (
    <div className={cn('grid place-items-center gap-1', className)}>
      <motion.div
        key="checkmark-verified"
        initial={{ x: 0 }}
        animate={{ x: 100 }}
        style={{ x: progress }}
        transition={{ duration: 1 }}
      />
      <CheckmarkProgress progress={progressValue} />
      <div className="space-y-4">
        <div className="space-y-2 text-center">
          <motion.h1
            {...fadeInAnimation}
            transition={{ ease: 'easeIn', duration: 0.5 }}
            className="text-3xl font-bold"
          >
            Email Verified
          </motion.h1>
          <motion.p
            {...fadeInAnimation}
            style={{ opacity: successMsgProgress }}
            className="text-gray-500 dark:text-gray-400"
          >
            Email address verified successfully
          </motion.p>
        </div>
      </div>
    </div>
  );
}

interface RequestingEmailStateProps {
  className?: string;
}
function RequestingEmailState({ className }: RequestingEmailStateProps) {
  return (
    <div className={cn('grid place-items-center gap-1', className)}>
      <Icons.spinner className="mr-0 size-10 animate-spin" />
      <div className="space-y-4">
        <div className="space-y-2 text-center">
          <motion.h1
            {...fadeInAnimation}
            transition={{ ease: 'easeIn', duration: 0.3 }}
            className="text-3xl font-bold"
          >
            Requesting Verification Email
          </motion.h1>
          <motion.p
            {...fadeInAnimation}
            transition={{ ease: 'easeIn', duration: 0.5 }}
            className="text-gray-500 dark:text-gray-400"
          >
            Checking your account for verification...
          </motion.p>
        </div>
      </div>
    </div>
  );
}

interface EmailRequestedStateProps {
  className?: string;
  progress: MotionValue<number>;
  progressValue: MotionValue<number>;
  isLoading: boolean;
  email?: string | null;
  onSubmit: (email: string) => Promise<void>;
}

function EmailRequestedState({
  className,
  progress,
  progressValue,
  isLoading,
  email,
  onSubmit,
}: EmailRequestedStateProps) {
  return (
    <div className={cn('grid place-items-center gap-1', className)}>
      <motion.div
        key="checkmark-requested-email"
        initial={{ x: 0 }}
        animate={{ x: 100 }}
        style={{ x: progress }}
        transition={{ duration: 1 }}
      />
      <CheckmarkProgress progress={progressValue} />
      <div className="space-y-4">
        <div className="space-y-2 text-center">
          <motion.h1
            {...fadeInAnimation}
            transition={{ ease: 'easeIn', duration: 0.3 }}
            className="text-3xl font-bold"
          >
            Verification Email Sent
          </motion.h1>
          <motion.p
            {...fadeInAnimation}
            transition={{ ease: 'easeIn', duration: 0.5 }}
            className="text-gray-500 dark:text-gray-400"
          >
            Please check your inbox to verify your email
          </motion.p>
        </div>
        <ResendEmailForm
          key="resend-email-form-email-sent"
          isLoading={isLoading}
          email={email}
          onSubmit={onSubmit}
        />
      </div>
    </div>
  );
}

interface DefaultStateProps {
  className?: string;
  verificationError: boolean;
  token: string | null;
  isLoading: boolean;
  email?: string | null;
  onSubmit: (email: string) => Promise<void>;
}

function DefaultState({
  className,
  verificationError,
  token,
  isLoading,
  email,
  onSubmit,
}: DefaultStateProps) {
  return (
    <div className={cn('grid gap-6', className)}>
      <div className="space-y-4">
        <div className="space-y-2 text-center">
          <motion.h1
            {...fadeInAnimation}
            transition={{ ease: 'easeIn', duration: 0.3 }}
            className="text-3xl font-bold"
          >
            Verify Email
          </motion.h1>
          <motion.p
            {...fadeInAnimation}
            transition={{ ease: 'easeIn', duration: 0.5 }}
            className="text-gray-500 dark:text-gray-400"
          >
            {verificationError
              ? 'Invalid or expired verification link - Please request a new verification email'
              : !token
                ? 'Please check your inbox to verify your email'
                : 'Please request a new verification email'}
          </motion.p>
        </div>
        <ResendEmailForm
          isLoading={isLoading}
          email={email}
          onSubmit={onSubmit}
        />
      </div>
    </div>
  );
}

interface VerifyEmailFormProps {
  className?: string;
}

export function VerifyEmailForm({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams?.get('token') || null;
  const [email, setEmail] = useState<string | null | undefined>(null);

  const [verificationState, setVerificationState] = useState<VerificationState>(
    VerificationState.VERIFYING
  );
  const [isLoading, setIsLoading] = useState(true);
  const [verificationError, setVerificationError] = useState(false);

  const { progress, progressValue, successMsgProgress } =
    useCheckmarkProgress();

  const redirectToLogin = useCallback(
    (msg: string, delay: number) => {
      const redirectURL = '/login';
      const query = createQueryString({
        emailUnverified: 'false',
        getStarted: 'true',
        msg,
      });
      setTimeout(() => {
        router.push(`${redirectURL}?${query}`);
      }, delay);
    },
    [router]
  );

  useEffect(() => {
    setEmail(searchParams?.get('email') || null);
  }, [searchParams]);

  useEffect(() => {
    setEmail(token ? decodeJwtPayload(token)?.sub : null);

    const verifyEmail = async () => {
      if (!token) {
        setTimeout(() => {
          setVerificationState(VerificationState.DEFAULT);
          setIsLoading(false);
        }, 2000);
        return;
      }
      try {
        setVerificationState(VerificationState.VERIFYING);
        const res = await userApi.verifyEmail(token);

        if (res.status === 200 && res.data) {
          setTimeout(() => {
            setVerificationState(VerificationState.VERIFIED);
            setIsLoading(false);
          }, 2000);
          redirectToLogin(res.data.msg || 'Email verified successfully', 5000);
        } else {
          throw new Error('Verification failed');
        }
      } catch (error) {
        setVerificationError(true);
        setTimeout(() => {
          console.debug('verification failed\n', error);
          setVerificationState(VerificationState.DEFAULT);
          setIsLoading(false);
        }, 2000);
      }
    };

    verifyEmail().catch(error => {
      console.error('Error verifying email', error);
    });
  }, [token, redirectToLogin]);

  const resendVerificationEmail = async (email?: string | null) => {
    setIsLoading(true);
    setVerificationState(VerificationState.REQUESTING_EMAIL);
    if (!email) {
      setVerificationState(VerificationState.DEFAULT);
      setIsLoading(false);
      return;
    }
    try {
      const resp = await userApi.requestEmailVerificationEmail(email);
      if (resp.status === 200) {
        setTimeout(() => {
          setVerificationState(VerificationState.EMAIL_REQUESTED);
          setIsLoading(false);
          toast({
            title: 'Verification Email Sent',
            description: `We sent you a login link to ${email}. Be sure to check your spam too.`,
          });
        }, 5000);
      }
      if (resp.status === 208) {
        setTimeout(() => {
          setVerificationState(VerificationState.VERIFIED);
          setIsLoading(false);
        }, 2000);
        redirectToLogin('Email already verified', 5000);
      }
    } catch (error) {
      const toastMsg = isErrorResponse(error)
        ? `${error.status} - ${error.detail}`
        : 'Verification email failed to send';
      toast({
        title: 'Verification Error',
        description: toastMsg,
        variant: 'destructive',
      });
      setVerificationState(VerificationState.DEFAULT);
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence initial={true}>
      {(() => {
        switch (verificationState) {
          case VerificationState.VERIFYING:
            return <VerifyingState className={className} />;
          case VerificationState.VERIFIED:
            return (
              <VerifiedState
                className={className}
                progress={progress}
                progressValue={progressValue}
                successMsgProgress={successMsgProgress}
              />
            );
          case VerificationState.REQUESTING_EMAIL:
            return <RequestingEmailState className={className} />;
          case VerificationState.EMAIL_REQUESTED:
            return (
              <EmailRequestedState
                className={className}
                progress={progress}
                progressValue={progressValue}
                isLoading={isLoading}
                email={email}
                onSubmit={resendVerificationEmail}
              />
            );
          case VerificationState.DEFAULT:
          default:
            return (
              <DefaultState
                className={className}
                verificationError={verificationError}
                token={token}
                isLoading={isLoading}
                email={email}
                onSubmit={resendVerificationEmail}
              />
            );
        }
      })()}
    </AnimatePresence>
  );
}

interface ResendEmailFormProps {
  keyPrefix?: string;
  initial?: any;
  animate?: any;
  exit?: any;
  transition?: any;
  isLoading?: boolean;
  email?: string | null;
  onSubmit: (email: string) => Promise<void>;
}
function ResendEmailForm(
  {
    keyPrefix,
    initial,
    animate,
    exit,
    transition,
    email,
    isLoading,
    onSubmit,
  }: ResendEmailFormProps = {
    keyPrefix: 'resend-email-form',
    initial: { opacity: 0, x: 0 },
    animate: { opacity: 1, x: 1 },
    exit: { opacity: 0 },
    transition: { ease: 'easeIn', delay: 0, duration: 0.7 },
    onSubmit: async () => {},
  }
) {
  type FormData = z.infer<typeof resendVerificationEmailSchema>;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(resendVerificationEmailSchema),
  });

  const onSubmitHandler = async (data: FormData) => {
    const emailVal = data.email || email;
    if (!emailVal) {
      return;
    }
    await onSubmit(emailVal);
  };

  return (
    <form onSubmit={handleSubmit(onSubmitHandler)}>
      <div className="grid gap-2">
        {!email && (
          <motion.div
            key={`${keyPrefix}-input`}
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
              disabled={isLoading}
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
          key={`${keyPrefix}-btn`}
          initial={initial}
          animate={animate}
          exit={exit}
          transition={transition}
        >
          <Button className="w-full" type="submit">
            Send Verification Email Again
          </Button>
        </motion.div>
      </div>
    </form>
  );
}
