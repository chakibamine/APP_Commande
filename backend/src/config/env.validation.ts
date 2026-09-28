export function validateEnv(config: Record<string, unknown>) {
  if (
    typeof config.DATABASE_URL !== 'string' ||
    config.DATABASE_URL.length === 0
  ) {
    throw new Error('DATABASE_URL est requis');
  }
  if (typeof config.JWT_SECRET !== 'string' || config.JWT_SECRET.length === 0) {
    throw new Error('JWT_SECRET est requis');
  }

  return {
    ...config,
    PORT: config.PORT ?? '3000',
    JWT_EXPIRES_IN: config.JWT_EXPIRES_IN ?? '1d',
  };
}
