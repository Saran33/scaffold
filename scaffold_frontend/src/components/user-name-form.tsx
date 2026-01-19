'use client';

import type { User } from 'next-auth';
import type * as z from 'zod';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { zodResolver } from '@hookform/resolvers/zod';

import { useAuth } from '@/hooks/use-auth';
import { useForm } from 'react-hook-form';

import userApi from '@/api/user-api';
import { cn } from '@/lib/utils/utils';
import { userNameSchema } from '@/lib/validations/user';
import { buttonThinVariants } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/use-toast';
import { Icons } from '@/components/ui/icons';

interface UserNameFormProps extends React.HTMLAttributes<HTMLFormElement> {
  user: Pick<User, 'id' | 'name'>;
  accessToken: string;
}

type FormData = z.infer<typeof userNameSchema>;

export function UserNameForm({
  user,
  accessToken,
  className,
  ...props
}: UserNameFormProps) {
  const router = useRouter();
  const {
    handleSubmit,
    register,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(userNameSchema),
    defaultValues: {
      name: user?.name || '',
    },
  });
  const [isSaving, setIsSaving] = React.useState<boolean>(false);
  const { update } = useAuth();

  async function onSubmit(data: FormData) {
    setIsSaving(true);

    try {
      await userApi.updateMe(accessToken, { fullName: data.name });
      await update({ userUpdate: { name: data.name } });
    } catch (error) {
      setIsSaving(false);
      return toast({
        title: 'Something went wrong.',
        description: 'Your name was not updated. Please try again.',
        variant: 'destructive',
      });
    }

    setIsSaving(false);

    toast({
      description: 'Your name has been updated.',
    });

    router.refresh();
  }

  return (
    <form
      className={cn(className)}
      onSubmit={handleSubmit(onSubmit)}
      {...props}
    >
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
              <CardTitle>Your Name</CardTitle>
              <CardDescription>
                Enter your full name or a display name you would like to use.
              </CardDescription>
            </motion.div>
          </CardHeader>
          <CardContent>
            <motion.div
              className="grid gap-1"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.2 }}
            >
              <Label className="sr-only" htmlFor="name">
                Name
              </Label>
              <Input
                id="name"
                className="w-full sm:w-[400px]"
                size={32}
                {...register('name')}
              />
              {errors?.name && (
                <motion.p
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="px-1 text-xs text-red-600"
                >
                  {errors.name.message}
                </motion.p>
              )}
            </motion.div>
          </CardContent>
          <CardFooter>
            <button
              type="submit"
              className={cn(buttonThinVariants(), className)}
              disabled={isSaving}
            >
              {isSaving && (
                <Icons.spinner className="mr-2 size-4 animate-spin" />
              )}
              <span>Save</span>
            </button>
          </CardFooter>
        </Card>
      </motion.div>
    </form>
  );
}
