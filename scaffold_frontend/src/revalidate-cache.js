// revalidate-cache.js

import http from 'http';
import { getCacheRevalidationToken } from './lib/utils/auth/server';

function waitForNextJs() {
  return new Promise(resolve => {
    const interval = setInterval(() => {
      http
        .get(`http://localhost:${process.env.PORT || 3000}`, res => {
          if (res.statusCode === 200) {
            clearInterval(interval);
            resolve();
          }
        })
        .on('error', () => {
          // Server not ready yet
        });
    }, 2000);
  });
}

async function revalidateCache() {
  const token = await getCacheRevalidationToken();
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: process.env.PORT || 3000,
      path: '/api/startup-revalidate',
      method: 'POST',
      headers: {
        'x-secret-token': token,
      },
    };

    const req = http.request(options, res => {
      if (res.statusCode === 200) {
        console.log('Cache revalidation complete');
        resolve();
      } else {
        reject(new Error(`Failed to revalidate cache: ${res.statusCode}`));
      }
    });

    req.on('error', e => {
      reject(e);
    });

    req.end();
  });
}

(async () => {
  console.log('Waiting for Next.js to be ready...');
  await waitForNextJs();
  console.log('Next.js is ready. Revalidating cache...');
  await revalidateCache();
})().catch(err => {
  console.error(err);
  process.exit(1);
});
