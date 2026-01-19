'use client';

import type { ClientSafeProviders } from '@/types/auth';

import * as React from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { AnimatePresence, motion } from 'framer-motion';

import { siteConfig } from '@/config/site';
import { useAuthMessages } from '@/hooks/auth-messages';

import { Icons } from '@/components/ui/icons';
import { toast } from '@/components/ui/use-toast';

interface UserAuthHeadingProps extends React.HTMLAttributes<HTMLDivElement> {
  mode: 'login' | 'register';
  providers: ClientSafeProviders;
}

const signInErrorMessages = {
  'No email in profile': {
    title: 'Email Required',
    description: `No email associated with your profile.
    Please sign up with an email address or sign in with an alternative method to continue.`,
  },
  'Account not active': {
    title: 'Inactive Account',
    description:
      'Your account is currently deactivated. Please contact support.',
  },
};

export function UserAuthHeading({
  mode,
  providers,
  className,
  ...props
}: UserAuthHeadingProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { authMessage, signUpMessage } = useAuthMessages(providers);

  const message = mode === 'login' ? authMessage : signUpMessage;

  const defaultHeading = mode === 'login' ? 'Sign In' : 'Create an account';
  const welcomeHeading = 'Get Started';
  const farewellHeading = 'Signed Out';

  const [heading, setHeading] = React.useState(siteConfig.name);
  const [showHeading, setShowHeading] = React.useState(true);
  const [logoutSuccessShown, setLogoutSuccessShown] = React.useState(false);

  const logoutSuccess = searchParams?.get('logoutSuccess');
  const getStarted = searchParams?.get('getStarted');
  const emailUnverified = searchParams?.get('emailUnverified');
  const signInAgain = searchParams?.get('signInAgain');
  const headingTransitionDelay = 700;

  React.useEffect(() => {
    if (logoutSuccess === 'true') {
      setLogoutSuccessShown(true);
      setTimeout(() => {
        setShowHeading(false);
        setTimeout(() => {
          setHeading(farewellHeading);
          setShowHeading(true);
        }, headingTransitionDelay);
      }, headingTransitionDelay);

      const timer = setTimeout(() => {
        setShowHeading(false);
        setTimeout(() => {
          setHeading(defaultHeading);
          setShowHeading(true);
          router.replace(pathname ?? 'login');
        }, headingTransitionDelay); // Timeout should be the same as the duration of the fade-out transition
      }, 10000); // Change to the welcome heading after 10 seconds

      const handleVisibilityChange = () => {
        if (document.hidden) {
          setHeading(defaultHeading);
          router.replace(pathname ?? 'login');
        }
      };
      document.addEventListener('visibilitychange', handleVisibilityChange);

      // Cleanup function to remove the event listener
      // and clear the timeout when the component unmounts or updates
      return () => {
        document.removeEventListener(
          'visibilitychange',
          handleVisibilityChange
        );
        clearTimeout(timer);
      };
    } else if (!logoutSuccessShown && !getStarted) {
      setTimeout(() => {
        setShowHeading(false);
        setTimeout(() => {
          setHeading(defaultHeading);
          setShowHeading(true);
        }, headingTransitionDelay);
      }, headingTransitionDelay);
    } else if (getStarted === 'true') {
      setTimeout(() => {
        setShowHeading(false);
        setTimeout(() => {
          setHeading(welcomeHeading);
          setShowHeading(true);
        }, headingTransitionDelay);
      }, headingTransitionDelay);
    }
  }, [
    logoutSuccess,
    logoutSuccessShown,
    getStarted,
    router,
    pathname,
    defaultHeading,
  ]);

  React.useEffect(() => {
    if (emailUnverified === 'true') {
      if (getStarted === 'true') {
        const email = searchParams?.get('email');
        if (email) {
          toast({
            title: 'Account Created — Please verify your email',
            description: `We sent you a login link to ${email}. Be sure to check your spam too.`,
          });
        }
      }
    } else if (emailUnverified === 'false') {
      const toastMsg = searchParams?.get('msg');
      toast({
        title: 'Account Verification Successful',
        description: `${toastMsg} - Sign in to continue.`,
      });
    }
  }, [getStarted, searchParams, emailUnverified]);

  React.useEffect(() => {
    const errorQuery = searchParams?.get('error');
    if (errorQuery) {
      const decodedError = decodeURIComponent(errorQuery);
      if (decodedError === 'Email not verified') {
        router.push('/verify-email');
      }
      const errorConfig =
        signInErrorMessages[decodedError as keyof typeof signInErrorMessages];

      if (errorConfig) {
        toast({
          title: errorConfig.title,
          description: errorConfig.description,
          variant: 'destructive',
        });
      } else {
        const defaultError =
          decodedError.charAt(0).toUpperCase() + decodedError.slice(1);
        toast({
          title: 'Login Unsuccessful',
          description: `${defaultError}`,
          variant: 'destructive',
        });
      }
    }
  }, [searchParams, router]);

  React.useEffect(() => {
    if (signInAgain === 'true') {
      signOut({ redirect: false }).catch(() => {
        console.error('Failed to sign out');
      });
      toast({
        title: 'Session Expired',
        description: 'Please sign in again to continue.',
        variant: 'destructive',
      });
    }
  }, [signInAgain]);

  return (
    <AnimatePresence>
      <div className="flex flex-col space-y-2 text-center">
        <motion.div
          key="user-auth-header"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ ease: 'easeIn', duration: 0.1 }}
        >
          <Icons.logo className="mx-auto size-6" />
          <div className="flex items-center justify-center">
            <h1
              className={`font-heading text-2xl font-semibold tracking-tight duration-500 ease-in-out ${
                showHeading ? 'my-0 opacity-100' : 'opacity-0'
              }`}
            >
              {heading}
            </h1>
          </div>
        </motion.div>
        <motion.p
          key="user-auth-header-message"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ ease: 'easeIn', duration: 0.2 }}
          className="text-sm text-muted-foreground"
        >
          {message}
        </motion.p>
      </div>
    </AnimatePresence>
  );
}
