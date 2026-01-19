/* eslint-disable @typescript-eslint/no-require-imports */
const { PHASE_DEVELOPMENT_SERVER } = require('next/constants.js');

if (!process.env.SKIP_ENV_VALIDATION) {
  (async () => {
    await import('./src/env/server.mjs');
  })().catch(err => {
    console.error('❌ Invalid environment variables:\n', err);
    throw new Error('Invalid environment variables)');
  });
}

const nextConfig = {
  reactStrictMode: true,
  cacheComponents: true,
  turbo: {
    rules: {
      '*.svg': {
        loaders: ['@svgr/webpack'],
        as: '*.js',
      },
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com',
        port: '',
        pathname: '/u/**',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'placehold.co',
      },
      {
        protocol: 'https',
        hostname: 'storage.googleapis.com',
        pathname: '/scaffold*/**',
      },
      {
        hostname: '**.scaffold.com',
        pathname: '/api/v1/files/**',
      },
    ],
    qualities: [100, 75],
  },
  async rewrites() {
    return [
      {
        source: '/.well-known/jwks.json',
        destination: '/api/oauth2/well-known/jwks.json',
      },
    ];
  },
  async headers() {
    return [
      // Global security headers
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
      // Service worker specific headers
      {
        source: '/sw.js',
        headers: [
          {
            key: 'Content-Type',
            value: 'application/javascript; charset=utf-8',
          },
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate',
          },
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self'",
          },
        ],
      },
    ];
  },
  // staleTimes: {
  //   dynamic: 0,
  //   static: 180,
  // },
  transpilePackages: ['mdx-bundler'],
  webpack(config) {
    // Grab the existing rule that handles SVG imports
    const fileLoaderRule = config.module.rules.find(rule =>
      rule.test?.test?.('.svg')
    );
    config.module.rules.push(
      // Reapply the existing rule, but only for svg imports ending in ?url
      {
        ...fileLoaderRule,
        test: /\.svg$/i,
        resourceQuery: /url/, // *.svg?url
      },
      // Convert all other *.svg imports to React components
      {
        test: /\.svg$/i,
        issuer: fileLoaderRule.issuer,
        resourceQuery: { not: [...fileLoaderRule.resourceQuery.not, /url/] }, // exclude if *.svg?url
        use: ['@svgr/webpack'],
      }
    );
    // Modify the file loader rule to ignore *.svg, since we have it handled now.
    fileLoaderRule.exclude = /\.svg$/i;

    return config;
  },
};

const envDev = {
  ...nextConfig,
};

const envProd =
  process.env.DEPLOYMENT === 'container'
    ? {
        ...nextConfig,
        output: 'standalone',
      }
    : { ...nextConfig };

/** @type {import("next").NextConfig} */
const getConfig = phase => {
  console.log('PHASE', phase);
  console.log('DEPLOYMENT', process.env.DEPLOYMENT);
  return phase === PHASE_DEVELOPMENT_SERVER ? envDev : envProd;
};

module.exports = phase => getConfig(phase);
