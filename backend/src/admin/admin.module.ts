import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { CompaniesModule } from '../companies/companies.module';
import { AdminApiController } from './admin-api.controller';
import { AdminWebController } from './admin-web.controller';
import { AdminService } from './admin.service';

@Module({
  imports: [AuthModule, CompaniesModule],
  controllers: [AdminApiController, AdminWebController],
  providers: [AdminService],
})
export class AdminModule {}
