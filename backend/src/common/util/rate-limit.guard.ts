import { CanActivate, ExecutionContext, HttpException, HttpStatus, Inject, Injectable, SetMetadata } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import type Redis from 'ioredis';
import { ConfigService } from '@nestjs/config';
import { REDIS } from '../../redis/redis.module';
import { AppConfig } from '../../config/app.config';
import { clientIp, hashIp } from './ip-hash';

interface RouteRateLimit {
  bucket: string;
  windowSeconds: number;
  max: number;
}

const META_KEY = 'route_rate_limit';

export const RouteRateLimit = (cfg: RouteRateLimit) => SetMetadata(META_KEY, cfg);

@Injectable()
export class RouteRateLimitGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly config: ConfigService<AppConfig, true>,
    @Inject(REDIS) private readonly redis: Redis,
  ) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const cfg = this.reflector.getAllAndOverride<RouteRateLimit | undefined>(META_KEY, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);
    if (!cfg) return true;

    const req = ctx.switchToHttp().getRequest<Request>();
    const ip = clientIp(req);
    const ipHash = hashIp(ip, this.config.get('IP_HASH_PEPPER', { infer: true })).slice(0, 16);

    const key = `rl:${cfg.bucket}:${ipHash}`;
    const count = await this.redis.incr(key);
    if (count === 1) {
      await this.redis.expire(key, cfg.windowSeconds);
    }
    if (count > cfg.max) {
      const ttl = await this.redis.ttl(key);
      throw new HttpException(
        {
          code: 'RATE_LIMITED',
          message: 'Too many requests, please try again later.',
        },
        HttpStatus.TOO_MANY_REQUESTS,
        { description: `${ttl}s` },
      );
    }
    return true;
  }
}
