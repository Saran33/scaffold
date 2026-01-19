import * as z from 'zod';

import { env } from '@/env/client.mjs';

const passwordField = z.string().min(1, 'Password required');

const complexPasswordField = z
  .string()
  .min(8, 'Password must be at least 8 characters long')
  .max(100)
  .refine(
    password =>
      /^(?=.*[A-Z])(?=.*[!@#$&*])(?=.*[0-9])(?=.*[a-z]).{8,}$/.test(password),
    {
      message:
        'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
    }
  );

function withConfirmPassword<T extends z.ZodRawShape>(schema: z.ZodObject<T>) {
  return schema
    .extend({
      confirmPassword: z.string(),
    })
    .superRefine(({ confirmPassword, password }, ctx) => {
      if (confirmPassword !== password) {
        ctx.addIssue({
          code: 'custom',
          message: `Those passwords didn't match. Try again.`,
          path: ['confirmPassword'],
        });
      }
    });
}

function withPasswordValidation<T extends z.ZodRawShape>(
  schema: z.ZodObject<T>
) {
  return withConfirmPassword(
    schema.extend({
      password: complexPasswordField,
    })
  );
}

export const userAuthSchema = z.object({
  email: z.string().email(),
  password: passwordField,
});

export const userAuthSchemaServer = z.object({
  email: z.string().email(),
  // do the full validation on the server
  // we don't want to show the password rules in the login form
  password: complexPasswordField,
});

export type userAuthFormData = z.infer<typeof userAuthSchema>;

export const userSignUpSchema = withPasswordValidation(userAuthSchema);

export const resendVerificationEmailSchema = z.object({
  email: z.string().email().optional(),
});

export const requestPasswordRecoverySchema = z.object({
  email: z.string().email(),
});

export const passwordResetSchema = withPasswordValidation(
  z.object({
    password: z.string(),
  })
);

export const passwordUpdateSchema = withPasswordValidation(
  z.object({
    oldPassword: z.string(),
    password: z.string(),
  })
);

export const signInRedirectSchema = z
  .string()
  .refine(
    url => {
      try {
        const isRelativePath = !/^(http|https):\/\//i.test(url);
        if (isRelativePath) {
          return url.startsWith('/') && !url.includes('//');
        }
        const parsedUrl = new URL(url);
        const app_domain = new URL(env.NEXT_PUBLIC_APP_URL).hostname;
        const allowedDomains = [app_domain];
        return allowedDomains.includes(parsedUrl.hostname);
      } catch (error) {
        return false;
      }
    },
    {
      message: 'Invalid or untrusted redirect URL',
    }
  )
  .optional();
