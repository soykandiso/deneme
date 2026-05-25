import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import type { Request } from 'express';
import { TokenService } from '../token.service';

export interface AdminRequest extends Request {
  user: { id: string };
}

@Injectable()
export class AdminJwtGuard implements CanActivate {
  constructor(private readonly tokens: TokenService) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const req = ctx.switchToHttp().getRequest<AdminRequest>();
    const header = req.headers.authorization ?? '';
    const m = header.match(/^Bearer\s+(.+)$/i);
    if (!m) throw new UnauthorizedException('Bearer token required');
    try {
      const payload = await this.tokens.verifyAccess(m[1], 'admin');
      req.user = { id: payload.sub };
      return true;
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}
