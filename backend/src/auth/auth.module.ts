import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import { TokenService } from './token.service';
import { PortalAuthService } from './portal-auth.service';
import { AdminAuthService } from './admin-auth.service';
import { PasswordService } from './password.service';
import { PortalAuthController } from './portal-auth.controller';
import { AdminAuthController } from './admin-auth.controller';
import { PortalJwtGuard } from './guards/portal-jwt.guard';
import { AdminJwtGuard } from './guards/admin-jwt.guard';

@Module({
  imports: [ConfigModule, JwtModule.register({})],
  controllers: [PortalAuthController, AdminAuthController],
  providers: [
    PasswordService,
    TokenService,
    PortalAuthService,
    AdminAuthService,
    PortalJwtGuard,
    AdminJwtGuard,
  ],
  exports: [
    PasswordService,
    TokenService,
    PortalAuthService,
    AdminAuthService,
    PortalJwtGuard,
    AdminJwtGuard,
  ],
})
export class AuthModule {}
