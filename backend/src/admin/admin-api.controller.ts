import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { ConfigService } from '@nestjs/config';
import { AdminJwtGuard, AdminRequest } from '../auth/guards/admin-jwt.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AdminService } from './admin.service';
import {
  AdminApproveSuggestionDto,
  AdminListComplaintsDto,
  AdminListSuggestionsDto,
  AdminRejectSuggestionDto,
  AdminSetStatusDto,
  CreateCompanyDto,
  CreateCompanyUserDto,
} from './dto/admin.dto';
import { clientIp, hashIp } from '../common/util/ip-hash';
import { AppConfig } from '../config/app.config';

@Controller({ path: 'admin', version: '1' })
@UseGuards(AdminJwtGuard)
export class AdminApiController {
  constructor(
    private readonly admin: AdminService,
    private readonly config: ConfigService<AppConfig, true>,
  ) {}

  private ipHash(req: Request) {
    return hashIp(clientIp(req), this.config.get('IP_HASH_PEPPER', { infer: true }));
  }

  @Get('dashboard')
  dashboard() {
    return this.admin.dashboard();
  }

  @Get('complaints')
  listComplaints(@Query() dto: AdminListComplaintsDto) {
    return this.admin.listComplaints(dto);
  }

  @Post('complaints/:id/status')
  setStatus(
    @CurrentUser() user: AdminRequest['user'],
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: AdminSetStatusDto,
    @Req() req: Request,
  ) {
    return this.admin.setStatus({ complaintId: id, actorId: user.id, status: dto.status, ipHash: this.ipHash(req) });
  }

  @Post('complaints/:id/redact')
  redact(
    @CurrentUser() user: AdminRequest['user'],
    @Param('id', new ParseUUIDPipe()) id: string,
    @Req() req: Request,
  ) {
    return this.admin.redact({ complaintId: id, actorId: user.id, ipHash: this.ipHash(req) });
  }

  @Delete('complaints/:id')
  delete(
    @CurrentUser() user: AdminRequest['user'],
    @Param('id', new ParseUUIDPipe()) id: string,
    @Req() req: Request,
  ) {
    return this.admin.softDelete({ complaintId: id, actorId: user.id, ipHash: this.ipHash(req) });
  }

  @Get('reports')
  listReports(@Query('cursor') cursor?: string) {
    return this.admin.listReports(cursor);
  }

  @Post('reports/:id/resolve')
  resolveReport(
    @CurrentUser() user: AdminRequest['user'],
    @Param('id', new ParseUUIDPipe()) id: string,
    @Req() req: Request,
  ) {
    return this.admin.resolveReport({ reportId: id, actorId: user.id, ipHash: this.ipHash(req) });
  }

  @Get('suggestions')
  listSuggestions(@Query() dto: AdminListSuggestionsDto) {
    return this.admin.listSuggestions(dto.status);
  }

  @Post('suggestions/:id/approve')
  approveSuggestion(
    @CurrentUser() user: AdminRequest['user'],
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: AdminApproveSuggestionDto,
    @Req() req: Request,
  ) {
    return this.admin.approveSuggestion({ id, actorId: user.id, ipHash: this.ipHash(req), slug: dto.slug, category: dto.category });
  }

  @Post('suggestions/:id/reject')
  rejectSuggestion(
    @CurrentUser() user: AdminRequest['user'],
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: AdminRejectSuggestionDto,
    @Req() req: Request,
  ) {
    return this.admin.rejectSuggestion({ id, actorId: user.id, ipHash: this.ipHash(req), note: dto.note });
  }

  @Post('companies')
  createCompany(
    @CurrentUser() user: AdminRequest['user'],
    @Body() dto: CreateCompanyDto,
    @Req() req: Request,
  ) {
    return this.admin.createCompany({ actorId: user.id, ipHash: this.ipHash(req), data: dto });
  }

  @Get('companies/:id/users')
  listCompanyUsers(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.admin.listCompanyUsers(id);
  }

  @Post('companies/:id/users')
  createCompanyUser(
    @CurrentUser() user: AdminRequest['user'],
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: CreateCompanyUserDto,
    @Req() req: Request,
  ) {
    return this.admin.createCompanyUser({
      actorId: user.id,
      ipHash: this.ipHash(req),
      companyId: id,
      email: dto.email,
      password: dto.password,
      displayName: dto.displayName,
    });
  }

  @Patch('companies/users/:id/disable')
  disableCompanyUser(
    @CurrentUser() user: AdminRequest['user'],
    @Param('id', new ParseUUIDPipe()) id: string,
    @Req() req: Request,
  ) {
    return this.admin.toggleCompanyUser({ id, isActive: false, actorId: user.id, ipHash: this.ipHash(req) });
  }

  @Patch('companies/users/:id/enable')
  enableCompanyUser(
    @CurrentUser() user: AdminRequest['user'],
    @Param('id', new ParseUUIDPipe()) id: string,
    @Req() req: Request,
  ) {
    return this.admin.toggleCompanyUser({ id, isActive: true, actorId: user.id, ipHash: this.ipHash(req) });
  }

  @Get('audit')
  audit(@Query('cursor') cursor?: string) {
    return this.admin.listAudit(cursor);
  }
}
