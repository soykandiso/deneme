// Environment validation. Kept dependency-free on purpose so the API can boot
// without pulling in a schema library at startup.

export interface AppConfig {
  NODE_ENV: 'development' | 'test' | 'production';
  PORT: number;
  LOG_LEVEL: string;
  PUBLIC_BASE_URL: string;

  DATABASE_URL: string;
  REDIS_URL: string;

  S3_ENDPOINT: string;
  S3_REGION: string;
  S3_BUCKET: string;
  S3_ACCESS_KEY: string;
  S3_SECRET_KEY: string;
  S3_FORCE_PATH_STYLE: boolean;

  JWT_MOBILE_SECRET: string;
  JWT_PORTAL_SECRET: string;
  JWT_ADMIN_SECRET: string;
  SESSION_SECRET: string;
  IP_HASH_PEPPER: string;

  ACCESS_TOKEN_TTL: string;
  REFRESH_TOKEN_TTL_DAYS: number;

  RATE_LIMIT_GLOBAL_PER_MINUTE: number;
  RATE_LIMIT_COMPLAINT_CREATE_PER_HOUR: number;
  RATE_LIMIT_REPORT_PER_HOUR: number;
  RATE_LIMIT_SUGGEST_PER_HOUR: number;

  SENTRY_DSN?: string;
}

const REQUIRED_KEYS: (keyof AppConfig)[] = [
  'DATABASE_URL',
  'REDIS_URL',
  'S3_ENDPOINT',
  'S3_BUCKET',
  'S3_ACCESS_KEY',
  'S3_SECRET_KEY',
  'JWT_MOBILE_SECRET',
  'JWT_PORTAL_SECRET',
  'JWT_ADMIN_SECRET',
  'SESSION_SECRET',
  'IP_HASH_PEPPER',
];

export const appConfigValidationSchema = {
  safeParse(raw: Record<string, string | undefined>): { success: true; data: AppConfig }
    | { success: false; error: { flatten(): { fieldErrors: Record<string, string[]> } } } {
    const errors: Record<string, string[]> = {};

    for (const k of REQUIRED_KEYS) {
      if (!raw[k]) errors[k] = ['required'];
    }

    const env = (raw.NODE_ENV as AppConfig['NODE_ENV']) ?? 'development';
    if (!['development', 'test', 'production'].includes(env)) {
      errors.NODE_ENV = ['must be development|test|production'];
    }

    if (Object.keys(errors).length > 0) {
      return {
        success: false,
        error: { flatten: () => ({ fieldErrors: errors }) },
      };
    }

    const parsed: AppConfig = {
      NODE_ENV: env,
      PORT: Number(raw.PORT ?? 3000),
      LOG_LEVEL: raw.LOG_LEVEL ?? 'info',
      PUBLIC_BASE_URL: raw.PUBLIC_BASE_URL ?? 'http://localhost:3000',

      DATABASE_URL: raw.DATABASE_URL!,
      REDIS_URL: raw.REDIS_URL!,

      S3_ENDPOINT: raw.S3_ENDPOINT!,
      S3_REGION: raw.S3_REGION ?? 'us-east-1',
      S3_BUCKET: raw.S3_BUCKET!,
      S3_ACCESS_KEY: raw.S3_ACCESS_KEY!,
      S3_SECRET_KEY: raw.S3_SECRET_KEY!,
      S3_FORCE_PATH_STYLE: (raw.S3_FORCE_PATH_STYLE ?? 'true') === 'true',

      JWT_MOBILE_SECRET: raw.JWT_MOBILE_SECRET!,
      JWT_PORTAL_SECRET: raw.JWT_PORTAL_SECRET!,
      JWT_ADMIN_SECRET: raw.JWT_ADMIN_SECRET!,
      SESSION_SECRET: raw.SESSION_SECRET!,
      IP_HASH_PEPPER: raw.IP_HASH_PEPPER!,

      ACCESS_TOKEN_TTL: raw.ACCESS_TOKEN_TTL ?? '15m',
      REFRESH_TOKEN_TTL_DAYS: Number(raw.REFRESH_TOKEN_TTL_DAYS ?? 30),

      RATE_LIMIT_GLOBAL_PER_MINUTE: Number(raw.RATE_LIMIT_GLOBAL_PER_MINUTE ?? 120),
      RATE_LIMIT_COMPLAINT_CREATE_PER_HOUR: Number(raw.RATE_LIMIT_COMPLAINT_CREATE_PER_HOUR ?? 5),
      RATE_LIMIT_REPORT_PER_HOUR: Number(raw.RATE_LIMIT_REPORT_PER_HOUR ?? 10),
      RATE_LIMIT_SUGGEST_PER_HOUR: Number(raw.RATE_LIMIT_SUGGEST_PER_HOUR ?? 5),

      SENTRY_DSN: raw.SENTRY_DSN || undefined,
    };

    return { success: true, data: parsed };
  },
};
