import { Body, Controller, HttpCode, Post, Req, UnauthorizedException } from '@nestjs/common';
import type { Request } from 'express';
import { ConfigService } from '@nestjs/config';
import { PortalAuthService } from './portal-auth.service';
import { TokenService } from './token.service';
import { LoginDto, RefreshDto } from './dto/login.dto';
import { clientIp, hashIp } from '../common/util/ip-hash';
import { AppConfig } from '../config/app.config';

@Controller({ path: 'portal/auth', version: '1' })
export class PortalAuthController {
  constructor(
    private readonly auth: PortalAuthService,
    private readonly tokens: TokenService,
    private readonly config: ConfigService<AppConfig, true>,
  ) {}

  @Post('login')
  @HttpCode(200)
  async login(@Body() dto: LoginDto, @Req() req: Request) {
    const ipHash = hashIp(clientIp(req), this.config.get('IP_HASH_PEPPER', { infer: true }));
    return this.auth.login({
      email: dto.email,
      password: dto.password,
      ipHash,
      userAgent: req.headers['user-agent']?.slice(0, 200) ?? '',
    });
  }

  @Post('refresh')
  @HttpCode(200)
  async refresh(@Body() dto: RefreshDto, @Req() req: Request) {
    const ipHash = hashIp(clientIp(req), this.config.get('IP_HASH_PEPPER', { infer: true }));
    try {
      return await this.tokens.rotate({
        refreshToken: dto.refreshToken,
        audience: 'portal',
        ipHash,
        userAgent: req.headers['user-agent']?.slice(0, 200) ?? '',
      });
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  @Post('logout')
  @HttpCode(204)
  async logout(@Body() dto: RefreshDto): Promise<void> {
    await this.tokens.revoke(dto.refreshToken);
  }
}
