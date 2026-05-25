import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ComplaintsModule } from '../complaints/complaints.module';
import { AttachmentsModule } from '../attachments/attachments.module';
import { PortalApiController } from './portal-api.controller';
import { PortalService } from './portal.service';
import { PortalWebController } from './portal-web.controller';

@Module({
  imports: [AuthModule, ComplaintsModule, AttachmentsModule],
  controllers: [PortalApiController, PortalWebController],
  providers: [PortalService],
})
export class PortalModule {}
