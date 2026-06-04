import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Render,
  Req,
  Res,
  VERSION_NEUTRAL,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { ComplaintCategory } from '@prisma/client';

import { CompaniesService } from '../companies/companies.service';
import { ComplaintsService } from '../complaints/complaints.service';
import { ReportsService } from '../reports/reports.service';
import { SuggestionsService } from '../suggestions/suggestions.service';
import { clientIp, hashIp } from '../common/util/ip-hash';
import { AppConfig } from '../config/app.config';

const COMPLAINT_CATEGORIES = Object.values(ComplaintCategory);

@Controller({ path: '/', version: VERSION_NEUTRAL })
export class PublicWebController {
  constructor(
    private readonly companies: CompaniesService,
    private readonly complaints: ComplaintsService,
    private readonly reports: ReportsService,
    private readonly suggestions: SuggestionsService,
    private readonly config: ConfigService<AppConfig, true>,
  ) {}

  private ipHash(req: Request) {
    return hashIp(clientIp(req), this.config.get('IP_HASH_PEPPER', { infer: true }));
  }

  @Get()
  @Render('web/home')
  async home() {
    const [companies, complaints] = await Promise.all([
      this.companies.list({ limit: 6 }),
      this.complaints.list({ limit: 5, sort: 'newest' }),
    ]);
    return { layout: 'web', companies: companies.items, complaints: complaints.items };
  }

  @Get('companies')
  @Render('web/companies')
  async listCompanies(@Query('q') q?: string) {
    const page = await this.companies.list({ q, limit: 30 });
    return { layout: 'web', companies: page.items, q };
  }

  @Get('companies/:slug')
  async companyDetail(@Param('slug') slug: string, @Res() res: Response) {
    try {
      const company = await this.companies.detailBySlug(slug);
      const complaints = await this.complaints.list({ companyId: company.id, limit: 20 });
      res.render('web/company', { layout: 'web', company, complaints: complaints.items });
    } catch {
      res.status(404).render('web/error', { layout: 'web', code: 404, message: 'Company not found.' });
    }
  }

  @Get('complaints')
  @Render('web/complaints')
  async listComplaints(
    @Query('q') q?: string,
    @Query('category') category?: string,
    @Query('status') status?: string,
    @Query('sort') sort?: string,
  ) {
    const validCategory = category && COMPLAINT_CATEGORIES.includes(category as ComplaintCategory)
      ? (category as ComplaintCategory)
      : undefined;
    const validStatus = ['NEW', 'CONTACTED', 'RESOLVED'].includes(status ?? '')
      ? (status as 'NEW' | 'CONTACTED' | 'RESOLVED')
      : undefined;
    const validSort = ['newest', 'oldest', 'updated', 'reported'].includes(sort ?? '')
      ? (sort as 'newest' | 'oldest' | 'updated' | 'reported')
      : 'newest';
    const page = await this.complaints.list({
      q,
      category: validCategory,
      status: validStatus,
      sort: validSort,
      limit: 30,
    });
    return {
      layout: 'web',
      complaints: page.items,
      q,
      category,
      status,
      sort: validSort,
      categories: COMPLAINT_CATEGORIES,
      statuses: ['NEW', 'CONTACTED', 'RESOLVED'],
    };
  }

  @Get('complaints/:id')
  async complaintDetail(@Param('id') id: string, @Req() req: Request, @Res() res: Response) {
    try {
      const c = await this.complaints.publicDetail(id);
      const flash = req.session.flash;
      delete req.session.flash;
      res.render('web/complaint', { layout: 'web', complaint: c, flash });
    } catch {
      res.status(404).render('web/error', { layout: 'web', code: 404, message: 'Complaint not found.' });
    }
  }

  @Get('submit')
  @Render('web/submit')
  async submitPage(@Req() req: Request, @Query('companyId') companyId?: string) {
    const companies = await this.companies.list({ limit: 200 });
    const flash = req.session.flash;
    delete req.session.flash;
    return {
      layout: 'web',
      companies: companies.items,
      companyId,
      categories: COMPLAINT_CATEGORIES,
      flash,
    };
  }

  @Post('submit')
  async submitCreate(
    @Body() body: {
      companyId?: string;
      title?: string;
      bodyText?: string;
      category?: string;
      contactEmail?: string;
      contactPhone?: string;
    },
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const category = (body.category ?? '').toUpperCase();
    const dto = {
      companyId: String(body.companyId ?? ''),
      title: String(body.title ?? '').trim(),
      body: String(body.bodyText ?? '').trim(),
      category: category as ComplaintCategory,
      contactEmail: body.contactEmail?.trim() || undefined,
      contactPhone: body.contactPhone?.trim() || undefined,
    };
    try {
      if (!COMPLAINT_CATEGORIES.includes(dto.category)) {
        throw new Error('Please pick a category.');
      }
      if (dto.title.length < 8 || dto.title.length > 160) {
        throw new Error('Title must be 8–160 characters.');
      }
      if (dto.body.length < 30 || dto.body.length > 8000) {
        throw new Error('Description must be 30–8000 characters.');
      }
      const draft = await this.complaints.createDraft(dto, this.ipHash(req));
      await this.complaints.publish(draft.id, draft.draftToken);
      req.session.flash = { type: 'success', message: 'Your complaint has been published.' };
      res.redirect(`/complaints/${draft.id}`);
    } catch (err) {
      req.session.flash = { type: 'error', message: (err as Error).message ?? 'Could not submit complaint.' };
      const qs = new URLSearchParams();
      if (dto.companyId) qs.set('companyId', dto.companyId);
      res.redirect(`/submit${qs.toString() ? '?' + qs.toString() : ''}`);
    }
  }

  @Get('suggest')
  @Render('web/suggest')
  async suggestPage(@Req() req: Request) {
    const flash = req.session.flash;
    delete req.session.flash;
    return { layout: 'web', flash };
  }

  @Post('suggest')
  async suggestCreate(
    @Body() body: { name?: string; website?: string; category?: string; note?: string },
    @Req() req: Request,
    @Res() res: Response,
  ) {
    try {
      const name = String(body.name ?? '').trim();
      if (name.length < 2 || name.length > 120) {
        throw new Error('Company name must be 2–120 characters.');
      }
      await this.suggestions.create(
        {
          name,
          website: body.website?.trim() || undefined,
          category: body.category?.trim() || undefined,
          note: body.note?.trim() || undefined,
        },
        this.ipHash(req),
      );
      req.session.flash = { type: 'success', message: 'Thanks — our team will review this suggestion.' };
      res.redirect('/suggest');
    } catch (err) {
      req.session.flash = { type: 'error', message: (err as Error).message };
      res.redirect('/suggest');
    }
  }

  @Post('complaints/:id/report')
  async report(
    @Param('id') id: string,
    @Body() body: { reason?: string; detail?: string },
    @Req() req: Request,
    @Res() res: Response,
  ) {
    try {
      await this.reports.create({
        complaintId: id,
        dto: {
          reason: (body.reason ?? 'other') as
            'spam' | 'abuse' | 'hate' | 'duplicate' | 'private_info' | 'misleading' | 'other',
          detail: body.detail?.trim() || undefined,
        },
        ipHash: this.ipHash(req),
      });
      req.session.flash = { type: 'success', message: 'Thanks — your report has been recorded.' };
    } catch (err) {
      req.session.flash = { type: 'error', message: (err as Error).message ?? 'Could not file report.' };
    }
    res.redirect(`/complaints/${id}`);
  }
}
