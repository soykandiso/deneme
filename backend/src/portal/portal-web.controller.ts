import { Body, Controller, Get, Param, Post, Query, Render, Req, Res, VERSION_NEUTRAL } from '@nestjs/common';
import type { Request, Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { PortalService } from './portal.service';
import { PortalAuthService } from '../auth/portal-auth.service';
import { clientIp, hashIp } from '../common/util/ip-hash';
import { AppConfig } from '../config/app.config';
import { ComplaintStatus } from '@prisma/client';

declare module 'express-session' {
  interface SessionData {
    portalUser?: { id: string; companyId: string; displayName: string; email: string };
    adminUser?: { id: string; displayName: string; email: string };
    flash?: { type: 'success' | 'error'; message: string };
  }
}

@Controller({ path: 'portal', version: VERSION_NEUTRAL })
export class PortalWebController {
  constructor(
    private readonly portal: PortalService,
    private readonly auth: PortalAuthService,
    private readonly config: ConfigService<AppConfig, true>,
  ) {}

  @Get('login')
  @Render('portal/login')
  loginPage(@Req() req: Request) {
    const flash = req.session.flash;
    delete req.session.flash;
    return { flash, layout: 'main' };
  }

  @Post('login')
  async login(
    @Body() body: { email?: string; password?: string },
    @Req() req: Request,
    @Res() res: Response,
  ) {
    try {
      const ipHash = hashIp(clientIp(req), this.config.get('IP_HASH_PEPPER', { infer: true }));
      const result = await this.auth.login({
        email: String(body.email ?? '').trim().toLowerCase(),
        password: String(body.password ?? ''),
        ipHash,
        userAgent: (req.headers['user-agent'] ?? '').slice(0, 200),
      });
      req.session.portalUser = {
        id: result.user.id,
        companyId: result.user.companyId,
        displayName: result.user.displayName,
        email: result.user.email,
      };
      res.redirect('/portal/complaints');
    } catch {
      req.session.flash = { type: 'error', message: 'Invalid email or password.' };
      res.redirect('/portal/login');
    }
  }

  @Post('logout')
  logout(@Req() req: Request, @Res() res: Response) {
    req.session.destroy(() => res.redirect('/portal/login'));
  }

  @Get('complaints')
  async list(
    @Req() req: Request,
    @Res() res: Response,
    @Query('status') status?: ComplaintStatus,
    @Query('q') q?: string,
  ) {
    const user = req.session.portalUser;
    if (!user) return res.redirect('/portal/login');

    const page = await this.portal.listComplaints(user.companyId, { status, q });
    return res.render('portal/list', {
      layout: 'main',
      user,
      page,
      status,
      q,
    });
  }

  @Get('complaints/:id')
  async detail(@Param('id') id: string, @Req() req: Request, @Res() res: Response) {
    const user = req.session.portalUser;
    if (!user) return res.redirect('/portal/login');
    const c = await this.portal.getComplaintForCompany(id, user.companyId);
    const flash = req.session.flash; delete req.session.flash;
    return res.render('portal/detail', { layout: 'main', user, complaint: c, flash });
  }

  @Post('complaints/:id/reply')
  async reply(
    @Param('id') id: string,
    @Body() body: { reply?: string },
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const user = req.session.portalUser;
    if (!user) return res.redirect('/portal/login');
    try {
      const ipHash = hashIp(clientIp(req), this.config.get('IP_HASH_PEPPER', { infer: true }));
      await this.portal.addReply({
        complaintId: id,
        companyId: user.companyId,
        actorId: user.id,
        reply: String(body.reply ?? ''),
        ipHash,
      });
      req.session.flash = { type: 'success', message: 'Reply saved.' };
    } catch (err) {
      req.session.flash = { type: 'error', message: (err as Error).message };
    }
    res.redirect(`/portal/complaints/${id}`);
  }

  @Post('complaints/:id/status')
  async statusChange(
    @Param('id') id: string,
    @Body() body: { status?: 'CONTACTED' | 'RESOLVED' },
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const user = req.session.portalUser;
    if (!user) return res.redirect('/portal/login');
    const allowed = ['CONTACTED', 'RESOLVED'] as const;
    if (!body.status || !allowed.includes(body.status)) {
      req.session.flash = { type: 'error', message: 'Invalid status.' };
      return res.redirect(`/portal/complaints/${id}`);
    }
    const ipHash = hashIp(clientIp(req), this.config.get('IP_HASH_PEPPER', { infer: true }));
    await this.portal.updateStatus({
      complaintId: id,
      companyId: user.companyId,
      actorId: user.id,
      status: body.status,
      ipHash,
    });
    req.session.flash = { type: 'success', message: `Status updated to ${body.status}.` };
    res.redirect(`/portal/complaints/${id}`);
  }
}
