import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import type { Request } from 'express';
import { TokenService } from '../token.service';

export interface PortalRequest extends Request {
  user: { id: string; companyId: string };
}

@Injectable()
export class PortalJwtGuard implements CanActivate {
  constructor(private readonly tokens: TokenService) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const req = ctx.switchToHttp().getRequest<PortalRequest>();
    const header = req.headers.authorization ?? '';
    const m = header.match(/^Bearer\s+(.+)$/i);
    if (!m) throw new UnauthorizedException('Bearer token required');
    try {
      const payload = await this.tokens.verifyAccess(m[1], 'portal');
      if (!payload.companyId) throw new UnauthorizedException('Token missing tenant');
      req.user = { id: payload.sub, companyId: payload.companyId };
      return true;
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}
