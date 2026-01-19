'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import type { User } from 'next-auth';
import { useForm } from 'react-hook-form';
import type * as z from 'zod';

import userApi from '@/api/user-api';
import { cn } from '@/lib/utils/utils';
import { passwordUpdateSchema } from '@/lib/validations/auth';
import { ButtonThin, buttonThinVariants } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/use-toast';
import { Icons } from '@/components/ui/icons';

interface PasswordUpdateFormProps
  extends React.HTMLAttributes<HTMLFormElement> {
  user: Pick<User, 'id' | 'name'>;
  accessToken: string;
}

type FormData = z.infer<typeof passwordUpdateSchema>;

export function PasswordUpdateForm({
  user,
  accessToken,
  className,
  ...props
}: PasswordUpdateFormProps) {
  const router = useRouter();
  const {
    handleSubmit,
    register,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(passwordUpdateSchema),
  });
  const [open, setOpen] = React.useState(false);
  const [isPending, startTransition] = React.useTransition();
  const [isSaving, setIsSaving] = React.useState<boolean>(false);

  async function onSubmit(data: FormData) {
    setIsSaving(true);

    try {
      await userApi.updatePassword(accessToken, {
        oldPassword: data.oldPassword,
        newPassword: data.password,
      });
    } catch (error) {
      setIsSaving(false);
      return toast({
        title: 'Something went wrong.',
        description: 'Your password was not updated. Please try again.',
        variant: 'destructive',
      });
    }

    startTransition(() => {
      setIsSaving(false);
      toast({
        description: 'Your password has been updated.',
      });
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <ButtonThin disabled={isPending}>
            {isPending && (
              <Icons.spinner className="mr-2 size-4 animate-spin" />
            )}
            Update Password
          </ButtonThin>
        </DialogTrigger>
        <DialogContent>
          <form
            className={cn(className)}
            onSubmit={handleSubmit(onSubmit)}
            {...props}
          >
            <DialogHeader className="space-y-1.5 p-6">
              <DialogTitle>Update Password</DialogTitle>
              <DialogDescription>
                Update your password to keep your account secure.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-1 p-6 pt-0">
              <div className="grid gap-1">
                <Label className="sr-only" htmlFor="password">
                  Enter Existing Password
                </Label>
                <Input
                  id="old-password"
                  className="w-full sm:w-[400px]"
                  placeholder="Enter current password"
                  type="password"
                  autoCapitalize="none"
                  autoComplete="off"
                  autoCorrect="off"
                  disabled={isSaving}
                  {...register('oldPassword')}
                />
                {errors?.oldPassword && (
                  <p className="px-1 text-xs text-red-600">
                    {errors.oldPassword.message}
                  </p>
                )}
              </div>
              <div className="grid gap-1">
                <Label className="sr-only" htmlFor="password">
                  Create New Password
                </Label>
                <Input
                  id="password"
                  className="w-full sm:w-[400px]"
                  placeholder="Create a new password"
                  type="password"
                  autoCapitalize="none"
                  autoComplete="new-password"
                  autoCorrect="off"
                  disabled={isSaving}
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
                  Confirm New Password
                </Label>
                <Input
                  id="confirm-password"
                  className="w-full sm:w-[400px]"
                  placeholder="Confirm new password"
                  type="password"
                  autoCapitalize="none"
                  autoComplete="off"
                  autoCorrect="off"
                  disabled={isSaving}
                  {...register('confirmPassword')}
                />
                {errors?.confirmPassword && (
                  <p className="px-1 text-xs text-red-600">
                    {errors.confirmPassword.message}
                  </p>
                )}
              </div>
            </div>

            <DialogFooter>
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
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
