import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Query, Req, Res, UseGuards } from '@nestjs/common';
import type { Response, Request } from 'express';
import { ConfigService } from '@nestjs/config';
import { PortalJwtGuard, PortalRequest } from '../auth/guards/portal-jwt.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { PortalService } from './portal.service';
import { AttachmentsService } from '../attachments/attachments.service';
import { ListPortalComplaintsDto, AddReplyDto, UpdatePortalStatusDto } from './dto/portal.dto';
import { clientIp, hashIp } from '../common/util/ip-hash';
import { AppConfig } from '../config/app.config';

@Controller({ path: 'portal', version: '1' })
@UseGuards(PortalJwtGuard)
export class PortalApiController {
  constructor(
    private readonly portal: PortalService,
    private readonly attachments: AttachmentsService,
    private readonly config: ConfigService<AppConfig, true>,
  ) {}

  @Get('me')
  me(@CurrentUser() user: PortalRequest['user']) {
    return this.portal.me(user.id);
  }

  @Get('complaints')
  list(
    @CurrentUser() user: PortalRequest['user'],
    @Query() dto: ListPortalComplaintsDto,
  ) {
    return this.portal.listComplaints(user.companyId, dto);
  }

  @Get('complaints/:id')
  detail(
    @CurrentUser() user: PortalRequest['user'],
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    return this.portal.getComplaintForCompany(id, user.companyId);
  }

  @Post('complaints/:id/reply')
  reply(
    @CurrentUser() user: PortalRequest['user'],
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: AddReplyDto,
    @Req() req: Request,
  ) {
    const ipHash = hashIp(clientIp(req), this.config.get('IP_HASH_PEPPER', { infer: true }));
    return this.portal.addReply({
      complaintId: id,
      companyId: user.companyId,
      actorId: user.id,
      reply: dto.reply,
      ipHash,
    });
  }

  @Post('complaints/:id/status')
  status(
    @CurrentUser() user: PortalRequest['user'],
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdatePortalStatusDto,
    @Req() req: Request,
  ) {
    const ipHash = hashIp(clientIp(req), this.config.get('IP_HASH_PEPPER', { infer: true }));
    return this.portal.updateStatus({
      complaintId: id,
      companyId: user.companyId,
      actorId: user.id,
      status: dto.status,
      ipHash,
    });
  }

  @Get('attachments/:id/download')
  async download(
    @CurrentUser() user: PortalRequest['user'],
    @Param('id', new ParseUUIDPipe()) id: string,
    @Res() res: Response,
  ) {
    const url = await this.attachments.getForCompany(id, user.companyId);
    res.redirect(302, url);
  }
}
