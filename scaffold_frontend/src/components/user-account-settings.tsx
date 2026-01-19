'use client';

import type { Session, UserInfo } from 'next-auth';
import * as React from 'react';
import { SessionProvider } from 'next-auth/react';
import { AnimatePresence, motion } from 'framer-motion';

import { UserNameForm } from '@/components/user-name-form';
import { UserSecuritySettings } from '@/components/user-security-settings';

interface UserSettingsProps extends React.HTMLAttributes<HTMLFormElement> {
  user: Pick<UserInfo, 'id' | 'name' | 'sub' | 'email'>;
  accessToken: string;
  session: Session;
}

export function UserSettings({
  user,
  accessToken,
  session,
  ...props
}: UserSettingsProps) {
  return (
    <SessionProvider session={session}>
      <AnimatePresence initial={true}>
        <motion.div
          className="grid w-full gap-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.5 }}
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <UserNameForm user={user} accessToken={accessToken} {...props} />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <UserSecuritySettings
              user={user}
              accessToken={accessToken}
              session={session}
              {...props}
            />
          </motion.div>
        </motion.div>
      </AnimatePresence>
    </SessionProvider>
  );
}
