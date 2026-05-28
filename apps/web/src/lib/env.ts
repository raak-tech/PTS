export function validateEnv() {
  if (process.env.NODE_ENV !== 'production') return;

  const required = ['DATABASE_URL'];
  const missing = required.filter((k) => !process.env[k]);

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}. ` +
        'Set them in your deployment environment and restart.',
    );
  }
}
