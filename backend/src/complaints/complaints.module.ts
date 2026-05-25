import { Module } from '@nestjs/common';
import { ComplaintsPublicController } from './complaints.public.controller';
import { ComplaintsService } from './complaints.service';
import { CompaniesModule } from '../companies/companies.module';

@Module({
  imports: [CompaniesModule],
  controllers: [ComplaintsPublicController],
  providers: [ComplaintsService],
  exports: [ComplaintsService],
})
export class ComplaintsModule {}
