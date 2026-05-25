import { Controller, Get, Param, Query } from '@nestjs/common';
import { CompaniesService } from './companies.service';
import { ListCompaniesDto } from './dto/list-companies.dto';

@Controller({ path: 'companies', version: '1' })
export class CompaniesController {
  constructor(private readonly companies: CompaniesService) {}

  @Get()
  list(@Query() dto: ListCompaniesDto) {
    return this.companies.list(dto);
  }

  @Get(':slug')
  detail(@Param('slug') slug: string) {
    return this.companies.detailBySlug(slug);
  }
}
