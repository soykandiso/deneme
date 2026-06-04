import { NestFactory } from '@nestjs/core';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { Logger } from 'nestjs-pino';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import session from 'express-session';
import { engine } from 'express-handlebars';
import { join } from 'path';

import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { ConfigService } from '@nestjs/config';
import { AppConfig } from './config/app.config';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: true,
  });

  app.useLogger(app.get(Logger));

  const config = app.get(ConfigService<AppConfig, true>);

  app.set('trust proxy', 1);
  app.use(helmet({ contentSecurityPolicy: false }));
  app.use(cookieParser());
  app.use(
    session({
      name: 'zalba.sid',
      secret: config.get('SESSION_SECRET', { infer: true }),
      resave: false,
      saveUninitialized: false,
      cookie: {
        httpOnly: true,
        sameSite: 'lax',
        secure: config.get('NODE_ENV', { infer: true }) === 'production',
        maxAge: 1000 * 60 * 60 * 8,
      },
    }),
  );

  app.engine(
    'hbs',
    engine({
      extname: '.hbs',
      defaultLayout: 'main',
      layoutsDir: join(__dirname, 'admin', 'views', 'layouts'),
      partialsDir: join(__dirname, 'admin', 'views', 'partials'),
      helpers: {
        eq: (a: unknown, b: unknown) => a === b,
        toLower: (v: unknown) => String(v ?? '').toLowerCase(),
        formatDate: (d: Date | string | null) =>
          d ? new Date(d).toISOString().replace('T', ' ').slice(0, 19) : '',
        statusBadge: (s: string) => `<span class="badge badge-${s.toLowerCase()}">${s}</span>`,
      },
    }),
  );
  app.setViewEngine('hbs');
  app.set('views', [
    join(__dirname, 'admin', 'views'),
    join(__dirname, 'portal', 'views'),
    join(__dirname, 'public-web', 'views'),
  ]);
  app.useStaticAssets(join(__dirname, 'public'), { prefix: '/static' });

  app.enableCors({
    origin: true,
    credentials: true,
    exposedHeaders: ['Retry-After'],
  });

  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );
  app.useGlobalFilters(new HttpExceptionFilter());

  const port = config.get('PORT', { infer: true });
  await app.listen(port);
  // eslint-disable-next-line no-console
  console.log(`Zalba API listening on http://0.0.0.0:${port}`);
}

bootstrap();
