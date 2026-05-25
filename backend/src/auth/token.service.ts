import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { randomBytes, createHash } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { AppConfig } from '../config/app.config';

export type Audience = 'portal' | 'admin' | 'mobile';

export interface AccessTokenPayload {
  sub: string;
  aud: Audience;
  companyId?: string;
}

export interface IssuedTokens {
  accessToken: string;
  refreshToken: string;
  refreshExpiresAt: Date;
  accessExpiresIn: string;
}

@Injectable()
export class TokenService {
  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService<AppConfig, true>,
    private readonly prisma: PrismaService,
  ) {}

  private secretFor(aud: Audience): string {
    switch (aud) {
      case 'portal': return this.config.get('JWT_PORTAL_SECRET', { infer: true });
      case 'admin':  return this.config.get('JWT_ADMIN_SECRET', { infer: true });
      case 'mobile': return this.config.get('JWT_MOBILE_SECRET', { infer: true });
    }
  }

  async issue(params: {
    userId: string;
    audience: Audience;
    companyId?: string;
    ipHash?: string;
    userAgent?: string;
    parentRefreshId?: string;
  }): Promise<IssuedTokens> {
    const accessTtl = this.config.get('ACCESS_TOKEN_TTL', { infer: true });
    const accessToken = await this.jwt.signAsync(
      {
        sub: params.userId,
        aud: params.audience,
        companyId: params.companyId,
      },
      {
        secret: this.secretFor(params.audience),
        expiresIn: accessTtl,
      },
    );

    const refreshRaw = randomBytes(32).toString('base64url');
    const refreshHash = createHash('sha256').update(refreshRaw).digest('hex');
    const days = this.config.get('REFRESH_TOKEN_TTL_DAYS', { infer: true });
    const expiresAt = new Date(Date.now() + days * 24 * 3600 * 1000);

    await this.prisma.refreshToken.create({
      data: {
        tokenHash: refreshHash,
        audience: params.audience,
        userId: params.userId,
        parentId: params.parentRefreshId,
        ipHash: params.ipHash,
        userAgent: params.userAgent,
        expiresAt,
      },
    });

    return {
      accessToken,
      refreshToken: refreshRaw,
      refreshExpiresAt: expiresAt,
      accessExpiresIn: accessTtl,
    };
  }

  async rotate(params: {
    refreshToken: string;
    audience: Audience;
    ipHash?: string;
    userAgent?: string;
  }): Promise<IssuedTokens> {
    const hash = createHash('sha256').update(params.refreshToken).digest('hex');
    const row = await this.prisma.refreshToken.findUnique({ where: { tokenHash: hash } });
    if (!row || row.audience !== params.audience) {
      throw new Error('Invalid refresh token');
    }
    if (row.revokedAt) {
      // Reuse detected — cascade revoke lineage.
      await this.prisma.refreshToken.updateMany({
        where: { userId: row.userId, audience: row.audience, revokedAt: null },
        data: { revokedAt: new Date() },
      });
      throw new Error('Refresh token reuse detected; lineage revoked');
    }
    if (row.expiresAt < new Date()) {
      throw new Error('Refresh token expired');
    }

    await this.prisma.refreshToken.update({
      where: { id: row.id },
      data: { revokedAt: new Date() },
    });

    let companyId: string | undefined;
    if (params.audience === 'portal') {
      const u = await this.prisma.companyUser.findUnique({ where: { id: row.userId } });
      companyId = u?.companyId;
    }

    return this.issue({
      userId: row.userId,
      audience: row.audience as Audience,
      companyId,
      ipHash: params.ipHash,
      userAgent: params.userAgent,
      parentRefreshId: row.id,
    });
  }

  async revoke(refreshToken: string): Promise<void> {
    const hash = createHash('sha256').update(refreshToken).digest('hex');
    await this.prisma.refreshToken.updateMany({
      where: { tokenHash: hash, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async verifyAccess(token: string, audience: Audience): Promise<AccessTokenPayload> {
    return this.jwt.verifyAsync<AccessTokenPayload>(token, {
      secret: this.secretFor(audience),
    });
  }
}
