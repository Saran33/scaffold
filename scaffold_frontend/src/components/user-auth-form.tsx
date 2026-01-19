'use client';

import type { ClientSafeProviders } from '@/types/auth';

import * as React from 'react';
import { useSearchParams } from 'next/navigation';
import { signInProvider } from '@/server/auth/session';
import { AnimatePresence, motion } from 'framer-motion';

import { cn } from '@/lib/utils/utils';
import { useAuthMessages } from '@/hooks/auth-messages';
import { AuthAnalytics } from '@/lib/analytics/auth';

import { buttonVariants } from '@/components/ui/button';
import { Icons, isKeyOfIcons } from '@/components/ui/icons';
import { AuthFormCredentialsLogin } from '@/components/auth/auth-form-credentials-login';
import { AuthFormCredentialsRegister } from '@/components/auth/auth-form-credentials-register';

interface UserAuthFormProps extends React.HTMLAttributes<HTMLDivElement> {
  mode: 'login' | 'register';
  providers: ClientSafeProviders;
}

export function UserAuthForm({
  mode,
  providers,
  className,
  ...props
}: UserAuthFormProps) {
  // Global loading state to disable all other buttons
  const [isLoading, setIsLoading] = React.useState<boolean>(false);
  // Individual loading states for spinners
  const [submittingStates, setSubmittingStates] = React.useState<
    Record<string, boolean>
  >({});

  const { continueMessage } = useAuthMessages(providers);

  // Read the redirect URL from query params
  const searchParams = useSearchParams();
  const redirectTo = searchParams?.get('from') || null;

  React.useEffect(() => {
    if (providers) {
      const initialLoadingStates: Record<string, boolean> = {};
      for (const providerId in providers) {
        initialLoadingStates[providerId] = false;
      }
      setSubmittingStates(initialLoadingStates);
    }
  }, [providers]);

  const handleSignIn = async (providerId: string) => {
    if (mode === 'login') {
      AuthAnalytics.clickLoginProvider(providerId);
    } else {
      AuthAnalytics.clickRegisterProvider(providerId);
    }

    setIsLoading(true);
    setSubmittingStates(prev => ({ ...prev, [providerId]: true }));

    try {
      await signInProvider(providerId, redirectTo);
    } catch (error) {
      setIsLoading(false);
      setSubmittingStates(prev => ({ ...prev, [providerId]: false }));
    }
  };

  const setCredentialAuthSubmitting = React.useCallback(
    (isSubmitting: boolean) => {
      setIsLoading(isSubmitting);
      setSubmittingStates(prev => ({ ...prev, credentials: isSubmitting }));
    },
    []
  );

  return (
    <AnimatePresence>
      <div className={cn('grid gap-2', className)} {...props}>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ ease: 'easeIn', duration: 0.4 }}
        >
          {providers.credentials &&
            (mode == 'login' ? (
              <AuthFormCredentialsLogin
                isLoading={isLoading}
                isSubmitting={submittingStates['credentials'] || false}
                setIsSubmitting={setCredentialAuthSubmitting}
              />
            ) : (
              <AuthFormCredentialsRegister
                isLoading={isLoading}
                isSubmitting={submittingStates['credentials'] || false}
                setIsSubmitting={setCredentialAuthSubmitting}
              />
            ))}
        </motion.div>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ ease: 'easeIn', duration: 0.35 }}
          className="relative"
        >
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">
              {continueMessage}
            </span>
          </div>
        </motion.div>
        {providers &&
          Object.keys(providers).map(
            (providerId, index) =>
              providerId !== 'credentials' && (
                <motion.button
                  key={providerId}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ ease: 'easeIn', duration: 0.44 + index * 0.1 }}
                  type="button"
                  className={cn(buttonVariants({ variant: 'outline' }))}
                  onClick={() => handleSignIn(providerId)}
                  disabled={isLoading}
                >
                  {submittingStates[providerId] ? (
                    <Icons.spinner className="mr-2 size-4 animate-spin" />
                  ) : (
                    isKeyOfIcons(providerId) && (
                      <>
                        {React.createElement(Icons[providerId], {
                          className: 'mr-2 size-4',
                        })}
                      </>
                    )
                  )}
                  {providers[providerId].name}
                </motion.button>
              )
          )}
      </div>
    </AnimatePresence>
  );
}
