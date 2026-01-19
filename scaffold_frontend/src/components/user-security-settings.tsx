'use client';

import type { Session, UserInfo } from 'next-auth';
import * as React from 'react';
import { motion } from 'framer-motion';

import { getBaseAuthProvider } from '@/lib/auth/client';

import { PasswordUpdateForm } from '@/components/password-update-form';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

interface UserSecuritySettingsProps
  extends React.HTMLAttributes<HTMLFormElement> {
  user: Pick<UserInfo, 'id' | 'name' | 'sub' | 'email'>;
  accessToken: string;
  session: Session;
}

export function UserSecuritySettings({
  user,
  accessToken,
  session,
  ...props
}: UserSecuritySettingsProps) {
  const baseAuthProvider = getBaseAuthProvider(session.provider, user);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{
        duration: 0.2,
        ease: 'easeOut',
      }}
    >
      <Card>
        <CardHeader>
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <CardTitle>Security Settings</CardTitle>
            <CardDescription>Manage your account security.</CardDescription>
          </motion.div>
        </CardHeader>
        <CardContent>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            <PasswordUpdateForm
              user={user}
              accessToken={accessToken}
              {...props}
            />
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
