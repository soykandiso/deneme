import { createHash } from 'crypto';
import type { Request } from 'express';

export function clientIp(req: Request): string {
  return (
    (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
    req.ip ||
    req.socket.remoteAddress ||
    'unknown'
  );
}

export function hashIp(ip: string, pepper: string): string {
  return createHash('sha256').update(`${pepper}:${ip}`).digest('hex');
}
