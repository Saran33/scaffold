import type { MetadataRoute } from 'next';
import { env } from '@/env/client.mjs';

export default function robots(): MetadataRoute.Robots {
  if (env.NEXT_PUBLIC_IS_DEV_SITE) {
    return {
      rules: {
        userAgent: '*',
        disallow: '/',
      },
    };
  }

  return {
    rules: {
      userAgent: '*',
      allow: '/',
    },
  };
}
