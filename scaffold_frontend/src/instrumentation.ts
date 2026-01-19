let INITIAL_LOAD = false;

export async function register() {
  console.log('Registering instrumentation');
  if (
    process.env.NODE_ENV === 'production' &&
    process.env.NEXT_RUNTIME === 'nodejs' &&
    typeof window === 'undefined' &&
    !INITIAL_LOAD
  ) {
    INITIAL_LOAD = true;
    try {
      console.log('Revalidating cache on startup');
      await import('./revalidate-cache.js');
    } catch (error) {
      console.error('Error revalidating cache on startup:', error);
    }
  }
}
