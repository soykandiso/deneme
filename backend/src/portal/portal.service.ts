import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { AuditActorRole, ComplaintStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { decodeCursor, encodeCursor, Page } from '../common/util/pagination';

const PORTAL_VISIBLE_STATUSES: ComplaintStatus[] = ['NEW', 'CONTACTED', 'RESOLVED'];

@Injectable()
export class PortalService {
  constructor(private readonly prisma: PrismaService, private readonly audit: AuditService) {}

  async me(userId: string) {
    const user = await this.prisma.companyUser.findUnique({
      where: { id: userId },
      include: { company: true },
    });
    if (!user) throw new NotFoundException();
    return {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      company: {
        id: user.company.id,
        slug: user.company.slug,
        name: user.company.name,
        category: user.company.category,
      },
    };
  }

  async listComplaints(companyId: string, params: { cursor?: string; limit?: number; status?: ComplaintStatus; q?: string }): Promise<Page<{
    id: string; title: string; status: ComplaintStatus; createdAt: string; hasReply: boolean;
  }>> {
    const limit = params.limit ?? 20;
    const cursor = decodeCursor<{ id: string }>(params.cursor);
    const where: Prisma.ComplaintWhereInput = {
      companyId,
      isDeleted: false,
      isPublished: true,
      status: { in: PORTAL_VISIBLE_STATUSES },
    };
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
    });

    const hasMore = rows.length > limit;
    const slice = hasMore ? rows.slice(0, limit) : rows;
    return {
      items: slice.map((c) => ({
        id: c.id,
        title: c.title,
        status: c.status,
        createdAt: c.createdAt.toISOString(),
        hasReply: !!c.companyReply,
      })),
      nextCursor: hasMore && slice[slice.length - 1]
        ? encodeCursor({ id: slice[slice.length - 1].id })
        : null,
    };
  }

  async getComplaintForCompany(complaintId: string, companyId: string) {
    const c = await this.prisma.complaint.findFirst({
      where: { id: complaintId, companyId, isDeleted: false },
      include: {
        attachments: true,
        updates: { orderBy: { createdAt: 'asc' } },
      },
    });
    if (!c) throw new NotFoundException({ code: 'NOT_FOUND', message: 'Complaint not found.' });
    return c;
  }

  async addReply(params: { complaintId: string; companyId: string; actorId: string; reply: string; ipHash: string }) {
    if (params.reply.length < 5 || params.reply.length > 4000) {
      throw new BadRequestException({ code: 'VALIDATION_ERROR', message: 'Reply must be 5–4000 chars.' });
    }
    const c = await this.getComplaintForCompany(params.complaintId, params.companyId);
    await this.prisma.$transaction([
      this.prisma.complaint.update({
        where: { id: c.id },
        data: { companyReply: params.reply, companyReplyUpdatedAt: new Date() },
      }),
      this.prisma.complaintUpdate.create({
        data: {
          complaintId: c.id,
          actor: AuditActorRole.COMPANY,
          actorId: params.actorId,
          note: 'complaint.reply.updated',
        },
      }),
    ]);
    await this.audit.log({
      actorRole: AuditActorRole.COMPANY,
      actorId: params.actorId,
      action: 'complaint.reply.update',
      targetType: 'complaint',
      targetId: c.id,
      ipHash: params.ipHash,
      payload: { length: params.reply.length },
    });
  }

  async updateStatus(params: {
    complaintId: string;
    companyId: string;
    actorId: string;
    status: 'CONTACTED' | 'RESOLVED';
    ipHash: string;
  }) {
    const c = await this.getComplaintForCompany(params.complaintId, params.companyId);
    await this.prisma.$transaction([
      this.prisma.complaint.update({ where: { id: c.id }, data: { status: params.status } }),
      this.prisma.complaintUpdate.create({
        data: {
          complaintId: c.id,
          actor: AuditActorRole.COMPANY,
          actorId: params.actorId,
          note: `complaint.status.${params.status.toLowerCase()}`,
        },
      }),
    ]);
    await this.audit.log({
      actorRole: AuditActorRole.COMPANY,
      actorId: params.actorId,
      action: 'complaint.status.update',
      targetType: 'complaint',
      targetId: c.id,
      ipHash: params.ipHash,
      payload: { status: params.status },
    });
  }
}
