import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PasswordService } from './password.service';
import { TokenService, IssuedTokens } from './token.service';

@Injectable()
export class PortalAuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly password: PasswordService,
    private readonly tokens: TokenService,
  ) {}

  async login(params: { email: string; password: string; ipHash: string; userAgent: string }): Promise<{
    user: { id: string; email: string; displayName: string; companyId: string };
    tokens: IssuedTokens;
  }> {
    const user = await this.prisma.companyUser.findUnique({
      where: { email: params.email },
    });
    if (!user || !user.isActive) {
      // constant-time-ish dummy verify to avoid user enumeration timing
      await this.password.verify(
        '$argon2id$v=19$m=19456,t=2,p=1$ZHVtbXkAAAAAAAAAAAAAAA$ZHVtbXlkdW1teWR1bW15ZHVtbXlkdW1teQ',
        params.password,
      ).catch(() => false);
      throw new UnauthorizedException('Invalid credentials');
    }
    const ok = await this.password.verify(user.passwordHash, params.password);
    if (!ok) throw new UnauthorizedException('Invalid credentials');

    const tokens = await this.tokens.issue({
      userId: user.id,
      audience: 'portal',
      companyId: user.companyId,
      ipHash: params.ipHash,
      userAgent: params.userAgent,
    });

    await this.prisma.companyUser.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        companyId: user.companyId,
      },
      tokens,
    };
  }
}
