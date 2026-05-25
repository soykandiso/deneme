import { Body, Controller, Get, Headers, Param, ParseUUIDPipe, Post, Query, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { ConfigService } from '@nestjs/config';
import { ComplaintsService } from './complaints.service';
import { ListComplaintsDto } from './dto/list-complaints.dto';
import { CreateComplaintDto } from './dto/create-complaint.dto';
import { CompaniesService } from '../companies/companies.service';
import { clientIp, hashIp } from '../common/util/ip-hash';
import { RouteRateLimit, RouteRateLimitGuard } from '../common/util/rate-limit.guard';
import { AppConfig } from '../config/app.config';

@Controller({ path: 'complaints', version: '1' })
export class ComplaintsPublicController {
  constructor(
    private readonly complaints: ComplaintsService,
    private readonly companies: CompaniesService,
    private readonly config: ConfigService<AppConfig, true>,
  ) {}

  @Get()
  list(@Query() dto: ListComplaintsDto) {
    return this.complaints.list(dto);
  }

  @Get(':id')
  detail(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.complaints.publicDetail(id);
  }

  @Post()
  @UseGuards(RouteRateLimitGuard)
  @RouteRateLimit({ bucket: 'complaint-create', windowSeconds: 3600, max: 5 })
  create(@Body() dto: CreateComplaintDto, @Req() req: Request) {
    const ipHash = hashIp(clientIp(req), this.config.get('IP_HASH_PEPPER', { infer: true }));
    return this.complaints.createDraft(dto, ipHash);
  }

  @Post(':id/publish')
  publish(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Headers('x-draft-token') draftToken: string,
  ) {
    return this.complaints.publish(id, draftToken);
  }
}
