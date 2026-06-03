import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LoggerModule } from 'nestjs-pino';
import { ThrottlerModule } from '@nestjs/throttler';

import { appConfigValidationSchema } from './config/app.config';
import { PrismaModule } from './prisma/prisma.module';
import { RedisModule } from './redis/redis.module';
import { StorageModule } from './storage/storage.module';
import { AuthModule } from './auth/auth.module';
import { CompaniesModule } from './companies/companies.module';
import { ComplaintsModule } from './complaints/complaints.module';
import { AttachmentsModule } from './attachments/attachments.module';
import { ReportsModule } from './reports/reports.module';
import { SuggestionsModule } from './suggestions/suggestions.module';
import { AdminModule } from './admin/admin.module';
import { PortalModule } from './portal/portal.module';
import { AuditModule } from './audit/audit.module';
import { HealthModule } from './health/health.module';
import { CategoriesModule } from './categories/categories.module';
import { PublicWebModule } from './public-web/public-web.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: (env) => {
        const parsed = appConfigValidationSchema.safeParse(env);
        if (!parsed.success) {
          // eslint-disable-next-line no-console
          console.error(parsed.error.flatten().fieldErrors);
          throw new Error('Invalid environment configuration');
        }
        return parsed.data;
      },
    }),
    LoggerModule.forRoot({
      pinoHttp: {
        level: process.env.LOG_LEVEL || 'info',
        transport:
          process.env.NODE_ENV !== 'production'
            ? { target: 'pino-pretty', options: { singleLine: true } }
            : undefined,
        redact: ['req.headers.authorization', 'req.headers.cookie'],
      },
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60_000,
        limit: Number(process.env.RATE_LIMIT_GLOBAL_PER_MINUTE ?? 120),
      },
    ]),
    PrismaModule,
    RedisModule,
    StorageModule,
    AuthModule,
    CategoriesModule,
    CompaniesModule,
    ComplaintsModule,
    AttachmentsModule,
    ReportsModule,
    SuggestionsModule,
    AdminModule,
    PortalModule,
    AuditModule,
    HealthModule,
    PublicWebModule,
  ],
})
export class AppModule {}
