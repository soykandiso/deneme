import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { AuditActorRole, ComplaintStatus, Prisma, SuggestionStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { PasswordService } from '../auth/password.service';
import { decodeCursor, encodeCursor, Page } from '../common/util/pagination';

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly password: PasswordService,
  ) {}

  async dashboard() {
    const [newComplaints, pendingReports, pendingSuggestions, totalCompanies, totalComplaints] =
      await Promise.all([
        this.prisma.complaint.count({ where: { status: 'NEW', isDeleted: false, isPublished: true } }),
        this.prisma.report.count({ where: { resolvedAt: null } }),
        this.prisma.companySuggestion.count({ where: { status: 'PENDING' } }),
        this.prisma.company.count(),
        this.prisma.complaint.count({ where: { isDeleted: false, isPublished: true } }),
      ]);
    return {
      counts: { newComplaints, pendingReports, pendingSuggestions, totalCompanies, totalComplaints },
    };
  }

  async listComplaints(params: { cursor?: string; limit?: number; status?: ComplaintStatus; q?: string; includeDeleted?: boolean }): Promise<Page<{
    id: string; title: string; status: ComplaintStatus; createdAt: string;
    company: { id: string; slug: string; name: string };
    isDeleted: boolean;
  }>> {
    const limit = params.limit ?? 25;
    const cursor = decodeCursor<{ id: string }>(params.cursor);
    const where: Prisma.ComplaintWhereInput = {};
    if (!params.includeDeleted) where.isDeleted = false;
    if (params.status) where.status = params.status;
    if (params.q) {
      where.OR = [
        { title: { contains: params.q, mode: 'insensitive' } },
        { body: { contains: params.q, mode: 'insensitive' } },
      ];
    }

    const rows = await this.prisma.complaint.findMany({
      where,
      orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
      take: limit + 1,
      cursor: cursor ? { id: cursor.id } : undefined,
      skip: cursor ? 1 : 0,
      include: { company: { select: { id: true, slug: true, name: true } } },
    });
    const hasMore = rows.length > limit;
    const slice = hasMore ? rows.slice(0, limit) : rows;
    return {
      items: slice.map((c) => ({
        id: c.id,
        title: c.title,
        status: c.status,
        createdAt: c.createdAt.toISOString(),
        company: c.company,
        isDeleted: c.isDeleted,
      })),
      nextCursor: hasMore && slice[slice.length - 1]
        ? encodeCursor({ id: slice[slice.length - 1].id })
        : null,
    };
  }

  async setStatus(params: { complaintId: string; actorId: string; status: ComplaintStatus; ipHash: string }) {
    const c = await this.prisma.complaint.findUnique({ where: { id: params.complaintId } });
    if (!c) throw new NotFoundException();
    await this.prisma.$transaction([
      this.prisma.complaint.update({
        where: { id: c.id },
        data: { status: params.status, isDeleted: params.status === 'REMOVED' ? true : c.isDeleted, deletedAt: params.status === 'REMOVED' ? new Date() : c.deletedAt },
      }),
      this.prisma.complaintUpdate.create({
        data: {
          complaintId: c.id,
          actor: AuditActorRole.ADMIN,
          actorId: params.actorId,
          note: `complaint.status.${params.status.toLowerCase()}`,
        },
      }),
    ]);
    await this.audit.log({
      actorRole: AuditActorRole.ADMIN,
      actorId: params.actorId,
      action: 'admin.complaint.status.update',
      targetType: 'complaint',
      targetId: c.id,
      payload: { from: c.status, to: params.status },
      ipHash: params.ipHash,
    });
  }

  async redact(params: { complaintId: string; actorId: string; ipHash: string }) {
    const c = await this.prisma.complaint.findUnique({ where: { id: params.complaintId } });
    if (!c) throw new NotFoundException();
    await this.prisma.$transaction([
      this.prisma.complaint.update({
        where: { id: c.id },
        data: { title: '[redacted]', body: '[redacted by moderator]' },
      }),
      this.prisma.complaintUpdate.create({
        data: {
          complaintId: c.id,
          actor: AuditActorRole.ADMIN,
          actorId: params.actorId,
          note: 'complaint.redacted',
        },
      }),
    ]);
    await this.audit.log({
      actorRole: AuditActorRole.ADMIN,
      actorId: params.actorId,
      action: 'admin.complaint.redact',
      targetType: 'complaint',
      targetId: c.id,
      ipHash: params.ipHash,
    });
  }

  async softDelete(params: { complaintId: string; actorId: string; ipHash: string }) {
    const c = await this.prisma.complaint.findUnique({ where: { id: params.complaintId } });
    if (!c) throw new NotFoundException();
    await this.prisma.complaint.update({
      where: { id: c.id },
      data: { isDeleted: true, deletedAt: new Date() },
    });
    await this.audit.log({
      actorRole: AuditActorRole.ADMIN,
      actorId: params.actorId,
      action: 'admin.complaint.delete',
      targetType: 'complaint',
      targetId: c.id,
      ipHash: params.ipHash,
    });
  }

  async listReports(cursor?: string, limit = 25) {
    const c = decodeCursor<{ id: string }>(cursor);
    const rows = await this.prisma.report.findMany({
      where: { resolvedAt: null },
      orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
      take: limit + 1,
      cursor: c ? { id: c.id } : undefined,
      skip: c ? 1 : 0,
      include: { complaint: { select: { id: true, title: true } } },
    });
    const hasMore = rows.length > limit;
    const slice = hasMore ? rows.slice(0, limit) : rows;
    return {
      items: slice.map((r) => ({
        id: r.id,
        reason: r.reason,
        detail: r.detail,
        createdAt: r.createdAt.toISOString(),
        complaint: r.complaint,
      })),
      nextCursor: hasMore && slice[slice.length - 1]
        ? encodeCursor({ id: slice[slice.length - 1].id })
        : null,
    };
  }

  async resolveReport(params: { reportId: string; actorId: string; ipHash: string }) {
    const r = await this.prisma.report.update({
      where: { id: params.reportId },
      data: { resolvedAt: new Date() },
    });
    await this.audit.log({
      actorRole: AuditActorRole.ADMIN,
      actorId: params.actorId,
      action: 'admin.report.resolve',
      targetType: 'report',
      targetId: r.id,
      ipHash: params.ipHash,
    });
  }

  async listSuggestions(status?: SuggestionStatus) {
    const rows = await this.prisma.companySuggestion.findMany({
      where: status ? { status } : { status: 'PENDING' },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    return rows.map((s) => ({
      id: s.id,
      name: s.name,
      website: s.website,
      category: s.category,
      note: s.note,
      status: s.status,
      adminNote: s.adminNote,
      createdAt: s.createdAt.toISOString(),
    }));
  }

  async approveSuggestion(params: { id: string; actorId: string; ipHash: string; slug: string; category: string }) {
    const sug = await this.prisma.companySuggestion.findUnique({ where: { id: params.id } });
    if (!sug || sug.status !== 'PENDING') throw new NotFoundException();
    try {
      const co = await this.prisma.company.create({
        data: {
          name: sug.name,
          slug: params.slug,
          category: params.category,
          website: sug.website,
        },
      });
      await this.prisma.companySuggestion.update({
        where: { id: sug.id },
        data: { status: 'APPROVED', processedAt: new Date(), adminNote: `created ${co.id}` },
      });
      await this.audit.log({
        actorRole: AuditActorRole.ADMIN,
        actorId: params.actorId,
        action: 'admin.suggestion.approve',
        targetType: 'suggestion',
        targetId: sug.id,
        payload: { companyId: co.id },
        ipHash: params.ipHash,
      });
      return { companyId: co.id };
    } catch (err: unknown) {
      if (typeof err === 'object' && err !== null && 'code' in err && (err as { code: string }).code === 'P2002') {
        throw new ConflictException({ code: 'CONFLICT', message: 'Slug already taken.' });
      }
      throw err;
    }
  }

  async rejectSuggestion(params: { id: string; actorId: string; ipHash: string; note?: string }) {
    await this.prisma.companySuggestion.update({
      where: { id: params.id },
      data: { status: 'REJECTED', processedAt: new Date(), adminNote: params.note },
    });
    await this.audit.log({
      actorRole: AuditActorRole.ADMIN,
      actorId: params.actorId,
      action: 'admin.suggestion.reject',
      targetType: 'suggestion',
      targetId: params.id,
      ipHash: params.ipHash,
    });
  }

  async createCompany(params: { actorId: string; ipHash: string; data: { slug: string; name: string; category: string; website?: string; description?: string } }) {
    try {
      const co = await this.prisma.company.create({ data: params.data });
      await this.audit.log({
        actorRole: AuditActorRole.ADMIN,
        actorId: params.actorId,
        action: 'admin.company.create',
        targetType: 'company',
        targetId: co.id,
        ipHash: params.ipHash,
      });
      return co;
    } catch (err: unknown) {
      if (typeof err === 'object' && err !== null && 'code' in err && (err as { code: string }).code === 'P2002') {
        throw new ConflictException({ code: 'CONFLICT', message: 'Slug already taken.' });
      }
      throw err;
    }
  }

  async createCompanyUser(params: { actorId: string; ipHash: string; companyId: string; email: string; password: string; displayName: string }) {
    if (params.password.length < 12) {
      throw new BadRequestException({ code: 'VALIDATION_ERROR', message: 'Password must be at least 12 characters.' });
    }
    const hash = await this.password.hash(params.password);
    const u = await this.prisma.companyUser.create({
      data: {
        companyId: params.companyId,
        email: params.email.toLowerCase(),
        passwordHash: hash,
        displayName: params.displayName,
      },
    });
    await this.audit.log({
      actorRole: AuditActorRole.ADMIN,
      actorId: params.actorId,
      action: 'admin.companyUser.create',
      targetType: 'companyUser',
      targetId: u.id,
      payload: { email: '[redacted]' },
      ipHash: params.ipHash,
    });
    return { id: u.id, email: u.email, displayName: u.displayName };
  }

  async listCompanyUsers(companyId: string) {
    return this.prisma.companyUser.findMany({
      where: { companyId },
      select: { id: true, email: true, displayName: true, isActive: true, lastLoginAt: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async toggleCompanyUser(params: { id: string; isActive: boolean; actorId: string; ipHash: string }) {
    await this.prisma.companyUser.update({ where: { id: params.id }, data: { isActive: params.isActive } });
    await this.audit.log({
      actorRole: AuditActorRole.ADMIN,
      actorId: params.actorId,
      action: params.isActive ? 'admin.companyUser.enable' : 'admin.companyUser.disable',
      targetType: 'companyUser',
      targetId: params.id,
      ipHash: params.ipHash,
    });
  }

  async listAudit(cursor?: string, limit = 50) {
    const c = decodeCursor<{ id: string }>(cursor);
    const rows = await this.prisma.adminAuditLog.findMany({
      orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
      take: limit + 1,
      cursor: c ? { id: c.id } : undefined,
      skip: c ? 1 : 0,
    });
    const hasMore = rows.length > limit;
    const slice = hasMore ? rows.slice(0, limit) : rows;
    return {
      items: slice,
      nextCursor: hasMore && slice[slice.length - 1]
        ? encodeCursor({ id: slice[slice.length - 1].id })
        : null,
    };
  }
}
