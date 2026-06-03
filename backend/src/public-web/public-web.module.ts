import { Module } from '@nestjs/common';
import { CompaniesModule } from '../companies/companies.module';
import { ComplaintsModule } from '../complaints/complaints.module';
import { ReportsModule } from '../reports/reports.module';
import { SuggestionsModule } from '../suggestions/suggestions.module';
import { PublicWebController } from './public-web.controller';

@Module({
  imports: [CompaniesModule, ComplaintsModule, ReportsModule, SuggestionsModule],
  controllers: [PublicWebController],
})
export class PublicWebModule {}
