import { Body, Controller, Get, Param, Post, Query, Req, Res, VERSION_NEUTRAL } from '@nestjs/common';
import type { Request, Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { AdminAuthService } from '../auth/admin-auth.service';
import { AdminService } from './admin.service';
import { clientIp, hashIp } from '../common/util/ip-hash';
import { AppConfig } from '../config/app.config';
import { ComplaintStatus } from '@prisma/client';

@Controller({ path: 'admin', version: VERSION_NEUTRAL })
export class AdminWebController {
  constructor(
    private readonly admin: AdminService,
    private readonly auth: AdminAuthService,
    private readonly config: ConfigService<AppConfig, true>,
  ) {}

  private ipHash(req: Request) {
    return hashIp(clientIp(req), this.config.get('IP_HASH_PEPPER', { infer: true }));
  }

  @Get('login')
  loginPage(@Req() req: Request, @Res() res: Response) {
    const flash = req.session.flash;
    delete req.session.flash;
    res.render('admin/login', { layout: 'main', flash });
  }

  @Post('login')
  async login(
    @Body() body: { email?: string; password?: string },
    @Req() req: Request,
    @Res() res: Response,
  ) {
    try {
      const r = await this.auth.login({
        email: String(body.email ?? '').trim().toLowerCase(),
        password: String(body.password ?? ''),
        ipHash: this.ipHash(req),
        userAgent: (req.headers['user-agent'] ?? '').slice(0, 200),
      });
      req.session.adminUser = { id: r.user.id, displayName: r.user.displayName, email: r.user.email };
      res.redirect('/admin/dashboard');
    } catch {
      req.session.flash = { type: 'error', message: 'Invalid email or password.' };
      res.redirect('/admin/login');
    }
  }

  @Post('logout')
  logout(@Req() req: Request, @Res() res: Response) {
    req.session.destroy(() => res.redirect('/admin/login'));
  }

  @Get('dashboard')
  async dashboard(@Req() req: Request, @Res() res: Response) {
    const user = req.session.adminUser;
    if (!user) return res.redirect('/admin/login');
    const dash = await this.admin.dashboard();
    res.render('admin/dashboard', { layout: 'main', user, dash });
  }

  @Get('complaints')
  async complaints(
    @Req() req: Request,
    @Res() res: Response,
    @Query('status') status?: ComplaintStatus,
    @Query('q') q?: string,
  ) {
    const user = req.session.adminUser;
    if (!user) return res.redirect('/admin/login');
    const page = await this.admin.listComplaints({ status, q });
    res.render('admin/complaints', { layout: 'main', user, page, status, q });
  }

  @Post('complaints/:id/status')
  async setStatus(
    @Param('id') id: string,
    @Body() body: { status?: ComplaintStatus },
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const user = req.session.adminUser;
    if (!user) return res.redirect('/admin/login');
    if (!body.status) return res.redirect('/admin/complaints');
    await this.admin.setStatus({ complaintId: id, actorId: user.id, status: body.status, ipHash: this.ipHash(req) });
    req.session.flash = { type: 'success', message: 'Status updated.' };
    res.redirect('/admin/complaints');
  }

  @Post('complaints/:id/redact')
  async redact(@Param('id') id: string, @Req() req: Request, @Res() res: Response) {
    const user = req.session.adminUser;
    if (!user) return res.redirect('/admin/login');
    await this.admin.redact({ complaintId: id, actorId: user.id, ipHash: this.ipHash(req) });
    req.session.flash = { type: 'success', message: 'Complaint redacted.' };
    res.redirect('/admin/complaints');
  }

  @Post('complaints/:id/delete')
  async delete(@Param('id') id: string, @Req() req: Request, @Res() res: Response) {
    const user = req.session.adminUser;
    if (!user) return res.redirect('/admin/login');
    await this.admin.softDelete({ complaintId: id, actorId: user.id, ipHash: this.ipHash(req) });
    req.session.flash = { type: 'success', message: 'Complaint removed.' };
    res.redirect('/admin/complaints');
  }

  @Get('reports')
  async reports(@Req() req: Request, @Res() res: Response) {
    const user = req.session.adminUser;
    if (!user) return res.redirect('/admin/login');
    const page = await this.admin.listReports();
    res.render('admin/reports', { layout: 'main', user, page });
  }

  @Post('reports/:id/resolve')
  async resolveReport(@Param('id') id: string, @Req() req: Request, @Res() res: Response) {
    const user = req.session.adminUser;
    if (!user) return res.redirect('/admin/login');
    await this.admin.resolveReport({ reportId: id, actorId: user.id, ipHash: this.ipHash(req) });
    req.session.flash = { type: 'success', message: 'Report resolved.' };
    res.redirect('/admin/reports');
  }

  @Get('suggestions')
  async suggestions(@Req() req: Request, @Res() res: Response) {
    const user = req.session.adminUser;
    if (!user) return res.redirect('/admin/login');
    const items = await this.admin.listSuggestions();
    res.render('admin/suggestions', { layout: 'main', user, items });
  }

  @Get('audit')
  async audit(@Req() req: Request, @Res() res: Response) {
    const user = req.session.adminUser;
    if (!user) return res.redirect('/admin/login');
    const page = await this.admin.listAudit();
    res.render('admin/audit', { layout: 'main', user, page });
  }
}
