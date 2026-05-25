import { Body, Controller, Param, ParseUUIDPipe, Post, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { ConfigService } from '@nestjs/config';
import { ReportsService } from './reports.service';
import { CreateReportDto } from './dto/create-report.dto';
import { clientIp, hashIp } from '../common/util/ip-hash';
import { RouteRateLimit, RouteRateLimitGuard } from '../common/util/rate-limit.guard';
import { AppConfig } from '../config/app.config';

@Controller({ path: 'complaints/:id/reports', version: '1' })
export class ReportsController {
  constructor(
    private readonly reports: ReportsService,
    private readonly config: ConfigService<AppConfig, true>,
  ) {}

  @Post()
  @UseGuards(RouteRateLimitGuard)
  @RouteRateLimit({ bucket: 'report', windowSeconds: 3600, max: 10 })
  create(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: CreateReportDto,
    @Req() req: Request,
  ) {
    const ipHash = hashIp(clientIp(req), this.config.get('IP_HASH_PEPPER', { infer: true }));
    return this.reports.create({ complaintId: id, dto, ipHash });
  }
}
