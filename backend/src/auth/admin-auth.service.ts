import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PasswordService } from './password.service';
import { TokenService, IssuedTokens } from './token.service';

@Injectable()
export class AdminAuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly password: PasswordService,
    private readonly tokens: TokenService,
  ) {}

  async login(params: { email: string; password: string; ipHash: string; userAgent: string }): Promise<{
    user: { id: string; email: string; displayName: string };
    tokens: IssuedTokens;
  }> {
    const user = await this.prisma.adminUser.findUnique({ where: { email: params.email } });
    if (!user || !user.isActive) {
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
      audience: 'admin',
      ipHash: params.ipHash,
      userAgent: params.userAgent,
    });

    await this.prisma.adminUser.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    return {
      user: { id: user.id, email: user.email, displayName: user.displayName },
      tokens,
    };
  }
}
