// @ts-check
import { z } from 'zod';

const requiredForProduction = () =>
  process.env.NODE_ENV === 'production'
    ? z.string().min(1).trim()
    : z.string().min(1).trim().optional();

function stringToBoolean() {
  return z.preprocess(str => str === 'true', z.boolean());
}

function stringToNumber() {
  return z.preprocess(str => Number(str), z.number());
}

/**
 * Preprocesses the RSA key to ensure it is in the correct PEM format.
 * This checks if the key is one line and reformats it if necessary.
 */
function rsaPemSchema() {
  return z.preprocess(value => {
    if (typeof value === 'string') {
      const isPrivateKey = value.includes('PRIVATE KEY');
      const BEGIN_KEY = isPrivateKey
        ? '-----BEGIN PRIVATE KEY-----'
        : '-----BEGIN PUBLIC KEY-----';
      const END_KEY = isPrivateKey
        ? '-----END PRIVATE KEY-----'
        : '-----END PUBLIC KEY-----';

      // Clean the key of any existing PEM-like headers, footers, or extra whitespaces, and single quotes
      let cleanValue = value.replace(
        /-----BEGIN (PUBLIC|PRIVATE) KEY-----|-----END (PUBLIC|PRIVATE) KEY-----|\s+|'/g,
        ''
      );
      // Reformat the key to have line breaks every 64 characters if necessary
      // (no newlines indicates a one-line key)
      if (!/\n/.test(cleanValue)) {
        cleanValue = cleanValue.replace(/(.{64})(?=.)/g, '$1\n');
      }
      return `${BEGIN_KEY}\n${cleanValue}\n${END_KEY}\n`;
    }
    return value;
  }, z.string().min(1, 'RSA key must be a non-empty string.').trim());
}

/**
 * Server-side environment variables schema.
 * Ensures the app isn't built with invalid env variables.
 */
export const serverSchema = z.object({
  ENV: z.enum(['development', 'test', 'production']),
  DEPLOYMENT: z.enum(['local', 'container', 'dev', 'staging', 'production']),
  NEXTAUTH_URL: z.string().url(),
  NEXTAUTH_SECRET: z.string().min(1).trim(),
  RSA_PUBLIC_KEY: rsaPemSchema(),
  RSA_PRIVATE_KEY: rsaPemSchema(),
  GOOGLE_CLIENT_ID: z.string().min(1).trim(),
  GOOGLE_CLIENT_SECRET: z.string().min(1).trim(),
  APPLE_CLIENT_ID: z.string().min(1).trim(),
  APPLE_CLIENT_SECRET: z.string().min(1).trim(),
});

/**
 * `process.env` can't be destructured as a regular object in the Next.js
 * middleware, so it's done manually here instead.
 * @type {{ [k in keyof z.input<typeof serverSchema>]: string | undefined }}
 */
export const serverEnv = {
  ENV: process.env.NODE_ENV,
  DEPLOYMENT: process.env.DEPLOYMENT,
  NEXTAUTH_URL: process.env.NEXTAUTH_URL,
  NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
  RSA_PUBLIC_KEY: process.env.RSA_PUBLIC_KEY,
  RSA_PRIVATE_KEY: process.env.RSA_PRIVATE_KEY,
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
  APPLE_CLIENT_ID: process.env.APPLE_CLIENT_ID,
  APPLE_CLIENT_SECRET: process.env.APPLE_CLIENT_SECRET,
};

/**
 * Client-side environment variables schema.
 * Ensures the app isn't built with invalid env variables.
 * To expose env vars to the client, prefix them with `NEXT_PUBLIC_`.
 */
export const clientSchema = z.object({
  NEXT_PUBLIC_ENV: z.enum(['development', 'test', 'preview', 'production']),
  NEXT_PUBLIC_APP_URL: z.string().url(),
  NEXT_PUBLIC_API_URL: z.string().url(),
  NEXT_PUBLIC_AUTH_FLOW: z.string().min(1).trim(),
  NEXT_PUBLIC_TIMEZONE: z.string().min(1).trim(),
  NEXT_PUBLIC_IS_DEV_SITE: stringToBoolean().optional().default(false),
  NEXT_PUBLIC_GA_MEASUREMENT_ID: z.string().optional(),
});

/**
 * Next.js evaluates this at build time, and only used environment variables
 * are included in the build.
 * @type {{ [k in keyof z.input<typeof clientSchema>]: string | undefined }}
 */
export const clientEnv = {
  NEXT_PUBLIC_ENV: process.env.NEXT_PUBLIC_ENV ?? 'development',
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  NEXT_PUBLIC_AUTH_FLOW: process.env.NEXT_PUBLIC_AUTH_FLOW,
  NEXT_PUBLIC_TIMEZONE: process.env.NEXT_PUBLIC_TIMEZONE,
  NEXT_PUBLIC_IS_DEV_SITE: process.env.NEXT_PUBLIC_IS_DEV_SITE,
  NEXT_PUBLIC_GA_MEASUREMENT_ID: process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID,
};
